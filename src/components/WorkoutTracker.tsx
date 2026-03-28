import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Dumbbell, Plus, History, Loader2, Check, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';
import { handleFirestoreError } from './Auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface WorkoutTrackerProps {
  user: User;
}

export function WorkoutTracker({ user }: WorkoutTrackerProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');

  const fetchWorkouts = async () => {
    const q = query(
      collection(db, 'workouts'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    setWorkouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user.uid]);

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || !sets || !reps) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'workouts'), {
        uid: user.uid,
        exerciseName: exercise,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight) || 0,
        duration: parseInt(duration) || 0,
        intensity: intensity,
        timestamp: serverTimestamp()
      });
      setExercise('');
      setSets('');
      setReps('');
      setWeight('');
      setDuration('');
      setIntensity('medium');
      fetchWorkouts();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workouts');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Log Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium">Log Exercise</h3>
          </div>

          <form onSubmit={handleLogWorkout} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Exercise Name</label>
              <input
                type="text"
                placeholder="e.g. Bench Press"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sets</label>
                <input
                  type="number"
                  placeholder="0"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Reps</label>
                <input
                  type="number"
                  placeholder="0"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Duration (min)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Intensity</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Log Workout
            </button>
          </form>
        </div>

        <div className="bg-emerald-600 rounded-[32px] p-8 text-white">
          <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
          <h4 className="text-xl font-light mb-2">Track Your Strength</h4>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Progressive overload is key. Keep track of your weights to ensure you're getting stronger every week.
          </p>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="text-xl font-medium">Workout History</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent 10</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />)}
            </div>
          ) : workouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
              <p className="italic">No workouts logged yet. Time to hit the gym!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={workout.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Dumbbell className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{workout.exerciseName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{workout.sets} sets × {workout.reps} reps</span>
                        {workout.duration > 0 && <span>• {workout.duration} min</span>}
                        {workout.intensity && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] uppercase font-bold ${
                            workout.intensity === 'high' ? 'bg-red-100 text-red-600' :
                            workout.intensity === 'medium' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {workout.intensity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{workout.weight} <span className="text-xs font-normal text-gray-400">kg</span></p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{formatDate(workout.timestamp?.toDate())}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
