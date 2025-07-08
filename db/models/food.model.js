"use strict";
import mongoose, { Types } from "mongoose";


const variantSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["size", "quantity", "extra"],
  },
  label: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subPrice: {
    type: Number,
    required: true,
  },
});


const FoodSchema = new mongoose.Schema(
  {
    title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  creatorId: {
    type: mongoose.Types.ObjectId,
    ref: "user",
    required: true,
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: {
    secure_url: String,
    public_id: String,
  },
  customId: String,
  discount: {
    type: Number,
    default: 0,
  },
  variants: [variantSchema],
  categoryName: String,
}, {
  timestamps: true,
  versionKey: false,
});

const foodModel = mongoose.model("Food", FoodSchema);
export default foodModel;
