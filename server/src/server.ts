import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initializeDatabase } from './models/db';

const PORT = process.env.PORT || 8001;

// Initialize database
initializeDatabase();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Adan server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Ollama endpoint: ${process.env.OLLAMA_BASE_URL || 'https://x1rspglhz3krhh-11434.proxy.runpod.net'}`);
});
