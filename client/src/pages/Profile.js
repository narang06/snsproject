"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  Grid,
  IconButton
} from "@mui/material"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import FavoriteIcon from "@mui/icons-material/Favorite"
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';

const Profile = ({ currentUser, onLogout }) => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const profileImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [user, setUser] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [likedSubmissions, setLikedSubmissions] = useState(new Set())
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || "");
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false); 
  const [profileImageFile, setProfileImageFile] = useState(null); 
  const [profileImagePreview, setProfileImagePreview] = useState(null); 
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submissionToEdit, setSubmissionToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editingImages, setEditingImages] = useState([]); 
  const [selectedImageForModal, setSelectedImageForModal] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const handleOpenEditModal = (submission) => {
    setSubmissionToEdit(submission);
    setEditedContent(submission.content);

    let initialImages = [];
    try {
      const parsed = JSON.parse(submission.image_url);
      if (Array.isArray(parsed)) {
        initialImages = parsed.map(url => ({ url, file: null, isNew: false }));
      }
    } catch (e) {
      if (typeof submission.image_url === 'string') {
        initialImages = [{ url: submission.image_url, file: null, isNew: false }];
      }
    }
    setEditingImages(initialImages);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSubmissionToEdit(null);
    setEditedContent("");
    setEditingImages([]);
  };

  const handleUpdateSubmission = async () => {
    if (!submissionToEdit) return;

    // 1. Validate content
    if (editedContent.trim().length < 10 || editedContent.trim().length > 500) {
      alert("내용은 10자 이상 500자 이하로 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("content", editedContent);

    // 2. Figure out which images to delete and which are new
    const originalImageUrls = JSON.parse(submissionToEdit.image_url || '[]');
    const remainingImageUrls = editingImages
      .filter(img => !img.isNew)
      .map(img => img.url);

    const imagesToDelete = originalImageUrls.filter(url => !remainingImageUrls.includes(url));
    const newImageFiles = editingImages
      .filter(img => img.isNew)
      .map(img => img.file);

    // 3. Append data to FormData
    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }
    if (newImageFiles.length > 0) {
      newImageFiles.forEach(file => {
        formData.append("images", file); // 'images' field for new files
      });
    }

    // 4. Send the request
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/submissions/${submissionToEdit.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "수정에 실패했습니다.");
        return;
      }

      const updatedSubmission = await response.json();

      // 5. Update UI
      setSubmissions(submissions.map(s =>
        s.id === submissionToEdit.id ? { ...s, content: updatedSubmission.content, image_url: updatedSubmission.image_url } : s
      ));

      handleCloseEditModal();
      alert("게시물이 수정되었습니다.");

    } catch (err) {
      console.error("게시물 수정 오류:", err);
      alert("서버 연결 오류");
    }
  };
  
  const handleRemoveEditingImage = (indexToRemove) => {
    setEditingImages(editingImages.filter((_, index) => index !== indexToRemove));
  };
  
  const handleEditImagesChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (editingImages.length + newFiles.length > 5) {
      alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    const newImageObjects = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      file: file,
      isNew: true
    }));

    setEditingImages([...editingImages, ...newImageObjects]);
  };


  const isOwnProfile = currentUser?.userId === Number.parseInt(userId)

  // 자기소개 수정 모드 시작
  const handleEditBioClick = () => {
    setBioInput(user.bio || ""); 
    setIsEditingBio(true); // 수정 모드 활성화
  };

  // 자기소개 수정 취소
  const handleCancelEditBio = () => {
    setIsEditingBio(false); 
    setBioInput(user.bio || ""); 
  };

  // 자기소개 저장 (API 호출)
  const handleSaveBio = async () => {
    if (bioInput === (user.bio || "")) { 
      setIsEditingBio(false);
      return;
    }
    if (bioInput.length > 160) { 
      alert("자기소개는 160자를 초과할 수 없습니다.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3010/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: bioInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "자기소개 수정 실패");
        return;
      }

      // 사용자 정보 업데이트 및 수정 모드 종료
      setUser({ ...user, bio: bioInput }); 
      setIsEditingBio(false);
      alert("자기소개 수정 성공!");
    } catch (err) {
      console.error("자기소개 저장 오류:", err);
      alert("서버 연결 오류");
    }
  };
  // 프로필 이미지 수정 모드 시작
  const handleEditProfileImageClick = () => {
    setIsEditingProfileImage(true);
    setProfileImageFile(null); 
    setProfileImagePreview(null); 
  };
  // 프로필 이미지 변경 시 미리보기 생성
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setIsEditingProfileImage(true); 
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setIsEditingProfileImage(false); 
    }
  };

  // 프로필 이미지 수정 취소
  const handleCancelEditProfileImage = () => {
    setIsEditingProfileImage(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = "";
    }
  };

  // 프로필 이미지 저장 
  const handleSaveProfileImage = async () => {
    if (!profileImageFile) {
      alert("변경할 프로필 이미지를 선택해주세요.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profileImage", profileImageFile);

      const response = await fetch("http://localhost:3010/users/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "프로필 이미지 수정 실패");
        return;
      }

      // 사용자 정보 업데이트 및 수정 모드 종료
      setUser({ ...user, profileImage: data.user.profileImage }); 
      setIsEditingProfileImage(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = "";
      }
      alert("프로필 이미지 수정 성공!");
    } catch (err) {
      console.error("프로필 이미지 저장 오류:", err);
      alert("서버 연결 오류");
    }
  };

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3010/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setSubmissions(data.submissions)
        setIsFollowing(data.isFollowing)
      }
    } catch (err) {
      console.error("프로필 로드 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setUser({
          ...user,
          followerCount: isFollowing ? user.followerCount - 1 : user.followerCount + 1,
        })
      }
    } catch (err) {
      console.error("팔로우 실패:", err)
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

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/submissions/${submissionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "삭제에 실패했습니다.");
        return;
      }

      setSubmissions(submissions.filter(s => s.id !== submissionId));
      alert("게시물이 삭제되었습니다.");
    } catch (err) {
      console.error("게시물 삭제 오류:", err);
      alert("서버 연결 오류");
    }
  };

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

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageForModal(null);
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
        <Alert severity="error">사용자를 찾을 수 없습니다</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", marginBottom: 2 }}>
            <Box sx={{ position: 'relative', width: 100, height: 100, margin: '0 auto', marginBottom: 2 }}>
              <Avatar
                src={profileImagePreview || user.profileImage} // 미리보기 또는 현재 이미지
                alt={user.nickname}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {isOwnProfile && ( // 내 프로필일 경우에만 수정 버튼 표시
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="upload picture"
                  component="label" 
                  htmlFor="profile-image-upload" 
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                  }}
                >
                <EditIcon fontSize="small" />
                  <input
                    hidden
                    id="profile-image-upload"
                    type="file"
                    ref={profileImageInputRef}
                    onChange={handleProfileImageChange}
                    accept="image/*"
                  />
                </IconButton>
              )}
            </Box>
            {isEditingProfileImage && ( // <<-- 이미지 박스 바로 아래로 이동
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, marginBottom: 2 }}>
                <Button size="small" variant="outlined" onClick={handleCancelEditProfileImage}>취소</Button> 
                <Button size="small" variant="contained" onClick={handleSaveProfileImage}>저장</Button> 
              </Box>
            )}
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {user.nickname}#{user.nickname_tag}
            </Typography>  
            {isEditingBio ? ( // 자기소개 수정 모드
              <Box sx={{ marginTop: 1, width: '100%' }}>
                <TextField
                  fullWidth 
                  multiline 
                  Rows={3} 
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)} 
                  variant="outlined" 
                  maxLength={160}
                  placeholder="자기소개를 160자까지 입력할 수 있습니다."
                  error={bioInput.length > 160}
                  helperText={
                    bioInput.length > 0 ?
                      `${bioInput.length}/160 ${bioInput.length > 160 ? ' (160자를 초과했습니다)' : ''}`
                      : '160자까지 입력 가능'
                  }
                  sx={{ marginBottom: 1 }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}> 
                  <Button size="small" variant="outlined" onClick={handleCancelEditBio}>취소</Button> 
                  <Button size="small" variant="contained" onClick={handleSaveBio}>저장</Button>
                </Box>
              </Box>
            ) : ( // 자기소개 보기 모드
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, gap: 1 }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    whiteSpace: 'pre-wrap',    
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',   
                    textAlign: 'center',       
                    flexGrow: 1,               
                    minWidth: 0                
                  }}
                >
                  {user.bio}
                </Typography>
                {isOwnProfile && ( 
                  <IconButton size="small" onClick={handleEditBioClick}> 
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          <Grid container spacing={2} justifyContent="space-around" sx={{ marginBottom: 2 }}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {submissions.length}
                </Typography>
                <Typography variant="caption">게시물</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {user.followerCount}
                </Typography>
                <Typography variant="caption">팔로워</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {user.followingCount}
                </Typography>
                <Typography variant="caption">팔로잉</Typography>
              </Box>
            </Grid>
          </Grid>

          {isOwnProfile && ( 
            <Button
              fullWidth
              variant="contained"
              color="error" 
              sx={{ marginTop: 2 }}
              onClick={onLogout} 
            >
              로그아웃
            </Button>
          )}

          {!isOwnProfile && (
            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: isFollowing ? "#E5E7EB" : "#6366F1",
                color: isFollowing ? "#000" : "#fff",
              }}
              onClick={handleFollow}
            >
              {isFollowing ? "언팔로우" : "팔로우"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        게시물
      </Typography>

      {submissions.length === 0 ? (
        <Typography sx={{ textAlign: "center", marginTop: 4 }}>게시물이 없습니다</Typography>
      ) : (
        submissions.map((submission) => {
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
                title={
                  <Typography variant="h6" component="div" sx={{ marginBottom: '4px', fontWeight: 'bold' }}>
                    {submission.questTitle}
                  </Typography>
                }
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
                action={
                  isOwnProfile && (
                    <>
                      <IconButton aria-label="edit" onClick={() => handleOpenEditModal(submission)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label="delete" onClick={() => handleDeleteSubmission(submission.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )
                }
              />
              {images.length > 0 && (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    ref={scrollContainerRef}
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
                      const scrollLeft = e.currentTarget.scrollLeft;
                      const width = e.currentTarget.offsetWidth;
                      const newIndex = Math.round(scrollLeft / width);
                      if (newIndex !== currentImageIndex) {
                        setCurrentImageIndex(newIndex);
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
                          image={imgUrl}
                          alt={`게시물 이미지 ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenImageModal(imgUrl)}
                        />
                      </Box>
                    ))}
                  </Box>

                  {images.length > 1 && (
                    <>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                          zIndex: 1
                        }}
                        onClick={() => handleScrollPrev()}
                        disabled={currentImageIndex === 0}
                      >
                        <ArrowBackIosIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                          zIndex: 1
                        }}
                        onClick={() => handleScrollNext(images.length)}
                        disabled={currentImageIndex === images.length - 1}
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
        })
      )}

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedSubmission && (
          <>
            <DialogTitle>{selectedSubmission.questTitle}</DialogTitle>
            <DialogContent>
              {selectedSubmission.imageUrl && (
                <Box
                  component="img"
                  src={selectedSubmission.imageUrl}
                  alt="게시물"
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
      <Dialog open={editModalOpen} onClose={handleCloseEditModal} fullWidth maxWidth="sm">
        <DialogTitle>게시물 수정</DialogTitle>
        <DialogContent>
          {/* Image Editor UI */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>이미지 (최대 5개)</Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', padding: 1, border: '1px solid #ddd', borderRadius: 1, minHeight: 100, alignItems: 'center' }}>
              {editingImages.map((image, index) => (
                <Box key={index} sx={{ position: 'relative', flexShrink: 0 }}>
                  <Box
                    component="img"
                    src={image.url}
                    alt={`수정할 이미지 ${index + 1}`}
                    sx={{ width: 150, height: 150, borderRadius: 1, objectFit: "cover" }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveEditingImage(index)}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Button variant="outlined" component="label" size="small" sx={{ mt: 1 }}>
              이미지 추가
              <input hidden type="file" ref={editImageInputRef} onChange={handleEditImagesChange} accept="image/*" multiple />
            </Button>
          </Box>

          {/* Content Text Editor UI */}
          <TextField
            autoFocus
            margin="dense"
            label="내용"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            error={editedContent.length > 0 && (editedContent.length < 10 || editedContent.length > 500)}
            helperText={
              editedContent.length > 0
                ? `${editedContent.length} / 500`
                : "10자 이상 500자 이하로 작성해주세요."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>취소</Button>
          <Button onClick={handleUpdateSubmission}>저장</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
};

export default Profile