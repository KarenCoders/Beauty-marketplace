import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BusinessPage from './pages/BusinessPage';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import EmployeePanel from './pages/EmployeePanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/negocio/:slug" element={<BusinessPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/empleado" element={<EmployeePanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
