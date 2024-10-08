import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import Info from "./pages/Info";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorPage from "./pages/ErrorPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContentModeration from "./pages/admin/ContentModeration";
import LawyerVerification from "./pages/admin/LawyerVerification";
import Platform from "./pages/admin/Platform";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import UserManagement from "./pages/admin/UserManagement";

// Client pages
import Appoint from "./pages/client/Appoint";
import CaseAnalysis from "./pages/client/CaseAnalysis";
import ClientChatPage from "./pages/client/ClientChatPage";
import ClientDashboard from "./pages/client/ClientDashboard";
import IPC from "./pages/client/IPC";
import LawyerProfile from "./pages/client/LawyerProfile";
import LawyerSearch from "./pages/client/LawyerSearch";
import Profile from "./pages/client/Profile";
import Review from "./pages/client/Review";

// Lawyer pages
import AppointmentScheduling from "./pages/lawyer/AppointmentScheduling";
import BillingPayment from "./pages/lawyer/BillingPayment";
import CaseManagement from "./pages/lawyer/CaseManagement";
import ClientMessaging from "./pages/lawyer/ClientMessaging";
import LawyerDashboard from "./pages/lawyer/LawyerDashboard";
import LegalDocumentAnalysis from "./pages/lawyer/LegalDocumentAnalysis";
import ProfileManagement from "./pages/lawyer/ProfileManagement";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Helmet>
          <title>Lex Net</title>
          <meta name="description" content="Lex Net | Legal Consulting | Services" />
        </Helmet>

        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/info" element={<Info />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<ErrorPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin pages */}
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/contentmoderation" element={<ContentModeration />} />
          <Route path="/lawyerverification" element={<LawyerVerification />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/reportsanalytics" element={<ReportsAnalytics />} />
          <Route path="/usermanagement" element={<UserManagement />} />

          {/* Client pages */}
          <Route path="/appoint" element={<Appoint />} />
          <Route path="/caseanalysis" element={<CaseAnalysis />} />
          <Route path="/clientchatpage" element={<ClientChatPage />} />
          <Route path="/clientdashboard" element={<ClientDashboard />} />
          <Route path="/ipc" element={<IPC />} />
          <Route path="/lawyerprofile" element={<LawyerProfile />} />
          <Route path="/lawyersearch" element={<LawyerSearch />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review" element={<Review />} />

          {/* Lawyer pages */}
          <Route path="/appointmentscheduling" element={<AppointmentScheduling />} />
          <Route path="/billingpayment" element={<BillingPayment />} />
          <Route path="/casemanagement" element={<CaseManagement />} />
          <Route path="/clientmessaging" element={<ClientMessaging />} />
          <Route path="/lawyerdashboard" element={<LawyerDashboard />} />
          <Route path="/legaldocumentanalysis" element={<LegalDocumentAnalysis />} />
          <Route path="/profilemanagement" element={<ProfileManagement />} />
        </Routes>
        
      </BrowserRouter>
    </div>
  );
}

export default App;
