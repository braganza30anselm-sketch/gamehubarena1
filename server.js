const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serve static files from the root directory
// (This allows browser requests to /admin_4.html, /index_3.html, etc. directly)
app.use(express.static(path.join(__dirname)));

// 2. Explicit fallback routes for HTML pages
app.get('/admin_4.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_4.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_4.html'));
});

app.get('/index_3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index_3.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index_3.html'));
});

// ------------------------------------
// In-Memory Storage / API Endpoints
// ------------------------------------
let gamesList = [
  { _id: "ps1", name: "EA SPORTS FC 25", platform: "PS5", price: 250, description: "Experience 4K 120Hz football gaming with dual-sense controllers." },
  { _id: "ps2", name: "God of War Ragnarök", platform: "PS5", price: 300, description: "Epic Norse action adventure on PlayStation 5 OLED setup." },
  { _id: "pc1", name: "Valorant", platform: "PC", price: 150, description: "5v5 tactical shooter on ultra-high refresh rate monitors." },
  { _id: "pc2", name: "Counter-Strike 2", platform: "PC", price: 200, description: "Competitive tactical shooter built on Source 2." },
  { _id: "pc3", name: "Cyberpunk 2077", platform: "PC", price: 250, description: "Night City with full RTX Ray Tracing Overdrive graphics." },
  { _id: "ps3", name: "Grand Theft Auto V", platform: "PS5", price: 250, description: "4K 60FPS with DualSense haptic feedback." }
];

let bookingsList = [];

// API: Get Games
app.get('/api/games', (req, res) => {
  res.json(gamesList);
});

// API: Add New Game
app.post('/api/games', (req, res) => {
  const newGame = {
    _id: req.body._id || "gm_" + Date.now(),
    name: req.body.name,
    platform: req.body.platform,
    price: req.body.price,
    imageUrl: req.body.imageUrl || "",
    description: req.body.description || ""
  };
  gamesList.push(newGame);
  res.status(201).json({ message: "Game added successfully", game: newGame });
});

// API: Delete Game
app.delete('/api/games/:id', (req, res) => {
  const gameId = req.params.id;
  gamesList = gamesList.filter(g => g._id !== gameId);
  res.json({ message: "Game deleted successfully" });
});

// API: Get Bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookingsList);
});

// API: Create Booking
app.post('/api/bookings', (req, res) => {
  const booking = {
    id: "BK_" + Date.now(),
    userName: req.body.userName || "Gamer",
    gameName: req.body.gameName || "Slot Booking",
    paymentMethod: req.body.paymentMethod || "UPI Direct",
    amount: req.body.amount || 0,
    date: new Date().toLocaleString()
  };
  bookingsList.push(booking);
  res.status(201).json({ message: "Booking confirmed", booking });
});

// API: Delete/Cancel Booking
app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  bookingsList = bookingsList.filter(b => b.id !== bookingId);
  res.json({ message: "Booking cancelled" });
});

// 404 Wildcard Handler
app.use((req, res) => {
  res.status(404).send(`Cannot GET ${req.url}`);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Access Admin Portal at http://localhost:${PORT}/admin_4.html`);
});
