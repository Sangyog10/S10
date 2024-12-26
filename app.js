import express from "express";
import errorMiddleware from "./middlewares/error.js";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";

import authRouter from "./routes/auth.routes.js";

config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: ["*", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);
app.use(morgan("dev"));

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Shop Infinity ",
  });
});

app.use(errorMiddleware);

export default app;
