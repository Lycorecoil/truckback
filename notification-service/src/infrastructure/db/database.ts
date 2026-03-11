import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env["DATABASE_URL"] ?? "mongodb://localhost:27017/notification-service";
  await mongoose.connect(uri);
  console.log("[notification-service] MongoDB connecté :", uri);
}
