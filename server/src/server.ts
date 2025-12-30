import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initializeDatabase } from './models/db';

const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
initializeDatabase();

// Start server - listen on 0.0.0.0 to be accessible externally
app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Adan server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🤖 Ollama endpoint: ${process.env.OLLAMA_BASE_URL || 'https://x1rspglhz3krhh-11434.proxy.runpod.net'}`);
});
