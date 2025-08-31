import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText } from 'lucide-react';

const SidebarLink = ({ to, icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-slate-900 ${
        isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
      }`
    }
  >
    {icon}
    {children}
  </NavLink>
);

export default function Layout() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr]">
      <div className="hidden border-r bg-slate-100/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <h1 className="font-bold text-lg text-slate-800">SimPPL Insights</h1>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <SidebarLink to="/" icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </SidebarLink>
              <SidebarLink to="/analyzer" icon={<MessageSquareText className="h-4 w-4" />}>
                Analyzer
              </SidebarLink>
            </nav>
          </div>
        </div>
      </div>
      <main className="flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}