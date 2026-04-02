# Deployment Guide - PriceWatch Pro

PriceWatch Pro is designed for high-availability production environments. Follow this guide to deploy your intelligence engine locally or to the cloud.

## 💻 Local Quickstart

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- ScraperAPI Key (Sign up at scraperapi.com)

### 2. Backend Config
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
# Set your API Key in proxy_manager.py
python main.py
```

### 3. Frontend Config
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Production Deployment (PostgreSQL)

For a 10/10 production setup, we recommend using **PostgreSQL** for data persistence.

### 1. Environment Variables
Set the following variables on your host or in your `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/pricewatch

# API Security (Planned feature)
API_SECRET=your_secret_key
```

### 2. Docker Deployment (Recommended)
Create a `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: pricewatch
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:password@db/pricewatch
    depends_on:
      - db
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
```

## 🛡️ Anti-Bot Scaling
To increase tracking capacity:
1. **Increase ScraperAPI Credits**: Ensure your plan supports your target ASIN count * capture frequency.
2. **Increase Semaphore**: Adjust `scrape_semaphore = asyncio.Semaphore(N)` in `scheduler.py` based on your server's compute power.
3. **Regional Monitoring**: Add multiple `track` calls with different pincodes for every ASIN to build a comprehensive geographic heatmap.

## 🛠️ Troubleshooting
- **Scraper Returns Null**: Check ScraperAPI credits and verify that the API key is correctly set in `proxy_manager.py`.
- **Database Locked**: If using SQLite, avoid multiple manual migrations while the server is running. Switch to PostgreSQL for concurrent access.
- **CORS Errors**: Ensure `allow_origins=["*"]` is set in `main.py` if accessing from a custom domain.
