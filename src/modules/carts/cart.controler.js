 "use strict";
import cartModel from "../../../db/models/cart.model.js";
import foodModel from "../../../db/models/food.model.js";
import { AppError } from "../../utils/classAppError.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";



function toArabicNumbers(input) {
  if (input === undefined || input === null) return "٠";  
  return input.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function toEnglishNumbers(str) {
  return str
    .toString()
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// export const createCart = asyncHandeler(async (req, res, next) => {
//   const { foodId, quantity, variantId } = req.body;

//   const food = await foodModel.findById(foodId);
//   if (!food) {
//     return next(new AppError("Food not found"));
//   }

//   const selectedVariant = food.variants.find(
//     (variantObj) => variantObj._id.toString() === variantId?.toString(),
//   );

//   if (!selectedVariant) {
//     return next(new AppError("Invalid variant ID for this food"));
//   }

//   const unitPrice = selectedVariant.subprice;
//   const itemTotalPrice = Number((unitPrice * quantity).toFixed(2));

//   let cart = await cartModel.findOne({ user: req.user._id });

//   if (!cart) {
//     const newCart = await cartModel.create({
//       user: req.user._id,
//       foods: [
//         {
//           foodId,
//           variantId,
//           quantity,
//           totalPrice: itemTotalPrice,
//         },
//       ],
//       totalCartPrice: itemTotalPrice,
//     });

//     return res.status(201).json({ msg: "Cart", cart: newCart });
//   }

//   let found = false;

//   for (let item of cart.foods) {
//     if (
//       item.foodId.toString() === foodId.toString() &&
//       item.variantId.toString() === variantId.toString()
//     ) {
//       item.quantity += quantity;
//       item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));
//       found = true;
//       break;
//     }
//   }

//   if (!found) {
//     cart.foods.push({
//       foodId,
//       variantId,
//       quantity,
//       totalPrice: itemTotalPrice,
//     });
//   }

//   cart.totalCartPrice = cart.foods.reduce(
//     (sum, item) => sum + (item.totalPrice || 0),
//     0,
//   );

//   await cart.save();

//   res.status(201).json({ msg: "Cart", cart });
// });

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

  // تحويل الأرقام من عربي إلى إنجليزي ثم إلى رقم
  const rawQuantity = toEnglishNumbers(quantity);
  const parsedQuantity = Number(rawQuantity);
  if (isNaN(parsedQuantity)) {
    return next(new AppError("Quantity must be a number"));
  }

  const unitPrice = Number(selectedVariant.subprice); // لازم نحوله لرقم
  if (isNaN(unitPrice)) {
    return next(new AppError("Invalid unit price for the selected variant"));
  }

  const itemTotalPrice = Number((unitPrice * parsedQuantity).toFixed(2));

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    const newCart = await cartModel.create({
      user: req.user._id,
      foods: [
        {
          foodId,
          variantId,
          quantity: parsedQuantity,
          totalPrice: itemTotalPrice,
        },
      ],
      totalCartPrice: itemTotalPrice,
    });

    return res.status(201).json({
      msg: "تم إضافة العنصر إلى السلة",
      cart: {
        ...newCart.toObject(),
        totalCartPrice: toArabicNumbers(newCart.totalCartPrice ?? 0),
        foods: newCart.foods.map((item) => ({
          ...item.toObject(),
          quantity: toArabicNumbers(item.quantity ?? 0),
          totalPrice: toArabicNumbers(item.totalPrice ?? 0),
        })),
      },
    });
  }

  let found = false;

  for (let item of cart.foods) {
    if (
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString()
    ) {
      item.quantity += parsedQuantity;
      item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));
      found = true;
      break;
    }
  }

  if (!found) {
    cart.foods.push({
      foodId,
      variantId,
      quantity: parsedQuantity,
      totalPrice: itemTotalPrice,
    });
  }

  cart.totalCartPrice = cart.foods.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0,
  );

  await cart.save();

  res.status(201).json({
    msg: "تم تحديث السلة",
    cart: {
      ...cart.toObject(),
      totalCartPrice: toArabicNumbers(cart.totalCartPrice ?? 0),
      foods: cart.foods.map((item) => ({
        ...item.toObject(),
        quantity: toArabicNumbers(item.quantity ?? 0),
        totalPrice: toArabicNumbers(item.totalPrice ?? 0),
      })),
    },
  });
});

// export const updateCart = asyncHandeler(async (req, res, next) => {
//   const { foodId, variantId, count } = req.body;

//   let cart = await cartModel.findOne({ user: req.user._id });

//   if (!cart) {
//     return next(new AppError("Cart not found"));
//   }

//   let found = false;

