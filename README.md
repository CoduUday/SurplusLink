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

## 🔮 Feature 2: AI-Powered Food Surplus Prediction

### Overview
SurplusLink includes an explainable, adaptive food surplus prediction engine that empowers food donors (hostels, banquets, event organizers, restaurants) to forecast excess food **before** an event finishes. By projecting expected surplus quantity and availability times early, partner NGOs can be alerted in advance to plan prompt pickups and prevent edible food from spoiling.

---

### 🧮 Prediction Formula & Historical Weighting Approach

1. **Usable Historical Surplus Rate Calculation:**
   For each verified past meal record belonging to the authenticated donor:
   $$\text{surplusRate}_i = \frac{\text{actualSurplusKg}_i}{\text{plannedQuantityKg}_i}$$
   *Only completed meals with valid submitted feedback where $0 \le \text{surplusRate} \le 1$ and created prior to the target prediction time are included to prevent future data leakage.*

2. **Multi-Factor Historical Comparability Weighting:**
   Each historical record receives a dynamic weight ($w_i$) based on similarity to the upcoming meal:
   - **Base Weight:** $+1.0$
   - **Category Match:** $+2.0$ (exact match on Vegetarian, Non-vegetarian, or Mixed cuisines)
   - **Meal Type Match:** $+2.0$ (exact match on Breakfast, Lunch, Dinner, Wedding, Event)
   - **Attendance Scale Similarity:** $+1.5$ (if historical attendance is within $\pm 25\%$ of current meal)
   - **Quantity Scale Similarity:** $+1.0$ (if planned quantity is within $\pm 30\%$ of current meal)
   - **Recency Boost:** Up to $+1.0$ (linear recency decay over a 60-day window)

   The personalized surplus rate is calculated as:
   $$\text{weightedSurplusRate} = \frac{\sum (w_i \cdot \text{surplusRate}_i)}{\sum w_i}$$

   When sufficient attendance data is available, an attendance-to-consumption check blends average consumption per attendee:
   $$\text{expectedConsumption} = \text{expectedAttendance} \times \text{avgPerPersonKg}$$
   $$\text{predictedSurplusKg} = \max(0, \min(\text{plannedQuantityKg}, \text{plannedQuantityKg} \times \text{estimatedSurplusRate}))$$

3. **Availability Time Estimation Rules:**
   - **Priority 1 (Donor Input):** Uses the donor's explicit `expectedServingEndTime` if provided.
   - **Priority 2 (Historical Median):** Calculates median serving duration for comparable meals if $\ge 2$ past records with verified availability timestamps exist.
   - **Priority 3 (Default Assumption):** Configurable institutional benchmark (Breakfast: 90 min, Lunch: 120 min, Dinner: 150 min, Wedding: 210 min).

---

### ❄️ Cold-Start Baseline Fallbacks
When a donor has no prior meal feedback in the database:
- Configurable institutional benchmarks are applied:
  - Vegetarian: **12%**
  - Non-vegetarian: **15%**
  - Mixed: **14%**
  - General Default: **13%**
- The prediction method is explicitly reported as `baseline_fallback`.
- Marked as **"baseline estimate — not yet personalized"** with full transparent explanation.
- No fabricated machine learning training claims are presented to the donor.

---

### 🛡️ Reliability Classification
Reliability indicates sample size and variance consistency (not a statistically calibrated confidence interval):
- **Low:** Cold-start ($< 3$ historical records) or high variance ($\text{stdDev} > 9\%$).
- **Medium:** $3 \text{ to } 6$ relevant records with moderate consistency.
- **High:** $\ge 7$ relevant records with low variance ($\text{stdDev} \le 4\%$).

---

### 🔄 Adaptive Feedback Loop
After each meal or event:
1. Donors enter the **actual surplus quantity (kg)** and **actual availability time** via the dashboard modal.
2. Inputs are strictly validated (non-negative, bounded against planned quantities).
3. The feedback is stored with status `submitted`.
4. Subsequent predictions automatically incorporate this new data point, increasing weighting precision and reliability over time.

---

### 📡 API Endpoints

All prediction routes require JWT authentication and `DONOR` role authorization:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/predictions` | Generate and save a new surplus prediction |
| `GET` | `/api/predictions` | Retrieve donor's paginated history with filters (`page`, `limit`, `foodCategory`, `feedbackStatus`, `startDate`, `endDate`) |
| `GET` | `/api/predictions/:id` | Retrieve single prediction details (enforces donor ownership) |
| `PATCH` | `/api/predictions/:id/feedback` | Record post-meal actual surplus quantity and availability time |

---

### 🤖 IBM watsonx.ai & IBM Granite Integration

SurplusLink includes a dedicated modular service at `server/src/services/prediction/watsonxGranite.service.js`:
- **Safe Architecture:** Numerical predictions, boundaries, and timestamps are always computed deterministically by the core engine. IBM Granite cannot override numerical bounds.
- **Natural Language Synthesis:** Prepared prompt templates allow IBM Granite models (e.g. `ibm/granite-13b-chat-v2`) to synthesize user-friendly surplus summaries and analyze unstructured menu descriptions.
- **Zero Hard Dependency:** SurplusLink operates fully without IBM credentials.
- **Optional Environment Variables:**
  - `IBM_WATSONX_APIKEY`
  - `IBM_WATSONX_PROJECT_ID`
  - `IBM_WATSONX_URL` (default: `https://us-south.ml.cloud.ibm.com`)
  - `IBM_GRANITE_MODEL_ID` (default: `ibm/granite-13b-chat-v2`)

---

### 🧪 Running Tests

Run the complete test suite (unit + integration tests) via Node.js native test runner:

```bash
# Run tests from project root
npm test

# Or run directly inside server directory
cd server
npm test
```

Test coverage includes:
1. Input validation & boundary constraints (negative values, invalid times, chronological order).
2. Cold-start fallback behavior without ML training claims.
3. Historical weighted rate calculation and variance.
4. Data leakage prevention (future records and unverified feedback excluded).
5. Availability time priority resolution (donor input > median > default duration).
6. Cross-donor isolation (Donor B cannot read or submit feedback for Donor A's records).
7. Feedback incorporation into subsequent predictions.

---

## 🏃 Running the Application

### 1. Environment Configuration
Ensure `.env` files are created:
- `server/.env` (see `server/.env.example`)
- `client/.env` (see `client/.env.example`)

### 2. Start Servers Concurrently
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
