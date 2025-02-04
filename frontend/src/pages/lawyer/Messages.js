import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import Chat from "../../components/Chat";
import io from "socket.io-client";
import "./Messages.css";

const Messages = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchActiveChats = async () => {
      try {
        const userId = user?._id || sessionStorage.getItem("userid");

        if (!userId) {
          console.error("No user ID found");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        console.log("Fetching chats for lawyer:", userId);

        const response = await axios.get(
          `http://localhost:5000/api/messages/active-chats/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        console.log("Fetched chats:", response.data);
        setActiveChats(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError(error.response?.data?.message || "Failed to load messages");
        setLoading(false);
      }
    };

    fetchActiveChats();

    // Set up real-time updates using WebSocket with error handling
    let socket;
    try {
      socket = io("http://localhost:5000", {
        auth: {
          token: sessionStorage.getItem("token"),
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError(
          "Failed to connect to chat server. Please try refreshing the page."
        );
      });

      socket.on("new_message", (message) => {
        console.log("Received new message:", message);
        setActiveChats((prevChats) => {
          const updatedChats = [...prevChats];
          const chatIndex = updatedChats.findIndex(
            (chat) => chat.chatRoomId === message.chatRoomId
          );

          if (chatIndex !== -1) {
            // Update existing chat
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: message,
              unreadCount:
                selectedChat?.chatRoomId === message.chatRoomId
                  ? 0
                  : (updatedChats[chatIndex].unreadCount || 0) + 1,
            };
          } else {
            // Add new chat
            updatedChats.push({
              chatRoomId: message.chatRoomId,
              lastMessage: message,
              participants: [message.senderId, message.receiverId],
              unreadCount: 1,
            });
          }

          return updatedChats;
        });
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          // the disconnection was initiated by the server, reconnect manually
          socket.connect();
        }
      });
    } catch (error) {
      console.error("Socket initialization error:", error);
      setError("Failed to initialize chat connection");
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, selectedChat]);

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);

    // Mark messages as read when chat is selected
    if (chat.unreadCount > 0) {
      try {
        await axios.put(
          `http://localhost:5000/api/messages/read/${chat.chatRoomId}`,
          { userId: user._id },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        // Update unread count locally
        setActiveChats((prevChats) =>
          prevChats.map((c) =>
            c.chatRoomId === chat.chatRoomId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  if (loading) return <div className="loading">Loading messages...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="messages-page">
      <Navbar />
      <div className="messages-container">
        <div className="chat-list">
          <h2>Messages</h2>
          {activeChats.map((chat) => {
            const otherParticipant = chat.participants?.find(
              (p) => p._id !== user._id
            );

            return (
              <div
                key={chat.chatRoomId}
                className={`chat-item ${
                  selectedChat?.chatRoomId === chat.chatRoomId ? "active" : ""
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="chat-item-header">
                  <span className="participant-name">
                    {otherParticipant?.fullName || "Unknown User"}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
                <div className="last-message">
                  {chat.lastMessage?.content?.substring(0, 50)}
                  {chat.lastMessage?.content?.length > 50 ? "..." : ""}
                </div>
                <div className="timestamp">
                  {chat.lastMessage?.timestamp
                    ? new Date(chat.lastMessage.timestamp).toLocaleString()
                    : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-window">
          {selectedChat ? (
            <Chat
              chatRoomId={selectedChat.chatRoomId}
              receiverId={
                selectedChat.participants.find((p) => p._id !== user._id)?._id
              }
              receiverName={
                selectedChat.participants.find((p) => p._id !== user._id)
                  ?.fullName
              }
            />
          ) : (
            <div className="no-chat-selected">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
