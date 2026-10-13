# 🌱 SurplusLink — AI-Powered Food Surplus Redistribution Platform

SurplusLink is a platform designed to tackle food wastage by bridging the gap between food donors (restaurants, college/hostel messes, event organizers, and institutions) and NGOs or community organizations that distribute meals to vulnerable populations.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React.js 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v18+) with native ES Modules
- **Framework:** Express.js
- **Database & ODM:** MongoDB & Mongoose
- **Security & Authentication:** JSON Web Tokens (JWT), bcryptjs, CORS
- **Environment Management:** dotenv

### Geolocation & AI (Scaffolded for Feature Phase)
- **Geospatial Matching:** Haversine formula distance calculation & OpenStreetMap
- **AI Forecasting:** Weighted average historical surplus forecasting & IBM watsonx.ai integration

---

## 📁 Monorepo Folder Structure

```
SurplusLink/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (.gitkeep placeholder)
│   │   ├── context/            # React Context providers (.gitkeep placeholder)
│   │   ├── hooks/              # Custom React hooks (.gitkeep placeholder)
│   │   ├── pages/              # Page views (HomePage scaffold)
│   │   ├── services/           # API services (Axios client setup)
│   │   ├── utils/              # Frontend formatting & helper utilities
│   │   ├── App.jsx             # Root React component & route definitions
│   │   ├── index.css           # Tailwind base styles and design system tokens
│   │   └── main.jsx            # React DOM mounting & router setup
│   ├── .env.example            # Client environment variables template
│   ├── index.html              # HTML entry with SEO metadata
│   ├── package.json            # Client dependencies and build scripts
│   ├── postcss.config.js       # PostCSS config for Tailwind
│   ├── tailwind.config.js      # Tailwind theme configuration
│   └── vite.config.js          # Vite config with API proxy
│
├── server/                     # Backend API Application (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database connection & server configurations
│   │   │   └── db.js           # Mongoose MongoDB connection module (graceful fallback)
│   │   ├── controllers/        # Request handlers & business logic (.gitkeep placeholder)
│   │   ├── middleware/         # Auth & validation middlewares (.gitkeep placeholder)
│   │   ├── models/             # Mongoose schemas & data models (.gitkeep placeholder)
│   │   ├── routes/             # Express API routes
│   │   │   └── health.routes.js# Health check endpoint (/api/health)
│   │   ├── services/           # AI, prediction, and matching logic (.gitkeep placeholder)
│   │   ├── utils/              # Server helper utilities (.gitkeep placeholder)
│   │   ├── app.js              # Express app initialization, middlewares & error handling
│   │   └── index.js            # Server entrypoint and port listener
│   ├── .env.example            # Server environment variables template
│   └── package.json            # Server dependencies and scripts
│
├── .gitignore                  # Git ignore rules for node_modules, .env, build outputs
├── package.json                # Root monorepo workspace configuration & runner scripts
└── README.md                   # Project documentation
```

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher (v11.x tested)
- **MongoDB** (Optional for scaffolding, required for full database operations):
  - Local MongoDB instance (`mongodb://127.0.0.1:27017/surpluslink`) OR
  - MongoDB Atlas free cluster connection string

---

## 🚀 Getting Started & Setup

### 1. Clone & Install Dependencies

From the repository root:

```bash
# Install root, server, and client dependencies concurrently
npm run install:all
```

Alternatively, install in each directory individually:
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables

Create `.env` files in both `server/` and `client/` by copying the examples:

#### Server:
```bash
cp server/.env.example server/.env
```
Key variables in `server/.env`:
- `PORT`: Server port (default: `5000`)
- `MONGODB_URI`: Connection string (e.g. `mongodb://127.0.0.1:27017/surpluslink` or Atlas URL)
- `CLIENT_URL`: Allowed frontend origin (`http://localhost:5173`)
- `JWT_SECRET`: Secret key for signing tokens

> **Note:** The server connects to MongoDB gracefully. If MongoDB is offline during initial scaffolding, the server logs a warning and continues running so you can verify APIs without crashing.

#### Client:
```bash
cp client/.env.example client/.env
```
Key variables in `client/.env`:
- `VITE_API_URL`: Backend endpoint (`http://localhost:5000/api`)

---

## 🏃 Running the Application

### Option A: Run Both Client & Server Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```

### Option B: Run Individually
- **Run Backend Only:**
  ```bash
  npm run dev:server
  # API starts at http://localhost:5000
  # Health check: http://localhost:5000/api/health
  ```

- **Run Frontend Only:**
  ```bash
  npm run dev:client
  # Frontend starts at http://localhost:5173
  ```

---

## 🏥 Verification Endpoints

- **Server Health Check:** `GET http://localhost:5000/api/health`
  - Returns operational status, server timestamp, and database connection state.
- **Root API Message:** `GET http://localhost:5000/`
- **Frontend Dashboard:** `http://localhost:5173/` includes an interactive test button to check connection to the backend health endpoint.

---

## 🔜 Next Steps / Feature Roadmap

1. **Role-Based Authentication (JWT):** Implement User model, registration, login, and authorization middleware for Donors and NGOs.
2. **Surplus Food Listings:** Build donation submission form and status lifecycle tracking (`Available` → `Accepted` → `Pickup Scheduled` → `Collected` → `Delivered`).
3. **AI Food Surplus Prediction:** Implement meal schedules and weighted surplus forecasting.
4. **Smart NGO Matching:** Implement Haversine distance and capacity compatibility scoring.
