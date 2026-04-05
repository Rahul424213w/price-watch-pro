import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_scraper_api():
    api_key = os.getenv("SCRAPER_API_KEY")
    url = "https://www.amazon.in/dp/B00DBOSQSK"
    proxy_url = f"http://api.scraperapi.com?api_key={api_key}&url={url}"
    
    print(f"Testing ScraperAPI with Key: {api_key[:5]}...{api_key[-5:]}")
    try:
        response = requests.get(proxy_url, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response snippet: {response.text[:200]}")
        
        # Check ScraperAPI Account Info (if possible)
        # They have an account endpoint: https://api.scraperapi.com/account?api_key=xxx
        acc_url = f"https://api.scraperapi.com/account?api_key={api_key}"
        acc_resp = requests.get(acc_url)
        print(f"\nAccount Status Code: {acc_resp.status_code}")
        print(f"Account Info: {acc_resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scraper_api()
