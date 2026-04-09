import { Response } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  createDocument,
  uploadDocumentFile,
  getDocument,
  updateDocument,
  submitForReview,
  approveReview,
  publishDocument,
  listDocuments,
  downloadDocument,
  createNewVersion,
  confirmDocumentRead,
  getDocumentReadConfirmations,
  getMyTasks,
  addDocumentComment,
  archiveDocument,
  deleteDocument,
  bulkUpdateDocuments,
} from "../services/document.js";
import { CreateDocumentSchema, UpdateDocumentSchema } from "@dms/shared";

// Roles that can access documents across all areas
const PRIVILEGED_ROLES = ["ADMIN", "QUALITY_MANAGER"];
// Roles that can access documents they are explicitly assigned to review (across areas)
const REVIEW_ROLES = ["REVIEWER", "APPROVER"];

/** Returns true if the user has access to the given document area */
async function hasAreaAccess(
  user: NonNullable<AuthenticatedRequest["user"]>,
  documentId: string,
  documentArea: string
): Promise<boolean> {
  // Privileged roles: full access
  if (PRIVILEGED_ROLES.includes(user.role)) return true;
  // No area assigned: skip restriction (backward compatible)
  if (!user.area) return true;
  // Same area: allow
  if (documentArea === user.area) return true;
  // REVIEWER / APPROVER: allow if assigned to a review task for this document
  if (REVIEW_ROLES.includes(user.role)) {
    const task = await prisma.reviewTask.findFirst({
      where: { documentId, assignedTo: user.userId },
    });
    if (task) return true;
  }
  return false;
}

export const createDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const parsed = CreateDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const document = await createDocument(parsed.data, req.user.userId);

    res.status(201).json({
      success: true,
      data: document,
    });
  }
);

export const uploadFileHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const document = await uploadDocumentFile(
      documentId,
      req.file.originalname,
      req.file.buffer,
      req.user.userId
    );

    res.json({
      success: true,
      data: document,
    });
  }
);

export const getDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const document = await getDocument(documentId);

    // Area-based access control
    if (!(await hasAreaAccess(req.user, documentId, document.area))) {
      return res.status(403).json({ success: false, error: "Acceso denegado: el documento pertenece a otra área" });
    }

    res.json({
      success: true,
      data: document,
    });
  }
);

export const updateDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const parsed = UpdateDocumentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const document = await updateDocument(documentId, parsed.data, req.user.userId);

    res.json({
      success: true,
      data: document,
    });
  }
);

export const submitForReviewHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const { reviewers, comments } = req.body;

    if (!Array.isArray(reviewers) || reviewers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one reviewer is required",
      });
    }

    const document = await submitForReview(
      documentId,
      reviewers,
      comments,
      req.user.userId
    );

    res.json({
      success: true,
      data: document,
    });
  }
);

export const approveReviewHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId, reviewTaskId } = req.params;
    const { action, comments } = req.body;

    if (!["APPROVE", "REQUEST_CHANGES"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action",
      });
    }

    const result = await approveReview(
      documentId,
      reviewTaskId,
      action,
      comments,
      req.user.userId
    );

    res.json({
      success: true,
      data: result,
    });
  }
);

export const publishDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const { comments } = req.body;

    const document = await publishDocument(documentId, comments, req.user.userId);

    res.json({
      success: true,
      data: document,
    });
  }
);

export const listDocumentsHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters: {
      status?: string;
      area?: string;
      type?: string;
      search?: string;
    } = {
      status: req.query.status as string | undefined,
      area: req.query.area as string | undefined,
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
    };

    // Area-based access control:
    // Non-privileged roles with an assigned area are restricted to that area only.
    // Their requested area filter is ignored and replaced with their own area.
    if (!PRIVILEGED_ROLES.includes(req.user.role) && req.user.area) {
      filters.area = req.user.area;
    }

    const sort = {
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as "asc" | "desc" | undefined) ?? "desc",
    };

    const result = await listDocuments(page, Math.min(limit, 100), filters, sort);

    res.json({
      success: true,
      data: result,
    });
  }
);

