 "use strict";
import { Router } from "express";
import * as CC from "./cart.controler.js";
import { auth } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post("/", auth([systemroles.user]), CC.createCart);
router.put("/update", auth([systemroles.user]), CC.updateCart);
router.put("/clear", auth([systemroles.user]), CC.clearCart);
router.get("/get", auth([systemroles.user]), CC.getCart);
router.delete("/delete", auth([systemroles.user]), CC.deleteCartItem);

export default router;
