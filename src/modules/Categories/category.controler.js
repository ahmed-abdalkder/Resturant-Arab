 "use strict";
import { nanoid } from "nanoid";
import categoryModel from "../../../db/models/category.model.js";
import cloudinary from "../../service/cloudinary.js";
import foodModel from "../../../db/models/food.model.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

export const createCategory = asyncHandeler(async (req, res, next) => {
  const { name } = req.body;

  const categoryexist = await categoryModel.findOne({ name });
  if (categoryexist) {
    return next(new AppError("category alredy exist"));
  }
  if (!req.file) {
    return next(new AppError("please inter image"));
  }
  const customId = nanoid(5);
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `Resturant/Category/${customId}` },
  );

  const category = await categoryModel.create({
    name,
    image: { secure_url, public_id },
    customId,
    createdBy: req.user._id,
  });
  res.json({ msg: "Category", category });
});

export const getCategory = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const category = await categoryModel.findById(id);
  if (!category) {
    return next(new AppError("categoty not found"));
  }
  let list = [];
  for (const item of [category]) {
    const food = await foodModel.find({ category: item._id });
    const newcategory = item.toObject();
    newcategory.food = food;
    list.push(newcategory);
  }

  res.json({ msg: "Category", category: list });
});

export const getCategories = asyncHandeler(async (req, res, next) => {
  const categories = await categoryModel.find({});
  if (!categories) {
    return next(new AppError("catrgories nit found"));
  }

  res.json({ msg: "Categories", categories });
});

export const updateCatrgory = asyncHandeler(async (req, res,next) => {
  const { id } = req.params;

  const { name } = req.body;

  const category = await categoryModel.findById(id);
  if (!category) {
    return next(new AppError("caregory not found"));
  }

  if (name) category.name = name;

  if (req.file) {
    await cloudinary.uploader.destroy(category.image.public_id);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `Resturant/Category/${category.customId}` },
    );
    category.image = { secure_url, public_id };
  }

  await category.save();

  return res.status(200).json({ message: "category", category });
});

export const deleteCategory = asyncHandeler(async (req, res,next) => {
  const { id } = req.params;

  const category = await categoryModel.findById(id);
  if (!category) {
    return next(new AppError("Category not found"));
  }

  if (category.image?.public_id) {
    await cloudinary.uploader.destroy(category.image.public_id);
    await cloudinary.api.delete_folder(
      `Resturant/Category/${category.customId}`,
    );
  }

  const foods = await foodModel.find({ category: id });

  for (const food of foods) {
    const folderPath = `Resturant/Category/Food/${food.customId || food._id}`;
    const deleteRes =
      await cloudinary.api.delete_resources_by_prefix(folderPath);

    if (food.image?.public_id) {
      const destroyRes = await cloudinary.uploader.destroy(
        food.image.public_id,
      );
    }
    const folderDeleteRes = await cloudinary.api.delete_folder(folderPath);
  }
  await foodModel.deleteMany({ category: id });

  await categoryModel.deleteOne({ _id: id });

  return res
    .status(200)
    .json({ message: "Category and related foods deleted successfully" });
});