export const downloadDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;

    // Area access check before serving file
    const docMeta = await getDocument(documentId);
    if (!(await hasAreaAccess(req.user, documentId, docMeta.area))) {
      return res.status(403).json({ success: false, error: "Acceso denegado: el documento pertenece a otra área" });
    }

    const { content, fileName, mimeType } = await downloadDocument(documentId, req.user.userId);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", content.length);
    res.send(content);
  }
);

export const createNewVersionHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const { changes } = req.body;
    const document = await createNewVersion(documentId, changes, req.user.userId);
    res.status(201).json({ success: true, data: document });
  }
);

// #12 — Confirmación de lectura
export const confirmReadHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const confirmation = await confirmDocumentRead(documentId, req.user.userId);
    res.json({ success: true, data: confirmation });
  }
);

export const getConfirmationsHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const result = await getDocumentReadConfirmations(documentId);
    res.json({ success: true, data: result });
  }
);

export const myTasksHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const tasks = await getMyTasks(req.user.userId);
    res.json({ success: true, data: tasks });
  }
);

export const addCommentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: "El comentario no puede estar vacío" });
    }
    const comment = await addDocumentComment(documentId, req.user.userId, content.trim());
    res.status(201).json({ success: true, data: comment });
  }
);

// ── Mejora 15: Archive & Delete ──────────────────────────────────────────────

export const archiveDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Solo administradores pueden archivar documentos" });
    }
    const { documentId } = req.params;
    const doc = await archiveDocument(documentId, req.user.userId);
    res.json({ success: true, data: doc });
  }
);

export const deleteDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Solo administradores pueden eliminar documentos" });
    }
    const { documentId } = req.params;
    await deleteDocument(documentId, req.user.userId);
    res.json({ success: true, message: "Documento eliminado" });
  }
);

// ── Template builder for AI assist (no external API needed) ─────────────────

