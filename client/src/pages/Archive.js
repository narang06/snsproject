"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Typography,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from "@mui/material"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import FavoriteIcon from "@mui/icons-material/Favorite"
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"

const Archive = ({ currentUser }) => {
  const [quests, setQuests] = useState([])
  const [selectedQuestId, setSelectedQuestId] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [likedSubmissions, setLikedSubmissions] = useState(new Set())

  useEffect(() => {
    fetchArchivedQuests()
  }, [])

  const fetchArchivedQuests = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/quests/archive", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setQuests(data)
      }
    } catch (err) {
      console.error("아카이브 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectQuest = async (questId) => {
    setSelectedQuestId(questId)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3010/submissions/quest/${questId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setSubmissions(data)
      }
    } catch (err) {
      console.error("제출물 로드 실패:", err)
    }
  }

  const handleOpenModal = async (submission) => {
    setSelectedSubmission(submission)
    setOpenModal(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3010/comments/submission/${submission.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setComments(data)
      }
    } catch (err) {
      console.error("댓글 로드 실패:", err)
    }
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSelectedSubmission(null)
    setComments([])
    setNewComment("")
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          content: newComment,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setComments([...comments, data])
        setNewComment("")
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err)
    }
  }

  const handleLike = async (submission) => {
    try {
      const token = localStorage.getItem("token")
      const isLiked = likedSubmissions.has(submission.id)

      const response = await fetch("http://localhost:3010/likes", {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submissionId: submission.id }),
      })

      if (response.ok) {
        const newLiked = new Set(likedSubmissions)
        if (isLiked) {
          newLiked.delete(submission.id)
        } else {
          newLiked.add(submission.id)
        }
        setLikedSubmissions(newLiked)

        setSubmissions(
          submissions.map((s) =>
            s.id === submission.id
              ? {
                  ...s,
                  likeCount: isLiked ? s.likeCount - 1 : s.likeCount + 1,
                }
              : s,
          ),
        )
      }
    } catch (err) {
      console.error("좋아요 실패:", err)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        지난 퀘스트 아카이브
      </Typography>

      {quests.length === 0 ? (
        <Alert severity="info">아카이브된 퀘스트가 없습니다</Alert>
      ) : (
        <>
          <Box sx={{ marginBottom: 3 }}>
            {quests.map((quest) => (
              <Card
                key={quest.id}
                sx={{
                  marginBottom: 1,
                  cursor: "pointer",
                  backgroundColor: selectedQuestId === quest.id ? "#E0E7FF" : "inherit",
                  "&:hover": { backgroundColor: "#F3F4F6" },
                }}
                onClick={() => handleSelectQuest(quest.id)}
              >
                <CardContent>
                  <Typography variant="h6">{quest.title}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(quest.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {selectedQuestId && (
            <>
              <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: "bold" }}>
                제출물 ({submissions.length})
              </Typography>

              {submissions.length === 0 ? (
                <Typography sx={{ textAlign: "center", marginTop: 2 }}>제출된 게시물이 없습니다</Typography>
              ) : (
                submissions.map((submission) => (
                  <Card key={submission.id} sx={{ marginBottom: 2 }}>
                    <CardHeader
                      avatar={<Avatar src={submission.userProfileImage} alt={submission.nickname} />}
                      title={submission.nickname}
                      subheader={new Date(submission.createdAt).toLocaleDateString()}
                    />
                    {submission.imageUrl && (
                      <CardMedia component="img" height="300" image={submission.imageUrl} alt="제출물" />
                    )}
                    <CardContent>
                      <Typography variant="body1">{submission.content}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => handleLike(submission)}
                        startIcon={
                          likedSubmissions.has(submission.id) ? (
                            <FavoriteIcon sx={{ color: "#EC4899" }} />
                          ) : (
                            <FavoriteBorderIcon />
                          )
                        }
                      >
                        {submission.likeCount}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ChatBubbleOutlineIcon />}
                        onClick={() => handleOpenModal(submission)}
                      >
                        {submission.commentCount}
                      </Button>
                    </CardActions>
                  </Card>
                ))
              )}
            </>
          )}
        </>
      )}

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedSubmission && (
          <>
            <DialogTitle>{selectedSubmission.nickname}님의 게시물</DialogTitle>
            <DialogContent>
              {selectedSubmission.imageUrl && (
                <Box
                  component="img"
                  src={selectedSubmission.imageUrl}
                  alt="제출물"
                  sx={{ width: "100%", marginBottom: 2, borderRadius: 1 }}
                />
              )}
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                {selectedSubmission.content}
              </Typography>

              <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>
                댓글 ({comments.length})
              </Typography>

              <Box sx={{ maxHeight: 300, overflowY: "auto", marginBottom: 2 }}>
                {comments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    아직 댓글이 없습니다
                  </Typography>
                ) : (
                  comments.map((comment) => (
                    <Box key={comment.id} sx={{ marginBottom: 1 }}>
                      <Typography variant="subtitle2">{comment.nickname}</Typography>
                      <Typography variant="body2">{comment.content}</Typography>
                    </Box>
                  ))
                )}
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="댓글을 작성하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddComment()
                  }
                }}
                multiline
                maxRows={3}
                inputProps={{ maxLength: 500 }}
                error={newComment.length > 500}
                helperText={`${newComment.length}/500 ${newComment.length > 500 ? ' (500자를 초과했습니다)' : ''}`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>닫기</Button>
              <Button onClick={handleAddComment} variant="contained" sx={{ backgroundColor: "#6366F1" }}>
                댓글 작성
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  )
}

export default Archive