import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import "dotenv/config"; // .env 파일을 자동으로 로드합니다.

const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";
import likeRoutes from "./routes/likes.js";
import commentRoutes from "./routes/comments.js";
import followRoutes from "./routes/follows.js";
import notificationRoutes from "./routes/notifications.js";

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/quests", questRoutes);
app.use("/submissions", submissionRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/follows", followRoutes);
app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});