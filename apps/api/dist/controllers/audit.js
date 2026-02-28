import { asyncHandler } from "../middleware/error.js";
import { getAuditLogs } from "../services/audit.js";
export const getAuditLogsHandler = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filters = {};
    if (req.query.action) {
        filters.action = req.query.action;
    }
    if (req.query.userId) {
        filters.userId = req.query.userId;
    }
    if (req.query.entityType) {
        filters.entityType = req.query.entityType;
    }
    const result = await getAuditLogs(page, Math.min(limit, 500), filters);
    res.json({
        success: true,
        data: result,
    });
});
//# sourceMappingURL=audit.js.map