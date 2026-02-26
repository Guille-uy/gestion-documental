import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import { getAuditLogs } from "../services/audit.js";

export const getAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters: any = {};

    if (req.query.action) {
      filters.action = req.query.action as string;
    }
    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }
    if (req.query.entityType) {
      filters.entityType = req.query.entityType as string;
    }

    const result = await getAuditLogs(page, Math.min(limit, 500), filters);

    res.json({
      success: true,
      data: result,
    });
  }
);
