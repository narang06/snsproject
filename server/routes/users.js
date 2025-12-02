import express from "express";
import db from "../db.js";
import authMiddleware from "../auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { addResolvedMentions } from "../utils/mentionUtils.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

// 사용자 정보 조회
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const [users] = await db.query(
      "SELECT id, nickname, nickname_tag, bio, profile_image_url FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }

    const user = users[0];

    const [followerCount] = await db.query(
      "SELECT COUNT(*) as count FROM follows WHERE following_id = ?",
      [userId],
    );

    const [followingCount] = await db.query(
      "SELECT COUNT(*) as count FROM follows WHERE follower_id = ?",
      [userId],
    );

    const [isFollowing] = await db.query(
      "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
      [currentUserId, userId],
    );

    const responseUser = {
      id: user.id,
      nickname: user.nickname,
      nickname_tag: user.nickname_tag,
      bio: user.bio,
      profileImage: user.profile_image_url,
      followerCount: followerCount[0].count,
      followingCount: followingCount[0].count,
    };

    res.status(200).json({
      user: responseUser,
      isFollowing: isFollowing.length > 0,
    });
  } catch (err) {
    console.error("사용자 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 프로필 수정
router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { bio } = req.body;
      const newProfileImage = req.file
        ? `/uploads/profiles/${req.file.filename}`
        : null;
      let oldProfileImagePath = null;

      if (newProfileImage) {
        const [currentUser] = await db.query(
          "SELECT profile_image_url FROM users WHERE id = ?",
          [userId],
        );
        if (currentUser.length > 0 && currentUser[0].profile_image_url) {
          oldProfileImagePath = currentUser[0].profile_image_url;
        }
      }

      let query = "UPDATE users SET ";
      const params = [];

      if (bio !== undefined) {
        if (bio.length > 160) {
          return res
            .status(400)
            .json({ message: "자기소개는 160자를 초과할 수 없습니다." });
        }
        query += "bio = ?, ";
        params.push(bio);
      }
      if (newProfileImage) {
        query += "profile_image_url = ?, ";
        params.push(newProfileImage);
      }

      if (params.length === 0) {
        return res.status(400).json({ message: "수정할 내용이 없습니다." });
      }

      query = query.slice(0, -2) + " WHERE id = ?";
      params.push(userId);

      await db.query(query, params);

      if (oldProfileImagePath) {
        const oldImageFilePath = path
          .join(
            new URL(".", import.meta.url).pathname,
            "..",
            oldProfileImagePath,
          )
          .substring(1);
        fs.unlink(oldImageFilePath, (err) => {
          if (err) {
            console.error("이전 프로필 이미지 삭제 실패:", err);
          }
        });
      }

      const [updatedUsers] = await db.query(
        "SELECT id, nickname, nickname_tag, bio, profile_image_url FROM users WHERE id = ?",
        [userId],
      );

      if (updatedUsers.length === 0) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      const updatedUser = updatedUsers[0];
      const responseUser = {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        nickname_tag: updatedUser.nickname_tag,
        bio: updatedUser.bio,
        profileImage: updatedUser.profile_image_url,
      };

      res.status(200).json({
        message: "프로필 수정 성공",
        user: responseUser,
      });
    } catch (err) {
      console.error("프로필 수정 오류:", err);
      res.status(500).json({ message: "서버 오류" });
    }
  },
);

// 프로필 설정
router.post(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { bio } = req.body;
      const profileImage = req.file
        ? `/uploads/profiles/${req.file.filename}`
        : null;

      if (bio !== undefined && bio.length > 160) {
        return res
          .status(400)
          .json({ message: "자기소개는 160자를 초과할 수 없습니다." });
      }

      await db.query(
        "UPDATE users SET bio = ?, profile_image_url = ? WHERE id = ?",
        [bio || "", profileImage, userId],
      );

      res.status(200).json({ message: "프로필 설정 성공" });
    } catch (err) {
      res.status(500).json({ message: "서버 오류" });
    }
  },
);

// 특정 사용자의 제출물 조회 (페이지네이션)
router.get("/:userId/submissions", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "9", 10);
    const offset = (page - 1) * limit;

    // 1. 총 제출물 개수 조회
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM submissions WHERE user_id = ?",
      [userId],
    );

    // 2. 페이지에 해당하는 제출물 조회
    const [submissions] = await db.query(
      `SELECT s.id, s.daily_quest_id, s.user_id, s.content_text as content, s.content_image_url as image_url, s.created_at,
              u.nickname, u.nickname_tag, u.profile_image_url as userProfileImage,
              q.title as questTitle,
              COUNT(DISTINCT l.user_id) as likeCount,
              COUNT(DISTINCT c.id) as commentCount
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN daily_quests dq ON s.daily_quest_id = dq.id
      JOIN quests q ON dq.quest_id = q.id
      LEFT JOIN likes l ON s.id = l.submission_id
      LEFT JOIN comments c ON s.id = c.submission_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
      OFFSET ?`,
      [userId, limit, offset],
    );

    const submissionsWithMentions = await addResolvedMentions(submissions);

    res.status(200).json({
      submissions: submissionsWithMentions,
      hasMore: total > page * limit,
    });
  } catch (err) {
    console.error("사용자 제출물 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
