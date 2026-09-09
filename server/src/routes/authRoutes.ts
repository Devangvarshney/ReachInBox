import { Router } from 'express';
import {
  getAuthConfig,
  googleLoginController,
  getMeController,
} from '../controllers/authController';

const router = Router();

// GET /api/auth/config - get Google Client ID configuration
router.get('/config', getAuthConfig);

// POST /api/auth/google - authenticate user with Google OAuth (tokens or auth code)
router.post('/google', googleLoginController);

// GET /api/auth/me - get current user profile
router.get('/me', getMeController);

export default router;
