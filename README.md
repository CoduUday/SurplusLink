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

## 🍲 Feature 3: Food Surplus Listing

### Overview
SurplusLink allows authenticated food donors to create, publish, view, edit, and cancel food surplus listings. Authenticated NGOs can browse available, non-expired donations with real-time filters and pagination to identify food meeting their daily serving capacity.

---

### 📋 Food Donation Schema & Fields

| Field | Type | Rules & Validation |
| :--- | :--- | :--- |
| `donor` | `ObjectId (User)` | Required reference to authenticated donor. Indexed. |
| `foodName` | `String` | Required, trimmed, max 150 characters. |
| `category` | `String` | Enum: `Cooked Meals`, `Bakery & Bread`, `Fresh Produce`, `Dairy & Eggs`, `Packaged Food`, `Beverages`, `Other`. |
| `quantity` | `Number` | Required positive number ($> 0$). Kept strictly distinct from servings. |
| `quantityUnit` | `String` | Enum: `kg`, `grams`, `litres`, `packets`, `servings`, `boxes`. |
| `foodType` | `String` | Enum: `VEGETARIAN` or `NON_VEGETARIAN`. |
| `servings` | `Number` | Required positive integer representing people served ($\ge 1$). |
| `allergenInfo` | `Object` | Structured allergen data: `allergensDeclared` (`[String]`), `ingredientNotes` (`String`), `declarationStatus` (`DECLARED_ALLERGENS`, `ALLERGEN_FREE_VERIFIED`, `UNKNOWN_UNVERIFIED`). Never defaults to allergen-free without verification. |
| `location` | `Object` | `address` (required string), `type` (`Point`), `coordinates` (`[longitude, latitude]`). Indexed with `2dsphere`. |
| `pickupDeadline` | `Date` | Required future timestamp when creating/updating. |
| `contactPerson` | `String` | Required donor contact person name. |
| `contactPhone` | `String` | Required validated phone number. |
| `pickupInstructions` | `String` | Optional pickup notes and access instructions. |
| `status` | `String` | Enum: `AVAILABLE`, `ACCEPTED`, `COLLECTED`, `DELIVERED`, `CANCELLED`, `EXPIRED`. Indexed. |
| `cancellationReason` | `String` | Reason recorded when a donor cancels an available listing. |
| `createdAt` / `updatedAt` | `Date` | Mongoose auto timestamps. |

---

### ⏳ Expiration & State Machine Restrictions

1. **Automatic Deadline Filtering & Expiration:**
   - Any donation where `pickupDeadline <= Date.now()` is automatically excluded from the NGO available feed.
   - The backend runs an automatic sweep marking past-due available listings as `EXPIRED`.
   - The expiration sweep **never overwrites** donations that have progressed to `ACCEPTED`, `COLLECTED`, or `DELIVERED`.

2. **Workflow State Protection:**
   - **Editing (`PATCH /api/donations/:id`):** Only permitted while `status === 'AVAILABLE'`. Once accepted, collected, delivered, cancelled, or expired, modification is rejected with `409 Conflict`.
   - **Cancellation (`DELETE /api/donations/:id`):** Only permitted while `status === 'AVAILABLE'`. Cannot cancel once accepted by an NGO or in transit.

---

### 📡 Feature 3 API Endpoints

