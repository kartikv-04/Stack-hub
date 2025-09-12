

// tracker.service.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import logger from "../../config/logger.js";
import cron from 'node-cron';
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

// Helper function to scrape product details (shared between initial scrape and cron updates)
const scrapeProductFromPage = async (page: any, platform: string) => {
    const getElement = async (selector: string) => {
        await page.waitForSelector(selector, { timeout: 7000 }).catch(() => {}); // wait for element
        return await page.$eval(selector, (El: Element) => El?.textContent?.trim() || "No Data Found")
            .catch(() => "No Data Found");
    };

    const getElementAttr = async (selector: string, attr: string) => {
        await page.waitForSelector(selector, { timeout: 7000 }).catch(() => {}); // wait for element
        return await page.$eval(selector, (El: Element) => El?.getAttribute(attr)?.trim() || "No Data Found")
            .catch(() => "No Data Found");
    };

    if (platform === 'amazon') {
        const title = await getElement('#productTitle');
        // const img = await getElementAttr('#landingImage', 'src');
        // const img = await getElementAttr('#landingImage', 'data-old-hires') || await getElementAttr('#landingImage', 'src');
        const img = await page.$eval('#landingImage', (el: Element) => {
            const imgEl = el as HTMLImageElement;
            const dynamic = imgEl.getAttribute('data-a-dynamic-image');
            if (dynamic) {
                const parsed = JSON.parse(dynamic);
                return Object.keys(parsed)[0]; // first image URL
            }
            return imgEl.getAttribute('data-old-hires') || imgEl.getAttribute('src');
            });

        logger.info('Image debug:', img);
        const priceText = await getElement('.a-price-whole');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, ""));
        const discount = await getElement('.savingsPercentage');
        const availability = await getElement('#availability .a-size-medium');
        const ratingsText = await getElement('#acrPopover > span.a-declarative > a > span');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, ""));
        const totalRatingsText = await getElement('#acrCustomerReviewText');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, ""));

        return {
            title,
            img,
            numericPrice,
            discount,
            availability,
            numericRatings,
            numericTotalRatings
        };
    } else if (platform === 'flipkart') {
        const title = await getElement('.VU-ZEz');
        const img = await getElementAttr('#container > div > div._39kFie.N3De93.JxFEK3._48O0EI > div.DOjaWF.YJG4Cf > div.DOjaWF.gdgoEp.col-5-12.MfqIAz > div:nth-child(1) > div > div.qOPjUY > div._8id3KM > div > div._4WELSP._6lpKCl > img', 'src');
        const priceText = await getElement('.Nx9bqj');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, ""));
        const discount = await getElement('.UkUFwK span');
        const availability = "Available";
        const ratingsText = await getElement('.XQDdHH');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, ""));
        const totalRatingsText = await getElement('.Wphh3N span span');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, ""));

        return {
            title,
            img,
            numericPrice,
            discount,
            availability,
            numericRatings,
            numericTotalRatings
        };
    }

    throw new Error(`Unsupported platform: ${platform}`);
};

// Main service function: fetch product details (check DB first, scrape if needed)
export const fetchProductDetails = async (url: string, platform: string) => {
    let browser;

    try {
        logger.info(`URL Received: ${url}`);
        logger.info(`Platform: ${platform}`);

        // Extract product ID
        const pid = extractProductId(url, platform);
        if (!pid) {
            throw new Error("Invalid URL format for platform");
        }

        logger.info(`Product ID: ${pid}`);

        // Check if product exists in database first
        const existingProduct = await ProductModel.findOne({
            productId: pid,
            productPlatform: platform
        });


        // If product already exists in DB
        if (existingProduct) {
            // Only launch browser if a critical field is missing
            if (!existingProduct.productImg || existingProduct.productImg === "No Data Found") {
                browser = await (puppeteer as any).launch({ headless: "new" });
                const page = await browser.newPage();
                await page.setUserAgent(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                );
                await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

                const freshData = await scrapeProductFromPage(page, platform);
                existingProduct.productImg = freshData.img;
                await existingProduct.save();
            }

            logger.info("Product found in database, returning existing data with price history");
            return existingProduct;
        }


        // Product doesn't exist, scrape and save
        logger.info("Product not found in database, scraping...");

        // Launch Browser
        browser = await (puppeteer as any).launch({ headless: "new" });
        logger.info("Browser launched");

        // New Page in the Browser
        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        logger.info("Landed onto Page..");


        // Scrape product details
        const scrapedData = await scrapeProductFromPage(page, platform);

        // Create new product document
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
            productPriceHistory: [
                {
                    price: scrapedData.numericPrice,
                    date: new Date()
                }
            ],
            productPlatform: platform
        });

        // Save the Product
        await newProduct.save();
        logger.info("Product Saved Successfully in Database");
        logger.info(`Image Url : ${newProduct.productImg}`);
        logger.info(newProduct);

        return newProduct; // This includes productPriceHistory automatically

    } catch (error: any) {
        logger.error("Error while fetching the Product", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Cron job function to update all products automatically
const updateAllProductPrices = async () => {
    let browser;

    try {
        logger.info("Starting scheduled price update...");

        // Get all products from database
        const products = await ProductModel.find({});

        if (products.length === 0) {
            logger.info("No products found to update");
            return;
        }

        // Launch browser once for all products
        browser = await (puppeteer as any).launch({ headless: "new" });

        for (const product of products) {
            try {
                logger.info(`Updating product: ${product.productName} (${product.productId})`);

                const page = await browser.newPage();
                await page.setUserAgent(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                );

                await page.goto(product.productUrl, {
                    waitUntil: "domcontentloaded",
                    timeout: 15000
                });

                // Use the same scraping function (no code duplication)
                const currentData = await scrapeProductFromPage(page, product.productPlatform);

                // Check if price has changed
                if (currentData.numericPrice !== product.productPrice) {
                    logger.info(`Price changed for ${product.productName}: ${product.productPrice} → ${currentData.numericPrice}`);

                    // Update product price and add to price history
                    product.productPrice = currentData.numericPrice;
                    product.productPriceHistory.push({
                        price: currentData.numericPrice,
                        date: new Date()
                    });
                }

                // Update other details that might have changed
                product.productRatings = currentData.numericRatings;
                product.productTotalRatings = currentData.numericTotalRatings;
                product.productDiscount = currentData.discount;
                product.productIsavailable = currentData.availability;

                // Save updated product
                await product.save();

                await page.close();

                // Add delay between requests to avoid being blocked
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                logger.error(`Error updating product ${product.productId}:` +error);
                continue; // Continue with next product
            }
        }

        logger.info("Scheduled price update completed");

    } catch (error) {
        logger.error("Error in scheduled price update:" + error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Auto-start cron job when service loads (runs every 6 hours)
cron.schedule('0 */6 * * *', updateAllProductPrices, {
    timezone: "Asia/Kolkata"
});

logger.info("Price tracking cron job started - runs every 6 hours automatically");