import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const saltRounds = 10;

  const users = [
    {
      email: "admin@centenario.net.uy",
      password: await bcrypt.hash("Admin@12345", saltRounds),
      firstName: "Admin",
      lastName: "Sistema",
      role: "ADMIN" as const,
      area: "Sistemas",
    },
    {
      email: "owner@centenario.net.uy",
      password: await bcrypt.hash("Owner@12345", saltRounds),
      firstName: "Propietario",
      lastName: "Documentos",
      role: "DOCUMENT_OWNER" as const,
      area: "Calidad",
    },
    {
      email: "reviewer@centenario.net.uy",
      password: await bcrypt.hash("Reviewer@12345", saltRounds),
      firstName: "Revisor",
      lastName: "Calidad",
      role: "REVIEWER" as const,
      area: "Calidad",
    },
    {
      email: "approver@centenario.net.uy",
      password: await bcrypt.hash("Approver@12345", saltRounds),
      firstName: "Aprobador",
      lastName: "Calidad",
      role: "APPROVER" as const,
      area: "Calidad",
    },
    {
      email: "reader@centenario.net.uy",
      password: await bcrypt.hash("Reader@12345", saltRounds),
      firstName: "Lector",
      lastName: "General",
      role: "READER" as const,
      area: "General",
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`Created user: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  // Seed default document types
  const documentTypes = [
    { code: "SOP", name: "Procedimiento Operativo", prefix: "PO", description: "Procedimiento Operativo Estándar (Standard Operating Procedure)" },
    { code: "POLICY", name: "Política", prefix: "POL", description: "Política organizacional" },
    { code: "WI", name: "Instrucción de Trabajo", prefix: "IT", description: "Instrucción de Trabajo detallada" },
    { code: "FORM", name: "Formulario", prefix: "FOR", description: "Formulario controlado" },
    { code: "RECORD", name: "Registro", prefix: "REG", description: "Registro de calidad" },
  ];

  for (const dt of documentTypes) {
    const existing = await prisma.documentTypeConfig.findUnique({ where: { code: dt.code } });
    if (!existing) {
      await prisma.documentTypeConfig.create({ data: dt });
      console.log(`Created document type: ${dt.code}`);
    }
  }

  // Seed default areas
  const areas = [
    { code: "CAL", name: "Calidad", description: "Área de Gestión de Calidad" },
    { code: "OPE", name: "Operaciones", description: "Área de Operaciones" },
    { code: "ADM", name: "Administración", description: "Área Administrativa" },
    { code: "RRH", name: "Recursos Humanos", description: "Área de Recursos Humanos" },
    { code: "LOG", name: "Logística", description: "Área de Logística" },
    { code: "SIS", name: "Sistemas", description: "Área de Sistemas / IT" },
    { code: "FIN", name: "Finanzas", description: "Área de Finanzas y Contabilidad" },
    { code: "COM", name: "Comercial", description: "Área Comercial y Ventas" },
  ];

  for (const area of areas) {
    const existing = await prisma.area.findUnique({ where: { code: area.code } });
    if (!existing) {
      await prisma.area.create({ data: area });
      console.log(`Created area: ${area.code}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
