import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import SentimentAnalysis from './pages/SentimentAnalysis';
import EngagementHub from './pages/EngagementHub';
import UserInsights from './pages/UserInsights';
import ToxicityMonitor from './pages/ToxicityMonitor';
import RealtimeFeed from './pages/RealtimeFeed';

const pageVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.95
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1
  },
  out: { 
    opacity: 0, 
    x: 20,
    scale: 0.95
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

const AnimatedPage = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Routes>
        <Route element={<Layout />}>
          <Route 
            path="/" 
            element={
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/analyzer" 
            element={
              <AnimatedPage>
                <Analyzer />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/sentiment" 
            element={
              <AnimatedPage>
                <SentimentAnalysis />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/engagement" 
            element={
              <AnimatedPage>
                <EngagementHub />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/users" 
            element={
              <AnimatedPage>
                <UserInsights />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/toxicity" 
            element={
              <AnimatedPage>
                <ToxicityMonitor />
              </AnimatedPage>
            } 
          />
          <Route 
            path="/realtime" 
            element={
              <AnimatedPage>
                <RealtimeFeed />
              </AnimatedPage>
            } 
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;