import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import userRoutes from './routes/userRoutes';
import paymentRoutes from './routes/paymentRoutes';
import projectRoutes from './routes/projectRoutes';
import deliverableRoutes from './routes/deliverableRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client build if it exists (for production)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
    console.log(`📦 Serving static client from: ${clientDistPath}`);
    app.use(express.static(clientDistPath));
}

// Temporary debug route - REMOVED


// Routes
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', projectRoutes);
app.use('/api/deliverables', deliverableRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Adan server is running' });
});

// SPA fallback - serve index.html for any non-API routes (for React Router)
if (fs.existsSync(clientDistPath)) {
    app.get('*', (req, res) => {
        // Don't serve index.html for API routes
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        }
    });
}

// Error handling
app.use(errorHandler);

export default app;
