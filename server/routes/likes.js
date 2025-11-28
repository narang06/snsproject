import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"

const router = express.Router()

// 좋아요 추가
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.body
    const userId = req.user.userId

    // Check if the user is trying to like their own post
    const [submissionAuthor] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId]);
    if (submissionAuthor.length > 0 && submissionAuthor[0].user_id === userId) {
      return res.status(400).json({ message: "자신의 게시물에는 좋아요를 누를 수 없습니다." });
    }

    const [existingLike] = await db.query("SELECT 1 FROM likes WHERE submission_id = ? AND user_id = ?", [
      submissionId,
      userId,
    ])

    if (existingLike.length > 0) {
      return res.status(400).json({ message: "이미 좋아요했습니다" })
    }

    await db.query("INSERT INTO likes (submission_id, user_id) VALUES (?, ?)", [submissionId, userId])

    // 알림 생성
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId])

    if (submissions.length > 0 && submissions[0].user_id !== userId) {
      await db.query("INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id) VALUES (?, ?, ?, ?, ?)", [
        submissions[0].user_id,
        userId,                
        "like",                
        "SUBMISSION",          
        submissionId,          
      ])
    }

    res.status(201).json({ message: "좋아요 성공" })
  } catch (err) {
    console.error("좋아요 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 좋아요 제거
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.body
    const userId = req.user.userId

    await db.query("DELETE FROM likes WHERE submission_id = ? AND user_id = ?", [submissionId, userId])

    res.status(200).json({ message: "좋아요 제거 성공" })
  } catch (err) {
    console.error("좋아요 제거 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

export default router
