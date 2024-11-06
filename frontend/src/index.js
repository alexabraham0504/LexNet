import React from "react";
import ReactDOM from "react-dom/client";

import "./custom.css";
import App from "./App";

import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.min.js";
// import '@fortawesome/fontawesome-free/css/all.min.css';  // Import Font Awesome styles
import 'bootstrap-icons/font/bootstrap-icons.css';  // Import Bootstrap Icons styles

// Import custom CSS files  


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
