import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Chat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";

const Chat = ({ chatRoomId, receiverId, receiverName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // Create axios instance with interceptor
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
  });

  // Add request interceptor to handle token expiration
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (
        error.response?.status === 401 &&
        error.response?.data?.code === "TOKEN_EXPIRED"
      ) {
        // Handle token expiration
        logout();
        navigate("/login");
        return Promise.reject(
          new Error("Session expired. Please login again.")
        );
      }
      return Promise.reject(error);
    }
  );

  // Add request interceptor for token
  api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    if (!chatRoomId) return;

    // Connect to Socket.IO
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: sessionStorage.getItem("token"),
      },
    });
    setSocket(newSocket);

    // Join the chat room
    newSocket.emit("join_room", chatRoomId);

    // Socket event listeners
    newSocket.on("new_message", (message) => {
      console.log("Received new message in Chat:", message);
      // Check if message belongs to this chat room and isn't already in the messages array
      if (message.chatRoomId === chatRoomId) {
        setMessages((prev) => {
          // Check if message already exists
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    // Initial fetch of messages
    fetchMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [chatRoomId]);

  const fetchMessages = async () => {
    if (!chatRoomId) return;

    try {
      console.log("Fetching messages for chatRoom:", chatRoomId);
      const response = await api.get(`/messages/${chatRoomId}`);
      console.log("Fetched messages:", response.data);
      
      // Sort messages by timestamp
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error.message === "Session expired. Please login again.") {
        return;
      }
      // Handle other errors
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatRoomId || !receiverId) return;

    try {
      const messageData = {
        senderId: user._id,
        receiverId: receiverId,
        content: newMessage,
        chatRoomId: chatRoomId,
      };

      const response = await api.post("/messages", messageData);

      // Add message locally first
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      scrollToBottom();

      // Emit the message through socket
      socket?.emit("send_message", {
        ...response.data,
        chatRoomId: chatRoomId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleTyping = () => {
    if (chatRoomId) {
      socket?.emit("typing", { chatRoomId, user: user?.fullName });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/messages/clear-chat/${chatRoomId}`);
      setMessages([]); // Clear messages locally
      alert("Chat cleared successfully");
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Failed to clear chat. Please try again.");
    }
  };

  const handleCloseChat = () => {
    // You can add any cleanup logic here if needed
    navigate(-1); // This will go back to the previous page
  };

  // Return early if no user
  if (!user) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat</h3>
        </div>
        <div className="messages-container">
          <div className="login-message">Please log in to chat</div>
        </div>
      </div>
    );
  }

  // Return message if no chatRoomId
  if (!chatRoomId) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat</h3>
        </div>
        <div className="messages-container">
          <div className="login-message">Invalid chat room</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-content">
          <h3>{receiverName || "Chat"}</h3>
          <div className="chat-header-actions">
            <button 
              className="clear-chat-btn" 
              onClick={handleClearChat}
              title="Clear chat history"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <button 
              className="close-chat-btn" 
              onClick={handleCloseChat}
              title="Close chat"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      </div>

      <div className="messages-container" id="messages-container">
        <div className="messages-list">
          {messages.map((message) => {
            const isSent = message.senderId._id === user._id;
            return (
              <div
                key={message._id}
                className={`message ${isSent ? "sent" : "received"}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
          {typing && <div className="typing-indicator">Typing...</div>}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleTyping}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
