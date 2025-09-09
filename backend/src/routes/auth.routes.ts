import { Router } from 'express';
import { login, register, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { oauthGoogleStart, oauthGoogleCallback } from '../social/google';
import { upload } from '../middleware/upload';
import { trackAuthActivity } from '../middleware/activityTracker';

const authRouter = Router();

authRouter.post('/register', upload.single('photo'), register);

authRouter.post('/login', trackAuthActivity('login'), login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);

// Google OAuth (démarrage + callback)
authRouter.get('/oauth/google', oauthGoogleStart);
authRouter.get('/oauth/google/callback', oauthGoogleCallback);

export default authRouter;
