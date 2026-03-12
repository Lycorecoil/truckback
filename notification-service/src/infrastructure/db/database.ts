import mongoose from "mongoose";

const MONGOOSE_OPTS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

export async function connectDatabase(): Promise<void> {
  const uri = process.env["DATABASE_URL"] ?? "mongodb://localhost:27017/notification-service";
  await mongoose.connect(uri, MONGOOSE_OPTS);
  console.log("[notification-service] MongoDB connecté :", uri);
}
