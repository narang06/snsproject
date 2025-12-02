"use client"

import { useState, useEffect, useRef, useCallback } from "react" 
import { Link } from 'react-router-dom';
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
  LinearProgress,
  IconButton,
} from "@mui/material"
import SubmissionCard from '../components/SubmissionCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { parseMentions } from "../utils/mentionParser";
import { useSubmissions } from '../contexts/SubmissionsContext';

const TodayQuest = ({ currentUser }) => {
  const { submissions, setSubmissions, likedSubmissions, handleLikeInContext, updateSubmissionCommentCount } = useSubmissions();
  const [quest, setQuest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState("")
  const [progressValue, setProgressValue] = useState(100);
  const [openModal, setOpenModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImageForModal, setSelectedImageForModal] = useState(null)
  const [latestAuthorComment, setLatestAuthorComment] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const commentsEndRef = useRef(null);


  useEffect(() => {
    fetchTodayQuest()
  }, [])

  useEffect(() => {
    if (!quest) return

    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const diff = tomorrow - now
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft(`${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')} 남음`)

      const totalDayMillis = 24 * 60 * 60 * 1000;
      const elapsedDayMillis = now.getTime() - new Date(now).setHours(0,0,0,0);
      const progress = (elapsedDayMillis / totalDayMillis) * 100;
      setProgressValue(100 - progress); 
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) 

    return () => clearInterval(interval)
  }, [quest])

  const fetchTodayQuest = useCallback(async () => { 
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/quests/today", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setQuest(data.quest)
        setSubmissions(data.submissions) // Context의 setSubmissions 사용
      } else {
        if(response.status !== 404) {
          alert(data.message || '오늘의 퀘스트 피드를 불러오는 데 실패했습니다.');
        }
        setSubmissions([]); // Context의 setSubmissions 사용
      }
    } catch (err) {
      console.error("오늘의 퀘스트 로드 실패:", err)
      setSubmissions([]); // Context의 setSubmissions 사용
    } finally {
      setLoading(false)
    }
  }, [setSubmissions]); // Context의 setSubmissions에 의존

  useEffect(() => {
    fetchTodayQuest()
  }, [fetchTodayQuest]) 

  const handleOpenModal = useCallback(async (submission) => {
    setSelectedSubmission(submission);
    setOpenModal(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/comments/submission/${submission.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        let commentsList = [...data];
        const postAuthorId = submission.user_id;

        const authorComments = commentsList.filter(c => c.user_id === postAuthorId);
        let foundLatestAuthorComment = null;
        if (authorComments.length > 0) {
          foundLatestAuthorComment = authorComments.reduce((latest, current) => {
            return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
          }, authorComments[0]);
        }
        setLatestAuthorComment(foundLatestAuthorComment);

        commentsList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setComments(commentsList);
      }
    } catch (err) {
      console.error("댓글 로드 실패:", err);
    }
  }, []); 

  
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
        const updatedComments = [...comments, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setComments(updatedComments);
        setNewComment("");
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });

          updateSubmissionCommentCount(selectedSubmission.id, 1); // 댓글 수 1 증가

        const postAuthorId = selectedSubmission.user_id;
        if (data.user_id === postAuthorId) {
          if (!latestAuthorComment || new Date(data.created_at) > new Date(latestAuthorComment.created_at)) {
            setLatestAuthorComment(data);
          }
        }
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err)
    } 
  }

  const handleLike = handleLikeInContext;

  const handleOpenImageModal = (imageUrl) => {
    setSelectedImageForModal(imageUrl);
    setImageModalOpen(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "댓글 삭제 실패");
        return;
      }
      setComments(comments.filter(comment => comment.id !== commentId));
      updateSubmissionCommentCount(selectedSubmission.id, -1);

      if (latestAuthorComment && latestAuthorComment.id === commentId) {
        setLatestAuthorComment(null);
      }

      alert("댓글이 삭제되었습니다.");
    } catch (err) {
      console.error("댓글 삭제 오류:", err);
      alert("서버 연결 오류");
    }
  };

  const handleEditCommentClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentContent("");
  };

  const handleSaveEditedComment = async (commentId) => {
    if (editedCommentContent.trim().length < 1 || editedCommentContent.trim().length > 500) {
      alert("댓글 내용은 1자 이상 500자 이하로 입력해주세요.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editedCommentContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "댓글 수정 실패");
        return;
      }
      const updatedComment = await response.json();
      setComments(comments.map(comment => comment.id === commentId ? updatedComment : comment));
      handleCancelEditComment();
      alert("댓글이 수정되었습니다.");
    } catch (err) {
      console.error("댓글 수정 오류:", err);
      alert("서버 연결 오류");
    }
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageForModal(null);
  };


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!quest) {
    return (
      <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
        <Alert severity="info">오늘의 퀘스트를 불러올 수 없습니다</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
      <Card sx={{
        marginBottom: 3,
        borderRadius: 3,
        boxShadow: 3,
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        color: "white",
        p: 2,
      }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 1 }}>
            오늘의 퀘스트
          </Typography>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            {quest.title}
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: 2, opacity: 0.9 }}>
            {quest.description}
          </Typography>
          <Box>
            <Typography variant="caption">{timeLeft}</Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{ 
                mt: 1, 
                height: 12,
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.3)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: progressValue > 50 ? "#4ade80" 
                                    : progressValue > 20 ? "#facc15" 
                                    : "#f87171" 
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        제출물 ({submissions.length})
      </Typography>

      {submissions.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 4, color: "text.secondary" }}>
          아직 제출된 게시물이 없습니다
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              handleOpenModal={handleOpenModal}
              handleOpenImageModal={handleOpenImageModal}
              handleLike={handleLikeInContext}
              likedSubmissions={likedSubmissions}
              currentUserId={currentUser?.userId}
            />
          ))}
        </Box>
      )}

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedSubmission && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar src={`http://localhost:3010${selectedSubmission.userProfileImage}`} sx={{ width: 30, height: 30 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {selectedSubmission.nickname}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedSubmission.created_at).toLocaleString('ko-KR')}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedSubmission.imageUrl && (
                <Box
                  component="img"
                  src={`http://localhost:3010${selectedSubmission.imageUrl}`}
                  alt="제출물"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }} 

                  sx={{ width: "100%", marginBottom: 2, borderRadius: 1 }}
                />
              )}
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                {selectedSubmission.content}
              </Typography>

              <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>
                댓글 ({comments.length})
              </Typography>

              <Box sx={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                {latestAuthorComment && (
                  <Box sx={{ borderBottom: '1px dashed #ccc', pb: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1, backgroundColor: '#E0F2F7', border: '1px solid #B2EBF2' }}>
                      <Avatar src={latestAuthorComment.profile_image_url} alt={latestAuthorComment.nickname} sx={{ width: 30, height: 30, mr: 1 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{latestAuthorComment.nickname}</Typography>
                          <Typography variant="caption" sx={{ backgroundColor: '#00BCD4', color: 'white', px: 0.5, borderRadius: 1, fontSize: '0.6rem' }}>작성자</Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                            {new Date(latestAuthorComment.created_at).toLocaleString('ko-KR')}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{latestAuthorComment.content}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {comments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    아직 댓글이 없습니다
                  </Typography>
                ) : (
                    comments.map((comment) => {
                       const isAuthor = comment.user_id === currentUser?.userId; 
                       const isEditing = editingCommentId === comment.id;
                       return (
                         <Box
                           key={comment.id}
                           id={`comment-${comment.id}`}
                           sx={{
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: comment.user_id === currentUser?.userId ? "#F3F4F6" : "transparent",
                              display: "flex",
                              gap: 1,
                              alignItems: "flex-start"
                            }}
                           >
                           <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                             <Link to={`/profile/${comment.user_id}`} onClick={handleCloseModal}>
                               <Avatar src={`http://localhost:3010${comment.profile_image_url}`} sx={{ width: 30, height: 30 }} />
                             </Link>
                           <Box sx={{ flexGrow: 1 }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                 {comment.nickname}
                               </Typography>
                               {comment.user_id === selectedSubmission.user_id && (
                                 <Typography variant="caption" sx={{ backgroundColor: '#00BCD4', color: 'white', px: 0.5, borderRadius: 1, fontSize:'0.6rem' }}>
                                   작성자
                                 </Typography>
                               )}
                               <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                                 {new Date(comment.created_at).toLocaleString('ko-KR', {
                                   year: 'numeric', month: 'numeric', day: 'numeric',
                                   hour: '2-digit', minute: '2-digit'
                                 })}
                               </Typography>
                             </Box>
                                                                                                                    {isEditing ? (
                                                                                                                      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                                                                        <TextField
                                                                                                                          fullWidth
                                                                                                                          multiline
                                                                                                                          value={editedCommentContent}
                                                                                                                          onChange={(e) => setEditedCommentContent(e.target.value)}
                                                                                                                          variant="outlined"
                                                                                                                          size="small"
                                                                                                                          sx={{ mt: 1, mb: 1 }}
                                                                                                                          error={editedCommentContent.length > 500}
                                                                                                                          helperText={`${editedCommentContent.length}/500 ${editedCommentContent.length > 500 ? ' (500자를초과했습니다)' : ''}`}
                                                                                                                        />
                                                                                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: -1 }}>
                                                                                                                          <Button size="small" variant="outlined" onClick={handleCancelEditComment}>취소</Button>
                                                                                                                          <Button size="small" variant="contained" onClick={() => handleSaveEditedComment(comment.id)}>저장</Button>
                                                                                                                        </Box>
                                                                                                                      </Box>
                                                                                                                    ) : (
                                                                                                                      <Typography variant="body2" component="div">
                                                                                                                        {parseMentions(comment.content, comment.resolvedMentions)}
                                                                                                                      </Typography>
                                                                                                                    )}                                                                                     </Box>
                                                                                      {isAuthor && !isEditing && (
                                                                                        <Box sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
                                                                                          <IconButton size="small" onClick={() => handleEditCommentClick(comment)} color="primary">
                                                                                            <EditIcon fontSize="small" />
                                                                                          </IconButton>
                                                                                          <IconButton size="small" onClick={() => handleDeleteComment(comment.id)} color="error">
                                                                                            <DeleteIcon fontSize="small" />
                                                                                          </IconButton>
                                                                                        </Box>
                                                                                      )}
                                                                                    </Box>
                                                                              </Box>
                       );
                     })
                   )}
                <div ref={commentsEndRef} />
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="댓글을 작성하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) { // Ctrl+Enter로 제출
                    handleAddComment();
                  }
                }}
                multiline
                maxRows={4}
                inputProps={{ maxLength: 500 }}
                sx={{ mt: 1 }}
                error={newComment.length > 500}
                helperText={`${newComment.length}/500 ${newComment.length > 500 ? ' (500자를 초과했습니다)' : 'Ctrl+Enter로 제출'}`}
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
      <Dialog
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ padding: 1 }}>
          {selectedImageForModal && (
            <Box
              component="img"
              src={selectedImageForModal}
              alt="원본 이미지"
              sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageModal}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default TodayQuest