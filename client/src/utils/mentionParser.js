import { Link } from "react-router-dom";
import React from "react";

export const parseMentions = (text, mentions) => {
  if (!text) return "";
  if (!mentions || mentions.length === 0) {
    return text;
  }

  // Sort mentions by length descending to match longer names first
  const sortedMentions = [...mentions].sort((a, b) => b.text.length - a.text.length);

  // Create a regex pattern from all mention texts
  const pattern = sortedMentions.map(m => m.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'g');

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const mention = sortedMentions.find(m => m.text === part);
    if (mention) {
      return (
        <Link 
          key={`${mention.userId}-${index}`}
          to={`/profile/${mention.userId}`}
          style={{ color: '#3B82F6', fontWeight: 'bold', textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()} // Stop card click event
        >
          {part}
        </Link>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

