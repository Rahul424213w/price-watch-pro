import random
import time
import asyncio
import os
from typing import Optional, Dict, Any
from curl_cffi.requests import AsyncSession, Response

class ProxyProvider:
    def get_proxy_url(self, target_url: str) -> str:
        raise NotImplementedError

class ScraperAPIProvider(ProxyProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "http://api.scraperapi.com"

    def get_proxy_url(self, target_url: str, keep_headers: bool = False) -> str:
        url = f"{self.base_url}?api_key={self.api_key}&url={target_url}&render=false&country_code=in"
        if keep_headers:
            url += "&keep_headers=true"
        return url

class ProxyManager:
    def __init__(self, api_key: str = None):
        if api_key is None:
            api_key = os.getenv("SCRAPER_API_KEY", "REPLACE_WITH_YOUR_SCRAPERAPI_KEY")
        self.provider = ScraperAPIProvider(api_key)
        self.max_retries = 3
        self.fallback_enabled = True
        self._session: Optional[AsyncSession] = None

    async def get_session(self) -> AsyncSession:
        if self._session is None:
            self._session = AsyncSession()
        return self._session

    async def get(self, url: str, headers: Optional[Dict] = None, timeout: int = 60) -> Response:
        last_exception = None
        session = await self.get_session()
        
        # 1. Try with Proxy (only if key is not a placeholder)
        # Note: bcfec key is the user's current key, we'll allow it but flag it
        is_placeholder = self.provider.api_key == "REPLACE_WITH_YOUR_SCRAPERAPI_KEY"
        
        if not is_placeholder:
            for attempt in range(self.max_retries):
                try:
                    proxy_url = self.provider.get_proxy_url(url, keep_headers=True)
                    print(f"[ProxyManager] Attempt {attempt + 1} for {url} via ScraperAPI")
                    
                    response = await session.get(proxy_url, headers=headers, timeout=timeout, impersonate="chrome110")
                    
                    if response.status_code == 200:
                        return response
                    
                    # Implement exponential backoff for 403, 429, 500 or CAPTCHA hints
                    is_captcha = "captcha" in response.text.lower() or "detect" in response.text.lower()
                    if response.status_code in [403, 429, 500] or is_captcha:
                        backoff = (2 ** attempt) + random.uniform(1, 3)
                        print(f"[ProxyManager] Issue detected ({response.status_code} / Captcha: {is_captcha}). Backoff: {backoff:.2f}s")
                        await asyncio.sleep(backoff)
                        continue
                        
                except Exception as e:
                    print(f"[ProxyManager] Proxy error: {e}")
                    last_exception = e
                    await asyncio.sleep(random.uniform(1, 3) * (attempt + 1))

        # 2. Fallback to Direct Request
        if self.fallback_enabled:
            reason = "Proxy Key Placeholder" if is_placeholder else "Proxy Attempts Exhausted"
            print(f"[ProxyManager] Falling back to direct request. Reason: {reason}")
            try:
                response = await session.get(url, headers=headers, timeout=timeout, impersonate="chrome110")
                return response
            except Exception as e:
                print(f"[ProxyManager] Direct fallback failed: {e}")
                last_exception = e

        if last_exception:
            raise last_exception
        
        raise Exception(f"Failed to fetch {url} after multiple attempts")

# Single instance for the application
manager = ProxyManager()
