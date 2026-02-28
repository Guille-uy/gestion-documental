import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { ValidationError, AuthenticationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    logger.warn("Login failed: user not found or inactive", { email });
    throw new AuthenticationError("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    logger.warn("Login failed: invalid password", { email });
    throw new AuthenticationError("Invalid email or password");
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    area: user.area,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    area: user.area,
  });

  // Log the login action
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    },
  });

  logger.info("User logged in successfully", { email });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      area: user.area,
      isActive: user.isActive,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError("User not found or inactive");
  }

  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    area: user.area,
  });

  return {
    accessToken: newAccessToken,
  };
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  area?: string | null;
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ValidationError("User with this email already exists");
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      role: data.role as any,
      area: data.area || null,
      isActive: true,
    },
  });

  logger.info("New user created", { email: user.email, id: user.id });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    area: user.area,
    isActive: user.isActive,
  };
}

export async function updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    area?: string | null;
    isActive?: boolean;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: data as any,
  });

  logger.info("User updated", { userId, changes: Object.keys(data) });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    area: user.area,
    isActive: user.isActive,
  };
}

export async function deleteUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  logger.info("User deactivated (soft delete)", { userId });
}

export async function reactivateUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  logger.info("User reactivated", { userId });
}

export async function getAllUsers(page: number = 1, limit: number = 20, includeInactive = false) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        area: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({
      where: includeInactive ? {} : { isActive: true },
    }),
  ]);

  return {
    items: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      area: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ValidationError("Usuario no encontrado");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AuthenticationError("La contraseña actual es incorrecta");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  await prisma.auditLog.create({
    data: { userId, action: "UPDATE_USER", entityType: "User", entityId: userId },
  });

  logger.info("Password changed", { userId });
}
