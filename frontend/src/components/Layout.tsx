import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Calculator, Settings, Menu, X, Sun, Moon, ChevronLeft, ChevronRight, School } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Estado da Sidebar Colapsada (Desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const menuItems = [
    { path: '/painel', label: 'Painel Visual', icon: Calendar },
    { path: '/calculadora', label: 'Calculadora', icon: Calculator },
    { path: '/manage', label: 'Gerenciamento', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen text-text-main font-sans overflow-hidden transition-colors duration-300 relative bg-transparent">
      
      {/* Mesh Gradients Orgânicos Flutuantes de Fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-bg transition-colors duration-500">
        {/* Luz Azul */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-primary/12 dark:bg-primary/8 blur-[100px] md:blur-[130px] animate-mesh-1"></div>
        {/* Luz Laranja */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-accent/10 dark:bg-accent/8 blur-[100px] md:blur-[130px] animate-mesh-2"></div>
      </div>
      
      {/* Header Mobile */}
      <header className="lg:hidden h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-30 shrink-0 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <School className="w-5 h-5 text-primary" />
          <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-widest uppercase">
            SGST
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Botão Tema Mobile */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-muted hover:bg-surface hover:text-text-main btn-tactile active:scale-95 transition-all"
            title="Alternar tema"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-text-muted hover:bg-surface btn-tactile active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar Mobile (Drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay escuro */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          ></div>
          
          {/* Sidebar Drawer */}
          <aside className="relative w-72 max-w-[80vw] glass-panel h-full flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-300 transition-colors">
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-b from-card/40 to-transparent">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-widest uppercase">
                  SGST
                </span>
              </div>
              <button 
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-text-muted hover:bg-surface hover:text-text-main btn-tactile transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 flex flex-col gap-2.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-base transition-all duration-200 border border-transparent btn-tactile ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm font-black' 
                        : 'text-text-muted hover:bg-surface hover:text-text-main'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-6 border-t border-border text-xs text-center text-text-muted font-medium uppercase tracking-widest bg-surface/30">
              v2.0 - Senac Edition
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar Desktop PREMIUM (Colapsável e Flutuante com visual Glassmorphic) */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-64'} glass-panel my-4 ml-4 rounded-3xl flex-col shadow-[0_8px_32px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-20 shrink-0 transition-all duration-300 relative`}>
        
        {/* Topo / Logo */}
        <div className={`p-6 border-b border-border/50 flex items-center bg-gradient-to-b from-card/30 to-transparent transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <School className={`text-primary transition-all ${sidebarCollapsed ? 'w-8 h-8' : 'w-6 h-6'}`} />
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-widest uppercase font-display">
                  SGST
                </span>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider -mt-0.5">Gestão de Ambientes</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Links de Navegação */}
        <nav className="flex-1 p-4 flex flex-col gap-3.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center rounded-2xl font-bold transition-all duration-300 border btn-tactile ${
                  sidebarCollapsed ? 'justify-center p-3.5' : 'gap-4 px-4 py-3.5 text-base'
                } ${
                  isActive 
                    ? 'bg-primary/10 text-primary border-primary/25 shadow-xs font-black' 
                    : 'text-text-muted hover:bg-surface/50 hover:text-text-main border-transparent'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`transition-all ${sidebarCollapsed ? 'w-6 h-6' : 'w-5.5 h-5.5'} ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé / Controles */}
        <div className="p-4 border-t border-border/50 flex flex-col gap-2 shrink-0 bg-surface/10 rounded-b-3xl">
          
          {/* Botão de Tema */}
          <button
            onClick={toggleTheme}
            className={`flex items-center rounded-xl hover:bg-surface/50 text-text-muted hover:text-text-main btn-tactile cursor-pointer ${
              sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5 text-sm font-bold'
            }`}
            title="Alternar tema"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5" />
                {!sidebarCollapsed && <span>Modo Escuro</span>}
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 text-amber-400" />
                {!sidebarCollapsed && <span>Modo Claro</span>}
              </>
            )}
          </button>

          {/* Botão Colapsar Sidebar */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center rounded-xl hover:bg-surface/50 text-text-muted hover:text-text-main btn-tactile cursor-pointer ${
              sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5 text-sm font-bold'
            }`}
            title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Recolher Menu</span>
              </>
            )}
          </button>
          
          {!sidebarCollapsed && (
            <div className="text-[10px] text-center text-text-muted font-bold uppercase tracking-wider pt-2 border-t border-border/50">
              v2.0 - Senac
            </div>
          )}
        </div>
      </aside>

      {/* Area de Conteúdo Principal */}
      <main className="flex-1 overflow-auto relative z-10 transition-all duration-300">
        <div className="mx-auto p-4 md:p-6 lg:p-8 h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
