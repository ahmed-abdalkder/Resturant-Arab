 "use strict";
import { Router } from "express";
import * as CC from "./category.controler.js";
import { dataValidation, globalMulter } from "../../service/multer.js";
import { auth } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post(
  "/",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  CC.createCategory,
);
router.patch(
  "/:id",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  CC.updateCatrgory,
);
router.delete(
  "/delete/:id",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  CC.deleteCategory,
);
router.get("/", CC.getCategories);
router.get("/:id", CC.getCategory);

export default router;
