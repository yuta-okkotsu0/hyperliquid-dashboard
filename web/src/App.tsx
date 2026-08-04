import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Positions } from './pages/Positions';
import { Trades } from './pages/Trades';
import { Analytics } from './pages/Analytics';
import { Reasoning } from './pages/Reasoning';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reasoning" element={<Reasoning />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;