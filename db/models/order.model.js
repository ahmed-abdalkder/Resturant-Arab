"use strict";
import mongoose, { Types } from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    foods: [
      {
        foodId: { type: Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        finalPrice: { type: Number, required: true },
        variantId: { type: Types.ObjectId },
      },
    ],
    user: { type: Types.ObjectId, ref: "user", required: true },
    subPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "card"],
    },
    status: {
      type: String,
      enum: [
        "placed",
        "waitPayment",
        "delivered",
        "onWay",
        "cancelled",
        "rejected",
      ],
      default: "placed",
      required: true,
    },
    
    cancelledBy: { type: Types.ObjectId, ref: "user" },
    reason: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const orderModel = mongoose.model("Order", orderSchema);
export default orderModel;
