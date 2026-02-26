import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin@12345", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@dms.local" },
    update: {},
    create: {
      email: "admin@dms.local",
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Admin user created:", adminUser.email);

  // Create sample users for testing
  const qualityManager = await prisma.user.upsert({
    where: { email: "qm@dms.local" },
    update: {},
    create: {
      email: "qm@dms.local",
      firstName: "Quality",
      lastName: "Manager",
      password: await bcrypt.hash("QM@12345", 10),
      role: "QUALITY_MANAGER",
      area: "Quality Assurance",
      isActive: true,
    },
  });

  console.log("✓ Quality Manager created:", qualityManager.email);

  const documentOwner = await prisma.user.upsert({
    where: { email: "owner@dms.local" },
    update: {},
    create: {
      email: "owner@dms.local",
      firstName: "Document",
      lastName: "Owner",
      password: await bcrypt.hash("Owner@12345", 10),
      role: "DOCUMENT_OWNER",
      area: "Operations",
      isActive: true,
    },
  });

  console.log("✓ Document Owner created:", documentOwner.email);

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@dms.local" },
    update: {},
    create: {
      email: "reviewer@dms.local",
      firstName: "Review",
      lastName: "User",
      password: await bcrypt.hash("Reviewer@12345", 10),
      role: "REVIEWER",
      area: "Quality Assurance",
      isActive: true,
    },
  });

  console.log("✓ Reviewer created:", reviewer.email);

  const approver = await prisma.user.upsert({
    where: { email: "approver@dms.local" },
    update: {},
    create: {
      email: "approver@dms.local",
      firstName: "Approve",
      lastName: "User",
      password: await bcrypt.hash("Approver@12345", 10),
      role: "APPROVER",
      area: "Management",
      isActive: true,
    },
  });

  console.log("✓ Approver created:", approver.email);

  const reader = await prisma.user.upsert({
    where: { email: "reader@dms.local" },
    update: {},
    create: {
      email: "reader@dms.local",
      firstName: "Read",
      lastName: "User",
      password: await bcrypt.hash("Reader@12345", 10),
      role: "READER",
      area: "Operations",
      isActive: true,
    },
  });

  console.log("✓ Reader created:", reader.email);

  // Create sample documents
  const sampleDoc = await prisma.document.upsert({
    where: { code: "DOC-001" },
    update: {},
    create: {
      code: "DOC-001",
      title: "Sample Standard Operating Procedure",
      description: "This is a sample SOP for document management process",
      type: "SOP",
      area: "Operations",
      status: "DRAFT",
      currentVersionLabel: "v1.0",
      createdBy: documentOwner.id,
      updatedBy: documentOwner.id,
    },
  });

  console.log("✓ Sample document created:", sampleDoc.code);

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
