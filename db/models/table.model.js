
"use strict";
import mongoose, { Types } from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    capacity: { type: Number, required: true },
     
    branchId: {
      type: Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
tableSchema.index({ number: 1, branchId: 1 }, { unique: true });
const tableModel = mongoose.model("Table", tableSchema);
export default tableModel;
