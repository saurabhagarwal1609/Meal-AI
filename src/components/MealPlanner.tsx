import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateMealPlan } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { Utensils, Sparkles, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface MealPlannerProps {
  user: User;
}

export function MealPlanner({ user }: MealPlannerProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user.uid]);

  const handleGenerate = async () => {
    if (!userProfile) return;
    setGenerating(true);
    const plan = await generateMealPlan(userProfile);
    setMealPlan(plan);
    setGenerating(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-3xl" />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-gray-900">AI Meal Planner</h2>
          <p className="text-gray-500 mt-1">Personalized nutrition strategy based on your goals.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
          {mealPlan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {!mealPlan && !generating ? (
        <div className="bg-white rounded-[32px] p-12 shadow-sm text-center border border-dashed border-gray-100">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to plan your day?</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            Our AI will analyze your profile and goals to create a balanced meal plan just for you.
          </p>
          <button
            onClick={handleGenerate}
            className="text-orange-600 font-semibold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
          >
            Get Started <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 shadow-sm"
        >
          {generating ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-medium tracking-wide uppercase text-xs">AI is crafting your plan...</p>
            </div>
          ) : (
            <div className="prose prose-orange max-w-none">
              <div className="flex items-center gap-2 mb-8 pb-4 border-b border-gray-50">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Generated Meal Plan</span>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{mealPlan || ''}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Profile Summary */}
      <div className="bg-gray-50 rounded-[24px] p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Goal</p>
            <p className="font-medium text-gray-900 capitalize">{userProfile?.goal?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Target</p>
          <p className="font-medium text-gray-900">{userProfile?.dailyCalorieTarget} kcal</p>
        </div>
      </div>
    </div>
  );
}
