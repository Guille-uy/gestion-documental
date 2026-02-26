import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import { Input } from "../components/Input.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    entityType: "",
  });

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAuditLogs({
        page,
        limit,
        ...filters,
      });
      setLogs(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="CREATE_DOCUMENT">Create Document</option>
            <option value="UPDATE_DOCUMENT">Update Document</option>
            <option value="PUBLISH_DOCUMENT">Publish Document</option>
            <option value="DOWNLOAD_DOCUMENT">Download Document</option>
            <option value="CREATE_USER">Create User</option>
            <option value="UPDATE_USER">Update User</option>
            <option value="DELETE_USER">Delete User</option>
            <option value="SUBMIT_FOR_REVIEW">Submit for Review</option>
            <option value="APPROVE_REVIEW">Approve Review</option>
            <option value="REQUEST_CHANGES">Request Changes</option>
          </select>

          <Input
            placeholder="Filter by user ID..."
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
          />

          <Input
            placeholder="Filter by entity type..."
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">
                        {log.user.firstName} {log.user.lastName}
                      </span>
                      <p className="text-gray-500 text-xs">{log.user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.entityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {log.entityId || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
