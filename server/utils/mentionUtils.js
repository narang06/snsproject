import db from "../db.js";

export const addResolvedMentions = async (items) => {
  if (!items || items.length === 0) {
    return items;
  }

  const mentionRegex = /[@#]([\p{L}\w]+#\d{4})/gu;
  const allMentionedParts = new Set();

  for (const item of items) {
    const matches = (item.content && item.content.match(mentionRegex)) || [];
    for (const match of matches) {
      allMentionedParts.add(match.substring(1));
    }
  }

  const resolvedUsers = new Map();
  if (allMentionedParts.size > 0) {
    const queryConditions = [];
    const queryParams = [];
    for (const part of allMentionedParts) {
      const [nickname, tag] = part.split('#');
      if (nickname && tag) {
        queryConditions.push("(nickname = ? AND nickname_tag = ?)");
        queryParams.push(nickname, tag);
      }
    }

    if (queryConditions.length > 0) {
      const sql = `SELECT id, nickname, nickname_tag FROM users WHERE ${queryConditions.join(" OR ")}`;
      const [users] = await db.query(sql, queryParams);
      for (const user of users) {
        resolvedUsers.set(`${user.nickname}#${user.nickname_tag}`, user);
      }
    }
  }

  return items.map(item => {
    const resolvedMentions = [];
    const localMentionRegex = /[@#]([\p{L}\w]+#\d{4})/gu;
    let match;
    const uniqueMatchesInItem = new Set();
    if (item.content) {
      while ((match = localMentionRegex.exec(item.content)) !== null) {
        uniqueMatchesInItem.add(match[0]);
      }
    }

    for (const fullMatch of uniqueMatchesInItem) {
      const mentionedPart = fullMatch.substring(1);
      if (resolvedUsers.has(mentionedPart)) {
        const user = resolvedUsers.get(mentionedPart);
        resolvedMentions.push({
          text: fullMatch,
          userId: user.id,
        });
      }
    }
    return { ...item, resolvedMentions };
  });
};