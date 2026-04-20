import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isBusinessPage = location.pathname.startsWith('/negocio/');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem('session');
    setSession(s ? JSON.parse(s) : null);
  }, [location.pathname]);

  const getDashboardLink = () => {
    if (!session) return '/login';
    if (session.role === 'admin') return '/admin';
    if (session.role === 'empleado') return '/empleado';
    if (session.role === 'superadmin') return '/superadmin';
    return '/cliente';
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isBusinessPage ? 'glass shadow-sm border-b border-white/20' : 'glass shadow-sm border-b border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform shadow-lg shadow-indigo-200">
                <Scissors className="h-6 w-6" />
              </div>
              <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                BeautyBook
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {session ? (
              <Link 
                to={getDashboardLink()} 
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-bold px-4 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Mi Cuenta</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Acceder</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
