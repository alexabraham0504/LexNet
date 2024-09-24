import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import Info from "./pages/Info";
import LegalServices from "./pages/LegalServices";
import Insolvency from "./pages/Insolvency";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorPage from "./pages/ErrorPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <div className="App">
      <>
        <BrowserRouter>
          <Helmet>
            <title>
             Lex Net 
            </title>
            <meta
              name="description"
              content="Cabinet de avocatură și insolvență condus de Alina Marin. Consultanță, asistență și reprezentare pentru probleme juridice și de insolvență. Contactați-ne pentru soluții profesioniste."
            />
          </Helmet>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/informatii-utile" element={<Info />} />
            <Route path="/legalservices" element={<LegalServices/>} />
            <Route path="/insolvency" element={<Insolvency />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<ErrorPage />} />
            <Route path="/register" element={<Register/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/forgotpassword" element={<ForgotPassword/>} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </>
    </div>
  );
}

export default App;
