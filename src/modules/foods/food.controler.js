 "use strict";
import { nanoid } from "nanoid";
import categoryModel from "../../../db/models/category.model.js";
import foodModel from "../../../db/models/food.model.js";
import cloudinary from "../../service/cloudinary.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

export const createFood = asyncHandeler(async (req, res, next) => {
  const { title, description, category, discount, categoryName } = req.body;
  let variants = req.body.variants;

  if (typeof variants === "string") {
    variants = JSON.parse(variants);
  }

  if (!Array.isArray(variants)) {
    return next(new AppError("Variants must be an array"));
  }

  const categoryExist = await categoryModel.findById(category);

  if (!categoryExist) {
    return next(new AppError("category not found"));
  }
  const foodExist = await foodModel.findOne({ title });
  if (foodExist) {
    return next(new AppError("food allredy exist"));
  }

  const updatedVariants = variants.map((variant) => {
    const price = Number(variant.price);
    if (isNaN(price)) {
      throw new Error("Each variant must have a valid numeric price");
    }

    const subprice = price - (price * (discount || 0)) / 100;

    return {
      ...variant,
      price,
      subprice,
    };
  });

  if (!req.file) {
    return next(new AppError("please inter image"));
  }
  const customId = nanoid(5);
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `Resturant/Category/Food/${customId}`,
    },
  );

  const food = await foodModel.create({
    title,
    description,
    category,
    discount,
    image: { secure_url, public_id },
    customId,
    createdBy: req.user._id,
    variants: updatedVariants,
    categoryName,
  });

  return res.json({ msg: "food", food });
});

export const updateFood = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const { title, description, discount, category } = req.body;

  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }

  if (title) food.title = title;
  if (description) food.description = description;
  if (category) food.category = category;
  if (discount !== undefined) {
    const discountValue = Number(discount);

    if (isNaN(discountValue)) {
      return next(new AppError("Discount must be a number"));
    }
    food.discount = discountValue;

    food.variants = food.variants.map((variant) => {
      const price = Number(variant.price);
      const subprice = price - (price * (discountValue || 0)) / 100;
      return { ...variant.toObject(), subprice };
    });
  }

  if (req.file) {
    await cloudinary.uploader.destroy(food.image.public_id);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `Resturant/Category/Food/${food.customId}` },
    );
    food.image = { secure_url, public_id };
  }

  await food.save();

  return res.status(200).json({ message: "Food", food });
});

export const deleteFood = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }

  if (food.image && food.image.public_id) {
    await cloudinary.uploader.destroy(food.image.public_id);
    await cloudinary.api.delete_folder(
      `Resturant/Category/Food/${food.customId}`,
    );
  }

  await foodModel.deleteOne({ _id: id });

  return res.status(200).json({ message: "Food delete successfully" });
});

export const getFoods = asyncHandeler(async (req, res, next) => {
  const foods = await foodModel.find({ discount: { $gt: 0 } });
  if (!foods) {
    return next(new AppError("food not found"));
  }
  return res.json({ msg: "foods", foods });
});

export const getFood = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }
  return res.json({ msg: "food", food });
});

export const updateVariant = asyncHandeler(async (req, res, next) => {
  const { id, variantId } = req.params;
  const { type, label, price } = req.body;

  const food = await foodModel.findById(id);

  if (!food) {
    return next(new AppError("food not found"));
  }
  const variant = food.variants.find((v) => v.id === variantId);

  if (!variant) {
    throw new Error("variant not found");
  }
  const updatedPrice = Number(price);
  if (isNaN(updatedPrice)) {
    throw new Error("Price must be a number");
  }

  if (type) variant.type = type;
  if (label) variant.label = label;
  if (price) variant.price = updatedPrice;

  const subprice = variant.price - (variant.price * (food.discount || 0)) / 100;
  variant.subprice = subprice;

  await food.save();
  res.status(200).json({ msg: "food", food });
});

export const deleteVariant = asyncHandeler(async (req, res, next) => {
  const { id, variantId } = req.params;

  const food = await foodModel.findById(id);

  if (!food) {
    return next(new AppError("food not found"));
  }
  const index = food.variants.findIndex((v) => v._id.toString() === variantId);

  if (index === -1) {
    return next(new AppError("Variant not found"));
  }

  food.variants.splice(index, 1);

  await food.save();
  res.status(200).json({ msg: "food", food });
});

export const createVariant = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { type, label, price } = req.body;

  const food = await foodModel.findById(id);

  if (!food) {
    return next(new AppError("food not found"));
  }
  const subprice = price - (price * (food.discount || 0)) / 100;
  food.variants.push({ type, label, price, subprice });

  await food.save();
  res.status(200).json({ msg: "food", food });
});

export const getAllFoods = asyncHandeler(async (req, res, next) => {
  const foods = await foodModel.find({});
  if (!foods || foods.length === 0) {
    return next(new AppError("No foods found", 404));
  }

  const expandedFoods = [];

  for (const food of foods) {
    if (Array.isArray(food.variants) && food.variants.length > 0) {
      for (const variation of food.variants) {
        expandedFoods.push({
          _id: food._id,
          title: food.title,
          description: food.description,
          category: food.category,
          categoryName: food.categoryName,
          image: food.image,
          basePrice: food.price,
          variation,
        });
      }
    } else {
      expandedFoods.push({
        _id: food._id,
        title: food.title,
        description: food.description,
        category: food.category,
        categoryName: food.categoryName,
        image: food.image,
        basePrice: food.price,
        variation: null,
      });
    }
  }

  return res.json({ msg: "foods", foods: expandedFoods });
});
