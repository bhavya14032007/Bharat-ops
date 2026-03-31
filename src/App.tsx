import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import VoiceKhata from './components/VoiceKhata';
import VisionInventory from './components/VisionInventory';
import { Package, FileText, Users, Plus, Download, LogIn, LogOut, Globe } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { auth, signIn, signOut, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { InventoryItem, Customer, Transaction } from './types';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qInv = query(collection(db, 'inventory'), orderBy('lastUpdated', 'desc'));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));

    const qCust = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubCust = onSnapshot(qCust, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    const qTx = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    return () => {
      unsubInv();
      unsubCust();
      unsubTx();
    };
  }, [user]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized in Firebase. Please add your Vercel URL to the Authorized Domains in Firebase Console.');
      } else {
        alert(`Login error: ${error.message}`);
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-8 text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
          <Globe className="text-white -rotate-12" size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('app_name')}</h1>
          <p className="text-gray-500 max-w-xs mx-auto">Smart operations manager for Indian MSMEs. Voice-powered, visual-first.</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full max-w-xs flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
        >
          <LogIn size={24} />
          <span>Login with Google</span>
        </button>
        <div className="flex space-x-4">
          <button onClick={() => i18n.changeLanguage('en')} className="text-sm font-bold text-blue-600">English</button>
          <span className="text-gray-300">|</span>
          <button onClick={() => i18n.changeLanguage('hi')} className="text-sm font-bold text-blue-600">हिंदी</button>
        </div>
      </div>
    );
  }

  const generateInvoice = () => {
    const doc = new jsPDF();
    doc.text('Bhasha-Ops Invoice', 10, 10);
    doc.text('Customer: Rahul Sharma', 10, 20);
    doc.text('Date: 31/03/2026', 10, 30);
    
    const columns = ['Item', 'Quantity', 'Price', 'Total'];
    const data = [
      ['Sugar', '2kg', '₹50', '₹100'],
      ['Oil', '1L', '₹150', '₹150'],
      ['Rice', '5kg', '₹40', '₹200'],
    ];
    
    (doc as any).autoTable({
      head: [columns],
      body: data,
      startY: 40,
    });
    
    doc.save('invoice.pdf');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'inventory':
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{t('inventory')}</h2>
              <button className="p-2 bg-blue-600 text-white rounded-xl shadow-sm active:scale-95 transition-all">
                <Plus size={20} />
              </button>
            </div>
            <VisionInventory />
            <div className="space-y-3">
              {inventory.length > 0 ? inventory.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-[10px] text-gray-400">Stock: {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-800">₹{item.price}</p>
                    <p className="text-[10px] text-gray-400">Per Unit</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 text-sm italic py-4">No items in inventory</p>
              )}
            </div>
          </div>
        );
      case 'ledger':
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{t('ledger')}</h2>
              <button 
                onClick={generateInvoice}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm active:scale-95 transition-all text-sm font-bold"
              >
                <Download size={16} />
                <span>{t('invoice')}</span>
              </button>
            </div>
            <VoiceKhata />
            
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-800">Transaction History</h3>
              <div className="space-y-3">
                {transactions.length > 0 ? transactions.map((tx) => (
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
                      <p className={tx.type === 'sale' ? "text-green-600 font-bold text-sm" : "text-red-600 font-bold text-sm"}>
                        {tx.type === 'sale' ? '+' : '-'}₹{tx.total}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 text-sm italic py-4">No transactions recorded yet</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'customers':
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('customers')}</h2>
            <div className="space-y-3">
              {customers.length > 0 ? customers.map((customer) => (
                <div key={customer.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{customer.name}</p>
                      <p className="text-[10px] text-gray-400">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-red-600">₹{customer.balance}</p>
                    <p className="text-[10px] text-gray-400">{t('credit')}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 text-sm italic py-4">No customers yet</p>
              )}
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
        {renderContent()}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
