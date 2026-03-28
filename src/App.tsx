import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Auth, Layout } from './components';
import { Dashboard } from './components/Dashboard';
import { MealScanner } from './components/MealScanner';
import { MealPlanner } from './components/MealPlanner';
import { WorkoutTracker } from './components/WorkoutTracker';
import { Profile } from './components/Profile';
import { User } from 'firebase/auth';

// Error Boundary for Firestore and App errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-500 mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMealLogged = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('dashboard');
  };

  const renderContent = (user: User) => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={refreshKey} user={user} />;
      case 'scanner':
        return <MealScanner user={user} onMealLogged={handleMealLogged} />;
      case 'planner':
        return <MealPlanner user={user} />;
      case 'workouts':
        return <WorkoutTracker user={user} />;
      case 'profile':
        return <Profile user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <Auth>
        {(user) => (
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent(user)}
          </Layout>
        )}
      </Auth>
    </ErrorBoundary>
  );
}
