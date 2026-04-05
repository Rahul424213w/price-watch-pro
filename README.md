# PriceWatch Pro - AI-Powered Competitive Intelligence (v4.0.2)

PriceWatch Pro is a high-performance, production-grade Amazon market intelligence system designed for industrial distributors. It features **Groq-Powered Neural Intelligence** (Llama-3-70B) for strategic decision-making, real-time geographic telemetry, and a premium "Command Center" interface.

## 🧠 Neural Strategic Intelligence
The platform transforms raw market telemetry into actionable "Executive Directives" using the **Groq Llama-3-70B** engine.
- **Neural Advisor Card**: Integrated Llama-3 insights directly in the product view for instant pricing strategies.
- **Undercut Predictor**: Behavioral analysis forecasting competitor price drops.
- **Regional Arbitrage**: AI-driven warehouse stocking recommendations based on geographic price deltas.
- **Executive PDF Synthesis**: High-fidelity reports with "Neural Strategic Directives."

## 🚀 Key Strategic Features

- **WhatsApp Smart Alerts (Live Plugin)**:
  - **Automated Pulse**: Real-time Buy Box and Price Drop notifications delivered via Twilio.
  - **Interactive Sentinels**: Manually trigger a "Quick Status" update for any asset directly from the Alerts dashboard.
  - **Neural WhatsApp Reports**: Synthesize and broadcast AI-driven market analysis reports to your mobile device with one click.
- **Live Intelligence Stream**: A real-time terminal feed visualizing proxy rotations, node verifications, and sentinel activations.
- **Regional Intelligence Matrix**: 
  - **Multi-Node Sync**: Concurrent scraping across 5 major Indian metropolitan nodes (Delhi, Mumbai, Bangalore, Kolkata, Chennai).
  - **Bypassing Geo-IP**: Advanced location simulation via cookie injection (`p13n-sc-address-zip`).
- **Anti-Bot Hardening**: Dual-layer defense using **ScraperAPI** (IP rotation) and **curl_cffi** (TLS/JA3 fingerprinting).
- **Advanced Market Analytics**:
  - **Price Volatility Scoring**: Coefficient of Variation (CV) based risk assessment.
  - **Buy Box Mastery**: Precise win-rate tracking per seller across regional zones.
- **Elite Command Center UI**: A premium, light-mode glassmorphic dashboard built for high-legibility in mission-critical environments.

## 🛠️ System Architecture

- **Backend**: 
  - **Framework**: FastAPI (Python 3.10+)
  - **Intelligence**: Groq Cloud API (Llama-3-70B)
  - **Alerts**: Twilio WhatsApp Business API
  - **Engine**: Selectolax (fast parsing) + ScraperAPI (enterprise-grade proxies)
  - **Database**: SQLAlchemy ORM (SQLite/Postgres)
- **Frontend**: 
  - **Identity**: React 18 (Vite) + TailwindCSS
  - **Design System**: "Command Center" Glassmorphism
  - **State**: Zustand for global telemetry synchronization

## 📦 Setup & Intelligence Activation

### 1. Requirements
- Python 3.10+
- Node.js 18+
- ScraperAPI, Groq Cloud, and **Twilio** (WhatsApp Sandbox) API Keys

### 2. Backend Orchestration
```bash
cd backend
pip install -r requirements.txt
python main.py
# Ensure environment variables are set in .env:
# WHATSAPP_ACCOUNT_SID=...
# WHATSAPP_AUTH_TOKEN=...
# WHATSAPP_FROM_NUMBER=whatsapp:+14155238886
# WHATSAPP_TO_NUMBER=whatsapp:+91XXXXXXXXXX
# WHATSAPP_ALERTS_ENABLED=true

```

### 3. Frontend Deployment
```bash
cd frontend
npm install
npm run dev
```

## 📄 Mission Documentation

- [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) - Infrastructure deep-dive.
- [HACKATHON_GUIDE.md](HACKATHON_GUIDE.md) - The Winning Script & Defense Strategy.

## ⚖️ License
MIT License. Engineered for Market Dominance.
