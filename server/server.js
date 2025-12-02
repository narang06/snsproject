import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import "dotenv/config"; 
const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], 
  credentials: true,
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import likeRoutes from "./routes/likes.js";
import commentRoutes from "./routes/comments.js";
import followRoutes from "./routes/follows.js";
import notificationRoutes from "./routes/notifications.js";
import { startNotificationCleanupJob } from "./cron-jobs.js";

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/quests", questRoutes);
app.use("/submissions", submissionRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/follows", followRoutes);
app.use("/notifications", notificationRoutes);
startNotificationCleanupJob();

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
});