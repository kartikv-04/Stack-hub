import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import got from "got";
import { URL } from "url";

// Allowed domains → mapped to platform identifiers
const allowedDomains: { [key: string]: string } = {
  "amazon.in": "amazon",
  "www.amazon.in": "amazon",
  "amazon.com": "amazon",
  "www.amazon.com": "amazon",
  "amzn.in": "amazon",
  "flipkart.com": "flipkart",
  "www.flipkart.com": "flipkart",
};

// Helper: identify platform from hostname
const getPlatformFromHostname = (hostname: string): string | null => {
  return allowedDomains[hostname] || null;
};

export const validateAndCheckURL = [
  // Validate format + domain
  body("url")
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Invalid URL format")
    .custom((value, { req }) => {
      const parsedUrl = new URL(value);

      if (parsedUrl.protocol !== "https:") {
        throw new Error("Only HTTPS product URLs are allowed.");
      }

      const platform = getPlatformFromHostname(parsedUrl.hostname);
      
      if (!platform) {
        throw new Error("This site is not supported for price tracking.");
      }

      (req as any).platform = platform; // attach platform for later use
      
      return true;

    }),

  // Validate if product page actually looks like a product
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const platform = (req as any).platform;


    if (platform === "flipkart") {
      return next();
    }

    try {
      const url = req.body.url;
      const response = await got(url, {
        timeout: { request: 5000 },
        followRedirect: true,
      });

      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("text/html")) {
        return res.status(400).json({ error: "This does not look like a product page." });
      }

      const html = response.body.toLowerCase();
      if (html.includes("add to cart") || html.includes("buy now") || html.includes("price")) {
        return next();
      }

      return res.status(400).json({ error: "This URL is not a valid product page." });
    } catch (err: any) {
      return res.status(400).json({
        error: "Insert a proper, real product URL",
        detail: err.message,
      });
    }
  },
];
