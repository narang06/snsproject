import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit'; // Profile.js에서만 필요할 수 있으나, 일단 포함
import DeleteIcon from '@mui/icons-material/Delete'; // Profile.js에서만 필요할 수 있으나, 일단 포함

const SubmissionCard = ({
  submission,
  handleOpenModal,          // 댓글 모달용
  handleOpenImageModal,     // 이미지 보기 모달용
  handleLike,               // 좋아요 기능용
  likedSubmissions,         // 좋아요 상태용
  currentUserId,            // 현재 로그인 사용자 ID (수정/삭제 권한 확인용)
  onDeleteSubmission,       // 삭제 기능용 (Profile.js에서만 필요)
  onEditSubmission,         // 수정 기능용 (Profile.js에서만 필요)
}) => {
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

  const isSubmissionOwner = currentUserId === submission.user_id;

  return (
    <Card sx={{ marginBottom: 2 }}>
      <CardHeader
        avatar={
          <Link to={`/profile/${submission.user_id}`}>
            <Avatar src={`http://localhost:3010${submission.userProfileImage}`} alt={submission.nickname} />
          </Link>
        }
        title={<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{submission.nickname}</Typography>}
        subheader={
          <>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
              {submission.questTitle}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>
              {new Date(submission.created_at).toLocaleDateString("ko-KR")}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {new Date(submission.created_at).toLocaleTimeString("ko-KR")}
            </Typography>
          </>
        }
        action={
          isSubmissionOwner && (onDeleteSubmission || onEditSubmission) ? (
            <>
              {onEditSubmission && ( // 수정 기능이 필요한 경우에만 버튼 표시
                <IconButton aria-label="edit" onClick={() => onEditSubmission(submission)}>
                  <EditIcon />
                </IconButton>
              )}
              {onDeleteSubmission && ( // 삭제 기능이 필요한 경우에만 버튼 표시
                <IconButton aria-label="delete" onClick={() => onDeleteSubmission(submission.id)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </>
          ) : null
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
              msOverflowStyle: 'none',
              scrollbarWidth: 'none', 
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
                onClick={() => handleScrollPrevLocal()}
                disabled={currentImageIndexLocal === 0}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              <IconButton
                sx={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }, zIndex: 1
                }}
                onClick={() => handleScrollNextLocal(images.length)}
                disabled={currentImageIndexLocal === images.length - 1}
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

export default SubmissionCard;