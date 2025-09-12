// tracker.service.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import logger from "../../config/logger.js";
import cron from "node-cron";
import { ProductModel } from "./tracker.model.js";

// Puppeteer Stealth for Extra Safety
(puppeteer as any).use(StealthPlugin);

// Helper function to extract product ID from URL
const extractProductId = (url: string, platform: string): string => {
    if (platform === 'amazon') {
        const dpPart = url.split("/dp/")[1];
        if (!dpPart) throw new Error("Invalid Amazon URL format");
        return url.split("/dp/")[1]?.split("/")[0] || '';
    } else if (platform === 'flipkart') {
        const newURL = new URL(url);
        return newURL.searchParams.get("pid") || '';
    }
    return '';
};

// Safe element extraction
const getElement = async (page: any, selector: string) => {
    try {
        await page.waitForSelector(selector, { timeout: 7000 });
        return await page.$eval(selector, (el: any) => el.textContent?.trim() || "No Data Found");
    } catch {
        return "No Data Found";
    }
};

const getElementAttr = async (page: any, selector: string, attr: string) => {
    try {
        await page.waitForSelector(selector, { timeout: 7000 });
        return await page.$eval(selector, (el: any) => el.getAttribute(attr)?.trim() || "No Data Found");
    } catch {
        return "No Data Found";
    }
};

// Scraping logic
const scrapeProductFromPage = async (page: any, platform: string) => {
    if (platform === 'amazon') {
        const title = await getElement(page, '#productTitle');
        const img = await page.$eval('#landingImage', (el: any) => {
            const dynamic = el.getAttribute('data-a-dynamic-image');
            if (dynamic) return Object.keys(JSON.parse(dynamic))[0];
            return el.getAttribute('data-old-hires') || el.getAttribute('src');
        });
        logger.info('Image debug:', img);
        const priceText = await getElement(page, '.a-price-whole');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, ""));
        const discount = await getElement(page, '.savingsPercentage');
        const availability = await getElement(page, '#availability .a-size-medium');
        const ratingsText = await getElement(page, '#acrPopover > span.a-declarative > a > span');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, ""));
        const totalRatingsText = await getElement(page, '#acrCustomerReviewText');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, ""));

        return { title, img, numericPrice, discount, availability, numericRatings, numericTotalRatings };
    } else if (platform === 'flipkart') {
        const title = await getElement(page, '.VU-ZEz');

        // Multiple selectors for image
        const imageSelectors = ['img.DByuf4','img._396cs4','div.CXW8mj img','img._53J4C-','._2r_T1I img','img[data-tkid]'];
        let img = "No Data Found";
        for (const sel of imageSelectors) {
            try {
                await page.waitForSelector(sel, { timeout: 3000 });
                img = await page.$eval(sel, (el: HTMLImageElement) => el.src);
                if (img && !img.includes('data:image')) break;
            } catch { continue; }
        }
        if (img === "No Data Found") {
            try {
                img = await page.evaluate(() => {
                    const images = document.querySelectorAll('img');
                    for (const image of images) {
                        const src = (image as HTMLImageElement).src;
                        if (src.includes('flipkart') && !src.includes('data:image') && !src.includes('icon') && !src.includes('logo')) return src;
                    }
                    return "No Data Found";
                });
            } catch (err) { logger.error('Error in general image search:', (err as any)); }
        }

        const priceText = await getElement(page, '.Nx9bqj');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, ""));
        const discount = await getElement(page, '.UkUFwK span');
        const availability = "Available";
        const ratingsText = await getElement(page, '.XQDdHH');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, ""));
        const totalRatingsText = await getElement(page, '.Wphh3N span span');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, ""));

        return { title, img, numericPrice, discount, availability, numericRatings, numericTotalRatings };
    }
    throw new Error(`Unsupported platform: ${platform}`);
};

// Main fetchProductDetails function
export const fetchProductDetails = async (url: string, platform: string) => {
    let browser;
    try {
        logger.info(`URL Received: ${url}`);
        logger.info(`Platform: ${platform}`);
        const pid = extractProductId(url, platform);
        if (!pid) throw new Error("Invalid URL format for platform");
        logger.info(`Product ID: ${pid}`);

        const existingProduct = await ProductModel.findOne({ productId: pid, productPlatform: platform });

        if (existingProduct) {
            if (!existingProduct.productImg || existingProduct.productImg === "No Data Found") {
                browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
                const page = await browser.newPage();
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
                const freshData = await scrapeProductFromPage(page, platform);
                existingProduct.productImg = freshData.img;
                await existingProduct.save();
            }
            logger.info("Product found in database, returning existing data with price history");
            return existingProduct;
        }

        logger.info("Product not found in database, scraping...");
        browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

        const scrapedData = await scrapeProductFromPage(page, platform);
        const newProduct = new ProductModel({
            productId: pid,
            productUrl: url,
            productName: scrapedData.title,
            productPrice: scrapedData.numericPrice,
            productImg: scrapedData.img,
            productRatings: scrapedData.numericRatings,
            productTotalRatings: scrapedData.numericTotalRatings,
            productDiscount: scrapedData.discount,
            productIsavailable: scrapedData.availability,
            productPriceHistory: [{ price: scrapedData.numericPrice, date: new Date() }],
            productPlatform: platform
        });
        await newProduct.save();
        logger.info("Product Saved Successfully in Database");
        return newProduct;
    } catch (error: any) {
        logger.error("Error while fetching the Product", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

// Cron job to update all products
const updateAllProductPrices = async () => {
    let browser;
    try {
        logger.info("Starting scheduled price update...");
        const products = await ProductModel.find({});
        if (!products.length) { logger.info("No products found to update"); return; }
        browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });

        for (const product of products) {
            try {
                const page = await browser.newPage();
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                await page.goto(product.productUrl, { waitUntil: "networkidle2", timeout: 20000 });
                const currentData = await scrapeProductFromPage(page, product.productPlatform);

                if (currentData.numericPrice !== product.productPrice) {
                    logger.info(`Price changed for ${product.productName}: ${product.productPrice} → ${currentData.numericPrice}`);
                    product.productPrice = currentData.numericPrice;
                    product.productPriceHistory.push({ price: currentData.numericPrice, date: new Date() });
                }
                product.productRatings = currentData.numericRatings;
                product.productTotalRatings = currentData.numericTotalRatings;
                product.productDiscount = currentData.discount;
                product.productIsavailable = currentData.availability;


                await product.save();
                await page.close();
                // Delay to reduce chance of being blocked
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                logger.error(`Error updating product ${product.productId}:`, (error as any));
                continue; // Continue with next product
            }
        }
        logger.info("Scheduled price update completed");
    } catch (error) {
        logger.error("Error in scheduled price update:", (error as any));
    } finally {
        if (browser) await browser.close();
    }
};

// Auto-start cron job (runs every 6 hours)
cron.schedule('0 */6 * * *', updateAllProductPrices, {
    timezone: "Asia/Kolkata"
});

logger.info("Price tracking cron job started - runs every 6 hours automatically");
