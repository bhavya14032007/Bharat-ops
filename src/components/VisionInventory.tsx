import React, { useState, useRef } from 'react';
import { Camera, Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function VisionInventory() {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: "Extract inventory items from this handwritten receipt or stock list. Return a JSON array of objects: [{ 'name': string, 'quantity': number, 'unit': string, 'price': number }]. If details are missing, leave null. Return ONLY the JSON array." },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const items = JSON.parse(response.text);
      setResult(JSON.stringify(items, null, 2));
      
      // Save to Firestore
      for (const item of items) {
        const inventoryItem = {
          name: item.name || 'Unknown Item',
          quantity: typeof item.quantity === 'number' ? item.quantity : 0,
          unit: item.unit || 'pcs',
          price: typeof item.price === 'number' ? item.price : 0,
          lastUpdated: new Date().toISOString()
        };
        await addDoc(collection(db, 'inventory'), inventoryItem);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      handleFirestoreError(err, OperationType.WRITE, 'inventory');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('vision_inventory')}</h2>
        <p className="text-gray-500 mt-2">Take a photo of a receipt or stock list to update inventory</p>
      </div>

      <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
          ref={fileInputRef}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={cn(
            "w-full h-48 border-2 border-dashed border-blue-300 rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all active:scale-95",
            isProcessing ? "bg-gray-50 opacity-50 cursor-not-allowed" : "bg-blue-50 hover:bg-blue-100"
          )}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin text-blue-600" size={48} />
          ) : (
            <>
              <Camera className="text-blue-600" size={48} />
              <span className="text-blue-600 font-medium">{t('scan_receipt')}</span>
            </>
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
        >
          <Upload size={20} />
          <span>Upload from gallery</span>
        </button>
      </div>

      {result && (
        <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-green-700 font-medium">
            <CheckCircle2 size={20} />
            <span>Items Extracted Successfully</span>
          </div>
          <pre className="text-xs overflow-auto whitespace-pre-wrap text-green-800">{result}</pre>
        </div>
      )}
    </div>
  );
}
