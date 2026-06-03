// Get User Orders

import { Request, Response } from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";

// Get User Orders
// GET /api/orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const query = { user: req.user._id };
    const orders = await Order.find(query)
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Get Single Orders
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "name images",
    );
    if (!order) {
      res.status(404).send({ success: false, message: "Order not found" });
    }

    if (
      order?.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).send({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Create order from cart
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { shippingAddress, notes } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(404).send({ success: false, message: "Cart is Empty" });
    }

    // Verify cart items stock
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).send({
          success: false,
          message: `Product ${(item.product as any).name} is out of stock`,
        });
      }

      orderItems.push({
        product: item.product._id,
        name: (item.product as any).name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      });

      //   Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    const subtotal = cart.totalAmount;
    const shippingCost = 2;
    const tax = 0;
    const totalAmount = subtotal + shippingCost + tax;
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: req.body.paymentMethod || "Cash on Delivery",
      paymentStatus: "pending",
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
      paymentIntentId: req.body.paymentIntentId,
      orderNumber: "ORD-" + Date.now(),
    });
    if (req.body.paymentMethod !== "stripe") {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }

    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Update Order Status
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .send({ success: false, message: "Order not found" });
    }

    if (order.orderStatus) order.orderStatus = orderStatus;
    if (order.paymentStatus) order.paymentStatus = paymentStatus;
    if (orderStatus === "delivered") order.deliveredAt = new Date();
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Orders
// GET /api/orders/admin/all
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query: any = {};

    if (status) query.orderStatus = status;
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).send({ success: false, message: err.message });
  }
};
