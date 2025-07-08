"use strict";
import { nanoid } from "nanoid";
import branchModel from "../../../db/models/branch.model.js";
import cloudinary from "../../service/cloudinary.js";
import { AppError } from "../../utils/classAppError.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";

export const createbranch = asyncHandeler(async (req, res, next) => {
  const { name, phone, address } = req.body;

  const branchExist = await branchModel.findOne({ phone });
  if (branchExist) {
    return next(new AppError("branch allredy exist"));
  }

  if (!req.file) {
    return next(new AppError("please inter image"));
  }
  const customId = nanoid(5);
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `Resturant/Category/branch/${customId}`,
    },
  );

  const branch = await branchModel.create({
    name,
    phone,
    address,
    image: { secure_url, public_id },
    customId,
    createdBy: req.user._id,
  });
  return res.status(201).json({ msg: "branch", branch });
});

export const getbranches = asyncHandeler(async (req, res, next) => {
  const branches = await branchModel.find({});
  if (!branches) {
    return next(new AppError("branches not found"));
  }
  return res.status(201).json({ msg: "branches", branches });
});

export const getbranch = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const branch = await branchModel.findById(id);
  if (!branch) {
    return next(new AppError("branch not found"));
  }
  return res.status(201).json({ msg: "branch", branch });
});

export const updateBranch = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const { name, phone, address } = req.body;

  const branch = await branchModel.findById(id);
  if (!branch) {
    return next(new AppError("branch not found"));
  }

  if (name) branch.name = name;
  if (phone) branch.phone = phone;
  if (address) branch.address = address;

  if (req.file) {
    await cloudinary.uploader.destroy(branch.image.public_id);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `Resturant/Category/branch/${branch.customId}` },
    );
    branch.image = { secure_url, public_id };
  }

  await branch.save();

  return res.status(200).json({ message: "branch", branch });
});

export const deleteBranch = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const branch = await branchModel.findById(id);
  if (!branch) {
    return next(new AppError("branch not found"));
  }

  if (branch.image?.public_id) {
    await cloudinary.uploader.destroy(branch.image.public_id);
    await cloudinary.api.delete_folder(
      `Resturant/Category/branch/${branch.customId}`,
    );
  }

  await branchModel.deleteOne({ _id: id });

  return res.status(200).json({ message: " deleted successfully" });
});
