// tracker.service.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import logger from "../../config/logger.js";
import { ProductModel } from "./tracker.model.js";

// Puppeteer Stealth for Extra Safety
(puppeteer as any).use(StealthPlugin);

// Basic browser configuration with env support
const getBrowserConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction
        ? {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
        }
        : { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
};

// Helper function to extract product ID from URL
const extractProductId = (url: string, platform: string): string => {
    try {
        if (platform === 'amazon') {
            const dpPart = url.split("/dp/")[1];
            if (!dpPart) throw new Error("Invalid Amazon URL format");
            return dpPart.split("/")[0] || '';
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

// Simple scraping helpers
const scrapeText = async (page: any, selector: string): Promise<string> => {
    try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return await page.$eval(selector, (el: Element) => el.textContent?.trim() || "No Data Found");
    } catch {
        return "No Data Found";
    }
};

const scrapeProductFromPage = async (page: any, platform: string) => {
    if (platform === 'amazon') {
        const title = await scrapeText(page, '#productTitle');
        const img = await page.$eval('#landingImage', (el: HTMLImageElement) =>
            el.getAttribute('src') || "No Data Found"
        ).catch(() => "No Data Found");

        const priceText = await scrapeText(page, '.a-price-whole');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, "")) || 0;
        const discount = await scrapeText(page, '.savingsPercentage');
        const availability = await scrapeText(page, '#availability .a-size-medium');
        const ratingsText = await scrapeText(page, '#acrPopover span.a-declarative a span');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, "")) || 0;
        const totalRatingsText = await scrapeText(page, '#acrCustomerReviewText');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, "")) || 0;

        return { title, img, numericPrice, discount, availability, numericRatings, numericTotalRatings };
    }

    if (platform === 'flipkart') {
        const title = await scrapeText(page, '.VU-ZEz');
        const img = await page.$eval('img.DByuf4', (el: HTMLImageElement) =>
            el.src || "No Data Found"
        ).catch(() => "No Data Found");

        const priceText = await scrapeText(page, '.Nx9bqj');
        const numericPrice = Number(priceText.replace(/[^0-9.]/g, "")) || 0;
        const discount = await scrapeText(page, '.UkUFwK span');
        const availability = "Available";
        const ratingsText = await scrapeText(page, '.XQDdHH');
        const numericRatings = Number(ratingsText.replace(/[^0-9.]/g, "")) || 0;
        const totalRatingsText = await scrapeText(page, '.Wphh3N span span');
        const numericTotalRatings = Number(totalRatingsText.replace(/[^0-9]/g, "")) || 0;

        return { title, img, numericPrice, discount, availability, numericRatings, numericTotalRatings };
    }

    throw new Error(`Unsupported platform: ${platform}`);
};

// Main service function
export const fetchProductDetails = async (url: string, platform: string) => {
    let browser;
    let page;

    try {
        logger.info(`URL Received: ${url}`);
        logger.info(`Platform: ${platform}`);

        const pid = extractProductId(url, platform);
        if (!pid) throw new Error("Invalid URL format for platform");

        logger.info(`Product ID: ${pid}`);

        const existingProduct = await ProductModel.findOne({ productId: pid, productPlatform: platform });

        if (existingProduct) {
            logger.info("Product found in database, returning existing data");
            return existingProduct;
        }

        // New product scrape
        browser = await (puppeteer as any).launch(getBrowserConfig());
        page = await browser.newPage();

        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

        const scrapedData = await scrapeProductFromPage(page, platform);

        if (!scrapedData.title || scrapedData.title === "No Data Found") {
            throw new Error("Failed to scrape product title");
        }

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
        logger.info("Product saved successfully in database");

        return newProduct;

    } catch (error: any) {
        logger.error("Error while fetching the product:", error);
        throw error;
    } finally {
        try {
            if (page) await page.close();
            if (browser) await browser.close();
        } catch {}
    }
};
