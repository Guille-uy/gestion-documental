import { Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const CreateAreaSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  description: z.string().optional(),
});

const UpdateAreaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const CreateTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  prefix: z.string().min(1).max(10),
  description: z.string().optional(),
});

const UpdateTypeSchema = z.object({
  name: z.string().min(1).optional(),
  prefix: z.string().min(1).max(10).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ---- AREAS ----
export const listAreasHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const where = includeInactive ? {} : { isActive: true };
  const areas = await prisma.area.findMany({ where, orderBy: { name: "asc" } });
  res.json({ success: true, data: areas });
});

export const createAreaHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  const allowed = ["ADMIN", "QUALITY_MANAGER"];
  if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, error: "Sin permisos" });
  const parsed = CreateAreaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.errors });
  const existing = await prisma.area.findUnique({ where: { code: parsed.data.code } });
  if (existing) return res.status(409).json({ success: false, error: "Ya existe un área con ese código" });
  const area = await prisma.area.create({ data: { ...parsed.data, code: parsed.data.code.toUpperCase() } });
  res.status(201).json({ success: true, data: area });
});

export const updateAreaHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  const allowed = ["ADMIN", "QUALITY_MANAGER"];
  if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, error: "Sin permisos" });
  const parsed = UpdateAreaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Datos inválidos" });
  const area = await prisma.area.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ success: true, data: area });
});

export const deleteAreaHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ success: false, error: "Solo Admin puede eliminar" });
  await prisma.area.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: "Área desactivada" });
});

// ---- DOCUMENT TYPES ----
export const listDocumentTypesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const where = includeInactive ? {} : { isActive: true };
  const types = await prisma.documentTypeConfig.findMany({ where, orderBy: { name: "asc" } });
  res.json({ success: true, data: types });
});

export const createDocumentTypeHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  const allowed = ["ADMIN", "QUALITY_MANAGER"];
  if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, error: "Sin permisos" });
  const parsed = CreateTypeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.errors });
  const existing = await prisma.documentTypeConfig.findUnique({ where: { code: parsed.data.code } });
  if (existing) return res.status(409).json({ success: false, error: "Ya existe un tipo con ese código" });
  const type = await prisma.documentTypeConfig.create({ data: { ...parsed.data, code: parsed.data.code.toUpperCase(), prefix: parsed.data.prefix.toUpperCase() } });
  res.status(201).json({ success: true, data: type });
});

export const updateDocumentTypeHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  const allowed = ["ADMIN", "QUALITY_MANAGER"];
  if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, error: "Sin permisos" });
  const parsed = UpdateTypeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Datos inválidos" });
  const type = await prisma.documentTypeConfig.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ success: true, data: type });
});

export const deleteDocumentTypeHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "No autenticado" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ success: false, error: "Solo Admin puede eliminar" });
  await prisma.documentTypeConfig.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: "Tipo desactivado" });
});