function buildTemplate(module: string, docType: string, title: string, area: string): string {
  const today = new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });

  const templates: Record<string, Record<string, string>> = {
    objetivo: {
      PR: `Establecer la metodología, secuencia y criterios para la correcta ejecución de "${title}" en el área de ${area}, asegurando resultados consistentes y controlados en conformidad con los requisitos del Sistema de Gestión.`,
      PO: `Definir la posición oficial de la organización respecto a "${title}", estableciendo los principios y compromisos que orientan las decisiones y acciones en ${area}, en alineación con los objetivos estratégicos y los requisitos de las normas aplicables.`,
      MN: `Describir en forma integral los requisitos, responsabilidades, procesos e interacciones del sistema de gestión en relación a "${title}", proporcionando un marco de referencia completo para ${area}.`,
      IT: `Proporcionar instrucciones detalladas y secuenciales para la ejecución correcta de "${title}" en ${area}, garantizando resultados reproducibles y reduciendo la variabilidad del proceso.`,
      PT: `Establecer el protocolo formal y los criterios de aceptación para "${title}" en ${area}, definiendo los pasos, recursos y responsabilidades necesarios para su correcta implementación.`,
      DEFAULT: `Establecer el marco de referencia, lineamientos y criterios aplicables a "${title}" en el área de ${area}, garantizando la gestión efectiva, controlada y conforme a los requisitos del sistema de gestión.`,
    },
    alcance: {
      DEFAULT: `Este documento aplica a todas las actividades, recursos y personal de ${area} involucrados en "${title}".\n\nComprende desde [inicio del proceso] hasta [fin del proceso / entregable final].\n\n**Aplica a:**\n- Área: ${area}\n- Personal: [puestos o grupos de trabajo involucrados]\n- Ubicaciones: [sitio/s donde se ejecuta]\n\n**Queda excluido:**\n- [Actividades, procesos o áreas no contemplados en este documento, si corresponde]`,
    },
    responsabilidades: {
      DEFAULT: `**Responsable del proceso:**\nAsegura la correcta implementación, mantenimiento y cumplimiento de este documento. Gestiona los recursos y las desviaciones detectadas.\n\n**Ejecutores / Operadores:**\nAplican las disposiciones de este documento en las actividades de su competencia. Reportan desviaciones al responsable del proceso.\n\n**Gestor de Calidad:**\nVerifica el cumplimiento mediante auditorías y revisiones periódicas. Mantiene el documento actualizado conforme a cambios del sistema.\n\n**Jefe de área / Líder:**\nAprueba y respalda la implementación. Garantiza la disponibilidad de los recursos necesarios.\n\n**Gerencia / Dirección:**\nRevisa y aprueba el documento. Asegura su alineación con los objetivos estratégicos.`,
    },
    docsRelacionados: {
      DEFAULT: `Los siguientes documentos del sistema de gestión se relacionan con "${title}":\n\n| Código | Título | Tipo |\n|--------|--------|------|\n| [CÓDIGO] | [Título del documento relacionado 1] | [Tipo] |\n| [CÓDIGO] | [Título del documento relacionado 2] | [Tipo] |\n| [CÓDIGO] | [Normativa o legislación aplicable] | Normativa externa |\n\n**Normas y referencias externas:**\n- ISO 9001:2015 – Sistemas de gestión de la calidad\n- [Otras normas o regulaciones aplicables al proceso]`,
    },
    descripcion: {
      PR: `## 1. Descripción general del proceso\n\n"${title}" comprende las siguientes etapas y actividades:\n\n[Describir el proceso de forma general]\n\n## 2. Desarrollo del procedimiento\n\n### Paso 1: [Nombre del primer paso]\n[Descripción detallada de las acciones a realizar, recursos y responsable]\n\n### Paso 2: [Nombre del segundo paso]\n[Descripción detallada]\n\n### Paso N: [Nombre del último paso]\n[Descripción detallada]\n\n## 3. Criterios de calidad / aceptación\n\nEl proceso se considera correctamente ejecutado cuando:\n- [Criterio 1]\n- [Criterio 2]\n\n## 4. Registros generados\n\n[Indicar qué registros se generan al ejecutar este procedimiento]`,
      MN: `## 1. Introducción\n\nEl presente manual describe "${title}" y establece el marco de referencia para ${area}.\n\n## 2. Contexto de la organización\n\n[Describir el contexto en que se aplica este manual]\n\n## 3. Liderazgo y compromiso\n\n[Describir el compromiso de la dirección]\n\n## 4. Planificación\n\n[Describir la planificación del sistema o proceso]\n\n## 5. Soporte\n\n[Recursos, competencias, comunicación, información documentada]\n\n## 6. Operación\n\n[Planificación y control operacional]\n\n## 7. Evaluación del desempeño\n\n[Seguimiento, medición, análisis y evaluación]\n\n## 8. Mejora continua\n\n[No conformidades, acciones correctivas, mejora continua]`,
      FT: `## Identificación\n\n- **Nombre/Denominación:** ${title}\n- **Área:** ${area}\n- **Responsable técnico:** [Nombre]\n\n## Características principales\n\n| Característica | Valor / Especificación | Unidad | Observaciones |\n|----------------|------------------------|--------|----------------|\n| [Característica 1] | [Valor] | [Unidad] | |\n| [Característica 2] | [Valor] | [Unidad] | |\n\n## Condiciones de uso\n\n[Describir condiciones de uso, almacenamiento, manipulación o aplicación]\n\n## Certificaciones / Conformidades\n\n[Indicar normas técnicas o certificaciones aplicables]`,
      DEFAULT: `## 1. Descripción general\n\n[Describir el contenido principal de "${title}" en ${area}]\n\n## 2. Desarrollo\n\n[Ampliar el contenido del documento según corresponda al tipo]\n\n## 3. Consideraciones adicionales\n\n[Indicar aspectos relevantes, excepciones, notas técnicas]\n\n## 4. Registros y evidencias\n\n[Indicar los registros que documentan la aplicación de este documento]`,
    },
    controlCambios: {
      DEFAULT: `| Versión | Fecha | Descripción del cambio | Elaborado por | Revisado por | Aprobado por |\n|---------|-------|------------------------|---------------|--------------|---------------|\n| v1.0 | ${today} | Versión inicial del documento | [Nombre] | [Nombre] | [Nombre] |`,
    },
  };

  const mod = templates[module] || {};
  return mod[docType] || mod["DEFAULT"] || `Contenido sugerido para el módulo "${module}" del documento "${title}" (${area}).`;
}

