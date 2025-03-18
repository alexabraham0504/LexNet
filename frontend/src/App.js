import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from './components/ProtectedRoute';
import FindLawyers from './pages/client/FindLawyers';
import IPCSectionDetails from './pages/client/IPCSectionDetails';
import VideoCall from './pages/client/VideoCall';

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
import LawyerAppointment from "./pages/client/LawyerAppointment";
import CaseDetails from "./pages/client/CaseDetails";
import DeletedCases from './pages/client/DeletedCases';
import LawyerProfile from './pages/client/LawyerProfile';
import PaymentReceiptsList from "./pages/client/PaymentReceiptsList";
import PaymentReceipt from "./pages/client/PaymentReceipt";
import ReviewForm from "./pages/client/ReviewForm";
import ReviewLawyersList from "./pages/client/ReviewLawyersList";
import SendCaseDetails from './pages/client/SendCaseDetails';
// Lawyer pages
import LawyerDashboard from "./pages/lawyer/LawyerDashboard";
import LawyerRegistration from "./pages/lawyer/LawyerRegistration";
import LawyerAvailability from "./pages/lawyer/LawyerAvailability";
import Messages from "./pages/lawyer/Messages";
import IPCSection from "./pages/lawyer/IPCSection";
import LawyerCaseDetails from "./pages/lawyer/LawyerCaseDetails";
import CaseHub from './pages/lawyer/CaseHub';

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="/verifyemail" element={<VerifyYourEmail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />

          {/* Admin Pages */}
          <Route path="/admindashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/contentmoderation" element={<ContentModeration />} />
          <Route path="/lawyerverification" element={<LawyerVerification />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/reportsanalytics" element={<ReportsAnalytics />} />
          <Route path="/usermanagement" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />

          {/* Client Pages */}
          <Route path="/clientdashboard" element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ipc" element={<IPC />} />
          <Route path="/client/lawyer-search" element={<LawyerSearch />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/lawyer-appointment/:lawyerId"
            element={<LawyerAppointment />}
          />
          <Route path="/case-details/:caseId" element={<CaseDetails />} />
          <Route path="/deleted-cases" element={<DeletedCases />} />
          <Route path="/find-lawyers/:ipcSection" element={<FindLawyers />} />
          <Route path="/client/find-lawyers" element={<FindLawyers />} />
          <Route path="/ipc-section/:sectionNumber" element={<IPCSectionDetails />} />
          <Route path="/client/lawyer-profile/:lawyerId" element={<LawyerProfile />} />
          <Route path="/video-call/:roomId" element={<VideoCall />} />
          <Route path="/client/payment-receipts" element={<PaymentReceiptsList />} />
          <Route path="/client/payment-receipt/:receiptId" element={<PaymentReceipt />} />
          <Route path="/client/review/:lawyerId" element={<ReviewForm />} />
          <Route path="/client/review-lawyers" element={<ReviewLawyersList />} />
          <Route path="/client/send-case-details" element={
            <ProtectedRoute>
              <SendCaseDetails />
            </ProtectedRoute>
          } />
          
          {/* Lawyer Pages */}
          <Route path="/lawyerdashboard" element={
            <ProtectedRoute>
              <LawyerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/lawyerregistration" element={<LawyerRegistration />} />
          <Route path="/lawyeravailability" element={<LawyerAvailability />} />
          <Route path="/message" element={<Messages />} />
          <Route path="/ipc-sections" element={<IPCSection />} />
          <Route path="/lawyer/case/:caseId" element={
            <ProtectedRoute>
              <LawyerCaseDetails />
            </ProtectedRoute>
          } />
          <Route path="/lawyer/casehub" element={<CaseHub />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
