
// tracker.controller.ts
import type { Request, Response } from "express";
import logger from "../../config/logger.js";
import { fetchProductDetails } from "./tracker.service.js";
import { ProductModel } from "./tracker.model.js";

// Controller: receives { url } in body and platform from middleware (req.platform).
// Calls service.fetchProductDetails and returns the product with price history.
export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const url = req.body.url;
    const platform = (req as any).platform;

    if (!url) {
      return res.status(400).json({ message: "Empty URL received" });
    }
    if (!platform) {
      return res.status(400).json({ message: "Platform not detected" });
    }

    logger.info(`API scrape requested: ${url} (${platform})`);

    const productDoc = await fetchProductDetails(url, platform);
    // attach owner if available
    const user = (req as any).user;
    if (user && productDoc && !(productDoc as any).owner) {
      (productDoc as any).owner = user.id || user._id;
      await (productDoc as any).save?.();
    }

    return res.status(200).json({ 
      success: true, 
      data: productDoc // This includes productPriceHistory automatically
    });
  } catch (err: any) {
    logger.error("getProductDetails error:", err.stack || err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserTrackedProducts = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
  const products = await ProductModel.find({ owner: user.id || user._id }).sort({ updatedAt: -1 });
  return res.status(200).json({ success: true, data: products });
};

export const setPriceAlert = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
  const { productId } = req.params as any;
  const { targetPrice } = req.body as any;
  if (!targetPrice || Number.isNaN(Number(targetPrice))) {
    return res.status(400).json({ success: false, message: "Invalid target price" });
  }
  const product = await ProductModel.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  (product as any).alert = { enabled: true, targetPrice: Number(targetPrice), userId: user.id || user._id };
  await product.save();
  return res.status(200).json({ success: true, message: "Alert set" });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const user = (req as any).user
  const productId = req.params.productId

  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" })

  const product = await ProductModel.findOne({ _id: productId, owner: user.id || user._id })
  if (!product) return res.status(404).json({ success: false, message: "Product not found" })

  await product.deleteOne();
  return res.status(200).json({ success: true, message: "Product deleted successfully" })
}
