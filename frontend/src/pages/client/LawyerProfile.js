import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Messaging Component
const Messaging = ({ lawyerId, clientId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Fetch messages between client and lawyer
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${lawyerId}/${clientId}`);
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [lawyerId, clientId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      senderId: clientId,
      receiverId: lawyerId,
      text: newMessage,
    };

    try {
      const res = await axios.post(`/api/messages`, messageData);
      setMessages([...messages, res.data]);
      setNewMessage(''); // Clear input field
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={styles.messagingContainer}>
      <div style={styles.messageBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={
              msg.senderId === clientId ? styles.messageClient : styles.messageLawyer
            }
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div style={styles.sendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
};

// Appointment Scheduling Component
const Appointment = ({ lawyerId, clientId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  useEffect(() => {
    // Fetch available slots for the selected lawyer
    const fetchAvailableSlots = async () => {
      try {
        const res = await axios.get(`/api/appointments/availability/${lawyerId}`);
        setAvailableSlots(res.data);
      } catch (error) {
        console.error('Error fetching available slots:', error);
      }
    };
    fetchAvailableSlots();
  }, [lawyerId]);

  const handleScheduleAppointment = async () => {
    if (!selectedDate || !selectedSlot) return;

    const appointmentData = {
      lawyerId,
      clientId,
      date: selectedDate,
      timeSlot: selectedSlot,
    };

    try {
      await axios.post(`/api/appointments/schedule`, appointmentData);
      alert('Appointment scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
  };

  return (
    <div style={styles.appointmentContainer}>
      <h3 style={styles.title}>Schedule Appointment</h3>
      <label style={styles.label}>Select Date</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>Select Time Slot</label>
      <select
        value={selectedSlot}
        onChange={(e) => setSelectedSlot(e.target.value)}
        style={styles.input}
      >
        <option value="">Select a time slot</option>
        {availableSlots.map((slot, index) => (
          <option key={index} value={slot}>
            {slot}
          </option>
        ))}
      </select>

      <button onClick={handleScheduleAppointment} style={styles.button}>
        Confirm Appointment
      </button>
    </div>
  );
};

// Combined Messaging and Appointment Component
const LawyerProfile = ({ lawyerId, clientId }) => {
  return (
    <div style={styles.lawyerInteractionContainer}>
      <Messaging lawyerId={lawyerId} clientId={clientId} />
      <Appointment lawyerId={lawyerId} clientId={clientId} />
    </div>
  );
};

// CSS-in-JS Styling
const styles = {
  messagingContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '400px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  messageBox: {
    height: '300px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  messageClient: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px',
    borderRadius: '12px',
    marginBottom: '10px',
    alignSelf: 'flex-end',
  },
  messageLawyer: {
    backgroundColor: '#f1f1f1',
    padding: '8px',
    borderRadius: '12px',
    marginBottom: '10px',
    alignSelf: 'flex-start',
  },
  sendMessage: {
    display: 'flex',
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    marginLeft: '10px',
    cursor: 'pointer',
  },
  appointmentContainer: {
    width: '300px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '16px',
  },
  title: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
  },
  lawyerInteractionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
  },
};

export default LawyerProfile;
