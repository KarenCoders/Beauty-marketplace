import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-20">
      <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-lg w-full relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="mx-auto w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="text-6xl sm:text-8xl font-black text-gray-900 tracking-tight mb-2">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Página no encontrada</h2>
          <p className="text-gray-500 mb-8 font-medium">
            Lo sentimos, no pudimos encontrar la página que estás buscando. Es posible que el enlace sea incorrecto o que la página haya sido eliminada.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Home className="mr-2 h-5 w-5" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
