import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  appendUniqueMessage,
  formatChatTimestamp,
  getDisplayName,
} from "../utils/chat";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [participantName, setParticipantName] = useState("Conversation");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let isMounted = true;
    let channel;

    const setupChat = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        if (isMounted) {
          setError(authError.message);
          setLoading(false);
        }
        return;
      }

      if (!user) return navigate("/login");

      if (isMounted) {
        setUserId(user.id);
      }

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId);

      const otherParticipant = (participants || []).find(
        (participant) => participant.user_id !== user.id,
      );

      if (otherParticipant) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name,name,username,email")
          .eq("id", otherParticipant.user_id)
          .maybeSingle();

        if (isMounted) {
          setParticipantName(getDisplayName(profile, otherParticipant.user_id));
        }
      }

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        if (isMounted) {
          setError(fetchError.message);
          setMessages([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setMessages(data || []);
        setLoading(false);
      }

      window.setTimeout(scrollToBottom, 0);

      channel = supabase
        .channel(`chat_${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (!isMounted) return;
            setMessages((prev) => appendUniqueMessage(prev, payload.new));
            window.setTimeout(scrollToBottom, 0);
          },
        )
        .subscribe();
    };

    setupChat();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    setError("");

    const trimmedMessage = newMessage.trim();

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          content: trimmedMessage,
        },
      ])
      .select("*")
      .single();

    if (error) {
      setError(error.message);
    } else {
      setMessages((prev) => appendUniqueMessage(prev, data));
      setNewMessage("");
      window.setTimeout(scrollToBottom, 0);
    }

    setSending(false);
  };

  return (
    <div className="screen-shell">
      <section className="chat-panel">
        <header className="screen-header chat-header">
          <div className="chat-header-main">
            <button className="ghost-button" onClick={() => navigate("/chats")}>
              Back
            </button>
            <div>
              <p className="eyebrow">Conversation</p>
              <h2>{participantName}</h2>
            </div>
          </div>
          <span className="conversation-chip">{conversationId?.slice(0, 8)}</span>
        </header>

        {error && <p className="status-banner error">{error}</p>}

        <div className="messages-area">
          {loading && <p className="empty-state">Loading messages...</p>}

          {!loading && messages.length === 0 && (
            <p className="empty-state">
              No messages yet. Start the conversation below.
            </p>
          )}

          {messages.map((message) => {
            const isMe = message.sender_id === userId;

            return (
              <article
                key={message.id}
                className={isMe ? "message-bubble mine" : "message-bubble"}
              >
                <p>{message.content}</p>
                <span>{formatChatTimestamp(message.created_at)}</span>
              </article>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!userId || sending}
          />
          <button className="primary-button" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
