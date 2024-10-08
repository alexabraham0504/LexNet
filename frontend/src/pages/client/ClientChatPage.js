import React, { useState } from "react";

const ClientChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [file, setFile] = useState(null);

  const handleSendMessage = () => {
    if (currentMessage.trim() || file) {
      const newMessage = {
        text: currentMessage,
        file: file,
        sender: "client",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setCurrentMessage("");
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div style={styles.messagingContainer}>
      <h2 style={styles.header}>Messaging with {selectedLawyer || "Select a Lawyer"}</h2>
      <div style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: message.sender === "client" ? "flex-end" : "flex-start",
            }}
          >
            <p style={styles.messageText}>{message.text}</p>
            {message.file && (
              <a href={URL.createObjectURL(message.file)} download style={styles.fileLink}>
                {message.file.name}
              </a>
            )}
            <span style={styles.timestamp}>{message.timestamp}</span>
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="file"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.messageInput}
        />
        <button onClick={handleSendMessage} style={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
};

// Styles
const styles = {
  messagingContainer: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
    display: "flex",
    flexDirection: "column",
    height: "600px",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    marginBottom: "20px",
    color: "#2d6da5",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#fff",
    marginBottom: "10px",
  },
  message: {
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    maxWidth: "70%",
  },
  messageText: {
    margin: "0",
  },
  timestamp: {
    fontSize: "10px",
    color: "#999",
    marginTop: "5px",
  },
  fileLink: {
    marginTop: "5px",
    color: "#2d6da5",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
  },
  fileInput: {
    marginRight: "10px",
  },
  messageInput: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginRight: "10px",
  },
  sendButton: {
    padding: "10px 20px",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ClientChatPage;
