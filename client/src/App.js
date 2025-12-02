"use client"

import { useState, useEffect, useRef } from "react" 
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { Box, BottomNavigation, BottomNavigationAction, Badge } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import AssignmentIcon from "@mui/icons-material/Assignment"
import PersonIcon from "@mui/icons-material/Person"
import NotificationsIcon from "@mui/icons-material/Notifications"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import { jwtDecode } from 'jwt-decode';

import Login from "./pages/Login"
import Join from "./pages/Join"
import Register from "./pages/Register"
import Home from "./pages/Home"
import { SubmissionsProvider } from "./contexts/SubmissionsContext";
import TodayQuest from "./pages/TodayQuest"
import Profile from "./pages/Profile"
import Notifications from "./pages/Notifications"
import Archive from "./pages/Archive"
import SubmitQuest from "./pages/SubmitQuest"

const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />
}


const MainLayout = ({ children, isAuthenticated, currentUser, navValue, setNavValue, unreadCount }) => {
  const navigate = useNavigate();

 
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minheight: "100dvh", paddingBottom: 7}}>
      <Box sx={{ flex: 1 }}>
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
        <BottomNavigationAction label="오늘의 퀘스트" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="제출" icon={<AddCircleOutlineIcon />} />
        <BottomNavigationAction
          label="알림"
          icon={
            <Badge color="error" variant="dot" invisible={unreadCount === 0}>
              <NotificationsIcon />
            </Badge>
          }
        />
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
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/') {
      setNavValue(0);
    } else if (pathname === '/today-quest') {
      setNavValue(1);
    } else if (pathname === '/submit-quest') {
      setNavValue(2);
    } else if (pathname === '/notifications') {
      setNavValue(3);
    } else if (pathname.startsWith('/profile/')) {
      setNavValue(4);
    }
  }, [location.pathname]); 

  const isAuthenticatedRef = useRef(isAuthenticated); 
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  });

  useEffect(() => {
  }, [isAuthenticated]); 



  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded = jwtDecode(token)
        const currentTime = Date.now() / 1000; 
        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setIsAuthenticated(false);
          setCurrentUser(null);
        } else {
          setCurrentUser(decoded);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error decoding token:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
    setLoading(false);
  }, [])


  useEffect(() => {
    const wasAuthenticated = isAuthenticatedRef.current;

    if (wasAuthenticated && !isAuthenticated && !loading && !localStorage.getItem("token")) {
      navigate(`/login?message=로그아웃%20되었습니다.&type=info`, { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3010/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("읽지 않은 알림 개수 조회 실패:", err);
      }
    };

    
    if (isAuthenticated) {
      fetchUnreadCount(); 
      const intervalId = setInterval(fetchUnreadCount, 60000); 

      return () => clearInterval(intervalId); 
    } else {
      setUnreadCount(0); 
    }
  }, [isAuthenticated]); 


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
        unreadCount={unreadCount}
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
                <SubmitQuest currentUser={currentUser} setNavValue={setNavValue} />
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
      <SubmissionsProvider>
        <MainAppContent />
      </SubmissionsProvider>
    </Router>
  );
}

export default App;
