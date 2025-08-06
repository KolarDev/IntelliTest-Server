// Load env variables as early as possible
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

// Import Prisma and config validation
import{ prisma } from "./lib/prisma";
import { config } from "./config/envSchema";

// Express app
import app from "./app";

// Start server
const port = config.PORT || 5052;
const server = app.listen(port, () => {
  console.log(`🚀 App running on port ${port}`);
});

// Graceful shutdown for unhandled promise rejections
process.on("unhandledRejection", (err: unknown) => {
  if (err instanceof Error) {
    console.error("UNHANDLED REJECTION 🔥:", err.name, err.message);
  } else {
    console.error("UNHANDLED REJECTION 🔥:", err);
  }

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions (synchronous code errors)
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION 🔥:", err.name, err.message);
  process.exit(1);
});

// Graceful shutdown logic
const gracefulShutdown = async (signal: string) => {
  console.log(`👋 ${signal} received. Closing server gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    console.log("💥 Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // System termination
