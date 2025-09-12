// tracker.service.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import logger from "../../config/logger.js";
import cron from 'node-cron';
import { ProductModel } from "./tracker.model.js";

// Puppeteer Stealth for Extra Safety
(puppeteer as any).use(StealthPlugin);

// Production-ready browser configuration
const getBrowserConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        return {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Important for low memory environments
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--memory-pressure-off',
                '--max_old_space_size=4096'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
        };
    } else {
        return {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
    }
};

// Helper function to extract product ID from URL
const extractProductId = (url: string, platform: string): string => {
    try {
        if (platform === 'amazon') {
            const dpPart = url.split("/dp/")[1];
            if (!dpPart) throw new Error("Invalid Amazon URL format");
            return url.split("/dp/")[1]?.split("/")[0] || '';
        } else if (platform === 'flipkart') {
            const newURL = new URL(url);
            return newURL.searchParams.get("pid") || '';
        }
        return '';
    } catch (error) {
        logger.error('Error extracting product ID:', (error as any));
        throw new Error("Invalid URL format for platform");
    }
};

// Enhanced error handling and retry logic
const scrapeWithRetry = async (page: any, selector: string, maxRetries: number = 3): Promise<string> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.waitForSelector(selector, { timeout: 10000 });
            const result = await page.$eval(selector, (el: Element) => el?.textContent?.trim() || "No Data Found");
            if (result !== "No Data Found") return result;
        } catch (error) {
            logger.warn(`Retry ${i + 1} failed for selector ${selector}:`, (error as any));
            if (i === maxRetries - 1) return "No Data Found";
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
    }
    return "No Data Found";
};

const scrapeAttributeWithRetry = async (page: any, selector: string, attr: string, maxRetries: number = 3): Promise<string> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.waitForSelector(selector, { timeout: 10000 });
            const result = await page.$eval(selector, (el: Element) => el?.getAttribute(attr)?.trim() || "No Data Found");
            if (result !== "No Data Found") return result;
        } catch (error) {
            logger.warn(`Retry ${i + 1} failed for attribute ${attr} on selector ${selector}:`, (error as any));
            if (i === maxRetries - 1) return "No Data Found";
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return "No Data Found";
};

