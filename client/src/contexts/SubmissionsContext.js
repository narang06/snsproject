import {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { format } from "date-fns";

const SubmissionsContext = createContext();

export const useSubmissions = () => useContext(SubmissionsContext);

export const SubmissionsProvider = ({ children }) => {
  const [submissions, setSubmissions] = useState([]);
  const [likedSubmissions, setLikedSubmissions] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    date: null,
    query: "",
    sort: "latest",
  });

  const fetchSubmissions = useCallback(
    async (newPage = 1, date = null, query = "", sort = "latest") => {
      setLoadingMore(true);
      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();
        if (date) queryParams.append("date", format(date, "yyyy-MM-dd"));
        if (query) queryParams.append("query", query);
        queryParams.append("sort", sort);
        queryParams.append("page", newPage);
        queryParams.append("limit", 5);

        const response = await fetch(
          `http://localhost:3010/submissions/feed?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();
        if (response.ok) {
          if (newPage === 1) {
            setSubmissions(data.submissions);
            const newLiked = new Set();
            data.submissions.forEach(s => {
              if (s.isLiked === 1) {
                newLiked.add(s.id);
              }
            });
            setLikedSubmissions(newLiked);
          } else {
            setSubmissions((prev) => [...prev, ...data.submissions]);
            setLikedSubmissions((prev) => {
              const merged = new Set(prev);
              data.submissions.forEach(s => {
                if (s.isLiked === 1) {
                  merged.add(s.id);
                }
              });
              return merged;
            });
          }
          setHasMore(data.hasMore);
          setPage(newPage);
        } else {
          if (response.status !== 404) {
            alert(data.message || "피드를 불러오는 데 실패했습니다.");
          }
          if (newPage === 1) setSubmissions([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("피드 로드 실패:", err);
        if (newPage === 1) setSubmissions([]);
        setHasMore(false);
      } finally {
        setLoadingMore(false);
      }
    },
    [],
  );

  const loadMoreHomeSubmissions = useCallback(() => {
    if (hasMore && !loadingMore) {
      const newPage = page + 1;
      fetchSubmissions(
        newPage,
        currentFilters.date,
        currentFilters.query,
        currentFilters.sort,
      );
    }
  }, [hasMore, loadingMore, page, fetchSubmissions, currentFilters]);

  const updateFiltersAndFetch = useCallback(
    (date, query, sort) => {
      setCurrentFilters({ date, query, sort });
      setPage(1); 
      setHasMore(true); 
      fetchSubmissions(1, date, query, sort);
    },
    [fetchSubmissions],
  );

  const handleLikeInContext = useCallback(
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

        if (response.ok) {
          const resultData = await response.json();
          const newLiked = new Set(likedSubmissions);
          if (isLiked) {
            newLiked.delete(submission.id);
          } else {
            newLiked.add(submission.id);
          }
          setLikedSubmissions(newLiked);

          setSubmissions((prevSubmissions) =>
            prevSubmissions.map((s) =>
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
        }
      } catch (err) {
        console.error("좋아요 실패:", err);
      }
    },
    [likedSubmissions],
  ); 

  const updateSubmissionCommentCount = useCallback((submissionId, change) => {
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((s) =>
        s.id === submissionId
          ? { ...s, commentCount: s.commentCount + change }
          : s,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      submissions,
      setSubmissions, 
      page,
      hasMore,
      loadingMore,
      fetchSubmissions: updateFiltersAndFetch, 
      loadMoreHomeSubmissions,
      updateSubmissionCommentCount,
      likedSubmissions,
      setLikedSubmissions, 
      handleLikeInContext,
    }),
    [
      submissions,
      likedSubmissions,
      page,
      hasMore,
      loadingMore,
      updateFiltersAndFetch,
      loadMoreHomeSubmissions,
      updateSubmissionCommentCount,
      handleLikeInContext,
    ],
  );

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
};
