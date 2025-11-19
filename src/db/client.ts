import { PrismaClient } from "@prisma/client";

// Create a single instance of PrismaClient to be reused across the application
export const prisma = new PrismaClient({
  log:
    process.env.LOG_LEVEL === "debug"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
});

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export interface BookCreateInput {
  title: string;
  description?: string;
  publishedYear?: number;
  authorId: number;
}

export interface BookUpdateInput {
  title?: string;
  description?: string;
  publishedYear?: number;
  authorId?: number;
}

export interface AuthorCreateInput {
  name: string;
  bio?: string;
}

export interface AuthorUpdateInput {
  name?: string;
  bio?: string;
}
