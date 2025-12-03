import express from "express"
import db from "../db.js"
import authMiddleware from "../auth.js"
import { addResolvedMentions } from '../utils/mentionUtils.js';

const router = express.Router()

// 댓글 조회
router.get("/submission/:submissionId", authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params

    const [comments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.submission_id = ?
       ORDER BY c.created_at ASC`,
      [submissionId],
    );

    if (comments.length === 0) {
      return res.status(200).json([]);
    }

    // --- 언급(mention) 정보 처리를 위한 로직 ---

    // 1. 모든 댓글에서 유니크한 @닉네임#태그 목록 수집
    const mentionRegex = /[@#]([\p{L}\w]+#\d{4})/gu; // 한글 포함 유니코드 지원
    const allMentionedParts = new Set();
    for (const comment of comments) {
      const matches = comment.content.match(mentionRegex) || [];
      for (const match of matches) {
        allMentionedParts.add(match.substring(1)); // "닉네임#태그" 부분만 저장
      }
    }
    
    const resolvedUsers = new Map(); // '닉네임#태그'를 키로, user 객체를 값으로 저장

    // 2. 언급된 닉네임이 있으면, 한 번의 쿼리로 모든 사용자 정보를 가져옴
    if (allMentionedParts.size > 0) {
      const queryConditions = [];
      const queryParams = [];
      for (const part of allMentionedParts) {
        const [nickname, tag] = part.split('#');
        if (nickname && tag) {
          queryConditions.push("(nickname = ? AND nickname_tag = ?)");
          queryParams.push(nickname, tag);
        }
      }

      if (queryConditions.length > 0) {
        const sql = `SELECT id, nickname, nickname_tag FROM users WHERE ${queryConditions.join(" OR ")}`;
        const [users] = await db.query(sql, queryParams);
        
        for (const user of users) {
          resolvedUsers.set(`${user.nickname}#${user.nickname_tag}`, user);
        }
      }
    }

    // 3. 각 댓글 객체에 'resolvedMentions' 배열 추가
    const commentsWithMentions = comments.map(comment => {
      const resolvedMentions = [];
      // 정규식의 'g' 플래그가 상태를 가지므로 재사용을 위해 새로 생성하거나 lastIndex를 리셋해야 함
      const localMentionRegex = /[@#]([\p{L}\w]+#\d{4})/gu; // 한글 포함 유니코드 지원
      let match;
      const uniqueMatchesInComment = new Set();
      while ((match = localMentionRegex.exec(comment.content)) !== null) {
        uniqueMatchesInComment.add(match[0]); // '@닉네임#태그' 전체 저장
      }

      for (const fullMatch of uniqueMatchesInComment) {
        const mentionedPart = fullMatch.substring(1); // '닉네임#태그'
        if (resolvedUsers.has(mentionedPart)) {
          const user = resolvedUsers.get(mentionedPart);
          resolvedMentions.push({
            text: fullMatch, // '@닉네임#태그'
            userId: user.id
          });
        }
      }
      return { ...comment, resolvedMentions };
    });

    res.status(200).json(commentsWithMentions);
  } catch (err) {
    console.error("댓글 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

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
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    )

    // 통합 알림 생성 (댓글 + 언급)
    const recipients = new Map(); // 수신자 ID를 키로, 알림 타입을 값으로 가짐

    // 1. 게시물 작성자 추가
    const [submissions] = await db.query("SELECT user_id FROM submissions WHERE id = ?", [submissionId]);
    const postOwnerId = submissions.length > 0 ? submissions[0].user_id : null;

    if (postOwnerId && postOwnerId !== userId) {
      recipients.set(postOwnerId, "comment"); // 기본 알림 타입: 'comment'
    }

    // 2. 언급된 사용자 추가 (형식: @닉네임#태그)
    const mentionRegex = /[@#]([\p{L}\w]+#\d{4})/gu; // 한글 포함 유니코드 지원
    const mentionedParts = new Set(); // 중복 언급을 처리하기 위해 Set 사용
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedParts.add(match[1]); // 예: "test#1234"
    }

    if (mentionedParts.size > 0) {
      const queryConditions = [];
      const queryParams = [];
      
      for (const part of mentionedParts) {
        const [nickname, tag] = part.split('#');
        if (nickname && tag) {
          queryConditions.push("(nickname = ? AND nickname_tag = ?)");
          queryParams.push(nickname, tag);
        }
      }

      if (queryConditions.length > 0) {
        const sql = `SELECT id FROM users WHERE ${queryConditions.join(" OR ")}`;
        const [mentionedUsers] = await db.query(sql, queryParams);

        for (const mentionedUser of mentionedUsers) {
          // 댓글 작성자 자신에게는 알림을 보내지 않음
          if (mentionedUser.id !== userId) {
            recipients.set(mentionedUser.id, "mention"); // 'mention' 타입이 우선
          }
        }
      }
    }

    // 3. 수집된 수신자들에게 알림 발송
    const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000); 

    for (const [recipientId, notificationType] of recipients.entries()) {
    // 멘션 알림은 그룹화하지 않고 개별로 보냅니다. (1분 내 중복 방지)
    if (notificationType === "mention") {
      const ONE_MINUTE_AGO_MENTION = new Date(Date.now() - 60 * 1000); // 새로운 변수명으로 충돌 방지
      const [existingMentionNotification] = await db.query(
        `SELECT id FROM notifications
        WHERE recipient_id = ? AND sender_id = ? AND type = 'mention' AND target_id = ? AND comment_id = ? AND created_at >= ?`,
        [recipientId, userId, submissionId, commentId, ONE_MINUTE_AGO_MENTION]
      );

      if (existingMentionNotification.length === 0) { 
        const [senderInfo] = await db.query("SELECT nickname FROM users WHERE id = ?", [userId]);
        const senderNickname = senderInfo.length > 0 ? senderInfo[0].nickname : "알 수 없는 사용자";
        await db.query(
          "INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id, comment_id, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            recipientId,
            userId,
            notificationType,
            "SUBMISSION",
            submissionId,
            commentId,
            `${senderNickname}님이 댓글에서 회원님을 언급했습니다.`, 
          ]
        );
      }
      continue; // 다음 수신자로 넘어감
    }

      // 'comment' 타입 알림 (게시물 작성자에게 가는 알림) 그룹화 처리
      const groupingKey = `comment-submission-${submissionId}`;
      const [existingGroupNotifications] = await db.query(
        `SELECT id, actors, created_at FROM notifications
        WHERE recipient_id = ? AND grouping_key = ? AND type = 'comment_group' AND created_at >= ?
        ORDER BY created_at DESC LIMIT 1`,
        [recipientId, groupingKey, ONE_MINUTE_AGO]
      );

      // 알림 메시지를 생성할 sender (닉네임) 정보 가져오기
      const [senderInfo] = await db.query("SELECT nickname FROM users WHERE id = ?", [userId]);
      const senderNickname = senderInfo.length > 0 ? senderInfo[0].nickname : "알 수 없는 사용자";

      if (existingGroupNotifications.length > 0) {
        // --- 기존 그룹 알림이 있는 경우 (UPDATE) ---
        const existingNotif = existingGroupNotifications[0];
        let actors = JSON.parse(existingNotif.actors || '[]');

        if (!actors.includes(senderNickname)) {
          actors.push(senderNickname);
        }

        let message = '';
        if (actors.length === 1) {
          message = `${actors[0]}님이 회원님의 게시물에 댓글을 달았습니다.`;
        } else if (actors.length === 2) {
          message = `${actors[0]}님과 ${actors[1]}님이 회원님의 게시물에 댓글을 달았습니다.`;
        } else {
          message = `${actors[0]}님 외 ${actors.length - 1}명이 회원님의 게시물에 댓글을 달았습니다.`;
        }

        await db.query(
          `UPDATE notifications SET message = ?, actors = ?, created_at = NOW(), comment_id = ?
          WHERE id = ?`,
          [message, JSON.stringify(actors), commentId, existingNotif.id]
        );
      } else {
        // --- 기존 그룹 알림이 없는 경우 (INSERT) ---
        const actors = [senderNickname];
        const message = `${senderNickname}님이 회원님의 게시물에 댓글을 달았습니다.`;

        await db.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, target_type, target_id, comment_id, message, grouping_key, actors)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recipientId,
            userId,
            "comment_group", 
            "SUBMISSION",
            submissionId,
            commentId,
            message,
            groupingKey,
            JSON.stringify(actors),
          ]
        );
      }
    }

     const newCommentsWithMentions = await addResolvedMentions(newComments);

     res.status(201).json(newCommentsWithMentions[0]);
   } catch (err) {
     console.error("댓글 생성 오류:", err)
     res.status(500).json({ message: "서버 오류" })
   }
 })

// 댓글 삭제
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const [comments] = await db.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: "댓글을 삭제할 권한이 없습니다." });
    }

    await db.query("DELETE FROM comments WHERE id = ?", [commentId]);

    res.status(200).json({ message: "댓글이 삭제되었습니다." });
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 댓글 수정
router.put("/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ message: "댓글 내용은 500자를 초과할 수 없습니다." });
    }
    
    const [comments] = await db.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: "댓글을 수정할 권한이 없습니다." });
    }

    await db.query("UPDATE comments SET content = ? WHERE id = ?", [content, commentId]);

    const [updatedComments] = await db.query(
      `SELECT c.id, c.submission_id, c.user_id, c.content, c.created_at, u.nickname, u.nickname_tag, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    );

    res.status(200).json(updatedComments[0]);
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router
