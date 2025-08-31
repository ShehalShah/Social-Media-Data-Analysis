import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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

// Reusable SidebarLink component with a clean, light theme design
const SidebarLink = ({ to, icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3.5 rounded-lg px-4 py-2.5 transition-all duration-200 font-medium text-sm ${
                isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
        }
    >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            {icon}
        </motion.div>
        <span>{children}</span>
    </NavLink>
);

// Navigation items definition
const sidebarItems = [
    { to: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { to: "/analyzer", icon: <MessageSquareText className="h-5 w-5" />, label: "AI Analyzer" },
    { to: "/sentiment", icon: <TrendingUp className="h-5 w-5" />, label: "Sentiment Analysis" },
    { to: "/engagement", icon: <BarChart3 className="h-5 w-5" />, label: "Engagement Hub" },
    { to: "/users", icon: <Users className="h-5 w-5" />, label: "User Insights" },
    { to: "/toxicity", icon: <Shield className="h-5 w-5" />, label: "Toxicity Monitor" },
    { to: "/realtime", icon: <Activity className="h-5 w-5" />, label: "Real-time Feed" }
];

// Main Layout component with the new light theme design
export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen w-full bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
            {/* Desktop Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:block border-r border-slate-200 bg-white"
            >
                <div className="flex h-full max-h-screen flex-col">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex h-[70px] items-center border-b border-slate-200 px-6"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 10, -5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                                className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30"
                            >
                                <Sparkles className="h-5 w-5 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="font-bold text-xl bg-indigo-600 bg-clip-text text-transparent">
                                    Social Insights
                                </h1>
                                <p className="text-xs text-slate-500">AI-Powered Analytics</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto py-6">
                        <nav className="grid items-start px-4 text-sm gap-2">
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

                    {/* Sidebar Footer */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="p-4 mt-auto border-t border-slate-200"
                    >
                        <div className="text-xs text-slate-500 text-center">
                            <p>&copy; {new Date().getFullYear()} Social Inc.</p>
                            <p className="mt-1">Version 2.0.0</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Mobile View Wrapper */}
            <div className="flex flex-col lg:hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-4 sticky top-0 z-30">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Social Insights
                        </h1>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </motion.button>
                </header>

                {/* Mobile Sidebar Overlay and Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40"
                                onClick={closeMobileMenu}
                            />
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed left-0 top-0 z-50 h-full w-[280px] bg-white shadow-xl"
                            >
                                <div className="flex h-full flex-col">
                                    <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                                <Sparkles className="h-4 w-4 text-white" />
                                            </div>
                                            <h1 className="font-bold text-lg bg-indigo-600 bg-clip-text text-transparent">
                                                Social Insights
                                            </h1>
                                        </div>
                                        <button
                                            onClick={closeMobileMenu}
                                            className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                                            aria-label="Close menu"
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
                                                <SidebarLink to={item.to} icon={item.icon} onClick={closeMobileMenu}>
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
            
            {/* Main Content Area */}
            <main className="flex flex-col max-h-screen overflow-hidden">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 overflow-auto"
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}

