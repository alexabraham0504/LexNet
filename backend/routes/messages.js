const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { isAuthenticated } = require("../middleware/auth");
const mongoose = require("mongoose");

// Get chat history
router.get("/:chatRoomId", isAuthenticated, async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    console.log("Fetching messages for chatRoom:", chatRoomId);
    console.log("Authenticated user:", req.user._id);

    const messages = await Message.find({
      chatRoomId,
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ],
    })
      .sort({ timestamp: 1 })
      .populate("senderId", "fullName role")
      .populate("receiverId", "fullName role");

    console.log(`Found ${messages.length} messages for chatRoom:`, chatRoomId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      message: "Error fetching messages",
      error: error.message,
    });
  }
});

// Send a message
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { senderId, receiverId, content, chatRoomId } = req.body;

    // Validate required fields
    if (!senderId || !receiverId || !content || !chatRoomId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create the message
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content,
      chatRoomId,
      timestamp: new Date(),
      isRead: false,
    });

    await message.save();

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "fullName email role")
      .populate("receiverId", "fullName email role");

    // Get the Socket.IO instance
    const io = req.app.get("io");

    // Emit only to the receiver's room to prevent duplicate messages
    io.to(receiverId).emit("new_message", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Error creating message" });
  }
});

// Mark messages as read
router.put("/read/:chatRoomId", async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.updateMany(
      {
        chatRoomId: req.params.chatRoomId,
        receiverId: userId,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Error marking messages as read" });
  }
});

// Get active chats for a lawyer
router.get("/active-chats/:userId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching chats for lawyer:", userId);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // First, let's fix any messages with null receiverId
    const messagesWithNullReceiver = await Message.find({
      receiverId: null,
      chatRoomId: { $regex: userId }, // Find messages where chatRoomId contains the lawyer's ID
    });

    // Fix those messages
    for (const message of messagesWithNullReceiver) {
      const [, senderId, receiverId] = message.chatRoomId.split("_");
      if (receiverId === userId) {
        await Message.findByIdAndUpdate(message._id, {
          receiverId: userObjectId,
        });
      }
    }

    // Now find all messages where this user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
    })
      .sort({ timestamp: -1 })
      .populate("senderId", "fullName email role")
      .populate("receiverId", "fullName email role")
      .lean();

    console.log(`Found ${messages.length} messages for lawyer:`, userId);

    // Group messages by chat room
    const chatRooms = {};
    messages.forEach((message) => {
      const chatRoomId = message.chatRoomId;

      // Determine who the other participant is
      const otherParticipant =
        message.senderId._id.toString() === userId
          ? message.receiverId
          : message.senderId;

      if (!chatRooms[chatRoomId]) {
        chatRooms[chatRoomId] = {
          chatRoomId,
          lastMessage: message,
          participants: [message.senderId, message.receiverId],
          otherParticipant,
          messages: [message],
          unreadCount:
            message.receiverId._id.toString() === userId && !message.isRead
              ? 1
              : 0,
        };
      } else {
        chatRooms[chatRoomId].messages.push(message);
        if (message.receiverId._id.toString() === userId && !message.isRead) {
          chatRooms[chatRoomId].unreadCount++;
        }
        if (
          new Date(message.timestamp) >
          new Date(chatRooms[chatRoomId].lastMessage.timestamp)
        ) {
          chatRooms[chatRoomId].lastMessage = message;
        }
      }
    });

    const chats = Object.values(chatRooms).map((chat) => ({
      ...chat,
      messageCount: chat.messages.length,
      lastMessageTime: chat.lastMessage.timestamp,
      otherParticipantName: chat.otherParticipant.fullName,
    }));

    console.log("Processed chats:", {
      totalChats: chats.length,
      chats: chats.map((chat) => ({
        chatRoomId: chat.chatRoomId,
        otherParticipant: chat.otherParticipantName,
        messageCount: chat.messageCount,
        unreadCount: chat.unreadCount,
      })),
    });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching active chats:", error);
    res.status(500).json({
      message: "Error fetching active chats",
      error: error.message,
    });
  }
});

