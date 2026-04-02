import os
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        return

    client = Groq(api_key=api_key)
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say hello!"}],
            model="llama-3.3-70b-versatile",
        )
        print("✅ Groq Connectivity: SUCCESS")
        print(f"Response: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Groq Connectivity: FAILED - {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
