import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import Navbar from "../../components/navbar/navbar-lawyer";
import Footer from "../../components/footer/footer-lawyer";
import Chat from "../../components/Chat";
import io from "socket.io-client";
import "./Messages.css";
import LawyerIconPanel from '../../components/LawyerIconPanel';

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
          `https://lexnet-backend.onrender.com/api/messages/active-chats/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        // Ensure participants are properly populated
        const chatsWithPopulatedData = response.data.map(chat => ({
          ...chat,
          participants: chat.participants.map(p => 
            typeof p === 'object' ? p : { _id: p, fullName: 'Loading...' }
          )
        }));

        console.log("Fetched chats with populated data:", chatsWithPopulatedData);
        setActiveChats(chatsWithPopulatedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError(error.response?.data?.message || "Failed to load messages");
        setLoading(false);
      }
    };

    let socket;
    if (user?._id) {
      // Initialize socket connection
      socket = io("https://lexnet-backend.onrender.com", {
        auth: {
          token: sessionStorage.getItem("token")
        },
        query: {
          userId: user._id,
          role: 'lawyer' // Add role to identify lawyer connections
        }
      });

      socket.on("connect", () => {
        console.log("Lawyer socket connected:", socket.id);
      });

      socket.on("new_message", (message) => {
        console.log("Lawyer received new message:", message);
        
        setActiveChats(prevChats => {
          const chatExists = prevChats.find(chat => chat.chatRoomId === message.chatRoomId);
          
          if (chatExists) {
            return prevChats.map(chat => 
              chat.chatRoomId === message.chatRoomId 
                ? {
                    ...chat,
                    lastMessage: message,
                    messages: [...(chat.messages || []), message].sort((a, b) => 
                      new Date(a.timestamp) - new Date(b.timestamp)
                    ),
                    unreadCount: selectedChat?.chatRoomId === message.chatRoomId 
                      ? 0 
                      : (chat.unreadCount || 0) + 1
                  }
                : chat
            );
          } else {
            // Add new chat with properly structured data
            return [...prevChats, {
              chatRoomId: message.chatRoomId,
              participants: [
                typeof message.senderId === 'object' ? message.senderId : { _id: message.senderId },
                typeof message.receiverId === 'object' ? message.receiverId : { _id: message.receiverId }
              ],
              messages: [message],
              lastMessage: message,
              unreadCount: 1
            }];
          }
        });

        // If this chat is currently selected, mark messages as read
        if (selectedChat?.chatRoomId === message.chatRoomId) {
          markMessagesAsRead(message.chatRoomId);
        }
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    }

    // Fetch initial chats
    fetchActiveChats();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, selectedChat]);

  const handleChatSelect = async (chat) => {
    console.log("Selected chat:", chat);
    const otherParticipant = chat.participants.find(p => p._id !== user._id);
    
    setSelectedChat({
      ...chat,
      participants: chat.participants,
      receiverId: otherParticipant?._id,
      receiverName: otherParticipant?.fullName
    });

    if (chat.unreadCount > 0) {
      try {
        await axios.put(
          `https://lexnet-backend.onrender.com/api/messages/read/${chat.chatRoomId}`,
          { userId: user._id },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        setActiveChats(prevChats =>
          prevChats.map(c =>
            c.chatRoomId === chat.chatRoomId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  // Add this function to mark messages as read
  const markMessagesAsRead = async (chatRoomId) => {
    try {
      await axios.post(
        `https://lexnet-backend.onrender.com/api/messages/read/${chatRoomId}`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  if (loading) return <div className="loading">Loading messages...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="messages-page">
      <Navbar />
      <LawyerIconPanel />
      <div className="messages-container">
        <div className="chat-list">
          {activeChats.length === 0 ? (
            <div className="no-messages">No messages yet</div>
          ) : (
            activeChats.map((chat) => {
              const otherParticipant = chat.participants.find(
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
                    {chat.lastMessage?.content || "No messages yet"}
                  </div>
                  <div className="timestamp">
                    {chat.lastMessage?.timestamp
                      ? new Date(chat.lastMessage.timestamp).toLocaleString()
                      : ""}
                  </div>
                </div>
              );
            })
          )}
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

      <style jsx="true">{`
        .messages-container {
          margin-left: 60px;
          min-height: calc(100vh - 60px);
          padding: 20px;
        }

        @media (max-width: 768px) {
          .messages-container {
            margin-left: 50px;
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Messages;
