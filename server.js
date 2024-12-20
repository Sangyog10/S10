import app from "./app.js";
import { config } from "dotenv";
import { connectDb } from "./db/index.js";

config();

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

const server = async () => {
  await connectDb();
  app.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
  });
};
server();

process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err.message}`);
  console.log(`Shutting Down the server due to unhandled promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
