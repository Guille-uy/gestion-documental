import { Router } from "express";
import {
  loginHandler,
  refreshHandler,
  meHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listUsersHandler,
  getUserHandler,
} from "../controllers/auth.js";
import { authMiddleware, authorizationMiddleware } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);

// Protected routes
router.get("/me", authMiddleware, meHandler);

// Admin only routes
router.post("/users", authMiddleware, authorizationMiddleware(["ADMIN"]), createUserHandler);
router.get("/users", authMiddleware, authorizationMiddleware(["ADMIN"]), listUsersHandler);
router.get("/users/:id", authMiddleware, authorizationMiddleware(["ADMIN"]), getUserHandler);
router.patch("/users/:id", authMiddleware, authorizationMiddleware(["ADMIN"]), updateUserHandler);
router.delete("/users/:id", authMiddleware, authorizationMiddleware(["ADMIN"]), deleteUserHandler);

export default router;
