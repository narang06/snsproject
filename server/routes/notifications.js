import express from "express";
import db from "../db.js";
import authMiddleware from "../auth.js";

const router = express.Router();

// 알림 조회
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId

    const [notifications] = await db.query(
      `SELECT n.id, n.recipient_id, n.sender_id, n.type, n.target_type, n.target_id, n.comment_id, n.is_read, n.created_at,
          s.content_text AS submissionContent,
          u.nickname as fromUserName, u.nickname_tag as fromUserNicknameTag, u.profile_image_url as fromUserProfileImage
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       LEFT JOIN submissions s ON n.target_type = 'SUBMISSION' AND n.target_id = s.id
       WHERE n.recipient_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId],
    )

    res.status(200).json(notifications)
  } catch (err) {
    console.error("알림 조회 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 알림 읽음 표시
router.patch("/:notificationId", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const [notifications] = await db.query(
      "SELECT recipient_id FROM notifications WHERE id = ?",
      [notificationId]
    );

    if (notifications.length === 0 || notifications[0].recipient_id !== userId) {
      return res.status(403).json({ message: "권한이 없습니다" });
    }

    await db.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [notificationId]);

    res.status(200).json({ message: "읽음 표시 성공" });
  } catch (err) {
    console.error("읽음 표시 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;