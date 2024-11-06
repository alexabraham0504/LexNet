import React from "react";
import { useLocation } from 'react-router-dom';
import Footer from "../components/footer/footer-admin";
import NavbarAdmin from '../components/navbar/navbar-admin';
import NavbarClient from '../components/navbar/navbar-client';
import NavbarLawyer from '../components/navbar/navbar-lawyer';
import Navbar from '../components/navbar/home-navbar';

const AboutUs = () => {
  const location = useLocation();
  
  // Modified navbar selection logic
  const getNavbar = () => {
    const path = window.location.pathname;
    if (path.includes('lawyer') || location.state?.from?.includes('lawyer')) {
      return <NavbarLawyer />;
    } else if (path.includes('client') || location.state?.from?.includes('client')) {
      return <NavbarClient />;
    } else if (path.includes('admin') || location.state?.from?.includes('admin')) {
      return <NavbarAdmin />;
    }
    return <Navbar />;
  };

  const aboutUsContent = {
    title: "About Lex Net",
    welcomeMessage: "Revolutionizing Legal Services",
    features: [
      {
        title: "Smart Legal Solutions",
        description: "AI-powered tools for instant legal insights",
        icon: "fas fa-robot",
        color: "#2ecc71",
      },
      {
        title: "Expert Network",
        description: "Connect with verified legal professionals",
        icon: "fas fa-users",
        color: "#3498db",
      },
      {
        title: "Secure Platform",
        description: "End-to-end encrypted communications",
        icon: "fas fa-shield-alt",
        color: "#9b59b6",
      },
      {
        title: "24/7 Support",
        description: "Round-the-clock legal assistance",
        icon: "fas fa-headset",
        color: "#1abc9c",
      },
    ],
    stats: [
      { number: "10K+", label: "Users", icon: "fas fa-users" },
      { number: "5K+", label: "Experts", icon: "fas fa-gavel" },
      { number: "95%", label: "Success", icon: "fas fa-chart-line" },
      { number: "24/7", label: "Support", icon: "fas fa-headset" },
    ],
  };

  const styles = {
    mainContainer: {
      background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    contentContainer: {
      flex: 1,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
    },
    header: {
      textAlign: 'center',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    },
    title: {
      fontSize: '2.5rem',
      background: 'linear-gradient(45deg, #2C3E50, #3498db)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '10px',
    },
    welcomeMessage: {
      fontSize: '1.2rem',
      color: '#34495e',
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      flex: 1,
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    },
    featureCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px',
      borderRadius: '10px',
      background: 'white',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-5px)',
      },
    },
    featureIcon: {
      fontSize: '1.5rem',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      color: 'white',
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '5px',
    },
    featureDescription: {
      fontSize: '0.9rem',
      color: '#666',
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px',
      background: 'white',
      borderRadius: '10px',
    },
    statIcon: {
      fontSize: '1.5rem',
      color: '#3498db',
    },
    statContent: {
      flex: 1,
    },
    statNumber: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#2C3E50',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#666',
    },
  };

  return (
    <div style={styles.mainContainer}>
      {getNavbar()}
      
      <div style={styles.contentContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>{aboutUsContent.title}</h1>
          <h2 style={styles.welcomeMessage}>{aboutUsContent.welcomeMessage}</h2>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.featuresGrid}>
            {aboutUsContent.features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={{
                  ...styles.featureIcon,
                  background: feature.color,
                }}>
                  <i className={feature.icon}></i>
                </div>
                <div style={styles.featureContent}>
                  <h3 style={styles.featureTitle}>{feature.title}</h3>
                  <p style={styles.featureDescription}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.statsContainer}>
            {aboutUsContent.stats.map((stat, index) => (
              <div key={index} style={styles.statItem}>
                <i className={stat.icon} style={styles.statIcon}></i>
                <div style={styles.statContent}>
                  <div style={styles.statNumber}>{stat.number}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
