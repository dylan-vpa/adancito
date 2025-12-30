import express from 'express';
import {
    getChatSessions,
    createChatSession,
    getChatSession,
    updateChatSession,
    deleteChatSession,
    getChatMessages,
    sendMessage
} from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Chat sessions
router.get('/chats', getChatSessions);
router.post('/chats', createChatSession);
router.get('/chats/:id', getChatSession);
router.patch('/chats/:id', updateChatSession);
router.delete('/chats/:id', deleteChatSession);

// Messages
router.get('/chats/:id/messages', getChatMessages);
router.post('/chat', sendMessage); // SSE endpoint

export default router;
