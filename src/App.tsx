import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthFlow from './components/AuthFlow';

type Page = 'landing' | 'dashboard' | 'auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAuthComplete = () => {
    setIsAuthenticated(true);
    navigate('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {currentPage === 'landing' && (
        <LandingPage navigate={navigate} />
      )}
      {currentPage === 'auth' && (
        <AuthFlow onAuthComplete={handleAuthComplete} navigate={navigate} />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard navigate={navigate} onLogout={handleLogout} />
      )}
    </div>
  );
}
