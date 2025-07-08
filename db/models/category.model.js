"use strict";
import mongoose, { Types } from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    image: { secure_url: String, public_id: String },

    customId: String,

    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
categorySchema.virtual("Food", {
  ref: "Food",
  localField: "_id",
  foreignField: "Category",
});
const categoryModel = mongoose.model("Category", categorySchema);
export default categoryModel;
