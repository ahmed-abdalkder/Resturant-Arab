"use strict";
import mongoose from "mongoose";
import { systemroles } from "../../src/utils/systemroles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
    },
    picture: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(systemroles),
      default: "user",
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    loggedIn: {
      type: Boolean,
      default: false,
    },
    code: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const userModel = mongoose.model("user", userSchema);

export default userModel;
