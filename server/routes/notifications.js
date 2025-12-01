import express from "express";
import db from "../db.js";
import authMiddleware from "../auth.js";

const router = express.Router();

// 1시간 뒤 알림 자동 읽음 처리
const lazyUpdateNotifications = async (userId) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE recipient_id = ?
         AND is_read = 0
         AND read_timer_started_at IS NOT NULL
         AND NOW() >= read_timer_started_at + INTERVAL 1 HOUR`,
      [userId]
    );
  } catch (err) {
    console.error("Lazy Update 중 오류 발생:", err);
  }
};

// 알림 조회
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    await lazyUpdateNotifications(userId);

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

// 읽지 않은 알림 개수 조회
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    await lazyUpdateNotifications(userId);

    const [result] = await db.query(
      "SELECT COUNT(*) as unreadCount FROM notifications WHERE recipient_id = ? AND is_read = 0",
      [userId]
    );

    const unreadCount = result[0].unreadCount;
    res.status(200).json({ unreadCount });

  } catch (err) {
    console.error("읽지 않은 알림 개수 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 사용자가 알림 탭에 진입한 시간을 기록
router.patch("/start-read-timers", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    await db.query(
      "UPDATE notifications SET read_timer_started_at = NOW() WHERE recipient_id = ? AND is_read = 0 AND read_timer_started_at IS NULL",
      [userId]
    );
    res.status(200).json({ message: "알림 읽기 타이머 시작 성공" });
  } catch (err) {
    console.error("알림 읽기 타이머 시작 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 알림 읽음 표시
router.patch("/:notificationId", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const [notifications] = await db.query(
      "SELECT recipient_id FROM notifications WHERE id = ?",
      [notificationId]
    );

    // 1. 알림이 없는 경우 404 에러 처리
    if (notifications.length === 0) {
      return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
    }

    // 2. 권한이 없는 경우 403 에러 처리
    if (notifications[0].recipient_id !== userId) {
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