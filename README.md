# 🏆 Sports Partnership Platform — Backend API

Backend RESTful API service for the **Sports Partnership & Multi-Level Commission Management Platform**. Built with Node.js, Express, and MongoDB (with automated in-memory MongoDB fallback for instant zero-configuration development).

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Database & Automated Seeding](#-database--automated-seeding)
- [API Reference](#-api-reference)
- [Production Deployment](#-production-deployment)

---

## 🌟 Features

- **Owner-Rooted Multi-Level Hierarchy (Owner → L1 to L5)**: Starts from the Platform Owner (Level 0), delegating revenue share down to Level 1 Senior Partners, Level 2 Sub-Partners, Level 3 Master Agents, Level 4 Agents, and Level 5 Sub-Agents.
- **Sport-wise Dynamic Partnership Allocation**: Configurable percentage distribution for multiple sports (Cricket, Tennis, Football) tracking **Received %**, **Given %**, and **Remaining %**.
- **Automated Commission Waterfall Engine**: Calculates exact revenue share percentages and payout amounts across all uplines from Level $N$ through all parent tiers back up to the Owner, enforcing 100% distribution conservation.
- **Transaction Ledger & Formula Breakdown**: Records each transaction with full audit trail formulas (e.g., `₹10,000 × 30% = ₹3,000`).
- **Reports & Aggregations**: Generates partner-wise earnings, sport-wise revenue splits, and platform metrics.
- **Zero-Config Database Fallback**: Connects to local MongoDB if available; seamlessly boots `mongodb-memory-server` if no local database is running.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database / ODM**: MongoDB, Mongoose
- **In-Memory Fallback**: `mongodb-memory-server`
- **Utilities**: `dotenv`, `cors`, `nodemon`

---

## 🗄 Database & Automated Seeding

Upon startup, `src/utils/seedData.js` auto-populates the complete hierarchy starting from Owner:
- **👑 Platform Owner (Level 0)**: `OWNER-001` (Starts with 100% Received pool)
- **🟡 Level 1 (Senior Partner)**: Rahul Sharma (`P-10021`)
- **🔵 Level 2 (Sub-Partner)**: Amit Kumar (`P-10045`), Rohit Das (`P-10050`)
- **🟢 Level 3 (Master Agent)**: Raj Singh (`P-10078`), Neha Singh (`P-10123`)
- **🟣 Level 4 (Agent)**: Ankit Singh (`P-10150`)
- **🔴 Level 5 (Sub-Agent)**: Vishal Verma (`P-10190`)
- **Sample Verified Transactions**: Multi-tier revenue logs with complete breakdown including Owner payout.

---

## 📡 API Reference

### Health & Reset
- `GET /api/health` — Check server status.
- `POST /api/seed/reset` — Reseed fresh Owner $\to$ L5 hierarchy.

### Partners API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/partners` | Get all partners (flat list with level & uplines) |
| `GET` | `/api/partners/tree` | Get hierarchical partner tree (nested starting from Owner) |
| `GET` | `/api/partners/:id` | Get partner details, direct downlines, and upline chain |
| `POST` | `/api/partners` | Create a new partner under a parent (or under Owner) |
| `PUT` | `/api/partners/:id` | Update partner details |
| `DELETE` | `/api/partners/:id` | Remove a partner (prevented on Owner or partners with children) |

### Partnership Matrix API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/partnerships/matrix` | Get complete sports percentage matrix for all partners |
| `POST` | `/api/partnerships/update` | Update given/remaining percentage and cascade to downlines |

### Transactions & Waterfall Calculation API
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions/calculate` | Preview commission breakdown formula without saving |
| `POST` | `/api/transactions` | Record a revenue transaction and apply breakdown |
| `GET` | `/api/transactions` | Query transaction ledger with filters (sport, partnerId) |
