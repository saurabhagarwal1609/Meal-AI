import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Check, X, Utensils } from 'lucide-react';
import { analyzeMealImage, MealAnalysis } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError } from './Auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface MealScannerProps {
  user: User;
  onMealLogged: () => void;
}

export function MealScanner({ user, onMealLogged }: MealScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeMealImage(base64.split(',')[1]);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const saveMeal = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'meals'), {
        uid: user.uid,
        name: analysis.name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        imageUrl: image,
        timestamp: serverTimestamp()
      });
      onMealLogged();
      reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'meals');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-light tracking-tight text-gray-900">AI Meal Scanner</h2>
        <p className="text-gray-500 mt-2">Snap a photo of your meal and let AI do the counting.</p>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-gray-900 font-medium mb-2">Upload a photo</p>
              <p className="text-gray-400 text-sm mb-8">Drag and drop or click to browse</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Image
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="relative aspect-video rounded-[24px] overflow-hidden bg-gray-100">
                <img src={image} alt="Meal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="font-medium tracking-wide uppercase text-xs">AI Analyzing Meal...</p>
                  </div>
                )}
              </div>

              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">{analysis.name}</h3>
                      <p className="text-gray-500 mt-1">{analysis.description}</p>
                    </div>
                    <div className="bg-orange-50 px-4 py-2 rounded-xl">
                      <span className="text-2xl font-bold text-orange-600">{analysis.calories}</span>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-widest ml-1">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Protein', value: analysis.protein, color: 'bg-orange-500' },
                      { label: 'Carbs', value: analysis.carbs, color: 'bg-blue-500' },
                      { label: 'Fat', value: analysis.fat, color: 'bg-emerald-500' },
                    ].map((macro) => (
                      <div key={macro.label} className="bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${macro.color}`} />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{macro.label}</span>
                        </div>
                        <p className="text-xl font-semibold">{macro.value}g</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={saveMeal}
                      disabled={saving}
                      className="flex-1 bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      Log Meal
                    </button>
                    <button
                      onClick={reset}
                      disabled={saving}
                      className="px-6 py-4 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
