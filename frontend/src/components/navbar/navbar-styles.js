// Common navbar styles
export const navbarStyles = `
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    font-weight: 500;
    width: 100%;
    background-color: rgba(2, 24, 43, 0.95);
  }

  .nav.scrolled {
    background-color: rgba(2, 24, 43, 0.95) !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    transform: translateY(0);
  }

  .nav.hidden {
    transform: translateY(-100%);
  }

  .nav .logo-image {
    max-width: 70px;
    transition: all 0.3s ease;
  }

  .nav.scrolled .logo-image {
    max-width: 60px;
  }

  .nav .slide-in {
    padding-top: 0;
    animation: slide-in 0.8s ease-out;
  }

  @keyframes slide-in {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .navbar-nav .nav-item .nav-link {
    color: white;
    transition: all 0.3s ease;
  }

  .navbar-nav .nav-item .nav-link:hover {
    color: #c2b697;
  }

  /* Add padding to the main content to prevent it from hiding behind the fixed navbar */
  body {
    padding-top: 80px;
  }

  /* Update body padding for login/register pages */
  body.auth-page {
    padding-top: 0;
  }
`; 