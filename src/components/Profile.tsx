import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { User as UserIcon, Save, Loader2, Target, Scale, Ruler, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError } from './Auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface ProfileProps {
  user: User;
}

export function Profile({ user }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile({ id: snap.id, ...data });
        setFormData(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, formData);
      setProfile({ ...profile, ...formData });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white rounded-3xl" />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-light tracking-tight text-gray-900">Your Profile</h2>
        <p className="text-gray-500 mt-1">Manage your physical data and fitness goals.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-50">
            <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
            <div>
              <h3 className="text-xl font-semibold">{user.displayName}</h3>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Scale className="w-3 h-3" /> Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Height (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Activity Level
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderately Active</option>
                <option value="active">Very Active</option>
                <option value="very_active">Extra Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-medium">Fitness Goals</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Primary Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
              >
                <option value="lose_weight">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain_muscle">Gain Muscle</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Daily Calorie Target</label>
              <input
                type="number"
                value={formData.dailyCalorieTarget}
                onChange={(e) => setFormData({ ...formData, dailyCalorieTarget: parseInt(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Profile
        </button>
      </form>
    </div>
  );
}
