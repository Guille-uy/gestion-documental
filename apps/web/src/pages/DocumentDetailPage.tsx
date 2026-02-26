import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [actionComment, setActionComment] = useState("");

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    if (!documentId) return;
    try {
      setIsLoading(true);
      const response = await apiService.getDocument(documentId);
      setDocument(response.data.data);
    } catch (error) {
      toast.error("Failed to load document");
      navigate("/documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !documentId) return;

    try {
      await apiService.uploadFile(documentId, file);
      toast.success("File uploaded successfully");
      setFile(null);
      setShowUploadForm(false);
      fetchDocument();
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || reviewers.length === 0) return;

    try {
      await apiService.submitForReview(documentId, {
        reviewers,
        comments: reviewComment,
      });
      toast.success("Document submitted for review");
      setReviewers([]);
      setReviewComment("");
      setShowReviewForm(false);
      fetchDocument();
    } catch (error) {
      toast.error("Failed to submit for review");
    }
  };

  const handlePublishDocument = async () => {
    if (!documentId) return;

    try {
      await apiService.publishDocument(documentId, {
        comments: "",
      });
      toast.success("Document published successfully");
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to publish document");
    }
  };

  const handleDownloadDocument = async () => {
    if (!documentId) return;

    try {
      const response = await apiService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${document.code}_v${document.currentVersionLabel}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading document...</div>;
  }

  if (!document) {
    return <div className="text-center py-8">Document not found</div>;
  }

  const canEdit = document.status === "DRAFT" && document.createdBy === user?.id;
  const canSubmitForReview =
    document.status === "DRAFT" && document.createdBy === user?.id;
  const canApprove =
    (user?.role === "APPROVER" || user?.role === "ADMIN") &&
    document.status === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-gray-600 mt-1">Code: {document.code}</p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      {/* Document Info */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <InfoItem label="Type" value={document.type} />
        <InfoItem label="Area" value={document.area} />
        <InfoItem label="Version" value={document.currentVersionLabel} />
        <InfoItem
          label="Created"
          value={formatDistanceToNow(new Date(document.createdAt), {
            addSuffix: true,
          })}
        />
      </div>

      {/* Description */}
      {document.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600">{document.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button onClick={() => setShowUploadForm(!showUploadForm)} size="sm">
              {showUploadForm ? "Cancel Upload" : "Upload File"}
            </Button>
          )}

          {document.googleDriveFileId && (
            <Button
              onClick={handleDownloadDocument}
              variant="outline"
              size="sm"
            >
              Download
            </Button>
          )}

          {canSubmitForReview && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              size="sm"
            >
              {showReviewForm ? "Cancel" : "Submit for Review"}
            </Button>
          )}

          {canApprove && (
            <Button onClick={handlePublishDocument} variant="primary" size="sm">
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <form onSubmit={handleUploadFile} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Upload Document File</h2>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full"
            required
          />
          <Button type="submit" isLoading={!file} size="sm">
            Upload
          </Button>
        </form>
      )}

      {/* Submit for Review Form */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmitForReview}
          className="bg-white rounded-lg shadow p-6 space-y-4"
        >
          <h2 className="font-bold text-gray-900">Submit for Review</h2>
          <Input
            label="Add review comment (optional)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Enter your comment..."
          />
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Select Reviewers *
            </label>
            <p className="text-sm text-gray-600 mb-2">
              (Feature: In production, would fetch available reviewers)
            </p>
          </div>
          <Button
            type="submit"
            disabled={reviewers.length === 0}
            size="sm"
          >
            Submit for Review
          </Button>
        </form>
      )}

      {/* Comments Section */}
      {document.comments && document.comments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-4">Comments</h2>
          <div className="space-y-4">
            {document.comments.map((comment: any) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">
                  {comment.author.firstName} {comment.author.lastName}
                </p>
                <p className="text-gray-600 text-sm">{comment.content}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Versions */}
      {document.versions && document.versions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-4">Version History</h2>
          <div className="space-y-3">
            {document.versions.map((version: any) => (
              <div key={version.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{version.versionLabel}</span>
                  <p className="text-gray-500 text-sm">
                    {formatDistanceToNow(new Date(version.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <StatusBadge status={version.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
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
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${colors[status] || colors.DRAFT}`}>
      {status}
    </span>
  );
}
