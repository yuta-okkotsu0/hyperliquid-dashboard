import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Trades } from './pages/Trades';
import { Analytics } from './pages/Analytics';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { Orders } from './pages/Orders';
import { Strategies } from './pages/Strategies';
import { ActivityFeed } from './components/ActivityFeed';

function App() {
  return (
    <Layout>
      <ActivityFeed />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;