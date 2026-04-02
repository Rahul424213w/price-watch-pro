import asyncio
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from proxy_manager import manager
from scraper import get_headers

async def verify():
    print("Testing Header Forwarding via ScraperAPI...")
    # Use an echo service to see what headers the server receives
    test_url = "https://httpbin.org/headers"
    pincode = "400001" # Mumbai
    headers = await get_headers(pincode)
    
    print(f"Original Headers: {headers}")
    
    try:
        response = await manager.get(test_url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            received_headers = data.get("headers", {})
            print(f"\nReceived Headers at HttpBin:")
            for k, v in received_headers.items():
                if "Cookie" in k or "User-Agent" in k:
                    print(f"  {k}: {v}")
            
            pincode_found = pincode in received_headers.get("Cookie", "")
            if pincode_found:
                print("\n✅ SUCCESS: Pincode cookie forwarded through ScraperAPI!")
            else:
                print("\n❌ FAILURE: Pincode cookie MISSING at destination.")
        else:
            print(f"\n❌ FAILED: Status code {response.status_code}")
    except Exception as e:
        print(f"\n❌ ERROR during verification: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
