import mongoose from "mongoose";

const MONGOOSE_OPTS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

export async function connectDatabase(): Promise<void> {
  const uri = process.env["MONGODB_URI"] ?? "mongodb://localhost:27017/fleet-service";
  await mongoose.connect(uri, MONGOOSE_OPTS);
  console.log("MongoDB connecté :", uri);
}
