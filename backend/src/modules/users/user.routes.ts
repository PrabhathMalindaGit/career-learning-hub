import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import {
  changePasswordController,
  getCurrentUserController,
  logoutAllSessionsController,
  updateCurrentUserController,
} from "./user.controller.js";
import {
  changePasswordBodySchema,
  updateProfileBodySchema,
} from "./user.schemas.js";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", asyncHandler(getCurrentUserController));

userRouter.patch(
  "/me",
  validate({ body: updateProfileBodySchema }),
  asyncHandler(updateCurrentUserController),
);

userRouter.post(
  "/me/change-password",
  validate({ body: changePasswordBodySchema }),
  asyncHandler(changePasswordController),
);

userRouter.post(
  "/me/logout-all",
  asyncHandler(logoutAllSessionsController),
);
