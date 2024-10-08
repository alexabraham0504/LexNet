import React, { useState, useEffect } from "react";

const ClientMessaging = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // Simulate fetching message history from a database or API
    const fetchMessages = () => {
      const messageHistory = [
        { id: 1, text: "Hello, I need assistance with my case.", sender: "Client" },
        { id: 2, text: "Sure! How can I help you?", sender: "Lawyer" },
      ];
      setMessages(messageHistory);
    };

    fetchMessages();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "message") {
      setNewMessage(value);
    } else if (name === "file") {
      setFile(files[0]);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const messageData = {
      id: messages.length + 1,
      text: newMessage,
      sender: "Lawyer",
    };
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage("");
    setFile(null);
    setNotification("New message sent!");
    
    // Clear the notification after a delay
    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  return (
    <div style={styles.messagingPage}>
      <div style={styles.messagingContainer}>
        <h2 style={styles.messagingTitle}>Client Messaging</h2>

        {/* Message Notification */}
        {notification && <div style={styles.notification}>{notification}</div>}

        {/* Message History */}
        <div style={styles.messageHistory}>
          <h3 style={styles.historyTitle}>Message History</h3>
          {messages.length === 0 ? (
            <p>No messages exchanged yet.</p>
          ) : (
            <ul style={styles.messageList}>
              {messages.map((message) => (
                <li key={message.id} style={styles.messageItem}>
                  <strong>{message.sender}:</strong> {message.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSendMessage} style={styles.sendMessageForm}>
          <textarea
            name="message"
            value={newMessage}
            onChange={handleChange}
            placeholder="Type your message..."
            required
            style={styles.messageInput}
          />
          <input
            type="file"
            name="file"
            onChange={handleChange}
            style={styles.fileInput}
          />
          <button type="submit" style={styles.btnSend}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// Styles
const styles = {
  messagingPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/messaging-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  messagingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "700px",
    width: "100%",
  },
  messagingTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
  },
  notification: {
    backgroundColor: "#dff0d8",
    color: "#3c763d",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    textAlign: "center",
  },
  messageHistory: {
    maxHeight: "400px",
    overflowY: "auto",
    marginBottom: "1.5rem",
  },
  historyTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  messageList: {
    listStyle: "none",
    padding: 0,
  },
  messageItem: {
    padding: "0.5rem",
    borderBottom: "1px solid #ccc",
  },
  sendMessageForm: {
    display: "flex",
    flexDirection: "column",
  },
  messageInput: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
    marginBottom: "0.5rem",
    resize: "vertical",
  },
  fileInput: {
    marginBottom: "0.5rem",
  },
  btnSend: {
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    padding: "0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
  },
};

export default ClientMessaging;
