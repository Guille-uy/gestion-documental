import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import {
  loginUser,
  refreshAccessToken,
  createUser,
  updateUser,
  deleteUser,
  reactivateUser,
  getAllUsers,
  getUserById,
} from "../services/auth.js";
import { LoginRequestSchema, CreateUserSchema, UpdateUserSchema } from "@dms/shared";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }

  const { email, password } = parsed.data;
  const result = await loginUser(email, password);

  res.json({
    success: true,
    data: result,
  });
});

export const refreshHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token required",
      });
    }

    const result = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  }
);

export const meHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const user = await getUserById(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  }
);

export const createUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const user = await createUser(parsed.data);

    res.status(201).json({
      success: true,
      data: user,
    });
  }
);

export const updateUserHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const parsed = UpdateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const user = await updateUser(id, parsed.data);

    res.json({
      success: true,
      data: user,
    });
  }
);

export const deleteUserHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await deleteUser(id);
    res.json({ success: true, message: "Usuario desactivado correctamente" });
  }
);

export const reactivateUserHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await reactivateUser(id);
    res.json({ success: true, message: "Usuario reactivado correctamente" });
  }
);

export const listUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const includeInactive = req.query.includeInactive === "true";

    const result = await getAllUsers(page, Math.min(limit, 100), includeInactive);

    res.json({
      success: true,
      data: result,
    });
  }
);

export const getUserHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  }
);
