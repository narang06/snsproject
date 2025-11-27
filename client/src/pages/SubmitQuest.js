"use client"

import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress, IconButton } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';


const SubmitQuest = ({ currentUser, setNavValue }) => {
  const [content, setContent] = useState("");
  const imageRef = useRef()
  const navigate = useNavigate()
  const [previews, setPreviews] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [questInfo, setQuestInfo] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    fetchTodayQuestInfo()
  }, [])

  const fetchTodayQuestInfo = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3010/quests/today", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok) {
        setQuestInfo(data.quest)
        setHasSubmitted(data.hasSubmitted)
      }
    } catch (err) {
      console.error("퀘스트 정보 로드 실패:", err)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (selectedFiles.length + newFiles.length > 5) {
      alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);

    const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async () => {
    setError("");
    const files = selectedFiles;

    if (!files || files.length === 0) {
      setError("이미지를 선택해주세요.");
      return;
    }
    if (files.length > 5) {
      setError("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }
    if (content.trim().length < 10 || content.trim().length > 500) {
      setError("내용은 10자 이상 500자 이하로 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("dailyQuestId", questInfo.dailyQuestId);
      formData.append("content", content);

      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3010/submissions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "제출 실패");
        return;
      }

      navigate("/today-quest");
      setNavValue(1);
    } catch (err) {
      setError("서버 연결 오류");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!questInfo) {
    return (
      <Container maxWidth="sm" sx={{ paddingTop: 2 }}>
        <Alert severity="error">오늘의 퀘스트를 불러올 수 없습니다</Alert>
      </Container>
    )
  }

  if (hasSubmitted) {
    return (
      <Container maxWidth="sm" sx={{ paddingY: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ padding: 4, textAlign: 'center', width: '100%', maxWidth: 400, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CheckCircleOutlineIcon color="success" />
            오늘 퀘스트 제출 완료!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 3 }}>
            오늘은 이미 퀘스트를 제출하셨습니다.<br />
            내일 다시 도전해보세요!
          </Typography>
          <Button
            fullWidth
            variant="contained"
            sx={{ backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4f46e5' } }}
            onClick={() => navigate("/today-quest")}
          >
            오늘의 퀘스트 확인
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", paddingY: 2 }}>
        <Paper sx={{ width: "100%", padding: 4 }}>
          <Typography variant="h5" component="h1" sx={{ textAlign: "center", marginBottom: 1, fontWeight: "bold" }}>
            오늘의 퀘스트 제출
          </Typography>

          <Typography variant="h6" sx={{ textAlign: "center", marginBottom: 3, color: "#6366F1" }}>
            {questInfo.title}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ textAlign: "center", marginBottom: 2 }}>
            {previews.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', padding: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                {previews.map((previewUrl, index) => (
                  <Box
                    key={index}
                    sx={{ position: 'relative', flexShrink: 0 }}
                  >
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={`Preview ${index + 1}`}
                      sx={{ width: 150, height: 150, borderRadius: 1, objectFit: "cover" }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Button variant="outlined" component="label" fullWidth sx={{ marginBottom: 2 }}>
            이미지 선택 (최대 5개)
            <input hidden type="file" ref={imageRef} onChange={handleImageChange} accept="image/*" multiple /> 
          </Button>

          <TextField
            fullWidth
            label="오늘의 인증"
            multiline
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
            variant="outlined"
            placeholder="오늘의 퀘스트 결과를 공유해주세요 (10~500자)"
            error={content.length > 0 && (content.length < 10 || content.length > 500)}
            helperText={
              content.length > 0 
                ? `${content.length} / 500` 
                : "10자 이상 500자 이하로 작성해주세요."
            }
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ marginTop: 2, backgroundColor: "#6366F1" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "제출 중..." : "제출하기"}
          </Button>

          <Box sx={{ textAlign: "center", marginTop: 2 }}>
            <Button color="primary" onClick={() => navigate("/today-quest")} sx={{ textTransform: "none" }}>
              취소
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default SubmitQuest