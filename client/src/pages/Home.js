"use client"

import { useState, useEffect } from "react"
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack
} from "@mui/material"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import FavoriteIcon from "@mui/icons-material/Favorite"
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"
import SubmissionCard from '../components/SubmissionCard';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns'; 

const Home = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [likedSubmissions, setLikedSubmissions] = useState(new Set())
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState(null)
  const [latestAuthorComment, setLatestAuthorComment] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [searchQuery, setSearchQuery] = useState("") 
  const [sortOrder, setSortOrder] = useState("latest")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  useEffect(() => {
    // 500ms(0.5초) 후에 검색어가 debouncedSearchQuery에 저장되도록 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    // 사용자가 계속 타이핑하면 이전 타이머를 취소하고 새 타이머를 시작
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]); // searchQuery가 바뀔 때마다 이 effect가 실행됩니다.

  useEffect(() => {
    fetchSubmissions(selectedDate, debouncedSearchQuery, sortOrder);
  }, [selectedDate, debouncedSearchQuery, sortOrder])

  const fetchSubmissions = async (date, query, sort) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token")
      const queryParams = new URLSearchParams();
      if (date) {
        queryParams.append('date', format(date, 'yyyy-MM-dd'));
      }
      if (query) {
        queryParams.append('query', query);
      }
      queryParams.append('sort', sort); 

      const response = await fetch(`http://localhost:3010/submissions/feed?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setSubmissions(data)
      } else {
        if(response.status !== 404) {
            alert(data.message || '피드를 불러오는 데 실패했습니다.');
        }
        setSubmissions([]); 
      }
    } catch (err) {
      console.error("피드 로드 실패:", err)
      setSubmissions([]);
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

  const handleOpenImageModal = (imageUrl) => {
    setSelectedImageForModal(imageUrl);
    setImageModalOpen(true);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
        <Stack spacing={2} sx={{ marginBottom: 3 }}>
          {/* 검색 관련 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label="날짜 선택"
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
                setSearchQuery('');
              }}
              disabled={!!searchQuery}
              renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              inputFormat="yyyy-MM-dd"
              mask="____-__-__"
            />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="닉네임 검색"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setSelectedDate(null);
              }}
              disabled={!!selectedDate}
            />
          </Stack>

          {/* 정렬/초기화 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortOrder}
                label="정렬"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="latest">최신순</MenuItem>
                <MenuItem value="likes">좋아요순</MenuItem>
                <MenuItem value="comments">댓글 많은순</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                setSelectedDate(null);
                setSearchQuery('');
              }}
              sx={{ height: 40 }}
            >
              필터 초기화
            </Button>
          </Stack>
        </Stack>

        {submissions.length === 0 ? (
          <Typography sx={{ textAlign: "center", marginTop: 4 }}>아직 게시물이 없습니다</Typography>
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
                        <Box key={comment.id} sx={{ display: 'flex', alignItems: 'flex-start', marginBottom: 2, p: 1, borderRadius: 1, backgroundColor: isAuthor ? '#F3F4F6' : 'transparent' }}>
                            <Link to={`/profile/${comment.user_id}`} onClick={handleCloseModal}>
                              <Avatar src={comment.profile_image_url} alt={comment.nickname} sx={{ width: 30, height: 30, marginRight: 1 }} />
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
                src={`http://localhost:3010${selectedImageForModal}`}
                alt="원본 이미지"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }}
                sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseImageModal}>닫기</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  )
}

export default Home