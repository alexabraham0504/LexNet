const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); 
const cors = require("cors"); // Import cors
// const User = require("./models/User");
const authRoutes = require("./routes/auth");
const User = require('./models/User'); // Adjust the path based on your folder structure


const app = express();
const PORT = process.env.PORT || 5000;
const passport = require('passport');
const session = require('express-session');

const OAuth2Strategy = require("passport-google-oauth2").Strategy;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.uri)
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Middleware
app.use(cors({
  origin: ["http://localhost:3000"], // Add the frontend URL (where the request is coming from)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true // Allows cookies to be sent with the request if needed
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID: process.env.Client_id,
        clientSecret: process.env.Client_secret_id,
        callbackURL:"/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        try {
            let user = await User.findOne({googleId:profile.id});

            if (!user) {
              user = new User({
                googleId: profile.id,
                firstName: profile.name.givenName,   // Assuming Google profile has first name
                lastName: profile.name.familyName,   // Assuming Google profile has last name
                email: profile.emails[0].value,      // Assuming email is available
                profilePicture: profile.photos[0].value,  // If profile picture is available
                phone: 'N/A',  // Default or fetch phone number later if necessary
                role: 'Client',  // Set role (e.g., 'Client' or 'Lawyer')
              });

                await user.save();
            }

            return done(null,user)
        } catch (error) {
            return done(error,null)
        }
    }
    )
)

passport.serializeUser((user,done)=>{
    done(null,user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);  // Find the user by ID from the session
      done(null, user);  // Pass the user object to the next middleware
    } catch (error) {
      done(error, null);  // Handle errors
    }
  });

// initial google ouath login
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  prompt: "select_account"  // Forces Google to show the account selection page
}));
app.get("/auth/google/callback", 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    (req, res) => {
      try {
          // Check if the authenticated user has the 'User' role
          if (req.user.role === 'Admin') {
              req.session.user = {
                  id: req.user._id,
                  role: req.user.role
                  
              };
              res.redirect('http://localhost:3000/admindashboard'); // Redirect to user interface
          } else {
              // If the user is not a 'User', redirect to a different page or show an error
              res.status(403).send('Access denied: Only users can log in with Google.');
          }
      } catch (error) {
          console.error('Error in Google callback:', error);
          res.status(500).send('Internal Server Error');
      }
  });
//   app.get('/login/success', (req, res) => {
//     if (req.isAuthenticated() && req.user) {
//         return res.status(200).json({ user: req.user });
//     } else {
//         return res.status(404).json({ message: 'User not found' });
//     }
// });

app.use(express.json());

// Use auth routes at /api/auth
app.use('/api/auth', authRoutes);

// Example route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
