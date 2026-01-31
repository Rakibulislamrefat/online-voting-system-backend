const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

console.log(process.env.MONGO_URI, "database url ");

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rakibulislamrefat126_db_user:ckcGnKNDT0FEh9jq@cluster0.cjle6jp.mongodb.net/?appName=Cluster0')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Bangladesh Voting System API Running');
});

const authRoutes = require('./routes/authRoutes');
const electionRoutes = require('./routes/electionRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/admin', adminRoutes);

// Share io instance with controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