// Helper function to scrape product details (with better error handling)
const scrapeProductFromPage = async (page: any, platform: string) => {
    try {
        if (platform === 'amazon') {
            const title = await scrapeWithRetry(page, '#productTitle');
            
            // Enhanced image scraping with fallbacks
            let img = "No Data Found";
            try {
                img = await page.$eval('#landingImage', (el: Element) => {
                    const imgEl = el as HTMLImageElement;
                    const dynamic = imgEl.getAttribute('data-a-dynamic-image');
                    if (dynamic) {
                        try {
                            const parsed = JSON.parse(dynamic);
                            return Object.keys(parsed)[0];
                        } catch (e) {
                            // JSON parse failed, try other attributes
                        }
                    }
                    return imgEl.getAttribute('data-old-hires') || 
                           imgEl.getAttribute('src') || 
                           "No Data Found";
                }).catch(() => "No Data Found");
            } catch (error) {
                logger.warn('Amazon image scraping failed:', (error as any));
            }

            const priceText = await scrapeWithRetry(page, '.a-price-whole');
            const numericPrice = Number(priceText.replace(/[^0-9.]/g, "")) || 0;
            const discount = await scrapeWithRetry(page, '.savingsPercentage');
            const availability = await scrapeWithRetry(page, '#availability .a-size-medium');
            const ratingsText = await scrapeWithRetry(page, '#acrPopover > span.a-declarative > a > span');
            const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, "")) || 0;
            const totalRatingsText = await scrapeWithRetry(page, '#acrCustomerReviewText');
            const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, "")) || 0;

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
        else if (platform === 'flipkart') {
            const title = await scrapeWithRetry(page, '.VU-ZEz');

            // Enhanced Flipkart image scraping
            let img = "No Data Found";
            const imageSelectors = [
                'img.DByuf4',
                'img._396cs4',
                'div.CXW8mj img',
                'img._53J4C-',
                '.CXW8mj img',
                '._2r_T1I img',
                'img[data-tkid]'
            ];

            for (const selector of imageSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    img = await page.$eval(selector, (el: HTMLImageElement) => el.src);
                    if (img && img !== "No Data Found" && !img.includes('data:image')) {
                        logger.info(`Found image with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // General image search as fallback
            if (img === "No Data Found") {
                try {
                    img = await page.evaluate(() => {
                        const images = document.querySelectorAll('img');
                        for (const image of images) {
                            const src = (image as HTMLImageElement).src;
                            if (src && src.includes('flipkart') &&
                                (src.includes('product') || src.includes('image')) &&
                                !src.includes('data:image') &&
                                !src.includes('icon') &&
                                !src.includes('logo')) {
                                return src;
                            }
                        }
                        return "No Data Found";
                    });
                } catch (error) {
                    logger.error('Error in general image search:', (error as any));
                }
            }

            const priceText = await scrapeWithRetry(page, '.Nx9bqj');
            const numericPrice = Number(priceText.replace(/[^0-9.]/g, "")) || 0;
            const discount = await scrapeWithRetry(page, '.UkUFwK span');
            const availability = "Available";
            const ratingsText = await scrapeWithRetry(page, '.XQDdHH');
            const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, "")) || 0;
            const totalRatingsText = await scrapeWithRetry(page, '.Wphh3N span span');
            const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, "")) || 0;

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
    } catch (error) {
        logger.error('Error in scrapeProductFromPage:', (error as any));
        throw error;
    }
};

// Main service function with enhanced error handling
export const fetchProductDetails = async (url: string, platform: string) => {
    let browser;
    let page;

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
                try {
                    browser = await (puppeteer as any).launch(getBrowserConfig());
                    page = await browser.newPage();
                    
                    // Set viewport and user agent
                    await page.setViewport({ width: 1366, height: 768 });
                    await page.setUserAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                        "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    );
                    
                    // Add extra headers
                    await page.setExtraHTTPHeaders({
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                    });

                    await page.goto(url, { 
                        waitUntil: "domcontentloaded", 
                        timeout: 30000 
                    });

                    const freshData = await scrapeProductFromPage(page, platform);
                    existingProduct.productImg = freshData.img;
                    await existingProduct.save();
                } catch (error) {
                    logger.error('Error updating existing product image:', (error as any));
                    // Don't throw error, just return existing data
                }
            }

            logger.info("Product found in database, returning existing data");
            return existingProduct;
        }

        // Product doesn't exist, scrape and save
        logger.info("Product not found in database, scraping...");

        // Launch Browser with production config
        browser = await (puppeteer as any).launch(getBrowserConfig());
        logger.info("Browser launched successfully");

        // Create new page with enhanced settings
        page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
        });

        // Navigate with longer timeout
        await page.goto(url, { 
            waitUntil: "domcontentloaded", 
            timeout: 30000 
        });
        logger.info("Successfully navigated to page");

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Scrape product details
        const scrapedData = await scrapeProductFromPage(page, platform);

        // Validate critical data
        if (!scrapedData.title || scrapedData.title === "No Data Found") {
            throw new Error("Failed to scrape product title - page might not have loaded correctly");
        }

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
        logger.info("Product saved successfully in database");
        logger.info(`Product: ${newProduct.productName}`);
        logger.info(`Price: ${newProduct.productPrice}`);
        logger.info(`Image URL: ${newProduct.productImg}`);

        return newProduct;

    } catch (error: any) {
        logger.error("Error while fetching the product:", error);
        
        // Return more specific error information
        if (error.message.includes('timeout')) {
            throw new Error('Request timeout - the website took too long to respond');
        } else if (error.message.includes('net::ERR')) {
            throw new Error('Network error - unable to connect to the website');
        } else {
            throw error;
        }
    } finally {
        // Ensure cleanup
        try {
            if (page) await page.close();
            if (browser) await browser.close();
            logger.info("Browser cleanup completed");
        } catch (cleanupError) {
            logger.error("Error during browser cleanup:", (cleanupError as any));
        }
    }
};

// Enhanced cron job with better error handling
const updateAllProductPrices = async () => {
    let browser;

    try {
        logger.info("Starting scheduled price update...");

        const products = await ProductModel.find({});
        if (products.length === 0) {
            logger.info("No products found to update");
            return;
        }

        browser = await (puppeteer as any).launch(getBrowserConfig());
        logger.info(`Updating ${products.length} products...`);

        for (const product of products) {
            let page;
            try {
                logger.info(`Updating: ${product.productName} (${product.productId})`);

                page = await browser.newPage();
                await page.setViewport({ width: 1366, height: 768 });
                await page.setUserAgent(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                );

                await page.goto(product.productUrl, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000
                });

                const currentData = await scrapeProductFromPage(page, product.productPlatform);

                if (currentData.numericPrice !== product.productPrice) {
                    logger.info(`Price updated for ${product.productName}: ${product.productPrice} → ${currentData.numericPrice}`);
                    
                    product.productPrice = currentData.numericPrice;
                    product.productPriceHistory.push({
                        price: currentData.numericPrice,
                        date: new Date()
                    });
                }

                // Update other details
                product.productRatings = currentData.numericRatings;
                product.productTotalRatings = currentData.numericTotalRatings;
                product.productDiscount = currentData.discount;
                product.productIsavailable = currentData.availability;

                await product.save();
                await page.close();

                // Longer delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 5000));

            } catch (error) {
                logger.error(`Error updating product ${product.productId}:`, (error as any));
                if (page) await page.close();
                continue;
            }
        }

        logger.info("Scheduled price update completed successfully");

    } catch (error) {
        logger.error("Error in scheduled price update:", (error as any));
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Only start cron job in production
if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 */6 * * *', updateAllProductPrices, {
        timezone: "Asia/Kolkata"
    });
    logger.info("Price tracking cron job started - runs every 6 hours");
}