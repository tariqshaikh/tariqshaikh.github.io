/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Portfolio from './components/Portfolio';
import Homebase from './components/Homebase';
import Orbit from './components/Orbit';
import NetWorth from './components/NetWorth';
import OrbitHome from './components/OrbitHome';
import NetWorthHistory from './components/NetWorthHistory';
import CurrencyConverter from './components/CurrencyConverter';
import RetirementPlanner from './components/RetirementPlanner';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/homebase" element={<Homebase />} />
        <Route path="/orbit" element={<OrbitHome />} />
        <Route path="/orbit/dashboard" element={<OrbitHome />} />
        <Route path="/orbit/balance-sheet" element={<NetWorth />} />
        <Route path="/orbit/history" element={<NetWorthHistory />} />
        <Route path="/orbit/simulator" element={<Orbit />} />
        <Route path="/orbit/currency-converter" element={<CurrencyConverter />} />
        <Route path="/orbit/retirement-planner" element={<RetirementPlanner />} />
      </Routes>
    </Router>
  );
}

