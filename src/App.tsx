import { createBrowserRouter, RouterProvider, useLocation, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import CartePage from './pages/CartePage';
import QuizPage from './pages/QuizPage';
import TableauPage from './pages/TableauPage';
import ErrorBoundary from './components/ErrorBoundary';

const VALID_PATHS = new Set(['/carte', '/quiz', '/tableau']);

function AppInner() {
  const { pathname } = useLocation();

  if (!VALID_PATHS.has(pathname)) {
    return <Navigate to="/quiz" replace />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/carte' ? 'contents' : 'none' }}>
        <ErrorBoundary name="Carte"><CartePage /></ErrorBoundary>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/quiz' ? 'contents' : 'none' }}>
        <ErrorBoundary name="Quiz"><QuizPage /></ErrorBoundary>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ display: pathname === '/tableau' ? 'contents' : 'none' }}>
        <ErrorBoundary name="Tableau"><TableauPage /></ErrorBoundary>
      </div>
    </div>
  );
}

const router = createBrowserRouter([{ path: '*', element: <AppInner /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
