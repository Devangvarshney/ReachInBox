import { Router } from 'express';
import {
  scheduleEmailController,
  getScheduledEmailsController,
  getSentEmailsController,
  searchEmailsController,
  cancelEmailController,
  deleteEmailController,
  getSendersController,
} from '../controllers/emailController';

const router = Router();

// 1. Schedule emails via BullMQ delayed jobs
router.post('/schedule', scheduleEmailController);

// 2. Fetch scheduled emails
router.get('/scheduled', getScheduledEmailsController);

// 3. Fetch sent emails
router.get('/sent', getSentEmailsController);

// 4. Full-text search via Elasticsearch
router.get('/search', searchEmailsController);

// 5. Cancel scheduled email
router.post('/:id/cancel', cancelEmailController);

// 6. Delete email
router.delete('/:id', deleteEmailController);

// 7. View sender accounts
router.get('/senders', getSendersController);

export default router;
