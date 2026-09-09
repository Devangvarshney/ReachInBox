import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';
import authRoutes from './routes/authRoutes';
import { setupBullBoard } from './queues/bullBoard';
import { setupEmailWorker } from './queues/emailWorker';
import { etherealService } from './services/etherealService';
import { connectDB } from './config/database';

dotenv.config();
// Restart server process to reload .env configuration: updated MongoDB Atlas URI

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 1. Mount Live BullMQ Queue Dashboard at /admin/queues
app.use('/admin/queues', setupBullBoard());

// 2. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Health check & Info endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      bullmqDashboard: `http://localhost:${PORT}/admin/queues`,
      apiBase: `http://localhost:${PORT}/api/emails`,
    },
  });
});

// Start BullMQ Worker & Multi-Sender Ethereal Accounts
const initServices = async () => {
  try {
    console.log('----------------------------------------------------');
    console.log('⚡ ReachInbox AI Outbound Email Scheduler Backend');
    console.log('----------------------------------------------------');

    // Connect to MongoDB
    await connectDB();

    await etherealService.initMultiSenders();
    setupEmailWorker();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 Live BullMQ Dashboard: http://localhost:${PORT}/admin/queues`);
      console.log(`✉️  Scheduler API: http://localhost:${PORT}/api/emails/schedule`);
      console.log('----------------------------------------------------');
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️  Port ${PORT} is already in use by another process.`);
        console.error(`👉 You can terminate the other process or set a different PORT in server/.env`);
      } else {
        console.error('Server error:', err.message);
      }
    });
  } catch (err: any) {
    console.error('Fatal initialization error:', err.message);
  }
};

initServices();
