# 🚀 ReachInbox — Cold Email Outreach & Distributed Job Dispatcher

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ%20%2B%20Redis-critical?style=flat-square&logo=redis)](https://bullmq.io/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen?style=flat-square&logo=mongodb)](https://www.mongodb.com/)

A modern, high-throughput outbound email scheduling and cold outreach platform built with **React 19**, **Node.js/Express**, **BullMQ**, **Redis**, and **MongoDB Atlas**. Designed to manage cold outreach campaigns with precision delay scheduling, multi-sender rate limiting, live queue observability, and SMTP dispatching.

---

## ✨ Features

* **⚡ Distributed Queue & Scheduling**: Powered by BullMQ & Redis with configurable per-job delays, retry policies, and exponential backoffs.
* **🍃 Cloud-Native Persistence**: Backed by MongoDB Atlas with Mongoose models for email schedules, sender accounts, and audit logging.
* **⏱️ Precision Rate Limiting**: Enforces strict hourly limits globally and per-sender to protect domain deliverability and avoid SMTP throttling.
* **📊 Live Queue Observability**: Real-time BullMQ Dashboard (`/admin/queues`) monitoring active, delayed, completed, and failed jobs with live progress gauges.
* **📬 Multi-Recipient & Lead Parsing**: Import multiple lead emails and automatically dispatch staggered sequences.
* **✉️ Multi-Channel Email Dispatcher**: Integrated with Nodemailer with sandbox testing (Ethereal SMTP) and production SMTP relays.
* **🔍 Instant Search & Indexing**: Elasticsearch integration for full-text search across sent emails and campaigns.
* **🔔 Real-time Alerts**: Slack Webhook notifications for critical job failures and delivery milestones.
* **🎨 Modern UI/UX**: Sleek dark/light dashboard built with Lucide icons, responsive preview panes, and clean status badges.

---

## 🛠️ Architecture

```
[ Frontend: React 19 + Vite ]
         │
         ▼  (REST API)
[ Backend: Node.js + Express ]
   ├── [ MongoDB Atlas ]         ─── Persistent Email Records & Schedulers
   ├── [ BullMQ Queue & Worker ] ─── Delayed Job Scheduling & Concurrency Control
   ├── [ Redis ]                 ─── Fast Queue In-Memory State & Rate Limiting
   ├── [ Nodemailer ]            ─── SMTP Dispatch (Ethereal / Production)
   └── [ BullMQ Live UI ]        ─── Real-Time Queue & Rate Limit Metrics
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Lucide Icons, Google OAuth |
| **Backend** | Node.js, Express, TypeScript, ts-node-dev |
| **Database** | MongoDB Atlas, Mongoose |
| **Queuing & Cache** | BullMQ, Redis (ioredis / ioredis-mock) |
| **Search & Alerts** | Elasticsearch, Slack Webhooks |
| **Email Delivery** | Nodemailer, Ethereal Test SMTP |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB Atlas** cluster (or local MongoDB)
- **Redis** (optional; built-in memory fallback included)

---

### 2. Installation & Setup

#### Clone the repository
```bash
git clone https://github.com/<your-username>/reachinbox.git
cd reachinbox
```

#### Install Root & Frontend Dependencies
```bash
npm install
```

#### Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

---

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory (see `server/.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/reachinbox?retryWrites=true&w=majority

# Redis (Set true to use in-memory Redis without external installation)
USE_IN_MEMORY_REDIS=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Rate Limiting
MAX_EMAILS_PER_HOUR=200
MAX_EMAILS_PER_HOUR_PER_SENDER=50

# Optional Integrations
SLACK_WEBHOOK_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

### 4. Running Locally

#### Start the Backend:
```bash
cd server
npm run dev
```
* Backend API: `http://localhost:5000`
* BullMQ Queue Dashboard: `http://localhost:5000/admin/queues`

#### Start the Frontend:
In a new terminal from the root folder:
```bash
npm run dev
```
* Frontend App: `http://localhost:5173`

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/emails/schedule` | Schedule single or bulk delayed outreach emails |
| `GET` | `/api/emails/scheduled` | Fetch currently scheduled / queued emails |
| `GET` | `/api/emails/sent` | Fetch sent emails history |
| `DELETE` | `/api/emails/:id` | Cancel and delete an email from queue & database |
| `GET` | `/admin/queues` | Live BullMQ Queue & Rate Limits Dashboard |
| `GET` | `/admin/queues/api/queues-data` | Real-time queue metrics endpoint |
| `POST` | `/admin/queues/api/retry-job/:id` | Trigger immediate dispatch for delayed/failed job |

---

## 📄 License
This project is licensed under the MIT License.
