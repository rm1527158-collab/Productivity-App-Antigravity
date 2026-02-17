import React from 'react';
import { NavLink } from 'react-router-dom';
import { SquaresFour, Checks, ArrowsClockwise, Trophy, ChartBar, Gear, CaretLeft, CaretRight, Leaf, Shuffle } from '@phosphor-icons/react';
import clsx from 'clsx';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: SquaresFour },
    { name: 'Tasks', path: '/daily', icon: Checks },
    { name: 'Habits', path: '/routine', icon: ArrowsClockwise },
    { name: 'Goals', path: '/vision', icon: Trophy },
    { name: 'Random Goals', path: '/random-goals', icon: Shuffle },
  ];

  return (
    <aside 
      className={clsx(
        "h-screen bg-cream-100/90 backdrop-blur-md border-r border-border/60 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Toggle Button (Desktop Only) */}
      <button 
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 bg-cream-50 border border-border rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:scale-105 transition-all shadow-sm"
      >
        {isCollapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
      </button>

      {/* Logo Area */}
      <div className={clsx("h-24 flex items-center border-b border-border/40 transition-all duration-300", isCollapsed ? "justify-center px-0" : "justify-start px-8")}>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
          <Leaf size={20} weight="fill" />
        </div>
        <div className={clsx("ml-4 overflow-hidden whitespace-nowrap transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
            <h1 className="text-2xl font-serif font-bold text-primary tracking-tighter">PULMIFY</h1>
            {/* Using PULMIFY name as requested by images look, or keep FOCUS */}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
                isCollapsed ? "justify-center" : "justify-start",
                isActive
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-sage-200/50 hover:text-primary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} weight={isActive ? "fill" : "duotone"} className={clsx("shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                <span className={clsx("text-sm transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 font-medium tracking-wide")}>
                    {item.name}
                </span>
                
                {/* Active Indicator Line for collapsed state */}
                {isActive && isCollapsed && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-accent rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom Actions */}
      <div className="p-4 border-t border-border/40 space-y-1">
        <NavLink 
            to="/settings"
            className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-sage-200/50 hover:text-primary",
                isCollapsed ? "justify-center" : "justify-start",
                isActive && "bg-sage-200 text-primary font-medium"
            )}
        >
             {({ isActive }) => (
              <>
                <Gear size={22} weight={isActive ? "fill" : "duotone"} className="shrink-0" />
                <span className={clsx("text-sm transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 font-medium tracking-wide")}>
                    Settings
                </span>
              </>
            )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
