import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      'app_name': 'Bhasha-Ops',
      'record': 'Record',
      'stop': 'Stop',
      'processing': 'Processing...',
      'inventory': 'Inventory',
      'ledger': 'Ledger',
      'customers': 'Customers',
      'invoice': 'Invoice',
      'voice_khata': 'Voice Khata',
      'vision_inventory': 'Vision Inventory',
      'language': 'Language',
      'hindi': 'Hindi',
      'english': 'English',
      'recent_transactions': 'Recent Transactions',
      'stock_status': 'Stock Status',
      'add_item': 'Add Item',
      'scan_receipt': 'Scan Receipt',
      'generate_invoice': 'Generate Invoice',
      'sold': 'Sold',
      'bought': 'Bought',
      'credit': 'Credit',
      'cash': 'Cash',
    }
  },
  hi: {
    translation: {
      'app_name': 'भाषा-ऑप्स',
      'record': 'रिकॉर्ड करें',
      'stop': 'रोकें',
      'processing': 'प्रसंस्करण...',
      'inventory': 'इन्वेंटरी',
      'ledger': 'खाता',
      'customers': 'ग्राहक',
      'invoice': 'इनवॉइस',
      'voice_khata': 'वॉयस खाता',
      'vision_inventory': 'विज़न इन्वेंटरी',
      'language': 'भाषा',
      'hindi': 'हिंदी',
      'english': 'अंग्रेज़ी',
      'recent_transactions': 'हाल के लेनदेन',
      'stock_status': 'स्टॉक की स्थिति',
      'add_item': 'आइटम जोड़ें',
      'scan_receipt': 'रसीद स्कैन करें',
      'generate_invoice': 'इनवॉइस बनाएं',
      'sold': 'बेचा',
      'bought': 'खरीदा',
      'credit': 'उधार',
      'cash': 'नकद',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
