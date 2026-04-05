import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_twilio():
    sid = os.getenv("WHATSAPP_ACCOUNT_SID")
    token = os.getenv("WHATSAPP_AUTH_TOKEN")
    from_no = os.getenv("WHATSAPP_FROM_NUMBER")
    to_no = os.getenv("WHATSAPP_TO_NUMBER")
    
    print(f"Testing with SID: {sid[:5]}...{sid[-5:]}")
    print(f"Testing with Token: {token[:2]}...{token[-2:]}")
    
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    payload = {
        "From": from_no,
        "To": to_no,
        "Body": "Twilio Connectivity Test from PriceWatch Pro",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=payload, auth=(sid, token))
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_twilio())
