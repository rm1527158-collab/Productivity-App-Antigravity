import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import clsx from 'clsx';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <main 
        className={clsx(
            "min-h-screen transition-all duration-300 ml-[80px] flex flex-col",
            isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
        )}
      >
        <TopNavbar />
        <div className="w-full mx-auto p-6 md:p-8 lg:p-10 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