//   for (let item of cart.foods) {
//     if (
//       item.foodId.toString() === foodId.toString() &&
//       item.variantId.toString() === variantId.toString()
//     ) {
//       item.quantity += count;
//       const food = await foodModel.findById(foodId);
//       const variant = food.variants.find(
//         (v) => v._id.toString() === variantId.toString(),
//       );
//       const unitPrice = variant.subprice;
//       item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));
//       found = true;
//       break;
//     }
//   }

//   if (!found) {
//     return next(new AppError("Cart item not found"));
//   }
//   cart.totalCartPrice = cart.foods.reduce(
//     (sum, item) => sum + (item.totalPrice || 0),
//     0,
//   );
//   await cart.save();

//   res.status(200).json({ msg: "Cart", cart });
// });

export const updateCart = asyncHandeler(async (req, res, next) => {
  const { foodId, variantId, count } = req.body;

  const cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found"));
  }

  let found = false;

  for (let item of cart.foods) {
    if (
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString()
    ) {
      // تأكد إن العدد رقم صحيح
      const updatedCount = Number(toEnglishNumbers(count));
      if (isNaN(updatedCount)) {
        return next(new AppError("Count must be a valid number"));
      }

      item.quantity += updatedCount;

      const food = await foodModel.findById(foodId);
      if (!food) {
        return next(new AppError("Food not found"));
      }

      const variant = food.variants.find(
        (v) => v._id.toString() === variantId.toString()
      );
      if (!variant) {
        return next(new AppError("Variant not found"));
      }

      const unitPrice = Number(toEnglishNumbers(variant.subprice));
      if (isNaN(unitPrice)) {
        return next(new AppError("Invalid variant price"));
      }

      item.totalPrice = Number((item.quantity * unitPrice).toFixed(2));

      found = true;
      break;
    }
  }

  if (!found) {
    return next(new AppError("Cart item not found"));
  }

  // تحديث السعر الكلي للسلة
  cart.totalCartPrice = cart.foods.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

  await cart.save();

  // تجهيز البيانات بالعربي لو حبيت تستخدمها
  const arabicCart = {
    ...cart.toObject(),
    totalCartPrice: toArabicNumbers(cart.totalCartPrice ?? 0),
    foods: cart.foods.map((item) => ({
      ...item.toObject(),
      quantity: toArabicNumbers(item.quantity ?? 0),
      totalPrice: toArabicNumbers(item.totalPrice ?? 0),
    })),
  };

  res.status(200).json({ msg: "تم تحديث السلة", cart: arabicCart });
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

// export const deleteCartItem = asyncHandeler(async (req, res, next) => {
//   const { foodId, variantId } = req.body;

//   const cart = await cartModel.findOne({ user: req.user._id });

//   if (!cart) {
//     return next(new AppError("Cart not found"));
//   }

//   const removedItem = cart.foods.find(
//     (item) =>
//       item.foodId.toString() === foodId.toString() &&
//       item.variantId.toString() === variantId.toString(),
//   );

//   if (!removedItem) {
//     return next(new AppError("Item not found in cart"));
//   }

//   const updatedTotal = Number(
//     (cart.totalCartPrice - removedItem.totalPrice).toFixed(2),
//   );

//   cart.foods = cart.foods.filter(
//     (item) =>
//       !(
//         item.foodId.toString() === foodId.toString() &&
//         item.variantId.toString() === variantId.toString()
//       ),
//   );

//   cart.totalCartPrice = Math.max(updatedTotal, 0);

//   await cart.save();

//   res.status(200).json({ message: "cart", cart });
// });

export const deleteCartItem = asyncHandeler(async (req, res, next) => {
  const { foodId, variantId } = req.body;

  const cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(new AppError("Cart not found"));
  }

  const removedItem = cart.foods.find(
    (item) =>
      item.foodId.toString() === foodId.toString() &&
      item.variantId.toString() === variantId.toString()
  );

  if (!removedItem) {
    return next(new AppError("Item not found in cart"));
  }

  const updatedTotal = Number(
    (cart.totalCartPrice - removedItem.totalPrice).toFixed(2)
  );

  cart.foods = cart.foods.filter(
    (item) =>
      !(
        item.foodId.toString() === foodId.toString() &&
        item.variantId.toString() === variantId.toString()
      )
  );

  cart.totalCartPrice = Math.max(updatedTotal, 0);

  await cart.save();

  // ✅ تجهيز الكارت بالأرقام العربية
  const arabicCart = {
    ...cart.toObject(),
    totalCartPrice: toArabicNumbers(cart.totalCartPrice ?? 0),
    foods: cart.foods.map((item) => ({
      ...item,
      quantity: toArabicNumbers(item.quantity ?? 0),
      totalPrice: toArabicNumbers(item.totalPrice ?? 0),
    })),
  };

  res.status(200).json({ message: "تم حذف العنصر من السلة", cart: arabicCart });
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
