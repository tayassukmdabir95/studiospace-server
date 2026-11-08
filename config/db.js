
import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("MongoDB Connected Successfully!");
    return db;
  } catch (error) {
    console.log("MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

export function getDB() {
  return db;
}
