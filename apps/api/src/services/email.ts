/**
 * Email service — #6 Notificaciones por email
 * Sends transactional emails on document workflow events.
 * Gracefully skips sending if EMAIL_HOST is not configured.
 *
 * Required env vars (all optional — feature degrades to log-only):
 *   EMAIL_HOST    SMTP host (e.g. smtp.gmail.com)
 *   EMAIL_PORT    SMTP port (default: 587)
 *   EMAIL_SECURE  "true" for TLS on connect (port 465), otherwise STARTTLS
 *   EMAIL_USER    SMTP username / address
 *   EMAIL_PASS    SMTP password or app-specific password
 *   EMAIL_FROM    Sender name + address (default: auto)
 */

import { logger } from "../utils/logger.js";

const EMAIL_ENABLED = !!(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
);

/* Lazy-load nodemailer only when configured to avoid startup errors */
let _transporter: any = null;

async function getTransporter() {
  if (!EMAIL_ENABLED) return null;
  if (_transporter) return _transporter;
  try {
    const nodemailer = await import("nodemailer");
    _transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return _transporter;
  } catch (err: any) {
    logger.warn("[EMAIL] nodemailer not available: " + err.message);
    return null;
  }
}

const FROM =
  process.env.EMAIL_FROM ||
  "Sistema de Gestión Documental <no-reply@centenario.com>";

const BASE_URL =
  process.env.FRONTEND_URL || "https://gestion-documental-centenario.surge.sh";

/* ─────────────────────────────────────────────────────────────────
   Low-level send helper
───────────────────────────────────────────────────────────────── */

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = await getTransporter();
  if (!transport) {
    logger.info(
      `[EMAIL SKIPPED – not configured] to=${options.to} | ${options.subject}`
    );
    return;
  }
  try {
    await transport.sendMail({ from: FROM, ...options });
    logger.info(`[EMAIL SENT] to=${options.to} | ${options.subject}`);
  } catch (err: any) {
    logger.error(`[EMAIL ERROR] to=${options.to}: ${err.message}`);
  }
}

/* ─────────────────────────────────────────────────────────────────
   Shared HTML shell
───────────────────────────────────────────────────────────────── */

function htmlShell(body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sistema de Gestión Documental</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#F3F4F6; margin:0; padding:24px; }
    .card { background:#fff; border-radius:12px; max-width:560px; margin:0 auto; overflow:hidden; }
    .header { background:linear-gradient(135deg,#1d4ed8,#2563eb); padding:28px 32px; }
    .header h1 { color:#fff; margin:0; font-size:18px; font-weight:700; }
    .header p  { color:#bfdbfe; margin:4px 0 0; font-size:13px; }
    .body { padding:28px 32px; }
    .body p { color:#374151; font-size:14px; line-height:1.6; }
    .label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#6B7280; }
    .doc-box { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:14px 18px; margin:16px 0; }
    .doc-title { font-size:15px; font-weight:700; color:#111827; margin:0 0 4px; }
    .doc-code  { font-size:12px; font-family:monospace; color:#6B7280; }
    .btn { display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 22px; border-radius:8px; font-size:14px; font-weight:600; margin-top:20px; }
    .footer { background:#F9FAFB; border-top:1px solid #E5E7EB; padding:16px 32px; font-size:12px; color:#9CA3AF; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>📋 Sistema de Gestión Documental</h1>
      <p>Centenario — ISO 22000:2018</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">Este es un mensaje automático. Por favor no respondas a este correo.</div>
  </div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────
   Domain-specific email senders
───────────────────────────────────────────────────────────────── */

export async function emailDocumentSubmittedForReview(opts: {
  to: string;
  reviewerName: string;
  docTitle: string;
  docCode: string;
  docId: string;
  authorName: string;
}) {
  const url = `${BASE_URL}/documents/${opts.docId}`;
  await sendEmail({
    to: opts.to,
    subject: `📋 Revisión requerida: ${opts.docCode} — ${opts.docTitle}`,
    html: htmlShell(`
      <p>Hola <strong>${opts.reviewerName}</strong>,</p>
      <p>Se te ha asignado la revisión del siguiente documento:</p>
      <div class="doc-box">
        <p class="doc-title">${opts.docTitle}</p>
        <p class="doc-code">${opts.docCode}</p>
      </div>
      <p class="label">Enviado por</p>
      <p>${opts.authorName}</p>
      <a href="${url}" class="btn">Revisar documento →</a>
    `),
  });
}

export async function emailChangesRequested(opts: {
  to: string;
  ownerName: string;
  docTitle: string;
  docCode: string;
  docId: string;
  reviewerName: string;
  comments?: string;
}) {
  const url = `${BASE_URL}/documents/${opts.docId}`;
  await sendEmail({
    to: opts.to,
    subject: `🔄 Cambios solicitados: ${opts.docCode} — ${opts.docTitle}`,
    html: htmlShell(`
      <p>Hola <strong>${opts.ownerName}</strong>,</p>
      <p><strong>${opts.reviewerName}</strong> ha solicitado cambios en tu documento:</p>
      <div class="doc-box">
        <p class="doc-title">${opts.docTitle}</p>
        <p class="doc-code">${opts.docCode}</p>
      </div>
      ${opts.comments ? `<p class="label">Observaciones</p><p>${opts.comments}</p>` : ""}
      <a href="${url}" class="btn">Ver documento →</a>
    `),
  });
}

export async function emailDocumentPublished(opts: {
  to: string;
  readerName: string;
  docTitle: string;
  docCode: string;
  docId: string;
  area: string;
}) {
  const url = `${BASE_URL}/documents/${opts.docId}`;
  await sendEmail({
    to: opts.to,
    subject: `🚀 Nuevo documento publicado: ${opts.docCode} — ${opts.docTitle}`,
    html: htmlShell(`
      <p>Hola <strong>${opts.readerName}</strong>,</p>
      <p>Se ha publicado un nuevo documento en tu área <strong>${opts.area}</strong>:</p>
      <div class="doc-box">
        <p class="doc-title">${opts.docTitle}</p>
        <p class="doc-code">${opts.docCode}</p>
      </div>
      <a href="${url}" class="btn">Leer documento →</a>
    `),
  });
}

export async function emailReviewDueSoon(opts: {
  to: string;
  recipientName: string;
  docTitle: string;
  docCode: string;
  docId: string;
  daysUntilDue: number;
  dueDate: string;
}) {
  const url = `${BASE_URL}/documents/${opts.docId}`;
  const urgency = opts.daysUntilDue <= 7 ? "⚠️ URGENTE:" : "📅";
  await sendEmail({
    to: opts.to,
    subject: `${urgency} Revisión próxima en ${opts.daysUntilDue} días: ${opts.docCode}`,
    html: htmlShell(`
      <p>Hola <strong>${opts.recipientName}</strong>,</p>
      <p>El siguiente documento requiere revisión periódica próximamente:</p>
      <div class="doc-box">
        <p class="doc-title">${opts.docTitle}</p>
        <p class="doc-code">${opts.docCode}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#D97706;font-weight:600;">Vence el ${opts.dueDate} (${opts.daysUntilDue} días)</p>
      </div>
      <a href="${url}" class="btn">Ver documento →</a>
    `),
  });
}
