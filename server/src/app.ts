import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Error handling
app.use(errorHandler);

export default app;