// ── Content improvement helper ───────────────────────────────────────────────

function improveContent(existingHtml: string, module: string, docType: string, title: string, area: string): string {
  const plain = existingHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const complements: Record<string, Record<string, string>> = {
    objetivo: {
      DEFAULT: `Complemento sugerido para ampliar el objetivo:\n\nAdemás de lo indicado, se recomienda incluir:\n- El marco normativo aplicable (ISO 9001:2015, regulaciones sectoriales)\n- El beneficio esperado para ${area} y la organización\n- Los resultados medibles que permitan evaluar el cumplimiento del objetivo\n\nEjemplo de cierre: "Este documento contribuye a la mejora continua del Sistema de Gestión de ${area}, en conformidad con los requisitos aplicables."`,
    },
    alcance: {
      DEFAULT: `Complemento sugerido para el alcance:\n\n**Exclusiones recomendadas a considerar:**\n- Actividades tercerizadas no controladas por ${area}\n- Documentos de otras áreas salvo interfaz explícita\n- [Especificar otras exclusiones relevantes]\n\n**Interfaces con otros procesos:**\n- [Proceso o área aguas arriba]\n- [Proceso o área aguas abajo]\n\nSe recomienda clarificar los límites del proceso y los puntos de transferencia de responsabilidad.`,
    },
    responsabilidades: {
      DEFAULT: `Responsabilidades complementarias a considerar:\n\n**Comité de Gestión de Calidad:**\nRealiza seguimiento periódico al cumplimiento de "${title}". Escala incumplimientos a la dirección cuando corresponda.\n\n**Auditor interno:**\nVerifica la aplicación efectiva durante auditorías programadas. Identifica oportunidades de mejora y no conformidades.\n\n**Personal en formación / nuevos ingresos:**\nDeben recibir instrucción sobre este documento antes de ejecutar las actividades correspondientes.`,
    },
    docsRelacionados: {
      DEFAULT: `Documentos adicionales relacionados a revisar:\n\n| Código | Título | Tipo |\n|--------|--------|------|\n| [CÓDIGO] | Matriz de riesgos del proceso | RG |\n| [CÓDIGO] | Plan de capacitación | PL |\n| [CÓDIGO] | Procedimiento de no conformidades | PR |\n| [CÓDIGO] | Manual de gestión de calidad | MN |\n\n**Legislación aplicable:**\n- [Decreto / Normativa local aplicable]\n- [Reglamento sectorial si corresponde]`,
    },
    descripcion: {
      PR: `## Controles y verificaciones\n\n### Puntos de control críticos\n| Paso | Control | Frecuencia | Responsable |\n|------|---------|------------|-------------|\n| [Paso N] | [Descripción del control] | [Frecuencia] | [Rol] |\n\n### Manejo de desvíos\nEn caso de detectar desvíos durante la ejecución:\n1. Detener la actividad si hay riesgo de producto/servicio no conforme\n2. Notificar al responsable del proceso\n3. Registrar el desvío según el procedimiento de no conformidades\n4. Evaluar la necesidad de retrabajo o descarte\n\n### Registros requeridos\n[Indicar los formularios, registros o evidencias que deben completarse al ejecutar este procedimiento]`,
      DEFAULT: `## Consideraciones adicionales\n\n### Gestión de excepciones\nCuando las condiciones no permitan aplicar este documento en su totalidad:\n- Documentar la excepción y su justificación\n- Solicitar aprobación del responsable del proceso\n- Establecer medidas compensatorias si corresponde\n\n### Indicadores de desempeño\n| Indicador | Fórmula | Meta | Frecuencia |\n|-----------|---------|------|------------|\n| [Nombre] | [Cálculo] | [Valor meta] | [Mensual/Trimestral] |\n\n### Mejora continua\nEste documento debe revisarse cuando:\n- Se detecten no conformidades recurrentes relacionadas\n- Cambien los requisitos normativos o del cliente\n- Ocurran cambios organizacionales que impacten el proceso`,
    },
    controlCambios: {
      DEFAULT: `Versiones previas y próxima revisión planificada:\n\n| Versión | Fecha | Descripción del cambio | Elaborado | Revisado | Aprobado |\n|---------|-------|------------------------|-----------|----------|----------|\n| v1.0 | [Fecha] | Versión inicial | [Autor] | [Revisor] | [Aprobador] |\n\n**Próxima revisión programada:** [Indicar fecha según ciclo de revisión del SGC, normalmente anual]\n\n**Distribución controlada:**\n- [Área 1] — [Responsable]\n- [Área 2] — [Responsable]`,
    },
  };

  const modComplements = complements[module] || {};
  const complement = modComplements[docType] || modComplements["DEFAULT"] ||
    `Complemento sugerido para "${module}" — "${title}" (${area}):\n\n[Revise el contenido actual e incorpore criterios adicionales, referencias normativas o indicadores de seguimiento según corresponda.]`;

  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const preview = plain.length > 120 ? plain.slice(0, 120) + "…" : plain;
  return `--- Contenido actual detectado (${wordCount} palabras): "${preview}" ---\n\n${complement}`;
}

