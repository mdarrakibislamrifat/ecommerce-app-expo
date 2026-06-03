import { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";

// Get User Cart
// GET /api/cart
export const getCart = async (req: Request, res: Response) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name images price stock",
    );
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Add item to cart
// POST /api/cart/add
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => {
      return item.product.toString() === productId && item.size === size;
    });

    if (existingItem) {
      if (product.stock < existingItem.quantity + quantity) {
        return res
          .status(400)
          .send({ success: false, message: "Not enough stock available" });
      }

      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      if (product.stock < quantity) {
        return res
          .status(400)
          .send({ success: false, message: "Product is out of stock" });
      }

      cart.items.push({
        product: productId,
        quantity,
        size,
        price: product.price,
      });
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate("items.product", "name images price stock");

    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Update cart item quantity
// PUT /api/cart/item/:productId
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { quantity, size } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res
        .status(404)
        .send({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find((item) => {
      return item.product.toString() === productId && item.size === size;
    });

    if (!item) {
      return res
        .status(404)
        .send({ success: false, message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => {
        return item.product.toString() !== productId && item.size !== size;
      });
    } else {
      const product = await Product.findById(productId);

      if (product!.stock < quantity) {
        return res
          .status(400)
          .send({ success: false, message: "Product is out of stock" });
      }
      item.quantity = quantity;
    }
    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock");

    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Remove item from cart
// DELETE /api/cart/item/:productId
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { size } = req.query;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !size) {
      return res
        .status(404)
        .send({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => {
      return (
        item.product.toString() !== req.params.productId && item.size !== size
      );
    });

    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock");

    res.json({ success: true, data: cart });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Clear cart
// DELETE /api/cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};
