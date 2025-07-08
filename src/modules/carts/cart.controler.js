 "use strict";
import cartModel from "../../../db/models/cart.model.js";
import foodModel from "../../../db/models/food.model.js";
import { AppError } from "../../utils/classAppError.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";

export const createCart = asyncHandeler(async (req, res, next) => {
  const { foodId, quantity, variantId } = req.body;

  const food = await foodModel.findById(foodId);
  if (!food) {
    return next(new AppError("Food not found"));
  }

  const selectedVariant = food.variants.find(
    (variantObj) => variantObj._id.toString() === variantId?.toString(),
  );

  if (!selectedVariant) {
    return next(new AppError("Invalid variant ID for this food"));
  }

  const unitPrice = selectedVariant.subprice;
  const itemTotalPrice = Number((unitPrice * quantity).toFixed(2));

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    const newCart = await cartModel.create({
      user: req.user._id,
      foods: [
        {
          foodId,
          variantId,
          quantity,
          totalPrice: itemTotalPrice,
        },
      ],
      totalCartPrice: itemTotalPrice,
    });

    return res.status(201).json({ msg: "Cart", cart: newCart });
  }

  let found = false;

  for (let item of cart.foods) {
    if (
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString()
    ) {
      item.quantity += quantity;
      item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));
      found = true;
      break;
    }
  }

  if (!found) {
    cart.foods.push({
      foodId,
      variantId,
      quantity,
      totalPrice: itemTotalPrice,
    });
  }

  cart.totalCartPrice = cart.foods.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0,
  );

  await cart.save();

  res.status(201).json({ msg: "Cart", cart });
});

export const updateCart = asyncHandeler(async (req, res, next) => {
  const { foodId, variantId, count } = req.body;

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(new AppError("Cart not found"));
  }

  let found = false;

  for (let item of cart.foods) {
    if (
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString()
    ) {
      item.quantity += count;
      const food = await foodModel.findById(foodId);
      const variant = food.variants.find(
        (v) => v._id.toString() === variantId.toString(),
      );
      const unitPrice = variant.subprice;
      item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));
      found = true;
      break;
    }
  }

  if (!found) {
    return next(new AppError("Cart item not found"));
  }
  cart.totalCartPrice = cart.foods.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0,
  );
  await cart.save();

  res.status(200).json({ msg: "Cart", cart });
});

export const clearCart = asyncHandeler(async (req, res, next) => {
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      foods: [],
      totalCartPrice: 0,
    },
    { new: true },
  );

  res.status(201).json({ msg: "cart", cart });
});

export const deleteCartItem = asyncHandeler(async (req, res, next) => {
  const { foodId, variantId } = req.body;

  const cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(new AppError("Cart not found"));
  }

  const removedItem = cart.foods.find(
    (item) =>
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString(),
  );

  if (!removedItem) {
    return next(new AppError("Item not found in cart"));
  }

  const updatedTotal = Number(
    (cart.totalCartPrice - removedItem.totalPrice).toFixed(2),
  );

  cart.foods = cart.foods.filter(
    (item) =>
      !(
        item.foodId.toString() === foodId.toString() &&
        item.variantId.toString() === variantId.toString()
      ),
  );

  cart.totalCartPrice = Math.max(updatedTotal, 0);

  await cart.save();

  res.status(200).json({ message: "cart", cart });
});

export const getCart = asyncHandeler(async (req, res) => {
  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    cart = await cartModel.create({
      user: req.user._id,
      foods: [],
      totalCartPrice: 0,
    });

    res.status(200).json({
      msg: "cart created empty",
      cart: [],
      totalCartPrice: 0,
    });
  }

  await cart.populate({
    path: "foods.foodId",
    select: "title description image variants ",
  });

  const cartWithDetails = cart.foods.map((item) => {
    const food = item.foodId;
    const variant = food?.variants?.find((v) => {
      return item.variantId && v._id.toString() === item.variantId.toString();
    });

    return {
      _id: item._id,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      food: {
        _id: food._id,
        title: food.title,
        description: food.description,
        image: food.image,
      },
      variant: variant || null,
    };
  });

  return res.status(200).json({
    msg: "cart",
    cart: cartWithDetails,
    totalCartPrice: cart.totalCartPrice,
  });
});
