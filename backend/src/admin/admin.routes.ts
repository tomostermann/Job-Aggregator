import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {getUsersController,updateUserRoleController,deleteOfferController,moderateOfferController,} from "./admin.controller";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/users", getUsersController);
router.patch("/users/:id", updateUserRoleController);
router.delete("/offers/:id", deleteOfferController);
router.patch("/offers/:id", moderateOfferController);

export default router;