All endpoints require JWT Bearer authentication (`protect`):

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/donations` | `DONOR` | Create and publish a new surplus listing |
| `GET` | `/api/donations` | `NGO` | Browse available, non-expired donations with filters (`category`, `foodType`, `search`, `page`, `limit`) |
| `GET` | `/api/donations/mine` | `DONOR` | Retrieve authenticated donor's own listings (with optional `status` filter) |
| `GET` | `/api/donations/:id` | Authorized User | Retrieve details of a donation (donor owner or NGO) |
| `PATCH` | `/api/donations/:id` | `DONOR` | Update an eligible listing owned by donor (`AVAILABLE` status only) |
| `DELETE` | `/api/donations/:id` | `DONOR` | Cancel an eligible listing owned by donor (`AVAILABLE` status only) |

---

### 🖥️ Frontend Pages & Navigation

- **Create Donation Page (`/donor/create-donation`):** Comprehensive responsive form with field-level validation, future-deadline checks, allergen toggles, and duplicate submission prevention.
- **My Listings Page (`/donor/my-donations`):** Donor management view displaying food details, status badges, countdowns, and inline modals for Viewing, Editing, and Cancelling.
- **NGO Available Feed (`/ngo/available-donations`):** Interactive card grid with live search, category and food-type filters, urgency tags, and detail view modals.
- **Donation Details View (`/donations/:id`):** Full authorized listing information, pickup instructions, GPS coordinates, contact details, and the embedded **Smart NGO Recommendations** module.

---

## 🎯 Feature 4: Smart NGO Matching System

### Overview
SurplusLink includes a transparent, explainable, rule-based matching engine that pairs available food donations with the most practical community organizations and NGOs. Rather than relying solely on straight-line distance, the engine evaluates multi-dimensional logistical feasibility: geographical proximity, daily serving capacity, operating schedules, transit estimates, and dietary preferences.

### 🧮 Multi-Factor Weighted Scoring Formula (0 to 100 Points)

The total score $S_{\text{total}} \in [0, 100]$ is computed as:

$$S_{\text{total}} = S_{\text{proximity}} + S_{\text{capacity}} + S_{\text{schedule}} + S_{\text{foodCompatibility}}$$

#### 1. Proximity & Service Area (Max 35 Points)
Calculates real-world distance using the **Haversine Formula**:
$$d = 2R \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right) } \right)$$
- $d \le 2\text{ km}$: **35 points**
- $2 < d \le 5\text{ km}$: **28 points**
- $5 < d \le 10\text{ km}$: **20 points**
- $10 < d \le 20\text{ km}$: **10 points**
- $d > 20\text{ km}$ (within custom radius): **5 points**
- **Hard Exclusion:** If $d > \text{serviceRadiusKm}_{\text{NGO}}$, the NGO is excluded from matching.

#### 2. Serving Capacity Suitability (Max 25 Points)
- **Sufficient Capacity ($\text{cap} \ge \text{servings}$):** **25 points**. Plain-language reason: *"Declared capacity is sufficient for all X servings."*
- **Partial Capacity ($0.6 \le \text{ratio} < 1.0$):** **11 points**. Honest warning: *"Donation may exceed declared capacity."*
- **Insufficient Capacity ($\text{ratio} < 0.6$):** **5 points**.
- **Unknown Capacity:** **13 points** (neutral). Plain-language warning: *"Capacity information not available on profile."*

#### 3. Operating Schedule & Pickup Feasibility (Max 20 Points)
- Uses a clearly labeled distance-based travel heuristic ($\text{transitHours} = \frac{d}{25\text{ km/h}} + 0.5\text{h buffer}$).
- **Feasible Window:** **20 points** when pickup window is compatible with operating hours.
- **Tight Window:** **5 points** if time remaining before deadline is less than estimated transit.
- **Unknown Schedule:** **10 points** (neutral) with uncertainty flagged.

#### 4. Dietary & Category Compatibility (Max 20 Points)
- **Food Type Match:** 10 points (VEGETARIAN vs NON_VEGETARIAN). *Hard exclusion if NGO strictly rejects the food type.*
- **Category Match:** 10 points for preferred category, 10 points if unrestricted.

---

### 📍 GPS Coordinate Auto-Detection & Mandatory Coordinates
- **Mandatory Geographic Coordinates:** Coordinates (`[longitude, latitude]`) are mandatory in both backend schemas, payload validation, and frontend forms for precise Haversine calculation.
- **Auto-Detect Location (GPS):** Donors can click the **Auto-detect Location (GPS)** button to automatically query the browser Geolocation API (`navigator.geolocation.getCurrentPosition`), populating latitude and longitude with meter-level accuracy.

---

### 📡 Feature 4 API Endpoints

All endpoints require JWT Bearer authentication (`protect`):

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/matching/donations/:donationId/ngos` | `DONOR` (Owner) | Returns ranked eligible NGOs for a food surplus listing with score breakdown and plain-language reasons |
| `GET` | `/api/matching/ngos/:ngoId/donations` | `NGO` (Self) | Returns ranked available donations suitable for the authenticated NGO |

---

### 🖥️ Frontend Matching Components

- **Recommended NGOs Module (`RecommendedNgosSection.jsx`):** Integrated into the donor's Donation Details page (`/donations/:id`). Ranks suitable NGOs with visual score badges, proximity indicators, capacity checks, and interactive *"Why this match?"* breakdown accordions.
- **Recommended Donations Module (`RecommendedDonationsSection.jsx`):** Integrated into the NGO Dashboard (`/ngo/dashboard`) and Available Donations feed (`/ngo/available-donations`). Highlights best-fit food surplus matching the organization's location and serving capacity.

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

### 3. Run Test Suite
```bash
# Run all 74 unit & integration tests from repository root
npm test
```

