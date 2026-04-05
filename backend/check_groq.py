import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    print(f"Testing Groq with Key: {api_key[:5]}...{api_key[-5:]}")
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello. Response in 3 words."}],
            model="llama-3.3-70b-versatile",
        )
        print(f"Response: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_groq()
