import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from 'buffer';
import process from 'process';
import App from "./App";
import { AuthProvider } from './context/AuthContext';
import "./custom.css";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.min.js";
// import '@fortawesome/fontawesome-free/css/all.min.css';  // Import Font Awesome styles
// import 'bootstrap-icons/font/bootstrap-icons.css';  // Import Bootstrap Icons styles

// Import custom CSS files  

window.process = process;
window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
