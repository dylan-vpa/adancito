import express from 'express';
import {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    updateDeliverable
} from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/projects', getProjects);
router.post('/projects', createProject);
router.get('/projects/:id', getProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);
router.patch('/deliverables/:id', updateDeliverable);

export default router;
