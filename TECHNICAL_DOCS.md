# Technical Documentation - PriceWatch Pro Intelligence Engine

## 🌍 Scraping Infrastructure

### 1. Anti-Bot Strategy: curl_cffi + ScraperAPI
PriceWatch Pro uses a dual-layer defense bypass:
- **curl_cffi (Library)**: Emulates the TLS fingerprint of modern browsers (Chrome 110+). This bypasses low-level network fingerprinting that standard libraries like `requests` or `httpx` fail.
- **ScraperAPI (Proxy)**: Provides over 40M+ residential/datacenter IPs, automatic header rotation, and CAPTCHA solving. Every request to Amazon is routed through a unique proxy node.

### 2. Location Simulation
- **Mechanism**: Use of `p13n-sc-address-zip` and `i18n-prefs` cookies.
- **Implementation**: The `scraper.py` injects the target PIN code into the request cookie header. This forces Amazon to show regional pricing, Buy Box winners, and stock status for that specific location.

## 📊 Data Extraction & Reliability

### 1. Advanced Price Detection
- **Multi-Selector Logic**: We use 6+ hierarchical CSS selectors to catch prices in diverse Amazon layouts (Standard, Deal, Buy Box Inside, Core Price).
- **Hidden Price Parsing**: "See price in cart" cases are handled by extracting `buyingPrice` from the embedded page JSON blobs using regex fallback if CSS selectors return null.
- **Out of Stock Detection**: Explicit checks for "currently unavailable" text and fallback to zero-price validation ensure accurate stock status.

### 2. Marketplace Intelligence (Seller Matrix)
- **Buy Box Priority**: The system identifies the current Buy Box holder and treats them as the primary data point.
- **Seller Comparison**: We extract the Top 5 alternate sellers (via `#mbc-box-all`) to calculate market dominance and win rates.

## 📈 Analytics & Calculations

### 1. Price Volatility Score (0-100)
Calculated using the **Coefficient of Variation (CV)**:
`Score = min(100, (Standard Deviation / Mean Price) * 1000)`
High scores indicate frequent/large price swings, alerting users to unstable market conditions.

### 2. Buy Box Win Rate (%)
`Win Rate = (Count of Buy Box occurrences for Seller / Total Scrapes for ASIN) * 100`

## 📡 Pipeline Scalability

- **Concurrent Scheduler**: Uses `apscheduler` with an `asyncio.Semaphore(3)`. This limits peak network load while allowing multiple assets to be analyzed in parallel.
- **PostgreSQL Support**: The `database.py` allows seamless swapping from SQLite to PostgreSQL for high-volume enterprise deployments using the `DATABASE_URL` environment variable.
