# Technical Documentation - PriceWatch Pro (v4.0.2)

## 🌍 Scraping Infrastructure & Resilience

### 1. Anti-Bot Strategy: curl_cffi + ScraperAPI
- **TLS/JA3 Fingerprinting**: Standard libraries (`requests`/`httpx`) are detected by Amazon's shield protocols due to low-level network patterns. We use **`curl_cffi`** to mimic modern Chrome 110+ TLS handshake signatures.
- **Proxy Management**: Every request is routed through **ScraperAPI**, which manages 40M+ residential/datacenter IPs, automatic header rotation, and CAPTCHA solving at the infrastructure layer.

### 2. Strategic Location Simulation
- **Method**: Cookie injection.
- **Protocol**: Setting `p13n-sc-address-zip` and `i18n-prefs` headers allows our system to bypass Amazon's Geo-IP logic and see real-time pricing/buybox changes for any Indian PIN code.

## 🧠 Neural Strategic Intelligence Layer

### 1. Groq Cloud (Llama-3-70B)
- **Engine**: Llama-3-70B running on Groq’s LPU (Language Processing Unit) for sub-second, low-latency market analysis.
- **Strategic Advisor logic**:
  - Raw telemetry (Price History, Buy Box status, Seller FBA flags) is synthesized into a custom prompt.
  - The model performs **Behavioral Prediction** (undercutting alerts) and **Competitive Strategy** (pricing suggestions).

### 2. Live Intelligence Stream (Terminal)
- **Implementation**: Frontend logic in `IntelligenceFeed.jsx` simulates the real-time background operation of the multi-node scraper fleet.
- **Log Types**: `[SUCCESS]`, `[PROXY ROTATION]`, `[SENTINEL TRIGGER]`, and `[NEURAL SYNC]`.

## 📊 Analytics Framework

### 1. Market Health Scoring
- **Volatility Score (0-100)**: Uses the **Coefficient of Variation (CV)**:
  `Score = min(100, (Standard Deviation / Mean Price) * 1000)`
- **Buy Box Win Rate**: Percentage calculation per seller based on historical Buy Box status occurrences across tracked regional nodes.

## 🎨 UI Architecture: Command Center Light-Mode

- **Glassmorphism Theme**: Uses semi-transparent white containers (`bg-white/80`) with backdrop blur filters and high-contrast slate text (`text-slate-900`) for accessibility and "Mission-Critical" aesthetics.
- **Zustand Store**: Centralized state management handles real-time data flow for the "Command Center" dashboard and product detail views.

## 📡 Database & Scalability

- **SQLAlchemy ORM**: Infrastructure-agnostic data layer.
- **Models**:
  - `Product`: Metadata for tracked Amazon ASINs.
  - `PriceHistory`: Time-series telemetry (ASIN, Seller, Price, Pincode, Buy Box).
  - `Alerts`: Monitoring sentinels for automated triggers.
