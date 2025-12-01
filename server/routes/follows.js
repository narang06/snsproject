import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"

const router = express.Router()

// 팔로우 추가
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { targetUserId } = req.body

    if (userId === Number.parseInt(targetUserId)) {
      return res.status(400).json({ message: "자신을 팔로우할 수 없습니다" })
    }

    const [existingFollow] = await db.query("SELECT * FROM follows WHERE follower_id = ? AND following_id = ?", [
      userId,
      targetUserId,
    ])

    if (existingFollow.length > 0) {
      return res.status(400).json({ message: "이미 팔로우했습니다" })
    }

    await db.query("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)", [userId, targetUserId])

    // 알림 생성 (1분 내 중복 방지)
    const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);
    const [existingFollowNotification] = await db.query(
      `SELECT id FROM notifications
      WHERE recipient_id = ? AND sender_id = ? AND type = 'follow' AND created_at >= ?`,
      [targetUserId, userId, ONE_MINUTE_AGO]
    );

    if (existingFollowNotification.length === 0) {
      await db.query("INSERT INTO notifications (recipient_id, type, sender_id) VALUES (?, ?, ?)", [
        targetUserId,
        "follow",
        userId,
      ]);
    }

    res.status(201).json({ message: "팔로우 성공" })
  } catch (err) {
    console.error("팔로우 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 팔로우 제거
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { targetUserId } = req.body

    await db.query("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [userId, targetUserId])

    res.status(200).json({ message: "언팔로우 성공" })
  } catch (err) {
    console.error("언팔로우 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 특정 사용자의 팔로워 목록 조회
router.get("/followers/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const [followers] = await db.query(
      `SELECT u.id, u.nickname, u.nickname_tag, u.profile_image_url
       FROM users u
       JOIN follows f ON u.id = f.follower_id
       WHERE f.following_id = ?`,
      [userId]
    );

    res.status(200).json(followers);
  } catch (err) {
    console.error("팔로워 목록 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 특정 사용자의 팔로잉 목록 조회
router.get("/following/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const [following] = await db.query(
      `SELECT u.id, u.nickname, u.nickname_tag, u.profile_image_url
       FROM users u
       JOIN follows f ON u.id = f.following_id
       WHERE f.follower_id = ?`,
      [userId]
    );

    res.status(200).json(following);
  } catch (err) {
    console.error("팔로잉 목록 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router
