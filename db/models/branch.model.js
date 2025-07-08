"use strict";
import mongoose, { Types } from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
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
    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
const branchModel = mongoose.model("Branch", branchSchema);

export default branchModel;
