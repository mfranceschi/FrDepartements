import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav';
import CartePage from './pages/CartePage';
import QuizPage from './pages/QuizPage';
import TableauPage from './pages/TableauPage';

const VALID_PATHS = new Set(['/carte', '/quiz', '/tableau']);

function AppInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!VALID_PATHS.has(pathname)) {
      navigate('/carte', { replace: true });
    }
  }, [pathname, navigate]);

  return (
    <div className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/carte' ? 'contents' : 'none' }}>
        <CartePage />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/quiz' ? 'contents' : 'none' }}>
        <QuizPage />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/tableau' ? 'contents' : 'none' }}>
        <TableauPage />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
