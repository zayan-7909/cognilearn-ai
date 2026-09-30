import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const { state: authState } = useContext(AuthContext);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  if (!authState.isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return <Dashboard />;
}