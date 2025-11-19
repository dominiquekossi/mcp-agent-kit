import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import booksRouter from "./routes/books";
import authorsRouter from "./routes/authors";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Library API is running" });
});

// API Routes
app.use("/api/books", booksRouter);
app.use("/api/authors", authorsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Library API server running on http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Books API: http://localhost:${PORT}/api/books`);
  console.log(`✍️  Authors API: http://localhost:${PORT}/api/authors`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

export default app;
