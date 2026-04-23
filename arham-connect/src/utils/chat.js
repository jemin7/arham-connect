export function shortId(value) {
  if (!value) return "Unknown user";
  return `${value.slice(0, 8)}...`;
}

export function getDisplayName(profile, fallbackId) {
  return (
    profile?.full_name ||
    profile?.name ||
    profile?.username ||
    profile?.email ||
    shortId(fallbackId)
  );
}

export function formatChatTimestamp(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

export function appendUniqueMessage(messages, incomingMessage) {
  if (!incomingMessage) return messages;

  const hasMessage = messages.some((message) => message.id === incomingMessage.id);
  if (hasMessage) return messages;

  return [...messages, incomingMessage].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );
}
