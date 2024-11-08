import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";

// General Pages


import Home from "./pages/Home";
import ErrorPage from "./pages/ErrorPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import VerifyYourEmail from "./pages/VerifyYourEmail";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";


// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentModeration from "./pages/admin/ContentModeration";
import LawyerVerification from "./pages/admin/LawyerVerification";
import Platform from "./pages/admin/Platform";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import UserManagement from "./pages/admin/UserManagement";


// Client pages
import ClientDashboard from "./pages/client/ClientDashboard";
import IPC from "./pages/client/IPC";
import LawyerSearch from "./pages/client/LawyerSearch";
import Profile from "./pages/client/Profile";
import ClientCaseManagement from "./pages/client/ClientCaseManagement";


// Lawyer pages
import LawyerDashboard from "./pages/lawyer/LawyerDashboard";
import LawyerRegistration from "./pages/lawyer/LawyerRegistration";
import LawyerCaseManagement from "./pages/lawyer/LawyerCaseManagement";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Helmet>
          <title>Lex Net</title>
          <meta
            name="description"
            content="Lex Net | Legal Consulting | Services"
          />
        </Helmet>

        <Routes>
          {/* General Pages */}
          <Route path="/" element={<Home />} />
         
          <Route path="*" element={<ErrorPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/verifyemail" element={<VerifyYourEmail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/aboutus" element={<AboutUs />} />
          {/* Admin Pages */}
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/contentmoderation" element={<ContentModeration />} />
          <Route path="/lawyerverification" element={<LawyerVerification />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/reportsanalytics" element={<ReportsAnalytics />} />
          <Route path="/usermanagement" element={<UserManagement />} />

          {/* Client Pages */}
          <Route path="/clientdashboard" element={<ClientDashboard />} />
          <Route path="/ipc" element={<IPC />} />
          <Route path="/lawyersearch" element={<LawyerSearch />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/clientcasemanagement" element={<ClientCaseManagement />} />
      
          {/* Lawyer Pages */}
          <Route path="/lawyerdashboard" element={<LawyerDashboard />} />
          <Route path="/lawyerregistration" element={<LawyerRegistration />} />
          <Route path="/lawyercasemanagement"element={<LawyerCaseManagement />}/>
          
          
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
