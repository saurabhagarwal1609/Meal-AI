import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { formatCalories, formatDate } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Flame, Utensils, Dumbbell, TrendingUp, Calendar } from 'lucide-react';
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

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [meals, setMeals] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }

        // Fetch today's meals
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealsQuery = query(
          collection(db, 'meals'),
          where('uid', '==', user.uid),
          where('timestamp', '>=', Timestamp.fromDate(today)),
          orderBy('timestamp', 'desc')
        );
        
        let mealsSnap;
        try {
          mealsSnap = await getDocs(mealsQuery);
        } catch (e) {
          console.error("Meals fetch error:", e);
          mealsSnap = { docs: [] };
        }
        setMeals(mealsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));

        // Fetch recent workouts
        const workoutsQuery = query(
          collection(db, 'workouts'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        let workoutsSnap;
        try {
          workoutsSnap = await getDocs(workoutsQuery);
        } catch (e) {
          console.error("Workouts fetch error:", e);
          workoutsSnap = { docs: [] };
        }
        setWorkouts(workoutsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.uid]);

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const calorieTarget = userProfile?.dailyCalorieTarget || 2000;
  const remainingCalories = Math.max(0, calorieTarget - totalCalories);

  const macroData = [
    { name: 'Protein', value: meals.reduce((sum, meal) => sum + (meal.protein || 0), 0), color: '#F97316' },
    { name: 'Carbs', value: meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0), color: '#3B82F6' },
    { name: 'Fat', value: meals.reduce((sum, meal) => sum + (meal.fat || 0), 0), color: '#10B981' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-white rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-64 bg-white rounded-3xl" />
      <div className="h-64 bg-white rounded-3xl" />
    </div>
  </div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">
            Hello, <span className="font-medium">{user.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Daily Goal</p>
            <p className="text-xl font-semibold">{formatCalories(totalCalories)} / {formatCalories(calorieTarget)} kcal</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calorie Progress */}
        <div className="md:col-span-2 bg-white rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: totalCalories },
                    { value: remainingCalories }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#F97316" />
                  <Cell fill="#F3F4F6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold">{Math.round((totalCalories / calorieTarget) * 100)}%</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Target</span>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <h2 className="text-xl font-medium">Nutrition Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: macro.color }} />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{macro.name}</span>
                  </div>
                  <p className="text-xl font-semibold">{Math.round(macro.value)}g</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
              <span className="text-gray-500">Remaining for today</span>
              <span className="font-semibold text-orange-600">{formatCalories(remainingCalories)} kcal</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-[32px] p-8 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-2xl font-light">Fuel Your Progress</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Log your meals and workouts consistently to see your transformation.
            </p>
          </div>
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Streak</span>
              <span className="font-medium">5 Days 🔥</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[70%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Meals */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-medium">Today's Meals</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{meals.length} Logs</span>
          </div>
          <div className="space-y-4">
            {meals.length === 0 ? (
              <p className="text-gray-400 text-center py-8 italic">No meals logged today</p>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{meal.name}</p>
                      <p className="text-xs text-gray-500">{new Date(meal.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCalories(meal.calories)} kcal</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xl font-medium">Recent Workouts</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 5</span>
          </div>
          <div className="space-y-4">
            {workouts.length === 0 ? (
              <p className="text-gray-400 text-center py-8 italic">No workouts logged yet</p>
            ) : (
              workouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{workout.exerciseName}</p>
                      <p className="text-xs text-gray-500">{workout.sets} sets × {workout.reps} reps</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{workout.weight} kg</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{formatDate(workout.timestamp?.toDate())}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
