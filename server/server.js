import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import "dotenv/config"; 
const app = express();

const allowedOrigins = ["http://localhost:3000", "http://52.78.74.252", "http://3.38.81.68"];

app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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