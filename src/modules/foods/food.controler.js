 "use strict";
import { nanoid } from "nanoid";
import categoryModel from "../../../db/models/category.model.js";
import foodModel from "../../../db/models/food.model.js";
import cloudinary from "../../service/cloudinary.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

// export const createFood = asyncHandeler(async (req, res, next) => {
//   const { title, description, category, discount, categoryName } = req.body;
//   let variants = req.body.variants;

//   if (typeof variants === "string") {
//     variants = JSON.parse(variants);
//   }

//   if (!Array.isArray(variants)) {
//     return next(new AppError("Variants must be an array"));
//   }

//   const categoryExist = await categoryModel.findById(category);

//   if (!categoryExist) {
//     return next(new AppError("category not found"));
//   }
//   const foodExist = await foodModel.findOne({ title });
//   if (foodExist) {
//     return next(new AppError("food allredy exist"));
//   }

//   const updatedVariants = variants.map((variant) => {
//     const price = Number(variant.price);
//     if (isNaN(price)) {
//       throw new Error("Each variant must have a valid numeric price");
//     }

//     const subprice = price - (price * (discount || 0)) / 100;

//     return {
//       ...variant,
//       price,
//       subprice,
//     };
//   });

//   if (!req.file) {
//     return next(new AppError("please inter image"));
//   }
//   const customId = nanoid(5);
//   const { secure_url, public_id } = await cloudinary.uploader.upload(
//     req.file.path,
//     {
//       folder: `Resturant/Category/Food/${customId}`,
//     },
//   );

//   const food = await foodModel.create({
//     title,
//     description,
//     category,
//     discount,
//     image: { secure_url, public_id },
//     customId,
//     createdBy: req.user._id,
//     variants: updatedVariants,
//     categoryName,
//   });

//   return res.json({ msg: "food", food });
// });

function toArabicNumbers(input) {
  if (input === undefined || input === null) return "٠";  
  return input.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function toEnglishNumbers(str) {
  return str
    .toString()
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

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
    return next(new AppError("food already exists"));
  }

 
  const parsedDiscount = Number(toEnglishNumbers(discount || 0));

  
  const updatedVariants = variants.map((variant) => {
    const rawPrice = toEnglishNumbers(variant.price);
    const price = Number(rawPrice);

    if (isNaN(price)) {
      throw new Error("Each variant must have a valid numeric price");
    }

    const subprice = price - (price * parsedDiscount) / 100;

    return {
      ...variant,
      price,
      subprice:subprice.toString(),
    };
  });

  if (!req.file) {
    return next(new AppError("Please upload an image"));
  }

  const customId = nanoid(5);

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: `Resturant/Category/Food/${customId}`,
  });

  const food = await foodModel.create({
    title,
    description,
    category,
    discount: parsedDiscount,
    image: { secure_url, public_id },
    customId,
    createdBy: req.user._id,
    variants: updatedVariants,
    categoryName,
  });

const arabicFood = {
  ...food.toObject(),
  discount: toArabicNumbers(food.discount ?? 0),
  variants: updatedVariants.map((variant) => ({
    ...variant,
    price: toArabicNumbers(variant.price ?? 0),
    subprice: toArabicNumbers(variant.subprice ?? 0),
  })),
};
  return res.status(201).json({
    msg: "تم إنشاء المنتج بنجاح",
    food: {
      ...food.toObject(),
      discount: toArabicNumbers(parsedDiscount),
      variants: arabicFood,
    },
  });
});


// export const updateFood = asyncHandeler(async (req, res, next) => {
//   const { id } = req.params;

//   const { title, description, discount, category } = req.body;

//   const food = await foodModel.findById(id);
//   if (!food) {
//     return next(new AppError("food not found"));
//   }

//   if (title) food.title = title;
//   if (description) food.description = description;
//   if (category) food.category = category;
//   if (discount !== undefined) {
//     const discountValue = Number(discount);

//     if (isNaN(discountValue)) {
//       return next(new AppError("Discount must be a number"));
//     }
//     food.discount = discountValue;

//     food.variants = food.variants.map((variant) => {
//       const price = Number(variant.price);
//       const subprice = price - (price * (discountValue || 0)) / 100;
//       return { ...variant.toObject(), subprice };
//     });
//   }

//   if (req.file) {
//     await cloudinary.uploader.destroy(food.image.public_id);

//     const { secure_url, public_id } = await cloudinary.uploader.upload(
//       req.file.path,
//       { folder: `Resturant/Category/Food/${food.customId}` },
//     );
//     food.image = { secure_url, public_id };
//   }

//   await food.save();

//   return res.status(200).json({ message: "Food", food });
  
// });

