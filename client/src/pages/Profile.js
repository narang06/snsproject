"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
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
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SubmissionCard from "../components/SubmissionCard";
import UserListDialog from "../components/UserListDialog";
import { parseMentions } from "../utils/mentionParser";
import { useSubmissions } from "../contexts/SubmissionsContext";

const Profile = ({ currentUser, onLogout }) => {
  const {
    submissions: contextSubmissions,
    setSubmissions,
    likedSubmissions,
    setLikedSubmissions,
  } = useSubmissions();
  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();
  const profileImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
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
  const [latestAuthorComment, setLatestAuthorComment] = useState(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [userList, setUserList] = useState([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const observerRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loadingMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, loadingMore],
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleOpenEditModal = (submission) => {
    setSubmissionToEdit(submission);
    setEditedContent(submission.content);

    let initialImages = [];
    try {
      const parsed = JSON.parse(submission.image_url);
      if (Array.isArray(parsed)) {
        initialImages = parsed.map((url) => ({
          url,
          file: null,
          isNew: false,
        }));
      }
    } catch (e) {
      if (typeof submission.image_url === "string") {
        initialImages = [
          { url: submission.image_url, file: null, isNew: false },
        ];
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
    const originalImageUrls = JSON.parse(submissionToEdit.image_url || "[]");
    const remainingImageUrls = editingImages
      .filter((img) => !img.isNew)
      .map((img) => img.url);

    const imagesToDelete = originalImageUrls.filter(
      (url) => !remainingImageUrls.includes(url),
    );
    const newImageFiles = editingImages
      .filter((img) => img.isNew)
      .map((img) => img.file);

    // 3. Append data to FormData
    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }
    if (newImageFiles.length > 0) {
      newImageFiles.forEach((file) => {
        formData.append("images", file); // 'images' field for new files
      });
    }

    // 4. Send the request
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/submissions/${submissionToEdit.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "수정에 실패했습니다.");
        return;
      }

      const updatedSubmission = await response.json();

      // 5. Update UI
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((s) =>
          s.id === submissionToEdit.id
            ? {
                ...s,
                content: updatedSubmission.content,
                image_url: updatedSubmission.image_url,
              }
            : s,
        ),
      );

      handleCloseEditModal();
      alert("게시물이 수정되었습니다.");
    } catch (err) {
      console.error("게시물 수정 오류:", err);
      alert("서버 연결 오류");
    }
  };

  const handleRemoveEditingImage = (indexToRemove) => {
    setEditingImages(
      editingImages.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleEditImagesChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (editingImages.length + newFiles.length > 5) {
      alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    const newImageObjects = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,
      isNew: true,
    }));

    setEditingImages([...editingImages, ...newImageObjects]);
  };

  const isOwnProfile = currentUser?.userId === Number.parseInt(userId);

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

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3010/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) onLogout();
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      setUser(data.user);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error("프로필 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, onLogout]);

  const fetchSubmissions = useCallback(async () => {
    setLoadingMore(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/users/${userId}/submissions?page=${page}&limit=9`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
      setLocalSubmissions((prev) =>
        page === 1 ? data.submissions : [...prev, ...data.submissions],
      );
      setHasMore(data.hasMore);

      if (page === 1) {
        const newLiked = new Set();
        data.submissions.forEach((s) => {
          if (s.isLiked === 1 || s.isLiked === true) {
            newLiked.add(s.id);
          }
        });
        setLikedSubmissions(newLiked);
      } else {
        setLikedSubmissions((prev) => {
          const merged = new Set(prev);
          data.submissions.forEach((s) => {
            if (s.isLiked === 1 || s.isLiked === true) {
              merged.add(s.id);
            }
          });
          return merged;
        });
      }
    }
    } catch (err) {
      console.error("사용자 제출물 로드 실패:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, setLikedSubmissions]);

  // Reset state when userId changes
  useEffect(() => {
    setLocalSubmissions([]);
    setPage(1);
    setHasMore(true);
    setUser(null);
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userId) {
      fetchSubmissions();
    }
  }, [userId, page, fetchSubmissions]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3010/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (response.ok) {
        // 요청 성공 시, 사용자 프로필 정보를 서버에서 다시 불러옵니다.
        fetchUserProfile();
      } else {
        // 요청이 실패한 경우 사용자에게 알림
        const data = await response.json();
        alert(data.message || "요청에 실패했습니다.");
      }
    } catch (err) {
      console.error("팔로우/언팔로우 작업 오류:", err);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleOpenUserList = async (type) => {
    const title = type === "followers" ? "팔로워" : "팔로잉";
    setDialogTitle(title);
    setIsListLoading(true);
    setIsListDialogOpen(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/follows/${type}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setUserList(data);
      } else {
        alert(data.message || "목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error(`${title} 목록 조회 오류:`, err);
      alert("목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsListLoading(false);
    }
  };

  const handleCloseUserList = () => {
    setIsListDialogOpen(false);
    setDialogTitle("");
    setUserList([]);
  };

  const handleOpenModal = async (submission) => {
    setSelectedSubmission(submission);
    setOpenModal(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/comments/submission/${submission.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (response.ok) {
        let commentsList = [...data];
        const postAuthorId = submission.user_id;

        const authorComments = commentsList.filter(
          (c) => c.user_id === postAuthorId,
        );
        let foundLatestAuthorComment = null;
        if (authorComments.length > 0) {
          foundLatestAuthorComment = authorComments.reduce(
            (latest, current) => {
              return new Date(current.created_at) > new Date(latest.created_at)
                ? current
                : latest;
            },
            authorComments[0],
          );
        }
        setLatestAuthorComment(foundLatestAuthorComment);

        commentsList.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
        setComments(commentsList);
      }
    } catch (err) {
      console.error("댓글 로드 실패:", err);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSubmission(null);
    setComments([]);
    setNewComment("");
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("token");
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
      });

      const data = await response.json();
      if (response.ok) {
        const updatedComments = [...comments, data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
        setComments(updatedComments);
        setNewComment("");

        // Update local state for immediate UI feedback
        setLocalSubmissions((prevSubmissions) =>
          prevSubmissions.map((s) =>
            s.id === selectedSubmission.id
              ? { ...s, commentCount: s.commentCount + 1 }
              : s,
          ),
        );

        const postAuthorId = selectedSubmission.user_id;
        if (data.user_id === postAuthorId) {
          if (
            !latestAuthorComment ||
            new Date(data.created_at) > new Date(latestAuthorComment.created_at)
          ) {
            setLatestAuthorComment(data);
          }
        }
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "댓글 삭제 실패");
        return;
      }
      setComments(comments.filter((comment) => comment.id !== commentId));
      
      // Update local state for immediate UI feedback
      setLocalSubmissions((prevSubmissions) =>
        prevSubmissions.map((s) =>
          s.id === selectedSubmission.id
            ? { ...s, commentCount: s.commentCount - 1 }
            : s,
        ),
      );

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
    if (
      editedCommentContent.trim().length < 1 ||
      editedCommentContent.trim().length > 500
    ) {
      alert("댓글 내용은 1자 이상 500자 이하로 입력해주세요.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editedCommentContent }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "댓글 수정 실패");
        return;
      }
      const updatedComment = await response.json();
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? updatedComment : comment,
        ),
      );
      handleCancelEditComment();
      alert("댓글이 수정되었습니다.");
    } catch (err) {
      console.error("댓글 수정 오류:", err);
      alert("서버 연결 오류");
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3010/submissions/${submissionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "삭제에 실패했습니다.");
        return;
      }

      setLocalSubmissions(
        localSubmissions.filter((s) => s.id !== submissionId),
      );
      alert("게시물이 삭제되었습니다.");
      handleCloseModal(); // 삭제 성공 후 모달 닫기
    } catch (err) {
      console.error("게시물 삭제 오류:", err);
      alert("서버 연결 오류");
    }
  };

  const handleLikeForProfile = useCallback(
    async (submission) => {
      try {
        const token = localStorage.getItem("token");
        const isLiked = likedSubmissions.has(submission.id);

        const response = await fetch("http://localhost:3010/likes", {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ submissionId: submission.id }),
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.message || "좋아요 처리 실패");
          return;
        }

        const resultData = await response.json();

        // 1) 좋아요 Set 업데이트
        const newLiked = new Set(likedSubmissions);
        if (isLiked) {
          newLiked.delete(submission.id);
        } else {
          newLiked.add(submission.id);
        }
        setLikedSubmissions(newLiked);

        // 2) 프로필 화면에 보이는 localSubmissions 의 likeCount 업데이트
        setLocalSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? {
                  ...s,
                  likeCount: isLiked ? s.likeCount - 1 : s.likeCount + 1,
                  isLiked:
                    resultData.isLiked !== undefined
                      ? resultData.isLiked
                      : !isLiked,
                }
              : s,
          ),
        );
      } catch (err) {
        console.error("좋아요 실패:", err);
        alert("서버 연결 오류");
      }
    },
    [likedSubmissions, setLikedSubmissions],
  );





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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
        <Alert severity="error">사용자를 찾을 수 없습니다</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", marginBottom: 2 }}>
            <Box
              sx={{
                position: "relative",
                width: 100,
                height: 100,
                margin: "0 auto",
                marginBottom: 2,
              }}
            >
              <Avatar
                src={
                  profileImagePreview ||
                  (user.profileImage
                    ? `http://localhost:3010${user.profileImage}`
                    : "")
                }
                alt={user.nickname}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {isOwnProfile && ( // 내 프로필일 경우에만 수정 버튼 표시
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  htmlFor="profile-image-upload"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "rgba(255,255,255,0.8)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  marginBottom: 2,
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCancelEditProfileImage}
                >
                  취소
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveProfileImage}
                >
                  저장
                </Button>
              </Box>
            )}
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {user.nickname}#{user.nickname_tag}
            </Typography>
            {isEditingBio ? ( // 자기소개 수정 모드
              <Box sx={{ marginTop: 1, width: "100%" }}>
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
                    bioInput.length > 0
                      ? `${bioInput.length}/160 ${bioInput.length > 160 ? " (160자를 초과했습니다)" : ""}`
                      : "160자까지 입력 가능"
                  }
                  sx={{ marginBottom: 1 }}
                />
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancelEditBio}
                  >
                    취소
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveBio}
                  >
                    저장
                  </Button>
                </Box>
              </Box>
            ) : (
              // 자기소개 보기 모드
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    textAlign: "center",
                    flexGrow: 1,
                    minWidth: 0,
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

          <Grid
            container
            spacing={2}
            justifyContent="space-around"
            sx={{ marginBottom: 2 }}
          >
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {localSubmissions.length}
                </Typography>
                <Typography variant="caption">게시물</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box
                sx={{ textAlign: "center", cursor: "pointer" }}
                onClick={() => handleOpenUserList("followers")}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {user?.followerCount}
                </Typography>
                <Typography variant="caption">팔로워</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box
                sx={{ textAlign: "center", cursor: "pointer" }}
                onClick={() => handleOpenUserList("following")}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {user?.followingCount}
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

      {localSubmissions.length === 0 && !loadingMore ? (
        <Typography sx={{ textAlign: "center", marginTop: 4 }}>
          게시물이 없습니다
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {localSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              handleOpenModal={handleOpenModal}
              handleOpenImageModal={handleOpenImageModal}
              handleLike={handleLikeForProfile}
              likedSubmissions={likedSubmissions}
              currentUserId={currentUser?.userId}
              onDeleteSubmission={handleDeleteSubmission}
              onEditSubmission={handleOpenEditModal}
            />
          ))}
        </Box>
      )}
      <div ref={observerRef} style={{ height: "1px" }} />
      {loadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMore && localSubmissions.length > 0 && (
        <Typography
          sx={{ textAlign: "center", my: 2, color: "text.secondary" }}
        >
          더 이상 게시물이 없습니다.
        </Typography>
      )}

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        {selectedSubmission && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {selectedSubmission.questTitle}
                {selectedSubmission.user_id === currentUser?.userId && (
                  <Box>
                    <IconButton
                      onClick={() => {
                        handleCloseModal();
                        handleOpenEditModal(selectedSubmission);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        handleDeleteSubmission(selectedSubmission.id)
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </DialogTitle>
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
                {latestAuthorComment && (
                  <Box sx={{ borderBottom: "1px dashed #ccc", pb: 1, mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: "#E0F2F7",
                        border: "1px solid #B2EBF2",
                      }}
                    >
                      <Avatar
                        src={latestAuthorComment.profile_image_url}
                        alt={latestAuthorComment.nickname}
                        sx={{ width: 30, height: 30, marginRight: 1 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {latestAuthorComment.nickname}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              backgroundColor: "#00BCD4",
                              color: "white",
                              px: 0.5,
                              borderRadius: 1,
                              fontSize: "0.6rem",
                            }}
                          >
                            작성자
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ ml: "auto" }}
                          >
                            {new Date(
                              latestAuthorComment.created_at,
                            ).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {latestAuthorComment.content}
                        </Typography>
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
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: 2,
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: isAuthor ? "#F3F4F6" : "transparent",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            width: "100%",
                          }}
                        >
                          <Link
                            to={`/profile/${comment.user_id}`}
                            onClick={handleCloseModal}
                          >
                            <Avatar
                              src={comment.profile_image_url}
                              alt={comment.nickname}
                              sx={{ width: 30, height: 30, marginRight: 1 }}
                            />
                          </Link>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {comment.nickname}
                              </Typography>
                              {comment.user_id ===
                                selectedSubmission.user_id && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    backgroundColor: "#00BCD4",
                                    color: "white",
                                    px: 0.5,
                                    borderRadius: 1,
                                    fontSize: "0.6rem",
                                  }}
                                >
                                  작성자
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ ml: "auto" }}
                              >
                                {new Date(comment.created_at).toLocaleString(
                                  "ko-KR",
                                )}
                              </Typography>
                            </Box>
                            {isEditing ? (
                              <TextField
                                fullWidth
                                multiline
                                value={editedCommentContent}
                                onChange={(e) =>
                                  setEditedCommentContent(e.target.value)
                                }
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1, mb: 1 }}
                                error={editedCommentContent.length > 500}
                                helperText={`${editedCommentContent.length}/500`}
                              />
                            ) : (
                              <Typography variant="body2" component="div">
                                {parseMentions(
                                  comment.content,
                                  comment.resolvedMentions,
                                )}
                              </Typography>
                            )}
                          </Box>
                          {isAuthor && !isEditing && (
                            <Box sx={{ ml: 1, display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditCommentClick(comment)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {isEditing && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={handleCancelEditComment}
                            >
                              취소
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() =>
                                handleSaveEditedComment(comment.id)
                              }
                            >
                              저장
                            </Button>
                          </Box>
                        )}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddComment();
                  }
                }}
                multiline
                maxRows={3}
                inputProps={{ maxLength: 500 }}
                error={newComment.length > 500}
                helperText={`${newComment.length}/500 ${newComment.length > 500 ? " (500자를 초과했습니다)" : ""}`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>닫기</Button>
              <Button
                onClick={handleAddComment}
                variant="contained"
                sx={{ backgroundColor: "#6366F1" }}
              >
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
              sx={{ width: "100%", height: "auto", borderRadius: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageModal}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>게시물 수정</DialogTitle>
        <DialogContent>
          {/* Image Editor UI */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              이미지 (최대 5개)
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                padding: 1,
                border: "1px solid #ddd",
                borderRadius: 1,
                minHeight: 100,
                alignItems: "center",
              }}
            >
              {editingImages.map((image, index) => (
                <Box key={index} sx={{ position: "relative", flexShrink: 0 }}>
                  <Box
                    component="img"
                    src={image.url}
                    alt={`수정할 이미지 ${index + 1}`}
                    sx={{
                      width: 150,
                      height: 150,
                      borderRadius: 1,
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveEditingImage(index)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ mt: 1 }}
            >
              이미지 추가
              <input
                hidden
                type="file"
                ref={editImageInputRef}
                onChange={handleEditImagesChange}
                accept="image/*"
                multiple
              />
            </Button>
          </Box>

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
            error={
              editedContent.length > 0 &&
              (editedContent.length < 10 || editedContent.length > 500)
            }
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
      <UserListDialog
        open={isListDialogOpen}
        onClose={handleCloseUserList}
        title={dialogTitle}
        users={userList}
      />
    </Container>
  );
};

export default Profile;