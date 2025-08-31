import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Shield, 
  Activity,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

const SidebarLink = ({ to, icon, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 group ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
          : 'text-slate-600 hover:text-slate-900'
      }`
    }
  >
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="transition-transform"
    >
      {icon}
    </motion.div>
    <span className="font-medium">{children}</span>
  </NavLink>
);

const sidebarItems = [
  { to: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
  { to: "/analyzer", icon: <MessageSquareText className="h-5 w-5" />, label: "AI Analyzer" },
  { to: "/sentiment", icon: <TrendingUp className="h-5 w-5" />, label: "Sentiment Analysis" },
  { to: "/engagement", icon: <BarChart3 className="h-5 w-5" />, label: "Engagement Hub" },
  { to: "/users", icon: <Users className="h-5 w-5" />, label: "User Insights" },
  { to: "/toxicity", icon: <Shield className="h-5 w-5" />, label: "Toxicity Monitor" },
  { to: "/realtime", icon: <Activity className="h-5 w-5" />, label: "Real-time Feed" }
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:block border-r bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          {/* Logo Section */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex h-16 items-center border-b border-slate-200/50 px-6 lg:h-[70px]"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SimPPL Insights
                </h1>
                <p className="text-xs text-slate-500">AI-Powered Analytics</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid items-start px-4 text-sm font-medium gap-2">
              {sidebarItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                >
                  <SidebarLink to={item.to} icon={item.icon}>
                    {item.label}
                  </SidebarLink>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-4 border-t border-slate-200/50"
          >
            <div className="text-xs text-slate-500 text-center">
              <p>Powered by AI</p>
              <p className="mt-1">v2.0.0</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center"
            >
              <Sparkles className="h-3 w-3 text-white" />
            </motion.div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SimPPL Insights
            </h1>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={closeMobileMenu}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 z-50 h-full w-80 bg-white shadow-xl lg:hidden"
              >
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        SimPPL Insights
                      </h1>
                    </div>
                    <button
                      onClick={closeMobileMenu}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <nav className="flex-1 space-y-2 p-4">
                    {sidebarItems.map((item, index) => (
                      <motion.div
                        key={item.to}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <SidebarLink 
                          to={item.to} 
                          icon={item.icon}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </SidebarLink>
                      </motion.div>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
    {/* Main Content */}
<main className="flex flex-col h-screen overflow-hidden">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex-1 overflow-auto"
  >
    <Outlet />
  </motion.div>
</main>

    </div>
  );
}