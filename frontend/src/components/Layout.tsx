import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Calculator, Settings } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const menuItems = [
    { path: '/painel', label: 'Painel Visual', icon: Calendar },
    { path: '/calculadora', label: 'Calculadora', icon: Calculator },
    { path: '/manage', label: 'Gerenciamento', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Sidebar PREMIUM */}
      <aside className="w-72 2xl:w-96 bg-white border-r border-gray-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 transition-all duration-300">
        <div className="p-8 2xl:p-12 border-b border-gray-100 flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50">
          <div className="bg-[var(--color-primary)] text-white font-black text-2xl 2xl:text-4xl rounded-2xl px-6 py-4 2xl:px-8 2xl:py-6 shadow-[0_8px_30px_rgb(27,121,135,0.3)] flex items-center gap-3 tracking-widest uppercase">
            <span className="text-3xl 2xl:text-5xl">⚡</span> SGST
          </div>
        </div>
        
        <nav className="flex-1 p-6 2xl:p-8 flex flex-col gap-3 2xl:gap-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 2xl:px-6 2xl:py-5 rounded-2xl font-bold text-lg 2xl:text-2xl transition-all duration-300 border-2 ${
                  isActive 
                    ? 'bg-blue-50/50 text-[var(--color-primary)] border-[var(--color-primary)]/20 shadow-sm translate-x-2' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-transparent hover:border-gray-100'
                }`}
              >
                <Icon className={`w-6 h-6 2xl:w-8 2xl:h-8 ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 2xl:p-8 border-t border-gray-100 text-sm 2xl:text-xl text-center text-gray-400 font-medium uppercase tracking-widest bg-gray-50/50">
          v2.0 - React Edition
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#f8fafc] relative">
        <div className="mx-auto p-8 2xl:p-12 h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
