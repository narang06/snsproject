import React, { useMemo, useEffect, useState } from "react";

const BackgroundManager = ({ isBackgroundEnabled }) => {
  const hour = new Date().getHours();
  const [pageHeight, setPageHeight] = useState(document.body.scrollHeight);

  const gradient = useMemo(() => {
    if (hour < 6) return "linear-gradient(to bottom, #0d0d2b, #1a1a3d)";
    if (hour < 12) return "linear-gradient(to bottom, #ffecd2, #fcb69f)";
    if (hour < 18) return "linear-gradient(to bottom, #a1c4fd, #c2e9fb)";
    return "linear-gradient(to bottom, #2b1055, #7597de)";
  }, [hour]);

  // 페이지 높이 변화 감지 후 배경 높이 자동 업데이트
  useEffect(() => {
    const updateHeight = () => {
      const newHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      setPageHeight(newHeight);
    };

    updateHeight();

    // 스크롤, 리사이즈 시 업데이트
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", updateHeight);
    };
  }, []);

  if (!isBackgroundEnabled) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${pageHeight}px`,
        background: gradient,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default BackgroundManager;