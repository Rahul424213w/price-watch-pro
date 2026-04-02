import httpx
import asyncio
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

async def debug_search(query="skf bearing"):
    url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    
    async with httpx.AsyncClient(timeout=30, follow_redirects=True, http2=True) as client:
        response = await client.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        with open("amazon_debug.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print("Saved response to amazon_debug.html")

if __name__ == "__main__":
    asyncio.run(debug_search())
