 "use strict";
import { Router } from "express";
import * as FC from "./food.controler.js";
import { dataValidation, globalMulter } from "../../service/multer.js";
import { auth } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post(
  "/",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  FC.createFood,
);
router.put(
  "/update/:id",
  auth(systemroles.admin),
  globalMulter(dataValidation.image).single("image"),
  FC.updateFood,
);
router.delete(
  "/delete/:id",
  auth(systemroles.admin),
  globalMulter(dataValidation.image).single("image"),
  FC.deleteFood,
);
router.get("/", FC.getFoods);
router.get("/All", FC.getAllFoods);
router.get("/:id", FC.getFood);
router.put(
  "/food/:id/variant/:variantId",
  auth(systemroles.admin),
  FC.updateVariant,
);
router.delete(
  "/food/:id/variant/:variantId",
  auth(systemroles.admin),
  FC.deleteVariant,
);
router.post("/food/:id", auth(systemroles.admin), FC.createVariant);

export default router;
