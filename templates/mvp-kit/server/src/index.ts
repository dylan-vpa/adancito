import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Allow iframe embedding
app.use(cors());

// Custom middleware to allow iframe embedding (no X-Frame-Options restriction)
app.use((req, res, next) => {
    // Allow embedding from any origin (for MVP preview)
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    next();
});

app.use(morgan('dev'));
app.use(express.json());

// API Routes Base
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Adán will inject routes here (e.g. todoRoutes, userRoutes)
// app.use('/api', todoRoutes);

app.use('/api', apiRouter);

// Serve Static Frontend (Production)
// In Docker, the client build is copied to ./public
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all: serve index.html for non-API routes (SPA support)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
