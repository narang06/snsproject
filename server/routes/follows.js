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

    const [existingFollow] = await db.query("SELECT id FROM follows WHERE user_id = ? AND target_user_id = ?", [
      userId,
      targetUserId,
    ])

    if (existingFollow.length > 0) {
      return res.status(400).json({ message: "이미 팔로우했습니다" })
    }

    await db.query("INSERT INTO follows (user_id, target_user_id) VALUES (?, ?)", [userId, targetUserId])

    // 알림 생성
    await db.query("INSERT INTO notifications (user_id, type, from_user_id) VALUES (?, ?, ?)", [
      targetUserId,
      "follow",
      userId,
    ])

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

    await db.query("DELETE FROM follows WHERE user_id = ? AND target_user_id = ?", [userId, targetUserId])

    res.status(200).json({ message: "언팔로우 성공" })
  } catch (err) {
    console.error("언팔로우 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

export default router
