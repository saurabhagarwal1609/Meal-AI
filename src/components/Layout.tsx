import React from 'react';
import { LayoutDashboard, Camera, Utensils, Dumbbell, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { SignOutButton } from './Auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scan Meal', icon: Camera },
    { id: 'planner', label: 'Meal Plan', icon: Utensils },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">FuelFit</span>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === tab.id
                  ? "bg-orange-50 text-orange-600 font-medium shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">FuelFit</span>
          </div>
          <SignOutButton />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>

        {/* Bottom Nav - Mobile */}
        <nav className="lg:hidden bg-white border-t border-gray-100 p-2 flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                activeTab === tab.id ? "text-orange-600" : "text-gray-400"
              )}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
