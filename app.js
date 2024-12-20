import express from "express";
import errorMiddleware from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";

config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "*",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://studentstiffin.ie",
      "https://student-tiffin-client.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Shop Infinity ",
    author: "Sangyog Puri",
  });
});

app.use(errorMiddleware);

export default app;
