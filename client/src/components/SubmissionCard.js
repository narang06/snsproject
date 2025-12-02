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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { parseMentions } from "../utils/mentionParser";

const SubmissionCard = ({
  submission,
  handleOpenModal,
  handleOpenImageModal,
  handleLike,
  likedSubmissions,
  currentUserId,
  onDeleteSubmission,
  onEditSubmission,
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
    <Card sx={{ marginBottom: 2, borderRadius: 2, boxShadow: 3, backgroundColor: "#fff" }}>
      <CardHeader
        avatar={
          <Link to={`/profile/${submission.user_id}`}>
            <Avatar src={`http://localhost:3010${submission.userProfileImage}`} alt={submission.nickname} />
          </Link>
        }
        title={<Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: "#111" }}>{submission.nickname}</Typography>}
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
              {onEditSubmission && (
                <IconButton 
                  aria-label="edit" 
                  onClick={() => onEditSubmission(submission)}
                  sx={{ color: "#6366F1", '&:hover': { backgroundColor: 'rgba(99,102,241,0.1)' } }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDeleteSubmission && (
                <IconButton 
                  aria-label="delete" 
                  onClick={() => onDeleteSubmission(submission.id)}
                  sx={{ color: "#EF4444", '&:hover': { backgroundColor: 'rgba(239,68,68,0.1)' } }}
                >
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
              borderColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
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
                  backgroundColor: 'rgba(0,0,0,0.4)', color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
                  zIndex: 1
                }}
                onClick={() => handleScrollPrevLocal()}
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
        <Typography
          variant="body1"
          component="div"
          sx={{ color: "#111", lineHeight: 1.5, whiteSpace: 'pre-line' }}
        >
          {parseMentions(submission.content, submission.resolvedMentions)}
        </Typography>
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
          sx={{
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(236,72,153,0.1)' },
            borderRadius: 1,
          }}
        >
          {submission.likeCount}
        </Button>
        <Button
          size="small"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => handleOpenModal(submission)}
          sx={{
            textTransform: 'none',
            borderRadius: 1,
          }}
        >
          {submission.commentCount}
        </Button>
      </CardActions>
    </Card>
  );
};

export default SubmissionCard;