export const updateFood = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, discount, category, categoryName } = req.body;
  let variants = req.body.variants;

  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }

  if (title) food.title = title;
  if (description) food.description = description;
  if (category) food.category = category;
  if (categoryName) food.categoryName = categoryName;

  // تحويل الخصم من أرقام عربية إلى إنجليزية
  const parsedDiscount = Number(toEnglishNumbers(discount || food.discount || 0));
  if (isNaN(parsedDiscount)) {
    return next(new AppError("Discount must be a valid number"));
  }
  food.discount = parsedDiscount;

  // ✅ تم التعديل هنا
  // تحديث الـ variants سواء تم إرسالها أم لا، حتى تتحدث subprice
  if (variants) {
    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch (err) {
        return next(new AppError("Variants format is invalid"));
      }
    }

    if (!Array.isArray(variants)) {
      return next(new AppError("Variants must be an array"));
    }

    const updatedVariants = variants.map((variant) => {
      const rawPrice = toEnglishNumbers(variant.price);
      const price = Number(rawPrice);
      if (isNaN(price)) {
        throw new Error("Each variant must have a valid numeric price");
      }
      const subprice = price - (price * parsedDiscount) / 100;
      return {
        ...variant,
        price,
        subprice: subprice.toString(),
      };
    });

    food.variants = updatedVariants;
  } else {
    // ✅ تم التعديل هنا: إعادة حساب subprice حتى لو مفيش variants مرسلة
    food.variants = food.variants.map((variant) => {
      const price = Number(toEnglishNumbers(variant.price));
      const subprice = price - (price * parsedDiscount) / 100;
      return {
        ...variant.toObject(),
        subprice: subprice.toString(),
      };
    });
  }

  // إذا تم رفع صورة جديدة
  if (req.file) {
    if (food.image?.public_id) {
      await cloudinary.uploader.destroy(food.image.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `Resturant/Category/Food/${food.customId}` }
    );

    food.image = { secure_url, public_id };
  }

  await food.save();

  // تجهيز البيانات بالعربي للعرض
  const arabicFood = {
    ...food.toObject(),
    discount: toArabicNumbers(food.discount ?? 0),
    variants: food.variants.map((variant) => ({
      ...variant,
      price: toArabicNumbers(variant.price ?? 0),
      subprice: toArabicNumbers(variant.subprice ?? 0),
    })),
  };

  return res.status(200).json({
    msg: "تم تعديل المنتج بنجاح",
    food: arabicFood,
  });
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

// export const updateVariant = asyncHandeler(async (req, res, next) => {
//   const { id, variantId } = req.params;
//   const { type, label, price } = req.body;

//   const food = await foodModel.findById(id);

//   if (!food) {
//     return next(new AppError("food not found"));
//   }
//   const variant = food.variants.find((v) => v.id === variantId);

//   if (!variant) {
//     throw new Error("variant not found");
//   }
//   const updatedPrice = Number(price);
//   if (isNaN(updatedPrice)) {
//     throw new Error("Price must be a number");
//   }

//   if (type) variant.type = type;
//   if (label) variant.label = label;
//   if (price) variant.price = updatedPrice;

//   const subprice = variant.price - (variant.price * (food.discount || 0)) / 100;
//   variant.subprice = subprice;

//   await food.save();
//   res.status(200).json({ msg: "food", food });
// });

export const updateVariant = asyncHandeler(async (req, res, next) => {
  const { id, variantId } = req.params;
  const { type, label, price } = req.body;

  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }

  const variant = food.variants.find((v) => v.id === variantId);
  if (!variant) {
    return next(new AppError("variant not found"));
  }

  // تحويل السعر إلى إنجليزي ثم رقم
  const rawPrice = toEnglishNumbers(price ?? variant.price);
  const numericPrice = Number(rawPrice);

  if (isNaN(numericPrice)) {
    return next(new AppError("Price must be a valid number"));
  }

  // تحديث القيم
  if (type) variant.type = type;
  if (label) variant.label = label;
  variant.price = numericPrice.toString();

  const subprice = numericPrice - (numericPrice * (food.discount || 0)) / 100;
  variant.subprice = subprice.toString();

  await food.save();

  // تجهيز نسخة عربية للعرض
  const arabicFood = {
    ...food.toObject(),
    discount: toArabicNumbers(food.discount ?? 0),
    variants: food.variants.map((v) => ({
      ...v,
      price: toArabicNumbers(v.price ?? 0),
      subprice: toArabicNumbers(v.subprice ?? 0),
    })),
  };

  res.status(200).json({
    msg: "تم تحديث الخيار بنجاح",
    food: arabicFood,
  });
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

// export const createVariant = asyncHandeler(async (req, res, next) => {
//   const { id } = req.params;
//   const { type, label, price } = req.body;

//   const food = await foodModel.findById(id);

//   if (!food) {
//     return next(new AppError("food not found"));
//   }
//   const subprice = price - (price * (food.discount || 0)) / 100;
//   food.variants.push({ type, label, price, subprice });

//   await food.save();
//   res.status(200).json({ msg: "food", food });
// });

export const createVariant = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { type, label, price } = req.body;

  const food = await foodModel.findById(id);
  if (!food) {
    return next(new AppError("food not found"));
  }

  // تحويل السعر من عربي إلى إنجليزي ثم إلى رقم
  const rawPrice = toEnglishNumbers(price);
  const numericPrice = Number(rawPrice);

  if (isNaN(numericPrice)) {
    return next(new AppError("Price must be a valid number"));
  }

  // حساب subprice بعد الخصم
  const subprice = numericPrice - (numericPrice * (food.discount || 0)) / 100;

  // إضافة المتغير
  food.variants.push({
    type,
    label,
    price: numericPrice.toString(),
    subprice: subprice.toString(),
  });

  await food.save();

  // تجهيز البيانات للعرض بالعربي
  const arabicFood = {
    ...food.toObject(),
    discount: toArabicNumbers(food.discount ?? 0),
    variants: food.variants.map((v) => ({
      ...v,
      price: toArabicNumbers(v.price ?? 0),
      subprice: toArabicNumbers(v.subprice ?? 0),
    })),
  };

  res.status(200).json({
    msg: "تم إضافة الخيار بنجاح",
    food: arabicFood,
  });
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
