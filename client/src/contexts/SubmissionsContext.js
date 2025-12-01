import { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { format } from 'date-fns';

const SubmissionsContext = createContext();

export const useSubmissions = () => useContext(SubmissionsContext);

export const SubmissionsProvider = ({ children }) => {
  const [submissions, setSubmissions] = useState([]);
  const [likedSubmissions, setLikedSubmissions] = useState(new Set()); // 좋아요 상태도 여기서 관리

  const fetchSubmissions = useCallback(async (date, query, sort) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', format(date, 'yyyy-MM-dd'));
      if (query) queryParams.append('query', query);
      queryParams.append('sort', sort);

      const response = await fetch(`http://localhost:3010/submissions/feed?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setSubmissions(data);
        const likedIds = new Set(data.filter(s => s.isLiked).map(s => s.id));
        setLikedSubmissions(likedIds);
      } else {
        if (response.status !== 404) {
          alert(data.message || '피드를 불러오는 데 실패했습니다.');
        }
        setSubmissions([]);
      }
    } catch (err) {
      console.error("피드 로드 실패:", err);
      setSubmissions([]);
    }
  }, []); 


  const handleLikeInContext = useCallback(async (submission) => {
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

      if (response.ok) {
        const resultData = await response.json(); 
        const newLiked = new Set(likedSubmissions);
        if (isLiked) {
          newLiked.delete(submission.id);
        } else {
          newLiked.add(submission.id);
        }
        setLikedSubmissions(newLiked);

        setSubmissions(prevSubmissions =>
          prevSubmissions.map((s) =>
            s.id === submission.id
              ? {
                  ...s,
                  likeCount: isLiked ? s.likeCount - 1 : s.likeCount + 1,
                  isLiked: resultData.isLiked !== undefined ? resultData.isLiked : !isLiked, 
                }
              : s,
          ),
        );
      }
    } catch (err) {
      console.error("좋아요 실패:", err);
    }
  }, [likedSubmissions]); // 이 함수는 likedSubmissions 상태에 의존

  const updateSubmissionCommentCount = useCallback((submissionId, change) => {
    setSubmissions(prevSubmissions =>
      prevSubmissions.map(s =>
        s.id === submissionId ? { ...s, commentCount: s.commentCount + change } : s
      )
    );
  }, []); 

  const value = useMemo(() => ({
    submissions,
    setSubmissions,
    fetchSubmissions,
    updateSubmissionCommentCount, 
    likedSubmissions,
    setLikedSubmissions,
    handleLikeInContext,
  }), [submissions, likedSubmissions, fetchSubmissions, updateSubmissionCommentCount, handleLikeInContext]);

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
};