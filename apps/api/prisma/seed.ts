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

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
