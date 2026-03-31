export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  type: 'sale' | 'purchase';
  paymentMethod: 'cash' | 'credit';
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
}
