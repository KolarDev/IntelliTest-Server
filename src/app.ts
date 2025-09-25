import path from "path";
import express, { Application, Request, Response, ErrorRequestHandler } from "express";
import bodyparser from "body-parser";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AppError } from "./utils/appError";


// // Import Routes
import authRoutes from "./routes/auth.route";
// import userRoutes from "./routes/user.route";


const app: Application = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(bodyparser.json());

// ROUTES

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hey there! from the sever side",
    app: "IntelliTest API",
  });
});

app.use("/api/v1/auths", authRoutes);
// app.use("/api/v1/users", userRoutes);


// Handle 404
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler as ErrorRequestHandler);


export default app;
