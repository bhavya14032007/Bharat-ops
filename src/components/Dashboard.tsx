import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Package, Users, LogOut, Globe } from 'lucide-react';
import { db, handleFirestoreError, OperationType, signOut } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Transaction, InventoryItem } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    sales: 0,
    purchases: 0,
    lowStock: 0,
    customers: 0
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setRecentTransactions(txs);
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayTxs = txs.filter(tx => tx.timestamp.startsWith(today));
      const sales = todayTxs.filter(tx => tx.type === 'sale').reduce((acc, tx) => acc + tx.total, 0);
      const purchases = todayTxs.filter(tx => tx.type === 'purchase').reduce((acc, tx) => acc + tx.total, 0);
      setStats(prev => ({ ...prev, sales, purchases }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    { label: 'Today\'s Sales', value: `₹${stats.sales}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Today\'s Purchases', value: `₹${stats.purchases}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Low Stock Items', value: stats.lowStock.toString(), icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Customers', value: stats.customers.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{t('app_name')}</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleLanguage}
            className="p-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Globe size={20} />
          </button>
          <button 
            onClick={signOut}
            className="p-2 bg-red-50 rounded-xl text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-2">
            <div className={stat.bg + " w-10 h-10 rounded-xl flex items-center justify-center " + stat.color}>
              <stat.icon size={20} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            <span className="text-lg font-bold text-gray-800">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold">Quick Action</h3>
          <p className="text-blue-100 text-sm mt-1">Use voice to record a transaction instantly</p>
          <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all">
            Start Recording
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500 rounded-full opacity-50 blur-2xl" />
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">{t('recent_transactions')}</h3>
        <div className="space-y-3">
          {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
            <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">{tx.customerName || 'Walk-in Customer'}</p>
                  <p className="text-[10px] text-gray-400">
                    {tx.items.map(item => `${item.quantity} ${item.name}`).join(', ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-bold text-sm", tx.type === 'sale' ? "text-green-600" : "text-red-600")}>
                  {tx.type === 'sale' ? '+' : '-'}₹{tx.total}
                </p>
                <p className="text-[10px] text-gray-400">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-400 text-sm italic py-4">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
