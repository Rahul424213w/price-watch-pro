import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const useStore = create((set, get) => ({
  products: [],
  alerts: [],
  dashboardStats: {
    tracked_count: 0,
    total_market_value: 0,
    avg_market_price: 0,
    active_alerts: 0,
    buybox_status: 'Idle'
  },
  isConfigOpen: false,
  setConfigOpen: (open) => set({ isConfigOpen: open }),

  isLoading: false,
  isSearching: false,
  error: null,
  clearError: () => set({ error: null }),
  searchResults: null,

  config: (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pricewatch_config')) || {};
      return {
        pincode: stored.pincode || '110001',
        frequency: stored.frequency || '30',
        locationName: stored.locationName || 'New Delhi, DL',
      };
    } catch (e) {
      return { pincode: '110001', frequency: '30', locationName: 'New Delhi, DL' };
    }
  })(),

  isGlobalSyncing: false,
  setGlobalSyncing: (syncing) => set({ isGlobalSyncing: syncing }),

  setConfig: (newConfig) => {
    const updated = { ...get().config, ...newConfig };
    set({ config: updated });
    localStorage.setItem('pricewatch_config', JSON.stringify(updated));
    get().fetchAllProducts();
    get().fetchDashboardStats();
  },

  // Back-compat with older components
  updateConfig: (newConfig) => get().setConfig(newConfig),

  fetchDashboardStats: async () => {
    const { pincode } = get().config;
    try {
      const response = await axios.get(`${API_BASE}/dashboard/stats?pincode=${pincode}`);
      set({ dashboardStats: response.data });
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
    }
  },

  fetchAllProducts: async () => {
    const { pincode } = get().config;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/products?pincode=${pincode}`);
      set({ products: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  searchAmazon: async (query, pincode, page = 1) => {
    set({ isSearching: true, error: null });
    console.log(`[PriceWatch Search] Initializing Discovery for: "${query}" at ${pincode} (Page: ${page})`);
    try {
      const response = await axios.post(`${API_BASE}/search?query=${encodeURIComponent(query)}&pincode=${pincode}&page=${page}`);
      console.log(`[PriceWatch Search] Success! Found ${response.data?.length} assets.`);
      set({ searchResults: response.data, isSearching: false });
      return response.data;
    } catch (error) {
      console.error(`[PriceWatch Search] Fatal Error:`, error.response?.data || error.message);
      set({ error: error.message, isSearching: false, searchResults: [] });
      return [];
    }
  },

  trackProduct: async (asin, title, image, pincode) => {
    set({ isLoading: true });
    // Platinum Fallback: Ensure pincode is Never undefined
    const activePincode = pincode && pincode !== 'undefined' ? pincode : (get().config?.pincode || '110001');
    console.log(`[PriceWatch Tracking] Activating ASIN: ${asin} at ${activePincode}`);
    try {
      const response = await axios.post(`${API_BASE}/track?asin=${asin}&pincode=${activePincode}`);
      get().fetchDashboardStats();
      get().fetchAllProducts();
      set({ isLoading: false });

      // Update local search results state if they exist
      const results = get().searchResults;
      if (results) {
        const updatedResults = results.map(r => r.asin === asin ? { ...r, is_tracked: true } : r);
        set({ searchResults: updatedResults });
      }

      return response.data;
    } catch (error) {
      console.error(`[PriceWatch Tracking] Failed to activate ASIN:`, error.message);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchAlerts: async () => {
    try {
      const response = await axios.get(`${API_BASE}/alerts`);
      set({ alerts: response.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  createAlert: async (asin, target) => {
    try {
      // Automatic Tracking: Ensure product is in universe
      const currentProducts = get().products;
      const isAlreadyTracked = currentProducts.some(p => p.asin === asin);

      if (!isAlreadyTracked) {
        console.log(`[PriceWatch Automation] Auto-Activating ASIN: ${asin} for Sentinel`);
        const { pincode } = get().config;
        await get().trackProduct(asin, "", "", pincode);
      }

      await axios.post(`${API_BASE}/alert?asin=${asin}&target_price=${target}`);
      get().fetchAlerts();
    } catch (error) {
      set({ error: error.response?.data?.detail || error.message });
    }
  },

  getVolatility: async (asin) => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/volatility/${asin}`);
      return response.data;
    } catch (error) {
      console.error("Volatility Error:", error);
      return { score: 0 };
    }
  },

  getBuyBoxWinRate: async (asin) => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/buybox/${asin}`);
      return response.data;
    } catch (error) {
      console.error("Win Rate Error:", error);
      return [];
    }
  },

  exportReport: async (asin, format) => {
    const url = `${API_BASE}/export/${format}/${asin}`;
    window.open(url, '_blank');
  },

  resetProductHistory: async (asin) => {
    const { pincode } = get().config;
    set({ isLoading: true });
    try {
      await axios.delete(`${API_BASE}/history/${asin}`);
      await axios.post(`${API_BASE}/track?asin=${asin}&pincode=${pincode}`);
      get().fetchDashboardStats();
      get().fetchAllProducts();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteProduct: async (asin) => {
    try {
      await axios.delete(`${API_BASE}/product/${asin}`);
      get().fetchAllProducts();
      get().fetchDashboardStats();
    } catch (error) {
      console.error("Deletion Error:", error);
    }
  },

  resetDatabase: async () => {
    // Wipes DB tables via backend endpoint
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_BASE}/system/reset`);
      await get().fetchAllProducts();
      await get().fetchDashboardStats();
      await get().fetchAlerts();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.detail || error.message, isLoading: false });
    }
  },

  getProductDetails: async (asin) => {
    const { pincode } = get().config;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/product/${asin}?pincode=${pincode}`);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  getRegionalComparison: async (asin) => {
    try {
      const response = await axios.get(`${API_BASE}/regional/comparison/${asin}`);
      return response.data;
    } catch (error) {
      console.error("Regional Error:", error);
      return [];
    }
  },

  triggerRegionalScrape: async (asin) => {
    console.log(`[Regional Intel] Initializing 5-Zone Burst for ASIN: ${asin}`);
    try {
      const response = await axios.post(`${API_BASE}/regional/scrape/${asin}`);
      console.log(`[Regional Intel] Consolidated Success across major nodes.`);
      return response.data;
    } catch (error) {
      console.error("Regional Scrape Error:", error);
      set({ error: "Regional scraping failed. Check connectivity." });
      return null;
    }
  },

  syncAllProducts: async () => {
    const { pincode } = get().config;
    set({ isGlobalSyncing: true });
    console.log("[Global Sync] Initializing fleet-wide telemetry update...");
    try {
      await axios.post(`${API_BASE}/products/sync?pincode=${pincode}`);
      console.log("[Global Sync] Fleet synchronization complete.");
      await get().fetchAllProducts();
      await get().fetchDashboardStats();
      set({ isGlobalSyncing: false });
    } catch (error) {
      console.error("Sync Error:", error);
      set({ isGlobalSyncing: false, error: "Global synchronization failed." });
    }
  },

  // --- NEURAL INTELLIGENCE ACTIONS ---

  getAIPricingAdvice: async (asin) => {
    const { pincode } = get().config;
    try {
      const response = await axios.post(`${API_BASE}/ai/pricing-advisor/${asin}?pincode=${pincode}`);
      return response.data.advice;
    } catch (error) {
      console.error("AI Pricing Error:", error);
      return "Strategic analysis pending. Node synchronization required.";
    }
  },

  getAIMarketInsight: async (asin) => {
    try {
      const response = await axios.post(`${API_BASE}/ai/market-insight/${asin}`);
      return response.data.insight;
    } catch (error) {
      console.error("AI Market Error:", error);
      return "Market dynamics currently stabilizing. Intelligence gathering in progress.";
    }
  },

  getAIUndercutPrediction: async (asin) => {
    try {
      const response = await axios.post(`${API_BASE}/ai/undercut-prediction/${asin}`);
      return response.data.prediction;
    } catch (error) {
      console.error("AI Prediction Error:", error);
      return "Undercut baseline established. Behavioral analysis active.";
    }
  },

  // --- WHATSAPP SMART ACTIONS ---

  sendWhatsAppStatus: async (asin) => {
    console.log(`[WhatsApp Pulse] Dispatching status for ASIN: ${asin}`);
    try {
      await axios.post(`${API_BASE}/api/whatsapp/send-status/${asin}`);
    } catch (error) {
      console.error("WhatsApp Status Error:", error);
      const msg = error.response?.data?.detail || "Failed to dispatch WhatsApp status.";
      set({ error: msg });
    }
  },

  sendWhatsAppAnalysis: async (asin) => {
    console.log(`[WhatsApp Intelligence] Dispatching neural analysis for ASIN: ${asin}`);
    try {
      await axios.post(`${API_BASE}/api/whatsapp/send-analysis/${asin}`);
    } catch (error) {
      console.error("WhatsApp Analysis Error:", error);
      const msg = error.response?.data?.detail || "Neural report dispatch failed.";
      set({ error: msg });
    }
  },

  subscribeWhatsApp: async (asin, number, label) => {
    console.log(`[WhatsApp Sentinel] Registering ${number} for ASIN: ${asin}`);
    try {
      await axios.post(`${API_BASE}/api/whatsapp/subscribe`, {
        product_id: asin,
        whatsapp_number: number,
        label: label
      });
      console.log(`[WhatsApp Sentinel] Subscription active for ${asin}`);
      return true;
    } catch (error) {
      console.error("WhatsApp Subscription Error:", error.response?.data?.detail || error.message);
      set({ error: error.response?.data?.detail || "Failed to subscribe for WhatsApp alerts." });
      return false;
    }
  },

}));

export default useStore;
