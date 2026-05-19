# Leather E-Commerce

A full-stack e-commerce platform for a leather goods store, built with the MERN stack.

---

## Tech Stack

**Client**

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Axios

**Server**

- Node.js + TypeScript
- Express 5
- MongoDB Atlas + Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Nodemon + tsx

---

## Project Structure

```
Leather-Ecommerce/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # Route-level pages
│       ├── components/      # Reusable UI components
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Axios instance, helpers
│       └── types/           # Shared TypeScript interfaces
│
└── server/                  # Express backend
    └── src/
        ├── index.ts         # Entry point — DB connect + server bootstrap
        ├── server.ts        # Express app + middleware + route mounting
        ├── lib/             # Shared utilities (db, jwt, etc.)
        ├── schemas/         # Mongoose schema definitions + TS interfaces
        ├── models/          # Mongoose model instances
        ├── controllers/     # Business logic — talks to models
        └── routes/          # Express routers — maps URLs to controllers
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1. Clone the repository

```bash
git clone <repo-url>
cd Leather-Ecommerce
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=3000
NODE_ENV=development
MONGO_URL=mongodb://<your-direct-connection-string>
```

> **Note:** Use the direct `mongodb://` connection string from Atlas, not the `mongodb+srv://` one. Go to Atlas → Connect → Drivers → Standard connection string.

```bash
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev
```

---

## API

| Method | Endpoint      | Description           |
| ------ | ------------- | --------------------- |
| GET    | `/api/health` | Server liveness check |

More endpoints will be documented here as they are built.

---

## Environment Variables

| Variable    | Description                                 |
| ----------- | ------------------------------------------- |
| `PORT`      | Port the server runs on (default: `3000`)   |
| `NODE_ENV`  | Environment — `development` or `production` |
| `MONGO_URL` | MongoDB direct connection string            |

---

## Scripts

### Server

| Script          | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start server with hot reload (nodemon + tsx) |
| `npm run start` | Start server for production                  |
| `npm run build` | Type-check the project                       |

### Client

| Script            | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start Vite dev server            |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview production build locally |

---

## Data Models

| Model      | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `User`     | Customer and admin accounts, with embedded addresses              |
| `Product`  | Leather goods with pricing, stock, images, and tags               |
| `Category` | Hierarchical product categories (supports subcategories)          |
| `Order`    | Customer orders with snapshotted item prices and shipping address |
