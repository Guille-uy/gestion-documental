import { PrismaClient } from "@prisma/client";

// Singleton — a single shared Prisma client for the whole process.
// Having multiple PrismaClient instances creates multiple connection pools
// and leads to OOM crashes on constrained environments like Railway free tier.
const prisma = new PrismaClient();

export default prisma;
