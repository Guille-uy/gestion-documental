/**
 * Script de un solo uso para crear un documento de prueba que aparece en el calendario.
 * Requiere status=PUBLISHED y nextReviewDate configurada.
 *
 * Uso: cd apps/api && npx tsx prisma/create-calendar-test.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar el primer usuario admin para usarlo como autor
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No se encontró ningún usuario admin en la base de datos.");

  // Fecha de revisión: hoy (10 de abril de 2026) para que aparezca inmediatamente en el calendario
  const today = new Date("2026-04-10T12:00:00.000Z");

  const doc = await prisma.document.upsert({
    where: { code: "PR-GD-CO-CAL01" },
    update: {
      status: "PUBLISHED",
      publishedAt: today,
      nextReviewDate: today,
      updatedBy: admin.id,
    },
    create: {
      code:                 "PR-GD-CO-CAL01",
      title:                "Revisión periódica del sistema documental",
      description:          "Documento de prueba para verificar la funcionalidad del calendario de revisiones.",
      type:                 "PR",
      area:                 "Gestión documental",
      status:               "PUBLISHED",
      currentVersionLabel:  "v1.0",
      siteCode:             "CO",
      sectorCode:           "GD",
      publishedAt:          today,
      nextReviewDate:       today,
      createdBy:            admin.id,
      updatedBy:            admin.id,
      content: {
        objetivo:
          "Establecer la metodología para la revisión periódica de la documentación del sistema de gestión.",
        alcance:
          "Aplica a todos los documentos vigentes del sistema de gestión documental de Centenario.",
        desarrollo:
          "## 1. Frecuencia de revisión\n\nCada documento vigente debe ser revisado con la periodicidad indicada en su ficha de control.\n\n## 2. Responsable\n\nEl responsable del área propietaria del documento debe iniciar la revisión antes de la fecha indicada en este calendario.\n\n## 3. Resultado\n\nSi el documento no requiere cambios, se emite una nueva versión con la fecha de revisión actualizada. Si requiere cambios, se inicia el flujo de elaboración correspondiente.",
      },
    },
  });

  console.log("✅ Documento creado/actualizado correctamente:");
  console.log(`   Código:        ${doc.code}`);
  console.log(`   Título:        ${doc.title}`);
  console.log(`   Estado:        ${doc.status}`);
  console.log(`   Fecha revisión: ${doc.nextReviewDate?.toISOString()}`);
  console.log("\nEl documento debería aparecer hoy en el calendario.");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
