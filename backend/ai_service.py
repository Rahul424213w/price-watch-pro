import os
from groq import Groq
from dotenv import load_dotenv
import json
from typing import List, Dict, Any

load_dotenv()

class AIService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile" # Using Llama 3.3 70B for high-quality strategic insights

    async def get_pricing_advice(self, product_title: str, current_price: float, sellers: List[Dict]) -> str:
        """AI Pricing Advisor - Suggests best price to win Buy Box"""
        prompt = f"""
        Product: {product_title}
        Current Price: ₹{current_price}
        Sellers List: {json.dumps(sellers)}
        
        Task: Provide a high-impact, concise strategic price to win the Buy Box. 
        Focus ONLY on the single most important action.
        
        Formatting:
        - Start with the exact suggested price in **bold**.
        - Provide the TOP 3 rationale points in a bulleted list.
        - Keep the total response under 60 words.
        Format example: "**₹[PRICE]** is the optimal strike price.\n- [Reason 1]\n- [Reason 2]\n- [Reason 3]"
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

    async def explain_market(self, product_title: str, sellers: List[Dict], history_summary: str) -> str:
        """Explain This Market - Market Insight Generator"""
        prompt = f"""
        Product: {product_title}
        Sellers: {json.dumps(sellers)}
        History: {history_summary}
        
        Task: Synthesize market dynamics into 3 key "Neural Insights". 
        Focus on competitor dominance and the single biggest barrier to the Buy Box.
        
        Formatting:
        - Use exactly 3 bullet points.
        - Bold the 'Dominant Seller'.
        - State a one-line 'Strategic Advantage'.
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

    async def predict_undercut(self, product_title: str, recent_history: List[Dict]) -> str:
        """Undercut Strategy Predictor"""
        prompt = f"""
        Product: {product_title}
        Recent Pricing Events: {json.dumps(recent_history)}
        
        Task: Identify the SINGLE most likely seller to undercut next. 
        Base this on the highest frequency of recent price drops.
        
        Formatting:
        - Identify the 'Primary Undercutter' in **bold**.
        - Provide the 'Trigger Event' (e.g., "Drops every 4 hours").
        - state a 'Response Recommendation'.
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

    async def get_location_strategy(self, product_title: str, regional_prices: List[Dict]) -> str:
        """Location Strategy Advisor"""
        prompt = f"""
        Product: {product_title}
        Regional Prices (PIN Code Analysis): {json.dumps(regional_prices)}
        
        Task: Identify the TOP 2 regional opportunities for pricing adjustments.
        Focus on where regional price gaps are largest.
        
        Formatting:
        - **[REGIONAL TARGET]**: [Actionable Adjustment]
        - **[REGIONAL TARGET]**: [Actionable Adjustment]
        - Keep it extremely surgical.
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

    async def forecast_trends(self, product_title: str, price_history: List[float]) -> str:
        """Price Trend Forecast"""
        prompt = f"""
        Product: {product_title}
        Historical Prices (Last 7 Days): {price_history}
        
        Task: Forecast the price direction for the next 4 hours only.
        
        Formatting:
        - Direction: [UP/DOWN/STABLE]
        - Target Price Delta: [±₹X]
        - Neural Confidence: [0-100%]
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

    async def generate_smart_alert_explanation(self, asin: str, trigger_type: str, details: Dict) -> str:
        """Smart Alerts (AI-powered) - Explains why an alert was triggered"""
        prompt = f"""
        Alert Triggered for ASIN: {asin}
        Event Type: {trigger_type}
        Event Details: {json.dumps(details)}
        
        Task: Provide a one-sentence "Smart Insight" explaining WHY this alert was triggered and what it means for the distributor.
        Example: "Alert: Price drop detected due to new seller entry (Seller D) undercutting by ₹15."
        """
        
        chat_completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
        )
        return chat_completion.choices[0].message.content

# Singleton instance
ai_service = AIService()
