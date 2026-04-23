import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { formatChatTimestamp, getDisplayName } from "../utils/chat";

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let channel;

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
      if (isMounted) {
        setCurrentUser(user);
      }

      const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (error) {
        if (isMounted) {
          setError(error.message);
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      if (!data?.length) {
        if (isMounted) {
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      const conversationIds = [...new Set(data.map((item) => item.conversation_id))];

      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", conversationIds);

      if (participantsError) {
        if (isMounted) {
          setError(participantsError.message);
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      const otherUserIds = [
        ...new Set(
          (participants || [])
            .filter((participant) => participant.user_id !== user.id)
            .map((participant) => participant.user_id),
        ),
      ];

      let profilesById = {};
      if (otherUserIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,full_name,name,username,email")
          .in("id", otherUserIds);

        profilesById = (profiles || []).reduce((accumulator, profile) => {
          accumulator[profile.id] = profile;
          return accumulator;
        }, {});
      }

      const { data: latestMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id,conversation_id,content,created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) {
        if (isMounted) {
          setError(messagesError.message);
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      const latestMessageByConversation = {};
      (latestMessages || []).forEach((message) => {
        if (!latestMessageByConversation[message.conversation_id]) {
          latestMessageByConversation[message.conversation_id] = message;
        }
      });

      const nextConversations = conversationIds
        .map((conversationId) => {
          const otherParticipant = (participants || []).find(
            (participant) =>
              participant.conversation_id === conversationId &&
              participant.user_id !== user.id,
          );
          const latestMessage = latestMessageByConversation[conversationId];

          return {
            conversationId,
            participantName: getDisplayName(
              profilesById[otherParticipant?.user_id],
              otherParticipant?.user_id,
            ),
            latestMessageText:
              latestMessage?.content || "No messages yet. Start the conversation.",
            latestMessageAt: latestMessage?.created_at || null,
          };
        })
        .sort((left, right) => {
          const leftTime = left.latestMessageAt
            ? new Date(left.latestMessageAt).getTime()
            : 0;
          const rightTime = right.latestMessageAt
            ? new Date(right.latestMessageAt).getTime()
            : 0;

          return rightTime - leftTime;
        });

      if (isMounted) {
        setConversations(nextConversations);
        setLoading(false);
      }
    };

    fetchConversations();

    channel = supabase
      .channel("chat_list_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="screen-shell">
      <section className="screen-panel">
        <header className="screen-header">
          <div>
            <p className="eyebrow">Chat List</p>
            <h2>Your conversations</h2>
            <p className="subtle-text">
              {currentUser?.email || "Signed in user"} can open any thread below.
            </p>
          </div>

          <button className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {error && <p className="status-banner error">{error}</p>}
        {loading && <p className="empty-state">Loading conversations...</p>}

        {!loading && conversations.length > 0 && (
          <div className="chat-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.conversationId}
                type="button"
                className="chat-list-item"
                onClick={() => navigate(`/chat/${conversation.conversationId}`)}
              >
                <div className="chat-list-row">
                  <strong>{conversation.participantName}</strong>
                  <span className="timestamp">
                    {formatChatTimestamp(conversation.latestMessageAt)}
                  </span>
                </div>
                <p>{conversation.latestMessageText}</p>
              </button>
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <p className="empty-state">
            No conversations found. Add rows in `conversation_participants` and
            `messages` to see them here.
          </p>
        )}
      </section>
    </div>
  );
}
