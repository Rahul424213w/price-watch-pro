import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import AlertsPage from './pages/Alerts';
import ProductDetail from './pages/ProductDetail';
import TrackedProducts from './pages/TrackedProducts';
import RegionalAnalysis from './pages/RegionalAnalysis';
import RegionalMatrix from './pages/RegionalMatrix';
import AIAnalysis from './pages/AIAnalysis';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/tracked" element={<TrackedProducts />} />
          <Route path="/product/:asin" element={<ProductDetail />} />
          <Route path="/regional/:asin" element={<RegionalAnalysis />} />
          <Route path="/regional-matrix" element={<RegionalMatrix />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
