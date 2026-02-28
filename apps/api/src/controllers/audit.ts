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
    if (req.query.from) {
      const d = new Date(req.query.from as string);
      if (!isNaN(d.getTime())) filters.from = d;
    }
    if (req.query.to) {
      // Include the full end day
      const d = new Date(req.query.to as string);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        filters.to = d;
      }
    }

    const result = await getAuditLogs(page, Math.min(limit, 500), filters);

    res.json({
      success: true,
      data: result,
    });
  }
);
