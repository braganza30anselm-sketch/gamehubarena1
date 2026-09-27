const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Bypass localtunnel warning page header
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});

// Direct Configurations
const ADMIN_SECRET_KEY = 'SuperAdminSecret123!';

// Reads MongoDB connection string from Render environment variables, or defaults to Atlas/local
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://braganza76james_db_user:45tmTb0n2yHYiPA8@cluster0.egf9wsf.mongodb.net/?appName=Cluster0';

// Reads dynamic PORT assigned by cloud hosts (like Render), or defaults to 5000
let PORT = process.env.PORT || 5000;

// ----------------------------------------------------
// MONGOOSE SCHEMAS & MODELS
// ----------------------------------------------------
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  userType: { type: String, enum: ['customer', 'admin'], default: 'customer' }
});

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  platform: { type: String, enum: ['PS5', 'PC'], default: 'PS5' },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true }
});

const BookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  gameId: { type: String, required: true },
  gameName: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Debit Card', 'Cash on Store'], required: true },
  bookingDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Game = mongoose.model('Game', GameSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// CUSTOMER REGISTER (Forces userType to 'customer')
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email.' });

    const newUser = new User({ name, email, phone, password, userType: 'customer' });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful!', user: { id: newUser._id, name: newUser.name, email: newUser.email, userType: newUser.userType } });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
});

// ADMIN REGISTER (Requires adminSecret & sets userType to 'admin')
app.post('/api/auth/admin/register', async (req, res) => {
  try {
    const { name, email, phone, password, adminSecret } = req.body;

    // Verify secret key
    if (adminSecret !== ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Access denied: Invalid Admin Secret Key.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'An account already exists with this email.' });

    const newAdmin = new User({
      name,
      email,
      phone,
      password,
      userType: 'admin'
    });

    await newAdmin.save();
    res.status(201).json({ 
      message: 'Admin account created successfully!', 
      user: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, userType: newAdmin.userType } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during admin registration.', error: err.message });
  }
});

// AUTHENTICATION: LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    res.json({ message: 'Login successful!', user: { id: user._id, name: user.name, email: user.email, userType: user.userType } });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
});

// GAMES: GET ALL (Cache-Disabled)
app.get('/api/games', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const games = await Game.find({});
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching games', error: err.message });
  }
});

// GAMES: ADD NEW GAME (ADMIN)
app.post('/api/games', async (req, res) => {
  try {
    const { name, platform, price, description, imageUrl } = req.body;
    
    const newGame = new Game({
      name,
      platform: platform || 'PS5',
      price,
      description,
      imageUrl,
      isAvailable: true
    });

    await newGame.save();
    res.status(201).json({ message: 'Game added successfully!', game: newGame });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add game', error: err.message });
  }
});

// GAMES: DELETE GAME (ADMIN)
app.delete('/api/games/:id', async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting game', error: err.message });
  }
});

// BOOKINGS: CREATE & PAY
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, userName, gameId, paymentMethod } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found.' });

    // Calculate Weekend Discount (20% off on Saturday [6] & Sunday [0])
    const dayOfWeek = new Date().getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const discountRate = isWeekend ? 0.20 : 0;
    
    const originalPrice = game.price;
    const discountApplied = Math.round(originalPrice * discountRate);
    const finalPrice = originalPrice - discountApplied;

    const newBooking = new Booking({
      userId,
      userName,
      gameId: game._id,
      gameName: game.name,
      originalPrice,
      finalPrice,
      discountApplied,
      paymentMethod
    });

    await newBooking.save();
    res.status(201).json({ 
      message: 'Booking & Payment Processed Successfully!', 
      booking: newBooking,
      isWeekendDiscount: isWeekend 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process payment', error: err.message });
  }
});

// PAGE ROUTING
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ----------------------------------------------------
// SERVER STARTUP & MONGODB CONNECTION
// ----------------------------------------------------
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully: GameHubArena');

    const server = app.listen(PORT, () => {
      console.log(`Server live on port ${PORT}`);
      console.log(`🌐 Customer Portal: http://localhost:${PORT}/`);
      console.log(`🛠️ Admin Portal:    http://localhost:${PORT}/admin`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        PORT = Number(PORT) + 1;
        app.listen(PORT, () => {
          console.log(`Server live on port ${PORT}`);
          console.log(`🌐 Customer Portal: http://localhost:${PORT}/`);
          console.log(`🛠️ Admin Portal:    http://localhost:${PORT}/admin`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  })
  .catch(err => console.error('Database connection error:', err));