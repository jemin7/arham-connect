import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!user) return navigate("/login");

      const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
        setConversations([]);
      } else {
        setConversations(data || []);
      }

      setLoading(false);
    };

    fetchConversations();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Your Chats</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "5px 10px",
            background: "#ff4d4d",
            color: "white",
            border: "none",
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <p style={{ color: "#b00020", marginBottom: "12px" }}>{error}</p>
      )}

      {loading && <p>Loading conversations...</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {!loading &&
          conversations.map((chat) => (
          <li
            key={chat.conversation_id}
            onClick={() => navigate(`/chat/${chat.conversation_id}`)}
            style={{
              padding: "15px",
              borderBottom: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            <strong>Conversation {chat.conversation_id.slice(0, 4)}...</strong>
            <p
              style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.9em" }}
            >
              Tap to view messages
            </p>
          </li>
          ))}
        {!loading && conversations.length === 0 && <p>No conversations found.</p>}
      </ul>
    </div>
  );
}
