import React, { useState } from "react";

const BillingPayment = () => {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    clientName: "",
    amount: "",
    date: "",
    status: "Pending",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setInvoices((prev) => [
      ...prev,
      { ...form, id: Date.now() },
    ]);
    setForm({ clientName: "", amount: "", date: "", status: "Pending" });
    alert("Invoice generated successfully!");
  };

  const handleDelete = (id) => {
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
    alert("Invoice deleted successfully!");
  };

  return (
    <div style={styles.billingPaymentPage}>
      <div style={styles.billingContainer}>
        <h2 style={styles.billingTitle}>Billing & Payment</h2>

        {/* Invoice Form */}
        <form onSubmit={handleSubmit} style={styles.billingForm}>
          <div style={styles.formGroup}>
            <label htmlFor="clientName">Client Name:</label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              style={styles.formInput}
            />
          </div>

          <button type="submit" style={styles.btnGenerate}>
            Generate Invoice
          </button>
        </form>

        {/* Invoice List */}
        <div style={styles.invoiceList}>
          <h3 style={styles.invoiceListTitle}>Invoice History</h3>
          {invoices.length === 0 ? (
            <p>No invoices generated.</p>
          ) : (
            <ul style={styles.invoiceItems}>
              {invoices.map((invoice) => (
                <li key={invoice.id} style={styles.invoiceItem}>
                  <div>
                    <strong>Client:</strong> {invoice.clientName} - <strong>Amount:</strong> ${invoice.amount} - <strong>Date:</strong> {invoice.date} - <strong>Status:</strong> {invoice.status}
                  </div>
                  <button
                    style={styles.btnDelete}
                    onClick={() => handleDelete(invoice.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  billingPaymentPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // backgroundImage: "url('/assets/billing-bg.jpg')", // Update with your background image
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  billingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    maxWidth: "600px",
    width: "100%",
  },
  billingTitle: {
    textAlign: "center",
    color: "#2d6da5",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  billingForm: {
    marginBottom: "2rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formInput: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #c2b697",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "#f9f9f9",
  },
  btnGenerate: {
    display: "block",
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#2d6da5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  invoiceList: {
    marginTop: "2rem",
  },
  invoiceListTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  invoiceItems: {
    listStyle: "none",
    padding: 0,
  },
  invoiceItem: {
    padding: "1rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnDelete: {
    backgroundColor: "#d9534f",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default BillingPayment;
