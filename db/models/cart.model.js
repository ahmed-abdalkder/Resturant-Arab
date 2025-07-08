"use strict";
import mongoose, { Types } from "mongoose";

const cartschema = new mongoose.Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    foods: [
      {
        foodId: {
          type: Types.ObjectId,
          ref: "Food",
          required: true,
        },
        variantId: {
          type: Types.ObjectId,
        },
        quantity: {
          type: Number,
          required: true,
        },
        totalPrice: { type: Number, required: true },
      },
    ],
    totalCartPrice: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
const cartModel = mongoose.model("cart", cartschema);
export default cartModel;
