import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
// ── 19 Tipos de documento ──────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { code: "PO", name: "Política",             prefix: "PO", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Declaración formal de la Alta Dirección que establece principios, compromisos y dirección estratégica del sistema de gestión. No describe procesos ni tareas." },
  { code: "MN", name: "Manual",               prefix: "MN", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que describe la estructura general del sistema de gestión, su alcance, procesos e interacciones. Explica cómo está organizado el sistema." },
  { code: "DM", name: "Documento Marco",      prefix: "DM", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que establece lineamientos o criterios generales que aplican transversalmente. Traduce la política en directrices." },
  { code: "PR", name: "Procedimiento",        prefix: "PR", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Describe cómo se ejecuta un proceso, incluyendo responsabilidades, secuencia y controles." },
  { code: "IT", name: "Instructivo",          prefix: "IT", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento operativo detallado que explica paso a paso cómo realizar una tarea específica." },
  { code: "RG", name: "Registro",             prefix: "RG", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que evidencia que una actividad fue realizada. Se completa y archiva." },
  { code: "LI", name: "Listado",              prefix: "LI", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que enumera elementos bajo control o seguimiento." },
  { code: "PL", name: "Plan",                 prefix: "PL", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que establece objetivos, responsables y plazos para una actividad puntual y delimitada en el tiempo." },
  { code: "PT", name: "Protocolo",            prefix: "PT", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento técnico que define metodología específica para realizar ensayos, validaciones o pruebas." },
  { code: "IN", name: "Informe",              prefix: "IN", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que comunica resultados, análisis o conclusiones de una actividad realizada." },
  { code: "FT", name: "Ficha Técnica",        prefix: "FT", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: true,  acceptedFileTypes: ".pdf,.xlsx,.xls,.docx,.doc", description: "Documento que describe características técnicas de un producto, insumo o equipo." },
  { code: "DF", name: "Diagrama de Flujo",    prefix: "DF", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: true,  acceptedFileTypes: ".vsdx,.vsd,.pdf,.png,.jpg,.jpeg,.svg,.drawio", description: "Representación gráfica de la secuencia de un proceso." },
  { code: "AR", name: "Análisis de Riesgos",  prefix: "AR", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que identifica peligros, evalúa riesgos y define medidas de control." },
  { code: "ES", name: "Especificación",       prefix: "ES", requiresElaborado: true,  requiresRevisado: true,  requiresAprobado: true,  requiresFileUpload: false, acceptedFileTypes: null, description: "Documento que define requisitos técnicos que debe cumplir un producto, proceso o servicio." },
  { code: "CE", name: "Comunicación Externa", prefix: "CE", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: false, requiresFileUpload: false, acceptedFileTypes: null, description: "Documento formal dirigido a partes externas (proveedores, clientes, autoridades)." },
  { code: "CI", name: "Comunicación Interna", prefix: "CI", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: false, requiresFileUpload: false, acceptedFileTypes: null, description: "Documento dirigido al personal interno para informar o instruir." },
  { code: "AN", name: "Anexo",                prefix: "AN", requiresElaborado: false, requiresRevisado: false, requiresAprobado: false, requiresFileUpload: true,  acceptedFileTypes: ".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip", description: "Documento complementario que amplía información de otro documento principal. No tiene autonomía funcional." },
  { code: "OG", name: "Organigrama",          prefix: "OG", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: true,  requiresFileUpload: true,  acceptedFileTypes: ".vsdx,.vsd,.pdf,.png,.jpg,.jpeg,.svg,.drawio", description: "Documento que representa gráficamente la estructura organizativa de la empresa y las relaciones jerárquicas entre sus áreas o sectores." },
  { code: "CT", name: "Contrato",             prefix: "CT", requiresElaborado: true,  requiresRevisado: false, requiresAprobado: false, requiresFileUpload: true,  acceptedFileTypes: ".pdf,.docx,.doc", description: "Documento formal que establece los términos, condiciones y responsabilidades acordadas entre la organización y una o más partes externas para la prestación de servicios, provisión de bienes u otras relaciones comerciales." },
];

// ── Estructura Carpetas / Sitios / Sectores / Áreas ──────────────────────
// code = unique identifier used in document codes
// name = display name (most specific level)
const AREAS = [
  // ── 01 Gestión general del SGI ──────────────────────────────────────────
  { code: "SGI-CO",         name: "Gestión general del SGI",         folder: "01 Gestión general del SGI",  site: "Corporativo",           siteCode: "CO", sector: null,                          sectorCode: "SGI" },
  // ── 02 Gestión documental ───────────────────────────────────────────────
  { code: "GD-CO",          name: "Gestión documental",              folder: "02 Gestión documental",       site: "Corporativo",           siteCode: "CO", sector: null,                          sectorCode: "GD"  },
  // ── 03 Procesos estratégicos ────────────────────────────────────────────
  { code: "PE-CO",          name: "Procesos estratégicos",           folder: "03 Procesos estratégicos",    site: "Corporativo",           siteCode: "CO", sector: null,                          sectorCode: "PE"  },
  // ── 04 Soporte al negocio ────────────────────────────────────────────────
  { code: "RH-CO",          name: "Recursos humanos",                folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Recursos humanos",             sectorCode: "RH"  },
  { code: "SYSO-CO",        name: "Seguridad y salud ocupacional",   folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Seguridad y salud ocupacional",sectorCode: "SYSO"},
  { code: "SYSO-FE",        name: "Seguridad y salud ocupacional",   folder: "04 Soporte al negocio",       site: "Fábrica de elaboración",siteCode: "FE", sector: "Seguridad y salud ocupacional",sectorCode: "SYSO"},
  { code: "SYSO-CD",        name: "Seguridad y salud ocupacional",   folder: "04 Soporte al negocio",       site: "Centro de distribución",siteCode: "CD", sector: "Seguridad y salud ocupacional",sectorCode: "SYSO"},
  { code: "MA-CO",          name: "Medio ambiente",                  folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Medio ambiente",               sectorCode: "MA"  },
  { code: "MA-FE",          name: "Medio ambiente",                  folder: "04 Soporte al negocio",       site: "Fábrica de elaboración",siteCode: "FE", sector: "Medio ambiente",               sectorCode: "MA"  },
  { code: "MA-CD",          name: "Medio ambiente",                  folder: "04 Soporte al negocio",       site: "Centro de distribución",siteCode: "CD", sector: "Medio ambiente",               sectorCode: "MA"  },
  { code: "CMP-CO",         name: "Compras",                         folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Compras",                      sectorCode: "CMP" },
  { code: "FIN-CO-CONT",    name: "Contabilidad",                    folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Finanzas",                     sectorCode: "FIN" },
  { code: "FIN-CO-CCORR",   name: "Cuentas corrientes",              folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Finanzas",                     sectorCode: "FIN" },
  { code: "FIN-CO-PPROV",   name: "Pago a proveedores",              folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Finanzas",                     sectorCode: "FIN" },
  { code: "DS-CO",          name: "Data Science",                    folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Data Science",                 sectorCode: "DS"  },
  { code: "TI-CO",          name: "Tecnologías de la información",   folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Tecnologías de la información", sectorCode: "TI"  },
  { code: "SEG-CO",         name: "Seguridad",                       folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Seguridad",                    sectorCode: "SEG" },
  { code: "SEG-CD",         name: "Seguridad",                       folder: "04 Soporte al negocio",       site: "Centro de distribución",siteCode: "CD", sector: "Seguridad",                    sectorCode: "SEG" },
  { code: "SEG-FE",         name: "Seguridad",                       folder: "04 Soporte al negocio",       site: "Fábrica de elaboración",siteCode: "FE", sector: "Seguridad",                    sectorCode: "SEG" },
  { code: "COM-CO-NNEG",    name: "Nuevos negocios",                 folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Comercial",                    sectorCode: "COM" },
  { code: "COM-CO-MKT",     name: "Marketing",                       folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Comercial",                    sectorCode: "COM" },
  { code: "COM-CO-VTA",     name: "Ventas",                          folder: "04 Soporte al negocio",       site: "Corporativo",           siteCode: "CO", sector: "Comercial",                    sectorCode: "COM" },
  // ── 05 Gestión operativa ────────────────────────────────────────────────
  { code: "IDI-CO",         name: "I+D+i",                           folder: "05 Gestión operativa",        site: "Corporativo",           siteCode: "CO", sector: "I+D+i",                        sectorCode: "IDI" },
  { code: "MT-FE",          name: "Mantenimiento",                   folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Mantenimiento",                sectorCode: "MT"  },
  { code: "AC-FE-CAL",      name: "Calidad (AC)",                    folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Aseguramiento de calidad",     sectorCode: "AC"  },
  { code: "AC-FE-HIG",      name: "Higiene (AC)",                    folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Aseguramiento de calidad",     sectorCode: "AC"  },
  { code: "PROD-FE-CARN",   name: "Cárnicos",                        folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-DCON",   name: "Descongelado",                    folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-ADIT",   name: "Aditivos",                        folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-JAM",    name: "Jamonería",                       folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-EMB",    name: "Embutidos",                       folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-SEC",    name: "Secadero",                        folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-SBL",    name: "Sala blanca",                     folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-VAC",    name: "Vacío",                           folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-ALPR",   name: "Alimentos preparados",            folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-GTRM",   name: "Gestión de transferencias",       folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "PROD-FE-DENV",   name: "Depósito de envases",             folder: "05 Gestión operativa",        site: "Fábrica de elaboración",siteCode: "FE", sector: "Producción",                   sectorCode: "PROD"},
  { code: "MT-CD-CAL",      name: "Calidad (MT)",                    folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Mantenimiento",                sectorCode: "MT"  },
  { code: "AC-CD-CAL",      name: "Calidad (AC)",                    folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Aseguramiento de calidad",     sectorCode: "AC"  },
  { code: "AC-CD-HIG",      name: "Higiene (AC)",                    folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Aseguramiento de calidad",     sectorCode: "AC"  },
  { code: "OL-CD-PED",      name: "Pedidos",                         folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-BLA",      name: "Bloque A",                        folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-BLB",      name: "Bloque B",                        folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-BLC",      name: "Bloque C",                        folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-BLD",      name: "Bloque D",                        folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-SLOG",     name: "Servicios logísticos",            folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-LOG",      name: "Logística",                       folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-LINV",     name: "Logística inversa",               folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  { code: "OL-CD-FACT",     name: "Facturación",                     folder: "05 Gestión operativa",        site: "Centro de distribución",siteCode: "CD", sector: "Operaciones logísticas",       sectorCode: "OL"  },
  // ── 06 Inocuidad alimentaria ─────────────────────────────────────────────
  { code: "IA-CO-AC",       name: "Aseguramiento de Calidad",        folder: "06 Inocuidad alimentaria",    site: "Corporativo",           siteCode: "CO", sector: "Aseguramiento de Calidad",     sectorCode: "AC"  },
  { code: "IA-FE-AC",       name: "Aseguramiento de Calidad",        folder: "06 Inocuidad alimentaria",    site: "Fábrica de elaboración",siteCode: "FE", sector: "Aseguramiento de Calidad",     sectorCode: "AC"  },
  { code: "IA-CD-AC",       name: "Aseguramiento de Calidad",        folder: "06 Inocuidad alimentaria",    site: "Centro de distribución",siteCode: "CD", sector: "Aseguramiento de Calidad",     sectorCode: "AC"  },
];

async function main() {
  console.log("Seeding database...");

  // ── Document types ─────────────────────────────────────────────────────
  for (const dt of DOCUMENT_TYPES) {
    await prisma.documentTypeConfig.upsert({
      where: { code: dt.code },
      update: { name: dt.name, prefix: dt.prefix, description: dt.description, requiresElaborado: dt.requiresElaborado, requiresRevisado: dt.requiresRevisado, requiresAprobado: dt.requiresAprobado, requiresFileUpload: dt.requiresFileUpload, acceptedFileTypes: dt.acceptedFileTypes, isActive: true },
      create: { ...dt, isActive: true },
    });
  }
  console.log(`✓ ${DOCUMENT_TYPES.length} tipos de documento cargados`);

  // ── Areas ──────────────────────────────────────────────────────────────
  for (const area of AREAS) {
    await prisma.area.upsert({
      where: { code: area.code },
      update: { name: area.name, folder: area.folder, site: area.site, siteCode: area.siteCode, sector: area.sector, sectorCode: area.sectorCode, isActive: true },
      create: { ...area, isActive: true },
    });
  }
  console.log(`✓ ${AREAS.length} áreas cargadas`);

  // ── Users ──────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@centenario.local" },
    update: {},
    create: {
      email: "admin@centenario.local",
      firstName: "Admin",
      lastName: "Centenario",
      password: await bcrypt.hash("Admin@2026!", 10),
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✓ Admin user:", adminUser.email);

  const qm = await prisma.user.upsert({
    where: { email: "calidad@centenario.local" },
    update: {},
    create: {
      email: "calidad@centenario.local",
      firstName: "Calidad",
      lastName: "Manager",
      password: await bcrypt.hash("Calidad@2026!", 10),
      role: "QUALITY_MANAGER",
      area: "AC-FE-CAL",
      isActive: true,
    },
  });
  console.log("✓ Quality Manager:", qm.email);

  // ── Documento de prueba de calendario ─────────────────────────────────
  // Aparece en el calendario porque está PUBLISHED y tiene nextReviewDate configurada.
  const reviewDate = new Date("2026-04-10T12:00:00.000Z");
  await prisma.document.upsert({
    where: { code: "PR-GD-CO-CAL01" },
    update: { status: "PUBLISHED", publishedAt: reviewDate, nextReviewDate: reviewDate, updatedBy: adminUser.id },
    create: {
      code:                "PR-GD-CO-CAL01",
      title:               "Revisión periódica del sistema documental — PRUEBA",
      description:         "Documento de prueba para validar la funcionalidad del calendario de revisiones.",
      type:                "PR",
      area:                "Gestión documental",
      status:              "PUBLISHED",
      currentVersionLabel: "v1.0",
      siteCode:            "CO",
      sectorCode:          "GD",
      publishedAt:         reviewDate,
      nextReviewDate:      reviewDate,
      createdBy:           adminUser.id,
      updatedBy:           adminUser.id,
      content: {
        objetivo: "Verificar el correcto funcionamiento del calendario de revisiones documentales.",
        alcance:  "Aplica únicamente como prueba de la funcionalidad del calendario.",
        desarrollo: "Documento de prueba creado automáticamente por el seed. Puede eliminarse una vez validada la funcionalidad.",
      },
    },
  });
  console.log("✓ Documento de prueba de calendario: PR-GD-CO-CAL01");

  console.log("✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

