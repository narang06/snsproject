import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"

const router = express.Router()

// 댓글 조회
router.get("/submission/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params

    const [comments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.submission_id = ?
       ORDER BY c.created_at ASC`,
      [submissionId],
    )

    res.status(200).json(comments)
  } catch (err) {
    console.error("댓글 조회 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// 댓글 생성
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { submissionId, content } = req.body

    if (!submissionId || !content) {
      return res.status(400).json({ message: "필수 필드를 입력해주세요" })
    }

    const result = await db.query("INSERT INTO comments (submission_id, user_id, content) VALUES (?, ?, ?)", [
      submissionId,
      userId,
      content,
    ])

    const commentId = result[0].insertId

    // 새로 생성된 댓글 조회
    const [newComments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    )

    // 알림 생성
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId])

    if (submissions.length > 0 && submissions[0].user_id !== userId) {
      await db.query("INSERT INTO notifications (user_id, type, from_user_id, submission_id) VALUES (?, ?, ?, ?)", [
        submissions[0].user_id,
        "comment",
        userId,
        submissionId,
      ])
    }

    res.status(201).json(newComments[0])
  } catch (err) {
    console.error("댓글 생성 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

export default router
