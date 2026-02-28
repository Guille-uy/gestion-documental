import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import { DocumentFlowDiagram } from "../components/DocumentFlowDiagram.js";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
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
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);
  const [newVersionChanges, setNewVersionChanges] = useState("");
  const [file, setFile] = useState<File | null>(null);
  // #2 PDF preview, #12 confirm read
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmReadDone, setConfirmReadDone] = useState(false);
  const [confirmations, setConfirmations] = useState<{ confirmed: number; total: number } | null>(null);
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

  useEffect(() => {
    if (doc?.status === "PUBLISHED") fetchConfirmations();
  }, [doc?.status]);

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
    if (action === "REQUEST_CHANGES" && !actionComentario.trim()) {
      toast.error("Debe describir los cambios requeridos antes de solicitar correcciones");
      return;
    }
    try {
      await apiService.approveReview(documentId, reviewTaskId, { action, comments: actionComentario });
      toast.success(action === "APPROVE" ? "Documento aprobado" : "Solicitud de cambios enviada al autor");
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

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) return;
    if (!window.confirm(`¿Crear una nueva versión de "${doc?.title}"?\n\nEl documento volverá al estado BORRADOR para iniciar un nuevo ciclo de revisión y aprobación. La versión publicada actual quedará como OBSOLETA.`)) return;
    try {
      await apiService.createNewVersion(documentId, { changes: newVersionChanges });
      toast.success("Nueva versión creada. El documento vuelve a estado Borrador.");
      setNewVersionChanges("");
      setShowNewVersionForm(false);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear nueva versión");
    }
  };

  const handleDownloadDocument = async () => {
    if (!documentId) return;
    try {
      const response = await apiService.downloadDocument(documentId);
      // Read filename from Content-Disposition header (includes extension)
      const disposition = response.headers["content-disposition"] || "";
      let fileName = `${doc.code}_v${doc.currentVersionLabel}`;
      const match = disposition.match(/filename="?([^"\n]+)"?/i);
      if (match?.[1]) fileName = decodeURIComponent(match[1]);
      const mimeType = response.headers["content-type"] || "application/octet-stream";
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      window.document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar el documento");
    }
  };

  // #2 PDF preview inline
  const handlePreviewDocument = async () => {
    if (!documentId) return;
    try {
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); return; }
      const response = await apiService.downloadDocument(documentId);
      const mimeType = response.headers["content-type"] || "application/pdf";
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setTimeout(() => document.getElementById("pdf-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch {
      toast.error("Error al previsualizar el archivo");
    }
  };

  // #12 Confirmar lectura
  const handleConfirmRead = async () => {
    if (!documentId) return;
    try {
      await apiService.confirmDocumentRead(documentId);
      setConfirmReadDone(true);
      toast.success("✅ Lectura confirmada correctamente");
      // Refresh confirmations count
      const r = await apiService.getDocumentReadConfirmations(documentId);
      setConfirmations({ confirmed: r.data.data.confirmed, total: r.data.data.total });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setConfirmReadDone(true);
        toast("Ya habías confirmado la lectura de este documento");
      } else {
        toast.error("Error al confirmar lectura");
      }
    }
  };

  const fetchConfirmations = async () => {
    if (!documentId || doc?.status !== "PUBLISHED") return;
    try {
      const r = await apiService.getDocumentReadConfirmations(documentId);
      setConfirmations({ confirmed: r.data.data.confirmed, total: r.data.data.total });
    } catch {}
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
  const canNuevaVersion = (user?.role === "DOCUMENT_OWNER" || user?.role === "ADMIN" || user?.role === "QUALITY_MANAGER") && doc.status === "PUBLISHED";

  return (
    <div className="space-y-7">
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
        {doc.nextReviewDate && (
          <InfoItem label="Próxima revisión" value={format(new Date(doc.nextReviewDate), "dd/MM/yyyy")} />
        )}
        {confirmations !== null && (
          <InfoItem label="Lecturas confirmadas" value={`${confirmations.confirmed} / ${confirmations.total}`} />
        )}
      </div>

      {doc.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-gray-900 mb-2">Descripción</h2>
          <p className="text-gray-600">{doc.description}</p>
        </div>
      )}

      {/* #2 PDF inline preview */}
      {previewUrl && (
        <div id="pdf-preview" className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Previsualización del documento</h2>
            <button onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <iframe src={previewUrl} className="w-full rounded border border-gray-200" style={{ height: "640px" }}
            title="Vista previa del documento" />
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
          {tieneArchivo && (
            <Button onClick={handlePreviewDocument} variant="outline" size="sm">
              {previewUrl ? "✕ Cerrar preview" : "🔍 Previsualizar PDF"}
            </Button>
          )}
          {doc.status === "PUBLISHED" && !confirmReadDone && (
            <Button onClick={handleConfirmRead} variant="outline" size="sm">✅ Confirmar lectura</Button>
          )}
          {confirmReadDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg font-medium">
              ✅ Lectura confirmada
            </span>
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
          {canNuevaVersion && (
            <Button onClick={() => setShowNewVersionForm(!showNewVersionForm)} variant="outline" size="sm">
              {showNewVersionForm ? "Cancelar" : "🔄 Crear Nueva Versión"}
            </Button>
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
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Comentarios
              <span className="text-red-500 ml-1" title="Requerido para Solicitar Cambios">*</span>
              <span className="text-gray-400 text-xs ml-2">(obligatorio para Solicitar Cambios)</span>
            </label>
            <textarea
              value={actionComentario}
              onChange={(e) => setActionComentario(e.target.value)}
              placeholder="Describa las observaciones, inconsistencias o cambios que el autor debe realizar..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button onClick={() => handleReviewAction("APPROVE")} variant="primary" size="sm">✓ Aprobar documento</Button>
            <Button
              onClick={() => handleReviewAction("REQUEST_CHANGES")}
              variant="outline"
              size="sm"
              disabled={!actionComentario.trim()}
            >
              ↩ Solicitar Cambios
            </Button>
          </div>
          {!actionComentario.trim() && (
            <p className="text-xs text-amber-600">Para solicitar cambios, debe escribir un comentario explicando qué debe corregirse.</p>
          )}
        </div>
      )}

      {showNewVersionForm && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-bold text-gray-900">Crear Nueva Versión</h2>
            <p className="text-sm text-gray-600 mt-1">
              El documento volverá a estado <strong>Borrador</strong> con una nueva versión (ej. v2.0).
              La versión publicada actual quedará marcada como <strong>Obsoleta</strong> y se conservará en el historial de versiones.
              Necesitará pasar nuevamente por el ciclo de revisión y aprobación antes de ser publicada.
            </p>
          </div>
          <form onSubmit={handleCreateNewVersion} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de los cambios <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <textarea
                value={newVersionChanges}
                onChange={(e) => setNewVersionChanges(e.target.value)}
                placeholder="Ej: Actualización de procedimientos según nueva normativa. Cambio en sección 3.2..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">Confirmar Nueva Versión</Button>
          </form>
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

      <DocumentFlowDiagram currentStatus={doc.status} doc={doc} />

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
