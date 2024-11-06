import React, { useEffect, useState } from "react";

const ContentModeration = () => {
  const [feedback, setFeedback] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/feedback");
        const data = await response.json();
        setFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/feedback/${id}/resolve`, {
        method: "PUT",
      });
      setFeedback(
        feedback.map((item) =>
          item.id === id ? { ...item, flagged: false } : item
        )
      );
    } catch (error) {
      console.error("Error resolving feedback:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/feedback/${id}`, {
        method: "DELETE",
      });
      setFeedback(feedback.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const filteredFeedback = feedback.filter(
    (item) =>
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="content-moderation">
      <h1>Content Moderation</h1>
      <input
        type="text"
        placeholder="Search Feedback..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table className="feedback-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Feedback</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFeedback.map((item) => (
            <tr key={item.id}>
              <td>{item.user}</td>
              <td>{item.content}</td>
              <td>{item.flagged ? "Flagged" : "Resolved"}</td>
              <td>
                {item.flagged && (
                  <>
                    <button onClick={() => handleResolve(item.id)}>
                      Resolve
                    </button>
                    <button onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContentModeration;
