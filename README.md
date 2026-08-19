# 🏆 Sports Partnership Platform — Backend API

Backend RESTful API service for the **Sports Partnership & Multi-Level Commission Management Platform**. Built with Node.js, Express, and MongoDB (with automated in-memory MongoDB fallback for instant zero-configuration development).

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database & Automated Seeding](#-database--automated-seeding)
- [API Reference](#-api-reference)
  - [Partners](#1-partners-api)
  - [Partnership Matrix](#2-partnership-matrix-api)
  - [Sports](#3-sports-api)
  - [Transactions & Payouts](#4-transactions--commission-calculation-api)
  - [Reports & Analytics](#5-reports--dashboard-api)
- [Production Deployment](#-production-deployment)

---

## 🌟 Features

- **Multi-Level Hierarchy (L1 to L5)**: Supports multi-tier partner management with parent-child upline/downline relationships.
- **Sport-wise Dynamic Partnership Allocation**: Configurable percentage distribution for multiple sports (Cricket, Tennis, Football) tracking **Received %**, **Given %**, and **Remaining %**.
- **Automated Commission Engine**: Calculates exact revenue share percentages and payout amounts across all uplines from Level $N$ to Level 1, enforcing 100% distribution validation.
- **Transaction Ledger & Formula Breakdown**: Records each transaction with full audit trail formulas (e.g., `₹10,000 × 30% = ₹3,000`).
- **Reports & Aggregations**: Generates partner-wise earnings, sport-wise revenue splits, and platform metrics.
- **Zero-Config Database Fallback**: Connects to local MongoDB if available; seamlessly boots `mongodb-memory-server` if no local database is running.
- **Angular SPA Serving**: Configured to serve the production build of the Angular frontend directly on the single server port.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database / ODM**: MongoDB, Mongoose
- **In-Memory Fallback**: `mongodb-memory-server`
- **Utilities**: `dotenv`, `cors`, `nodemon`

---

## 📁 Architecture & Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & in-memory fallback
│   ├── controllers/
│   │   ├── partnerController.js      # Partner CRUD & tree traversal
│   │   ├── partnershipController.js  # Sport percentage matrix & adjustments
│   │   ├── reportController.js       # Dashboard KPIs & reports
│   │   ├── sportController.js        # Sports catalog
│   │   └── transactionController.js  # Revenue calculator & transactions
│   ├── models/
│   │   ├── Partner.js            # Partner schema with sportsPartnership Map
│   │   ├── Sport.js              # Sports catalog schema
│   │   └── Transaction.js        # Transaction schema with payout breakdown
│   ├── routes/
│   │   ├── partnerRoutes.js
│   │   ├── partnershipRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── sportRoutes.js
│   │   └── transactionRoutes.js
│   ├── utils/
│   │   └── seedData.js           # Initial database seed (L1–L5 hierarchy & transactions)
│   └── server.js                 # Express app initialization & route registration
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/) (version 9.x or higher)
- *(Optional)* [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally on `mongodb://127.0.0.1:27017`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in the root of `backend/` if custom configuration is needed:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sports_partnership_db
```
*(If no `.env` or MongoDB server exists, the server automatically defaults to `PORT=5000` and starts an in-memory database).*

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

The API will be available at: **`http://localhost:5000/api`**

---

## 🗄 Database & Automated Seeding

Upon startup, `src/utils/seedData.js` verifies if data is present. If the database is empty, it automatically populates:
- **3 Sports**: Cricket, Tennis, Football
- **Multi-Level Partner Tree (L1 to L5)**:
  - **L1**: Rahul Sharma (`P-10021`)
  - **L2**: Amit Kumar (`P-10045`), Rohit Das (`P-10050`)
  - **L3**: Raj Singh (`P-10078`), Neha Singh (`P-10123`)
  - **L4**: Ankit Singh (`P-10150`)
  - **L5**: Vishal Verma (`P-10190`)
- **Sample Transactions**: Real-world revenue share logs with detailed breakdown allocations.

---

## 📡 API Reference

### Health Check
- `GET /api/health` — Check server status.

### 1. Partners API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/partners` | Get all partners (flat list with level & uplines) |
| `GET` | `/api/partners/tree` | Get hierarchical partner tree (nested children) |
| `GET` | `/api/partners/:id` | Get partner details and their direct downlines |
| `POST` | `/api/partners` | Create a new partner under an optional parent |
| `PUT` | `/api/partners/:id` | Update partner details |
| `DELETE` | `/api/partners/:id` | Remove a partner |

### 2. Partnership Matrix API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/partnerships/matrix` | Get complete sports percentage matrix for all partners |
| `POST` | `/api/partnerships/update` | Update given/remaining percentage for a partner and sport |

### 3. Sports API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sports` | List all supported sports |
| `POST` | `/api/sports` | Add a new sport |

### 4. Transactions & Commission Calculation API
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions/calculate` | Preview commission breakdown formula without saving |
| `POST` | `/api/transactions` | Record a revenue transaction and apply breakdown |
| `GET` | `/api/transactions` | Query transaction ledger with filters (sport, partnerId) |

#### Sample Commission Calculation Request:
```json
POST /api/transactions/calculate
{
  "partnerId": "66c30f4...",
  "sport": "cricket",
  "amount": 10000
}
```

#### Sample Commission Calculation Response:
```json
{
  "success": true,
  "data": {
    "totalAmount": 10000,
    "sport": "cricket",
    "partner": "Raj Singh (Level 3)",
    "breakdown": [
      { "level": 3, "partnerName": "Raj Singh", "percentage": 50, "amount": 5000, "formula": "₹10,000 × 50% = ₹5,000" },
      { "level": 2, "partnerName": "Amit Kumar", "percentage": 30, "amount": 3000, "formula": "₹10,000 × 30% = ₹3,000" },
      { "level": 1, "partnerName": "Rahul Sharma", "percentage": 20, "amount": 2000, "formula": "₹10,000 × 20% = ₹2,000" }
    ],
    "totalDistributedPercentage": 100
  }
}
```

### 5. Reports & Dashboard API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/dashboard` | Aggregated dashboard statistics (Total Volume, Partners, Distribution) |
| `GET` | `/api/reports/earnings` | Partner-wise and Sport-wise earnings breakdown |

---

## 🚢 Production Deployment

1. Build the Angular frontend in the `frontend` folder:
   ```bash
   cd ../frontend && npm run build
   ```
2. The Express server in `backend/src/server.js` serves static files from `../frontend/dist/sports-partnership-frontend/browser` and handles SPA client-side routing fallbacks.
3. Start the server:
   ```bash
   npm start
   ```
