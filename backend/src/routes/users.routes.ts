import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMe, updateMe } from '../controllers/users.controller';
import { upload } from '../middleware/upload';

const usersRouter = Router();

usersRouter.get('/me', requireAuth, getMe);
usersRouter.patch('/me', requireAuth, upload.single('photo'), updateMe);

export default usersRouter;
