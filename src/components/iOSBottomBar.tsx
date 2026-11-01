import React from 'react';
import { Film, SlidersHorizontal, Layers, Sliders, Code2, Server } from 'lucide-react';

export type MainTabType = 'transcode' | 'presets' | 'queue' | 'studio' | 'code' | 'remote';

interface IOSBottomBarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  queueBadgeCount?: number;
}

export const IOSBottomBar: React.FC<IOSBottomBarProps> = ({
  activeTab,
  onChangeTab,
  queueBadgeCount = 0,
}) => {
  interface TabItem {
    id: MainTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'transcode', label: 'Transcode', icon: Film },
    { id: 'presets', label: 'Presets', icon: SlidersHorizontal },
    { id: 'queue', label: 'Queue', icon: Layers, badge: queueBadgeCount },
    { id: 'studio', label: 'Studio', icon: Sliders },
    { id: 'code', label: 'Swift Code', icon: Code2 },
    { id: 'remote', label: 'Remote', icon: Server },
  ];

  return (
    <nav className="shrink-0 bg-[#0c0d14]/95 backdrop-blur-xl border-t border-white/10 z-30 select-none pb-safe">
      <div className="grid grid-cols-6 h-14 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id as MainTabType)}
              className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] relative transition-colors focus:outline-none"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'text-amber-400 scale-110' : 'text-slate-400 hover:text-slate-200'
                  }`}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center font-mono shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-amber-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
