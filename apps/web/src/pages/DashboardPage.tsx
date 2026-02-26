import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    drafts: 0,
    inReview: 0,
    published: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.listDocuments({
          page: 1,
          limit: 5,
        });

        const docs = response.data.data.items;
        setRecentDocuments(docs);

        setStats({
          totalDocuments: response.data.data.total,
          drafts: docs.filter((d: any) => d.status === "DRAFT").length,
          inReview: docs.filter((d: any) => d.status === "IN_REVIEW").length,
          published: docs.filter((d: any) => d.status === "PUBLISHED").length,
        });
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your documents efficiently with our DMS platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Documents" value={stats.totalDocuments} />
        <StatCard title="Drafts" value={stats.drafts} color="bg-yellow-50 text-yellow-900" />
        <StatCard title="In Review" value={stats.inReview} color="bg-blue-50 text-blue-900" />
        <StatCard title="Published" value={stats.published} color="bg-green-50 text-green-900" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/documents/create"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-600"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-bold text-gray-900">Create Document</h3>
          <p className="text-gray-600 text-sm">Start a new document</p>
        </Link>

        <Link
          to="/documents"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-bold text-gray-900">View Documents</h3>
          <p className="text-gray-600 text-sm">Browse all documents</p>
        </Link>
      </div>

      {/* Recent Documents */}
      {!isLoading && recentDocuments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Recent Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50" onClick={() => {}}>
                    <td className="px-6 py-4">{doc.code}</td>
                    <td className="px-6 py-4">{doc.title}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4">{doc.type}</td>
                    <td className="px-6 py-4">{doc.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color = "bg-blue-50 text-blue-900" }) {
  return (
    <div className={`p-6 rounded-lg shadow ${color}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-900",
    IN_REVIEW: "bg-yellow-100 text-yellow-900",
    APPROVED: "bg-blue-100 text-blue-900",
    PUBLISHED: "bg-green-100 text-green-900",
    OBSOLETE: "bg-red-100 text-red-900",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.DRAFT}`}>
      {status}
    </span>
  );
}
