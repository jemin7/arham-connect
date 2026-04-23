import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
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
            setMessages((prev) => [...prev, payload.new]);
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

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        content: newMessage.trim(),
      },
    ]);

    if (error) {
      setError(error.message);
    } else {
      setNewMessage("");
    }

    setSending(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100svh",
        maxWidth: "600px",
        margin: "0 auto",
        background: "#fff",
      }}
    >
      <header
        style={{
          padding: "15px",
          background: "#eee",
          display: "flex",
          gap: "10px",
        }}
      >
        <button onClick={() => navigate("/chats")}>&larr; Back</button>
        <h3 style={{ margin: 0 }}>Chat</h3>
      </header>

      {error && (
        <p style={{ color: "#b00020", padding: "12px 20px 0" }}>{error}</p>
      )}

      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {loading && <p>Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: "#666" }}>No messages yet. Start the conversation below.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                background: isMe ? "#007bff" : "#e5e5ea",
                color: isMe ? "white" : "black",
                padding: "10px 15px",
                borderRadius: "15px",
                maxWidth: "70%",
              }}
            >
              {msg.content}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "15px",
          display: "flex",
          gap: "10px",
          background: "#eee",
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!userId || sending}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
