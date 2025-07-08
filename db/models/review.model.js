"use strict";
import mongoose, { Types } from "mongoose";

const reviewschema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
const reviewModel = mongoose.model("review", reviewschema);
export default reviewModel;
