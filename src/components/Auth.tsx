import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { LogIn, LogOut, Loader2, User as UserIcon, Check, ArrowRight, Sparkles, Scale, Ruler, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMealPlan } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export function Auth({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    age: 25,
    height: 170,
    weight: 70,
    goal: 'maintain',
    activityLevel: 'moderate'
  });
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const names = currentUser.displayName?.split(' ') || [];
          const firstName = names[0] || '';
          const lastName = names.slice(1).join(' ') || '';

          await setDoc(userRef, {
            uid: currentUser.uid,
            firstName,
            lastName,
            displayName: currentUser.displayName,
            email: currentUser.email,
            createdAt: serverTimestamp(),
            weight: 70,
            height: 170,
            age: 25,
            gender: 'other',
            activityLevel: 'moderate',
            goal: 'maintain',
            dailyCalorieTarget: 2000,
            onboardingCompleted: false
          });
          setOnboarding(true);
        } else {
          const data = userSnap.data();
          if (!data.onboardingCompleted) {
            setOnboarding(true);
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setGeneratingSuggestions(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const calorieTarget = calculateCalories(onboardingData);
      
      const updatedProfile = {
        ...onboardingData,
        dailyCalorieTarget: calorieTarget,
        onboardingCompleted: true
      };

      await updateDoc(userRef, updatedProfile);
      
      // Generate initial suggestions
      const plan = await generateMealPlan(updatedProfile);
      setSuggestions(plan);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setGeneratingSuggestions(false);
      setOnboardingStep(3); // Move to suggestions view
    }
  };

  const calculateCalories = (data: any) => {
    // Basic BMR calculation (Mifflin-St Jeor)
    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
    const multipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    let tdee = bmr * (multipliers[data.activityLevel] || 1.2);
    
    if (data.goal === 'lose_weight') return Math.round(tdee - 500);
    if (data.goal === 'gain_muscle') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5] p-6">
        <div className="w-full max-w-md bg-white rounded-[24px] p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2">FuelFit</h1>
          <p className="text-gray-500 mb-8">Scan. Plan. Train. Your AI fitness companion.</p>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (onboarding) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-[32px] p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {onboardingStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-light text-gray-900">Welcome, {user.displayName?.split(' ')[0]}!</h2>
                  <p className="text-gray-500 mt-2">Let's personalize your fitness journey.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> Age
                    </label>
                    <input
                      type="number"
                      value={onboardingData.age}
                      onChange={(e) => setOnboardingData({ ...onboardingData, age: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={onboardingData.weight}
                      onChange={(e) => setOnboardingData({ ...onboardingData, weight: parseFloat(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Height (cm)
                    </label>
                    <input
                      type="number"
                      value={onboardingData.height}
                      onChange={(e) => setOnboardingData({ ...onboardingData, height: parseFloat(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Activity
                    </label>
                    <select
                      value={onboardingData.activityLevel}
                      onChange={(e) => setOnboardingData({ ...onboardingData, activityLevel: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Lightly Active</option>
                      <option value="moderate">Moderately Active</option>
                      <option value="active">Very Active</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setOnboardingStep(2)}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {onboardingStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-light text-gray-900">What's your goal?</h2>
                  <p className="text-gray-500 mt-2">We'll tailor your experience to match.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'lose_weight', label: 'Lose Weight', desc: 'Burn fat and get leaner' },
                    { id: 'maintain', label: 'Maintain', desc: 'Stay healthy and fit' },
                    { id: 'gain_muscle', label: 'Gain Muscle', desc: 'Build strength and size' },
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setOnboardingData({ ...onboardingData, goal: goal.id })}
                      className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                        onboardingData.goal === goal.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{goal.label}</p>
                          <p className="text-sm text-gray-500">{goal.desc}</p>
                        </div>
                        {onboardingData.goal === goal.id && <Check className="w-6 h-6 text-orange-500" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="flex-1 py-4 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={completeOnboarding}
                    disabled={generatingSuggestions}
                    className="flex-[2] bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingSuggestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-orange-400" />}
                    Complete Setup
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-3xl font-light text-gray-900">Your AI Plan is Ready!</h2>
                  <p className="text-gray-500 mt-2">Based on your profile, here's our initial suggestion.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 max-h-[400px] overflow-y-auto prose prose-orange">
                  <ReactMarkdown>{suggestions || ''}</ReactMarkdown>
                </div>

                <button
                  onClick={() => setOnboarding(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm">Sign Out</span>
    </button>
  );
}
