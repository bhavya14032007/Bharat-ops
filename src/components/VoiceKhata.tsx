import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function VoiceKhata() {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: "You are a business assistant for Indian shopkeepers. Listen to this audio and extract the transaction details in JSON format. The user might speak in English, Hindi, or Hinglish. Extract: { 'customerName': string, 'items': [{ 'name': string, 'quantity': number, 'unit': string, 'price': number }], 'type': 'sale' | 'purchase', 'paymentMethod': 'cash' | 'credit', 'total': number }. If details are missing, make your best guess or leave null. Return ONLY the JSON object." },
              { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text);
      setTranscript(JSON.stringify(data, null, 2));
      
      // Ensure mandatory fields for Firestore rules
      const transactionData = {
        customerName: data.customerName || 'Unknown',
        items: data.items || [],
        type: data.type || 'sale',
        paymentMethod: data.paymentMethod || 'cash',
        total: typeof data.total === 'number' ? data.total : 0,
        timestamp: new Date().toISOString()
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'transactions'), transactionData);
    } catch (err) {
      console.error('Error processing audio:', err);
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('voice_khata')}</h2>
        <p className="text-gray-500 mt-2">Speak to record sales, purchases, or credit</p>
      </div>

      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-blue-500 rounded-full"
            />
          )}
        </AnimatePresence>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95",
            isRecording ? "bg-red-500 text-white" : "bg-blue-600 text-white",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={40} />
          ) : isRecording ? (
            <Square size={40} />
          ) : (
            <Mic size={40} />
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-50 rounded-xl p-4 min-h-[100px] border border-gray-200">
        {isProcessing ? (
          <p className="text-gray-400 italic text-center">{t('processing')}</p>
        ) : transcript ? (
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{transcript}</pre>
        ) : (
          <p className="text-gray-400 text-center italic">Transcript will appear here...</p>
        )}
      </div>
    </div>
  );
}
