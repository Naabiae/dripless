import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import TradeRoom from './pages/TradeRoom';
import Disputes from './pages/Disputes';
import { useStore } from './store/useStore';

function App() {
  const { fetchUserStatus } = useStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserStatus();
    }
  }, [fetchUserStatus]);

  return (
    <Router>
      <div className="min-h-screen bg-background text-white flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/trade/:id" element={<TradeRoom />} />
            <Route path="/disputes" element={<Disputes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
