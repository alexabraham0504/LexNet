const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;

// Import your routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const lawyerRegistrationRoutes = require("./routes/lawyerRegistrationRoutes");
const ipcRoutes = require("./routes/ipc");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.uri, {
    // Make sure to use process.env.uri
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Middleware setup
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static("uploads"));
app.use("/uploads", express.static("./uploads"));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth setup
passport.use(
  new OAuth2Strategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET_ID,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            fullName: profile.name.givenName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            phone: "N/A",
            role: "Client", // Adjust this based on your role logic
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.user.role === "Admin") {
      req.session.user = {
        id: req.user._id,
        role: req.user.role,
      };
      res.redirect("http://localhost:3000/admindashboard");
    } else {
      res
        .status(403)
        .send("Access denied: Only admins can log in with Google.");
    }
  }
);

// Define your API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/lawyers", lawyerRegistrationRoutes);
app.use("/api/ipc", ipcRoutes);

// Example route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
