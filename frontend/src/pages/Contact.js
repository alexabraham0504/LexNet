import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../components/footer/footer-admin';
import NavbarAdmin from '../components/navbar/navbar-admin';
import NavbarClient from '../components/navbar/navbar-client';
import NavbarLawyer from '../components/navbar/navbar-lawyer';
import Navbar from '../components/navbar/home-navbar';
// import Header from '../components/header/header-admin';

const Contact = () => {
    const location = useLocation();
    
    // Modified navbar selection logic
    const getNavbar = () => {
        // Check if we came from a specific user type page
        if (location.state?.from === 'lawyer') {
            return <NavbarLawyer />;
        } else if (location.state?.from === 'client') {
            return <NavbarClient />;
        } else if (location.state?.from === 'admin') {
            return <NavbarAdmin />;
        }
        // Default to home navbar if no specific user type
        return <Navbar />; // Import and use the home navbar
    };

    const styles = {
        mainContainer: {
            background: `
                linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4)),
                url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1950&q=80')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            padding: '10px 0',
            position: 'relative',
        },
        container: {
            maxWidth: '900px',
            margin: '20px auto',
            padding: '30px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
        },
        heading: {
            color: '#2C3E50',
            fontSize: '2.2rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #2C3E50, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        infoContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            padding: '20px',
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        },
        infoItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(44, 62, 80, 0.1)',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#ffffff',
            },
        },
        icon: {
            fontSize: '24px',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #2C3E50, #3498db)',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        },
        infoText: {
            flex: 1,
        },
        infoTitle: {
            fontWeight: '600',
            color: '#2C3E50',
            marginBottom: '5px',
            fontSize: '1.1rem',
        },
        infoDetail: {
            color: '#666',
            fontSize: '0.95rem',
            margin: '3px 0',
            lineHeight: '1.4',
        },
        badge: {
            display: 'inline-block',
            padding: '4px 8px',
            backgroundColor: '#e1f5fe',
            color: '#0288d1',
            borderRadius: '4px',
            fontSize: '0.8rem',
            marginLeft: '8px',
        },
    };

    return (
        <div style={styles.mainContainer}>
            {getNavbar()}
            {/* <Header /> */}
            <div style={styles.container}>
                <h1 style={styles.heading}>Contact Us</h1>
                
                <div style={styles.infoContainer}>
                    <div style={styles.infoItem}>
                        <div style={styles.icon}>
                            <i className="fas fa-building"></i>
                        </div>
                        <div style={styles.infoText}>
                            <h3 style={styles.infoTitle}>Our Office</h3>
                            <p style={styles.infoDetail}>Lex Net Inc.</p>
                            <p style={styles.infoDetail}>123 Legal Street, Kanjirapally</p>
                        </div>
                    </div>

                    <div style={styles.infoItem}>
                        <div style={styles.icon}>
                            <i className="fas fa-envelope"></i>
                        </div>
                        <div style={styles.infoText}>
                            <h3 style={styles.infoTitle}>Email Us</h3>
                            <p style={styles.infoDetail}>support@lexnet.com</p>
                            <span style={styles.badge}>24/7 Support</span>
                        </div>
                    </div>

                    <div style={styles.infoItem}>
                        <div style={styles.icon}>
                            <i className="fas fa-phone"></i>
                        </div>
                        <div style={styles.infoText}>
                            <h3 style={styles.infoTitle}>Call Us</h3>
                            <p style={styles.infoDetail}>+91 1234567890</p>
                            <span style={styles.badge}>Toll Free</span>
                        </div>
                    </div>

                    <div style={styles.infoItem}>
                        <div style={styles.icon}>
                            <i className="fas fa-clock"></i>
                        </div>
                        <div style={styles.infoText}>
                            <h3 style={styles.infoTitle}>Business Hours</h3>
                            <p style={styles.infoDetail}>Mon - Fri: 9:00 AM - 5:00 PM</p>
                            <p style={styles.infoDetail}>Weekends: Closed</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
