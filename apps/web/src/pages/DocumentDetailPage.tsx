import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [doc, setDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [reviewComentario, setReviewComentario] = useState("");
  const [actionComentario, setActionComentario] = useState("");
  const uploadFormRef = useRef<HTMLDivElement>(null);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  const approveFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
    fetchReviewers();
  }, [documentId]);

  const fetchDocument = async () => {
    if (!documentId) return;
    try {
      setIsLoading(true);
      const response = await apiService.getDocument(documentId);
      setDoc(response.data.data);
    } catch {
      toast.error("Error al cargar el documento");
      navigate("/documents");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const response = await apiService.getUsers(1, 50);
      const users = response.data.data.items || response.data.data.users || [];
      setAvailableReviewers(users.filter((u: any) =>
        ["REVIEWER", "APPROVER", "ADMIN", "QUALITY_MANAGER"].includes(u.role)
      ));
    } catch {}
  };

  const toggleUploadForm = () => {
    const next = !showUploadForm;
    setShowUploadForm(next);
    setShowReviewForm(false);
    setShowApproveForm(false);
    if (next) setTimeout(() => uploadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const toggleReviewForm = () => {
    const next = !showReviewForm;
    setShowReviewForm(next);
    setShowUploadForm(false);
    setShowApproveForm(false);
    if (next) setTimeout(() => reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const toggleApproveForm = () => {
    const next = !showApproveForm;
    setShowApproveForm(next);
    setShowUploadForm(false);
    setShowReviewForm(false);
    if (next) setTimeout(() => approveFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !documentId) return;
    try {
      await apiService.uploadFile(documentId, file);
      toast.success("Archivo subido exitosamente");
      setFile(null);
      setShowUploadForm(false);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al subir el archivo");
    }
  };

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || selectedReviewers.length === 0) {
      toast.error("Debe seleccionar al menos un revisor");
      return;
    }
    try {
      await apiService.submitForReview(documentId, { reviewers: selectedReviewers, comments: reviewComentario });
      toast.success("Documento enviado a revisión");
      setSelectedReviewers([]);
      setReviewComentario("");
      setShowReviewForm(false);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al enviar a revisión");
    }
  };

  const handleReviewAction = async (action: "APPROVE" | "REQUEST_CHANGES") => {
    if (!documentId || !doc) return;
    const reviewTaskId = doc.reviewTasks?.[0]?.id;
    if (!reviewTaskId) { toast.error("No se encontró tarea de revisión"); return; }
    try {
      await apiService.approveReview(documentId, reviewTaskId, { action, comments: actionComentario });
      toast.success(action === "APPROVE" ? "Documento aprobado" : "Cambios solicitados");
      setActionComentario("");
      setShowApproveForm(false);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al procesar la acción");
    }
  };

  const handlePublicarDocument = async () => {
    if (!documentId) return;
    try {
      await apiService.publishDocument(documentId, { comments: "" });
      toast.success("Documento publicado exitosamente");
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al publicar el documento");
    }
  };

  const handleDownloadDocument = async () => {
    if (!documentId) return;
    try {
      const response = await apiService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${doc.code}_v${doc.currentVersionLabel}`);
      window.document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar el documento");
    }
  };

  const toggleReviewer = (userId: string) => {
    setSelectedReviewers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (isLoading) return <div className="text-center py-8 text-gray-600">Cargando documento...</div>;
  if (!doc) return <div className="text-center py-8">Documento no encontrado</div>;

  const tieneArchivo = !!doc.googleDriveFileId;
  const canEdit = doc.status === "DRAFT" && doc.createdBy === user?.id;
  const canSubmitForReview = doc.status === "DRAFT" && doc.createdBy === user?.id && tieneArchivo;
  const canReview = (user?.role === "REVIEWER" || user?.role === "APPROVER" || user?.role === "ADMIN") && doc.status === "IN_REVIEW";
  const canPublicar = (user?.role === "APPROVER" || user?.role === "ADMIN" || user?.role === "QUALITY_MANAGER") && doc.status === "IN_REVIEW" && doc.reviewTasks?.length > 0 && doc.reviewTasks?.every((t: any) => t.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{doc.title}</h1>
          <p className="text-gray-600 mt-1">Código: <span className="font-mono font-medium">{doc.code}</span></p>
        </div>
        <EstadoBadge status={doc.status} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <InfoItem label="Tipo" value={doc.type} />
        <InfoItem label="Área" value={doc.area} />
        <InfoItem label="Versión" value={doc.currentVersionLabel} />
        <InfoItem label="Creado" value={formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: es })} />
      </div>

      {doc.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-2">Descripción</h2>
          <p className="text-gray-600">{doc.description}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button onClick={toggleUploadForm} size="sm" variant={showUploadForm ? "outline" : "primary"}>
              {showUploadForm ? "Cancelar subida" : tieneArchivo ? "Reemplazar Archivo" : "Subir Archivo"}
            </Button>
          )}
          {tieneArchivo && (
            <Button onClick={handleDownloadDocument} variant="outline" size="sm">Descargar</Button>
          )}
          {doc.status === "DRAFT" && doc.createdBy === user?.id && !tieneArchivo && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <span></span>
              <span>Debe subir un archivo antes de enviar a revisión</span>
            </div>
          )}
          {canSubmitForReview && (
            <Button onClick={toggleReviewForm} size="sm" variant={showReviewForm ? "outline" : "primary"}>
              {showReviewForm ? "Cancelar revisión" : "Enviar a Revisión"}
            </Button>
          )}
          {canReview && (
            <Button onClick={toggleApproveForm} variant="primary" size="sm">
              {showApproveForm ? "Cancelar revisión" : "Revisar Documento"}
            </Button>
          )}
          {canPublicar && (
            <Button onClick={handlePublicarDocument} variant="primary" size="sm">Publicar</Button>
          )}
        </div>
      </div>

      {showUploadForm && (
        <div ref={uploadFormRef}>
          <form onSubmit={handleUploadFile} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Subir Archivo del Documento</h2>
            <p className="text-sm text-gray-500">Formatos admitidos: <strong>PDF, DOCX, XLSX</strong>  Tamaño máximo: 50 MB</p>
            <input type="file" accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 cursor-pointer" required />
            {file && (
              <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                Seleccionado: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <Button type="submit" disabled={!file} size="sm">Subir Archivo</Button>
          </form>
        </div>
      )}

      {showReviewForm && (
        <div ref={reviewFormRef}>
          <form onSubmit={handleSubmitForReview} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Enviar a Revisión</h2>
            <Input label="Comentario (opcional)" value={reviewComentario}
              onChange={(e) => setReviewComentario(e.target.value)} placeholder="Comentario para los revisores..." />
            <div>
              <label className="block font-medium text-gray-700 mb-2">Seleccionar Revisores *</label>
              {availableReviewers.length === 0 ? (
                <p className="text-sm text-gray-500">No hay revisores disponibles</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                  {availableReviewers.map((r: any) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" checked={selectedReviewers.includes(r.id)}
                        onChange={() => toggleReviewer(r.id)} className="rounded" />
                      <span className="text-sm">{r.firstName} {r.lastName}
                        <span className="text-gray-400 ml-2">({r.role})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={selectedReviewers.length === 0} size="sm">
              Enviar a Revisión ({selectedReviewers.length} seleccionados)
            </Button>
          </form>
        </div>
      )}

      {showApproveForm && (
        <div ref={approveFormRef} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Revisión del Documento</h2>
          <Input label="Comentarios de Revisión" value={actionComentario}
            onChange={(e) => setActionComentario(e.target.value)} placeholder="Ingrese sus comentarios..." />
          <div className="flex gap-3">
            <Button onClick={() => handleReviewAction("APPROVE")} variant="primary" size="sm">Aprobar</Button>
            <Button onClick={() => handleReviewAction("REQUEST_CHANGES")} variant="outline" size="sm">Solicitar Cambios</Button>
          </div>
        </div>
      )}

      {doc.reviewTasks && doc.reviewTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-4">Revisiones</h2>
          <div className="space-y-3">
            {doc.reviewTasks.map((task: any) => (
              <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{task.reviewer?.firstName} {task.reviewer?.lastName}</p>
                  {task.comments && <p className="text-gray-500 text-sm">{task.comments}</p>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${task.status === "APPROVED" ? "bg-green-100 text-green-800" : task.status === "CHANGES_REQUESTED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {task.status === "APPROVED" ? "Aprobado" : task.status === "CHANGES_REQUESTED" ? "Cambios solicitados" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {doc.comments && doc.comments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-4">Comentarios</h2>
          <div className="space-y-4">
            {doc.comments.map((comment: any) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">{comment.author.firstName} {comment.author.lastName}</p>
                <p className="text-gray-600 text-sm">{comment.content}</p>
                <p className="text-gray-500 text-xs mt-1">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {doc.versions && doc.versions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-4">Historial de Versiones</h2>
          <div className="space-y-3">
            {doc.versions.map((version: any) => (
              <div key={version.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Versión {version.versionLabel}</span>
                  {version.fileName && <p className="text-gray-500 text-sm">{version.fileName} {version.fileSize && `(${(version.fileSize / 1024 / 1024).toFixed(2)} MB)`}</p>}
                  <p className="text-gray-400 text-xs">{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true, locale: es })}</p>
                </div>
                <EstadoBadge status={version.status} />
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

function EstadoBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En Revisión", APPROVED: "Aprobado", PUBLISHED: "Publicado", OBSOLETE: "Obsoleto" };
  const colors: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-900", IN_REVIEW: "bg-yellow-100 text-yellow-900", APPROVED: "bg-blue-100 text-blue-900", PUBLISHED: "bg-green-100 text-green-900", OBSOLETE: "bg-red-100 text-red-900" };
  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${colors[status] || colors.DRAFT}`}>
      {labels[status] || status}
    </span>
  );
}
