import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env["DATABASE_URL"] ?? "mongodb://localhost:27017/auth-service";
  await mongoose.connect(uri);
  console.log("[auth-service] MongoDB connecté :", uri);
}