// ── Content update handler ───────────────────────────────────────────────────

export const updateContentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    const { documentId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      return res.status(400).json({ success: false, error: "content must be a plain object" });
    }
    const allowed: Record<string, true> = { objetivo: true, alcance: true, responsabilidades: true, docsRelacionados: true, descripcion: true, controlCambios: true };
    const sanitized: Record<string, string> = {};
    for (const [key, val] of Object.entries(content as Record<string, unknown>)) {
      if (allowed[key] && typeof val === "string") sanitized[key] = val;
    }
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ success: false, error: "Document not found" });
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { content: sanitized, updatedBy: req.user.userId },
    });
    res.json({ success: true, data: { content: updated.content } });
  }
);

// ── AI assist handler (template builder) ────────────────────────────────────

export const aiAssistHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    const { module, docType, title, area, existingContent } = req.body as {
      module: string;
      docType: string;
      title: string;
      area: string;
      existingContent?: string;
    };
    if (!module || !docType) {
      return res.status(400).json({ success: false, error: "module and docType are required" });
    }
    const hasExisting = typeof existingContent === "string" && existingContent.replace(/<[^>]+>/g, "").trim().length > 10;
    const suggestion = hasExisting
      ? improveContent(existingContent!, module, docType, title || "el documento", area || "el área")
      : buildTemplate(module, docType, title || "el documento", area || "el área");
    res.json({ success: true, data: { suggestion } });
  }
);

// ── Mejora 8: Bulk operations ────────────────────────────────────────────────

export const bulkDocumentsHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "Not authenticated" });
    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Sin permiso para operaciones masivas" });
    }
    const { documentIds, action } = req.body;
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ success: false, error: "documentIds requerido" });
    }
    if (![ "OBSOLETE" ].includes(action)) {
      return res.status(400).json({ success: false, error: "Acción no válida" });
    }
    const results = await bulkUpdateDocuments(documentIds, action, req.user.userId);
    res.json({ success: true, data: results });
  }
);
