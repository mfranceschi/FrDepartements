import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import CartePage from './pages/CartePage';
import QuizPage from './pages/QuizPage';
import TableauPage from './pages/TableauPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <Nav />
        <Routes>
          <Route path="/carte" element={<CartePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/tableau" element={<TableauPage />} />
          <Route path="*" element={<Navigate to="/carte" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
