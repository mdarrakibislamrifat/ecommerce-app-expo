import express from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { authorize, protect } from "../middleware/auth.js";

const ProductRouter = express.Router();

// get all products
ProductRouter.get("/", getProducts);

// Get Single Product
ProductRouter.get("/:id", getProduct);

// Create Product Admin Route
ProductRouter.post(
  "/",
  upload.array("images", 5),
  protect,
  authorize("admin"),
  createProduct,
);


// Update Product Admin Route
ProductRouter.put(
  "/:id",
  upload.array("images", 5),
  protect,
  authorize("admin"),
  updateProduct
);



// Delete Product Admin Route
ProductRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteProduct
);


export default ProductRouter;