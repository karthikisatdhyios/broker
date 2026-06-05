import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MapPage from './pages/MapPage.jsx';
import MyPropertiesPage from './pages/MyPropertiesPage.jsx';
import LeadsPage from './pages/LeadsPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import CrmPage from './pages/CrmPage.jsx';
import RenewalsPage from './pages/RenewalsPage.jsx';
import AccountPage from './pages/AccountPage.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route
        path="/"
        element={
          loading ? <div className="empty">Loading…</div> : user ? <Navigate to="/app" replace /> : <Landing />
        }
      />
      <Route path="/app" element={<Protected><MapPage /></Protected>} />
      <Route path="/my-properties" element={<Protected><MyPropertiesPage /></Protected>} />
      <Route path="/leads" element={<Protected><LeadsPage /></Protected>} />
      <Route path="/matches" element={<Protected><MatchesPage /></Protected>} />
      <Route path="/crm" element={<Protected><CrmPage /></Protected>} />
      <Route path="/renewals" element={<Protected><RenewalsPage /></Protected>} />
      <Route path="/account" element={<Protected><AccountPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
