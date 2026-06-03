import { Request, Response } from "express";
import Product from "../models/Products.js";
import cloudinary from "../config/cloudinary.js";

// Get all products
// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query: any = { isActive: true };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// Get single product
// GET /api/products/:id
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).send({ success: false, message: "Product not found" });
    }
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Create a product
// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    let images = [];

    // Handle File Upload
    if (req.files && (req.files as any).length > 0) {
      const uploadPromises = (req.files as any).map((file: any) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "ecom-app/products",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result!.secure_url);
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      });
      images = await Promise.all(uploadPromises);
    }

    let sizes = req.body.sizes || [];
    if (typeof sizes == "string") {
      try {
        sizes = JSON.parse(sizes);
      } catch (err) {
        sizes = sizes
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s !== "");
      }
    }

    // Ensure they are array
    if (!Array.isArray(sizes)) {
      sizes = [sizes];
    }

    const productDate = {
      ...req.body,
      images: images,
      sizes,
    };
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const product = await Product.create(productDate);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Update a product
// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    let images: string[] = [];
    if (req.body.exitingImages) {
      if (Array.isArray(req.body.exitingImages)) {
        images = [...req.body.exitingImages];
      } else {
        images = [req.body.exitingImages];
      }
    }

    // Handle File Upload
    if (req.files && (req.files as any).length > 0) {
      const uploadPromises = (req.files as any).map((file: any) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "ecom-app/products",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result!.secure_url);
              }
            },
          );
          uploadStream.end(file.buffer);
        });
      });
      const newImages = await Promise.all(uploadPromises);
      images = [...images, ...newImages];
    }
    const updates = { ...req.body };
    if (req.body.sizes) {
      let sizes = req.body.sizes;
      if (typeof sizes == "string") {
        try {
          sizes = JSON.parse(sizes);
        } catch (err) {
          sizes = sizes
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s !== "");
        }
      }
      if (!Array.isArray(sizes)) sizes = [sizes];
      updates.sizes = sizes;
    }

    if (
      req.body.exitingImages ||
      (req.files && (req.files as any).length > 0)
    ) {
      updates.images = images;
    }

    delete updates.exitingImages;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (product) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).send({ success: false, message: "Product not found" });
    }
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Delete a product
// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }

    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((imageUrl) => {
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.[a-z]+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;

        if (publicId) {
          return cloudinary.uploader.destroy(publicId);
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};