// Debug route to check messages for a specific user
router.get("/debug/:userId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Debug: Checking messages for userId:", userId);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find messages specifically for this user
    const userMessages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
    })
      .populate("senderId", "fullName email role")
      .populate("receiverId", "fullName email role")
      .sort({ timestamp: -1 });

    console.log("Debug: Found messages:", {
      count: userMessages.length,
      messages: userMessages.map((m) => ({
        id: m._id,
        from: m.senderId.fullName,
        to: m.receiverId?.fullName || "Unknown",
        content: m.content,
        timestamp: m.timestamp,
      })),
    });

    res.json({
      userMessages,
      searchedUserId: userId,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test route to verify message creation
router.post("/test-message", isAuthenticated, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    console.log("Creating test message:", { senderId, receiverId });

    const message = new Message({
      senderId,
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content: "Test message",
      chatRoomId: `chat_${senderId}_${receiverId}`,
      timestamp: new Date(),
      isRead: false,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "fullName email role")
      .populate("receiverId", "fullName email role");

    console.log("Test message created:", populatedMessage);
    res.json(populatedMessage);
  } catch (error) {
    console.error("Error creating test message:", error);
    res.status(500).json({ message: "Error creating test message" });
  }
});

// Fix existing messages
router.post("/fix-messages", isAuthenticated, async (req, res) => {
  try {
    // Find all messages with null receiverId
    const messages = await Message.find({ receiverId: null });
    console.log("Found messages to fix:", messages.length);

    for (const message of messages) {
      // Extract receiverId from chatRoomId
      const [, senderId, receiverId] = message.chatRoomId.split("_");

      // Update the message
      await Message.findByIdAndUpdate(message._id, {
        receiverId: new mongoose.Types.ObjectId(receiverId),
      });
    }

    res.json({ message: `Fixed ${messages.length} messages` });
  } catch (error) {
    console.error("Error fixing messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all messages for a user
router.get("/all/:userId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
    })
      .sort({ timestamp: -1 })
      .populate("senderId", "fullName email role")
      .populate("receiverId", "fullName email role")
      .lean();

    console.log(`Found ${messages.length} messages for user:`, userId);

    // Add some useful fields
    const enhancedMessages = messages.map((message) => ({
      ...message,
      isSender: message.senderId._id.toString() === userId,
      otherParticipant:
        message.senderId._id.toString() === userId
          ? message.receiverId
          : message.senderId,
    }));

    res.json(enhancedMessages);
  } catch (error) {
    console.error("Error fetching all messages:", error);
    res.status(500).json({
      message: "Error fetching messages",
      error: error.message,
    });
  }
});

// Get messages where user is the receiver (lawyer)
router.get("/received/:userId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching received messages for lawyer:", userId);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find all messages where this lawyer is the receiver
    const messages = await Message.find({
      receiverId: userObjectId,
    })
      .sort({ timestamp: -1 })
      .populate("senderId", "fullName email role")
      .populate({
        path: "receiverId",
        model: "Lawyer",
        select: "fullName email specialization",
      })
      .lean();

    console.log("Found messages:", messages);

    // Add some useful fields
    const enhancedMessages = messages.map((message) => ({
      ...message,
      senderName: message.senderId.fullName,
      receiverName: message.receiverId.fullName,
    }));

    res.json(enhancedMessages);
  } catch (error) {
    console.error("Error fetching received messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Add this new route to clear chat messages
router.delete("/clear-chat/:chatRoomId", isAuthenticated, async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const userId = req.user._id;

    // Delete all messages in the chat room
    await Message.deleteMany({
      chatRoomId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    res.json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.error("Error clearing chat:", error);
    res.status(500).json({ message: "Error clearing chat" });
  }
});

module.exports = router;
