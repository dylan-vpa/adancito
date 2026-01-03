/**
 * MVP Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as mvpController from '../controllers/mvpController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Generate MVP from chat content
router.post('/generate', mvpController.generateMVP);

// Parse content to check for MVP code (preview)
router.post('/parse', mvpController.parseContent);

// List all user MVPs
router.get('/list', mvpController.listMVPs);

// Get specific project status
router.get('/:id/status', mvpController.getProjectStatus);

// Stop running MVP
router.post('/:id/stop', mvpController.stopMVP);

export default router;
