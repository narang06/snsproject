"use client"

import { useState, useEffect, useRef } from "react"
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
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import FavoriteIcon from "@mui/icons-material/Favorite"
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"
import SubmissionCard from '../components/SubmissionCard';

const TodayQuest = ({ currentUser }) => {
  const [quest, setQuest] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState("")
  const [progressValue, setProgressValue] = useState(100);
  const [openModal, setOpenModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [likedSubmissions, setLikedSubmissions] = useState(new Set())
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImageForModal, setSelectedImageForModal] = useState(null)
  const [latestAuthorComment, setLatestAuthorComment] = useState(null);


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
      const elapsedDayMillis = now.getTime() - new Date(now).setHours(0,0,0,0); // 오늘 00:00부터 경과한 시간
      const progress = (elapsedDayMillis / totalDayMillis) * 100;
      setProgressValue(100 - progress); // 남은 시간을 기준으로 100에서 차감
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // 랜더링 1분마다

    return () => clearInterval(interval)
  }, [quest])

  const fetchTodayQuest = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/quests/today", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setQuest(data.quest)
        setSubmissions(data.submissions)
      }
    } catch (err) {
      console.error("오늘의 퀘스트 로드 실패:", err)
    } finally {
      setLoading(false)
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
        const updatedComments = [...comments, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setComments(updatedComments);
        setNewComment("");

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

  const handleScrollNext = (imagesLength) => {
    if (scrollContainerRef.current) {
      const newIndex = Math.min(currentImageIndex + 1, imagesLength - 1);
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.offsetWidth * newIndex,
        behavior: 'smooth'
      });
      setCurrentImageIndex(newIndex);
    }
  };

  const handleScrollPrev = () => {
    if (scrollContainerRef.current) {
      const newIndex = Math.max(currentImageIndex - 1, 0);
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.offsetWidth * newIndex,
        behavior: 'smooth'
      });
      setCurrentImageIndex(newIndex);
    }
  };

  const handleOpenImageModal = (imageUrl) => {
    setSelectedImageForModal(imageUrl);
    setImageModalOpen(true);
  };

  const SubmissionCardItem = ({ submission, handleOpenModal, handleOpenImageModal, handleLike, likedSubmissions }) => {
    const scrollContainerRefLocal = useRef(null); 
    const [currentImageIndexLocal, setCurrentImageIndexLocal] = useState(0); 

    const handleScrollNextLocal = (imagesLength) => {
      if (scrollContainerRefLocal.current) {
        const newIndex = Math.min(currentImageIndexLocal + 1, imagesLength - 1);
        scrollContainerRefLocal.current.scrollTo({
          left: scrollContainerRefLocal.current.offsetWidth * newIndex,
          behavior: 'smooth'
        });
        setCurrentImageIndexLocal(newIndex);
      }
    };

    const handleScrollPrevLocal = () => {
      if (scrollContainerRefLocal.current) {
        const newIndex = Math.max(currentImageIndexLocal - 1, 0);
        scrollContainerRefLocal.current.scrollTo({
          left: scrollContainerRefLocal.current.offsetWidth * newIndex,
          behavior: 'smooth'
        });
        setCurrentImageIndexLocal(newIndex);
      }
    };

    let images = [];
    try {
      const parsedImages = JSON.parse(submission.image_url);
      if (Array.isArray(parsedImages)) {
        images = parsedImages;
      }
    } catch (e) {
      if (typeof submission.image_url === 'string' && submission.image_url.startsWith('/uploads/')) {
        images = [submission.image_url];
      }
    }

    return (
      <Card key={submission.id} sx={{ marginBottom: 2 }}>
        <CardHeader
          avatar={
            <Avatar src={`http://localhost:3010${submission.userProfileImage}`} 
            alt={submission.nickname} 
            onError={(e) => { e.target.src ='https://via.placeholder.com/40?text=N/A'; }} 
            />
          }  
          title={<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{submission.nickname}</Typography>}
          subheader={
            <>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>
                {new Date(submission.created_at).toLocaleDateString("ko-KR")}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {new Date(submission.created_at).toLocaleTimeString("ko-KR")}
              </Typography>
            </>
          }
        />
        {images.length > 0 && (
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={scrollContainerRefLocal} 
              sx={{
                display: 'flex',
                overflowX: 'scroll',
                scrollSnapType: 'x mandatory',
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none',
              }}
              onScroll={(e) => {
                const newIndex = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
                if (newIndex !== currentImageIndexLocal) {
                  setCurrentImageIndexLocal(newIndex);
                }
              }}
            >
              {images.map((imgUrl, index) => (
                <Box
                  key={index}
                  sx={{
                    minWidth: '100%',
                    height: 300,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={`http://localhost:3010${imgUrl}`} 
                    alt={`제출물 이미지 ${index + 1}`}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenImageModal(`http://localhost:3010${imgUrl}`)}
                  />
                </Box>
              ))}
            </Box>

            {images.length > 1 && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }, zIndex: 1
                  }}
                  onClick={() => handleScrollPrevLocal()} // 로컬 핸들러 사용
                  disabled={currentImageIndexLocal === 0} // 로컬 상태 사용
                >
                  <ArrowBackIosIcon fontSize="small" />
                </IconButton>
                <IconButton
                  sx={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }, zIndex: 1
                  }}
                  onClick={() => handleScrollNextLocal(images.length)} // 로컬 핸들러 사용
                  disabled={currentImageIndexLocal === images.length - 1} // 로컬 상태 사용
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
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
          <Button size="small" startIcon={<ChatBubbleOutlineIcon />} onClick={() => handleOpenModal(submission)}>
            {submission.commentCount}
          </Button>
        </CardActions>
      </Card>
    );
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
      <Card sx={{ marginBottom: 3, backgroundColor: "#6366F1", color: "white" }}>
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
          <Box sx={{ marginBottom: 1 }}>
            <Typography variant="caption">{timeLeft}</Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{ 
                marginTop: 1, 
                height: 10,
                borderRadius: 5,
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

      <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        제출물 ({submissions.length})
      </Typography>

      {submissions.length === 0 ? (
        <Typography sx={{ textAlign: "center", marginTop: 4 }}>아직 제출된 게시물이 없습니다</Typography>
      ) : (
        submissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            handleOpenModal={handleOpenModal}
            handleOpenImageModal={handleOpenImageModal}
            handleLike={handleLike}
            likedSubmissions={likedSubmissions}
            currentUserId={currentUser?.userId}
          />
        ))
      )}

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedSubmission && (
          <>
            <DialogTitle>{selectedSubmission.nickname}님의 게시물</DialogTitle>
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

              <Box sx={{ maxHeight: 300, overflowY: "auto", marginBottom: 2 }}>
                {latestAuthorComment && (
                  <Box sx={{ borderBottom: '1px dashed #ccc', pb: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1, backgroundColor: '#E0F2F7', border: '1px solid #B2EBF2' }}>
                      <Avatar src={latestAuthorComment.profile_image_url} alt={latestAuthorComment.nickname} sx={{ width: 30, height: 30, marginRight: 1 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {latestAuthorComment.nickname}
                          </Typography>
                          <Typography variant="caption" sx={{ backgroundColor: '#00BCD4', color: 'white', px: 0.5, borderRadius: 1, fontSize: '0.6rem' }}>
                            작성자
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                            {new Date(latestAuthorComment.created_at).toLocaleString('ko-KR', {
                              year: 'numeric', month: 'numeric', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
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
                    const isAuthor = comment.user_id === selectedSubmission.user_id;
                    return (
                      <Box key={comment.id} sx={{ display: 'flex', alignItems: 'flex-start', marginBottom: 2, p: 1, borderRadius: 1, backgroundColor: isAuthor ?'#F3F4F6' : 'transparent' }}>
                        <Link to={`/profile/${comment.user_id}`} onClick={handleCloseModal}>
                            <Avatar
                              src={`http://localhost:3010${comment.profile_image_url}`}
                              alt={comment.nickname}
                              sx={{ width: 30, height: 30, marginRight: 1 }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=N/A'; }}
                            />
                        </Link>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {comment.nickname}
                            </Typography>
                            {isAuthor && (
                              <Typography variant="caption" sx={{ backgroundColor: '#6366F1', color: 'white', px: 0.5, borderRadius: 1, fontSize: '0.6rem' }}>
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
                          <Typography variant="body2">{comment.content}</Typography>
                        </Box>
                      </Box>
                    );
                  })
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