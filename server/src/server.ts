import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

console.log('--- SERVER STARTUP DEBUG ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Target .env path:', envPath);
console.log('Dotenv parsed:', result.parsed ? 'Yes' : 'No');
console.log('Dotenv error:', result.error);
console.log('ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
if (process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY.length);
    console.log('ANTHROPIC_API_KEY start:', process.env.ANTHROPIC_API_KEY.substring(0, 10));
}
console.log('----------------------------');

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
