"use strict";
import mongoose, { Types } from "mongoose";


const variantSchema = new mongoose.Schema({
  النوع: {
    type: String,
    required: true,
    enum: ["حجم", "كمية", "إضافة"],
  },
  الاسم: {
    type: String,
    required: true,
  },
  السعر: {
    type: Number,
    required: true,
  },
  السعر_الفرعي: {
    type: Number,
    required: true,
  },
});

const FoodSchema = new mongoose.Schema(
  {
    العنوان: {
      type: String,
      required: true,
    },
    الوصف: {
      type: String,
      required: true,
    },
    معرف_المنشئ: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    التصنيف: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    الصورة: { secure_url: String, public_id: String },
    معرف_مخصص: String,
    الخصم: {
      type: Number,
      default: 0,
    },
    الخيارات: [variantSchema],
    اسم_التصنيف: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const foodModel = mongoose.model("Food", FoodSchema);
export default foodModel;
