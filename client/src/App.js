"use client"

import { useState, useEffect, useRef } from "react" // useRef 추가
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Box, BottomNavigation, BottomNavigationAction } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import PersonIcon from "@mui/icons-material/Person"
import NotificationsIcon from "@mui/icons-material/Notifications"
import { jwtDecode } from 'jwt-decode';

import Login from "./pages/Login"
import Join from "./pages/Join"
import Register from "./pages/Register"
import Home from "./pages/Home"
import TodayQuest from "./pages/TodayQuest"
import Profile from "./pages/Profile"
import Notifications from "./pages/Notifications"
// import ProfileEdit from "./pages/ProfileEdit" // 설계 변경으로 주석 처리
import Archive from "./pages/Archive"
import SubmitQuest from "./pages/SubmitQuest"

const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />
}


const MainLayout = ({ children, isAuthenticated, currentUser, navValue, setNavValue }) => {
  const navigate = useNavigate();

 
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box sx={{ flex: 1, overflowY: "auto", paddingBottom: 7 }}>
        {children}
      </Box>
      <BottomNavigation
        value={navValue}
        onChange={(event, newValue) => {
          setNavValue(newValue);
          switch (newValue) {
            case 0: navigate("/"); break;
            case 1: navigate("/today-quest"); break;
            case 2: navigate("/submit-quest"); break;
            case 3: navigate("/notifications"); break;
            case 4: navigate(`/profile/${currentUser?.userId}`); break;
            default: break;
          }
        }}
        sx={{ position: "fixed", bottom: 0, width: "100%" }}
      >
        <BottomNavigationAction label="홈" icon={<HomeIcon />} />
        <BottomNavigationAction label="오늘의 퀘스트" icon={<TrendingUpIcon />} />
        <BottomNavigationAction label="제출" icon={<TrendingUpIcon />} />
        <BottomNavigationAction label="알림" icon={<NotificationsIcon />} />
        <BottomNavigationAction label="프로필" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
};



function MainAppContent() {
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true); 
  const [navValue, setNavValue] = useState(0); 

  const navigate = useNavigate();

  const isAuthenticatedRef = useRef(isAuthenticated); 
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  });

  useEffect(() => {
  console.log("isAuthenticated:", isAuthenticated);
  }, [isAuthenticated]); // 디버깅용



  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded = jwtDecode(token)
        setCurrentUser(decoded)
        setIsAuthenticated(true)
      } catch (err) {
        localStorage.removeItem("token")
        localStorage.removeItem("userId")
        setIsAuthenticated(false)
      }
    }
    setLoading(false); 
  }, []) 


  useEffect(() => {
    const wasAuthenticated = isAuthenticatedRef.current;

    if (wasAuthenticated && !isAuthenticated && !loading && !localStorage.getItem("token")) {
      console.log("Navigating to login with message");
      navigate(`/login?message=로그아웃%20되었습니다.&type=info`, { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);


  const handleLogin = (data) => {
    localStorage.setItem("token", data.token)
    localStorage.setItem("userId", data.userId)
    const decoded = jwtDecode(data.token)
    setCurrentUser(decoded)
    setIsAuthenticated(true)
  }

  // 로그아웃 시 호출될 함수 
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    setIsAuthenticated(false)
    setCurrentUser(null)
    window.location.href = "/login?message=로그아웃%20되었습니다.&type=info"
  }
  
  if (loading) {
    return <div>로딩 중...</div>; 
  }

  return (
      <MainLayout 
        isAuthenticated={isAuthenticated} 
        currentUser={currentUser} 
        navValue={navValue} 
        setNavValue={setNavValue}
      >
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/join" element={!isAuthenticated ? <Join /> : <Navigate to="/" />} />
          <Route path="/register" element={<Register />} /> 

          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Home currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/today-quest"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <TodayQuest currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Profile currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Notifications currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Archive currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-quest"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <SubmitQuest currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MainLayout>
  )
}

function App() {
  return (
    <Router>
      <MainAppContent />
    </Router>
  );
}

export default App;
