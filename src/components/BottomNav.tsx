import React from 'react';
import { Home, ClipboardList, Users, FileText, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', icon: Home, label: t('app_name') },
    { id: 'inventory', icon: ClipboardList, label: t('inventory') },
    { id: 'ledger', icon: FileText, label: t('ledger') },
    { id: 'customers', icon: Users, label: t('customers') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 flex justify-around items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
            activeTab === tab.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <tab.icon size={24} />
          <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
