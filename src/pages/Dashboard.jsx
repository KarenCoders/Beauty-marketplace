import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Search, Star, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    fetchNegocios();
  }, []);

  async function fetchNegocios() {
    try {
      const { data, error } = await supabase.from('negocios').select('*, servicios(nombre)');
      if (error) throw error;
      setNegocios(data || []);
    } catch (error) {
      console.error('Error fetching negocios:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredNegocios = negocios.filter((n) => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchName = (n.nombre || '').toLowerCase().includes(searchLower);
    const matchService = n.servicios?.some(s => (s.nombre || '').toLowerCase().includes(searchLower)) || false;
    
    const matchSearch = matchName || matchService;
    const matchCat = categoria ? n.categoria === categoria : true;
    
    return matchSearch && matchCat;
  });

  const categorias = [...new Set(negocios.map(n => n.categoria).filter(Boolean))];

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Hero Section Premium */}
      <div className="relative overflow-hidden bg-white text-gray-900 pb-20 pt-32">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 rounded-full px-5 py-2 mb-8 border border-indigo-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-bold text-indigo-800 tracking-wide uppercase">Experiencias Exclusivas</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-gray-900">
            Descubre tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">mejor versión</span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto font-medium leading-relaxed">
            Reserva al instante en los salones, spas y estudios más prestigiosos de la ciudad.
          </p>

          {/* Search Box Glass */}
          <div className="mt-12 max-w-3xl mx-auto bg-white/60 backdrop-blur-2xl rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/80 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 placeholder-gray-400 bg-white/50 hover:bg-white focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-lg"
                placeholder="¿Qué servicio buscas hoy?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="block w-full sm:w-64 px-5 py-4 bg-white/50 hover:bg-white text-gray-700 font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-2xl transition-all border-none appearance-none cursor-pointer"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNegocios.map((negocio) => (
              <Link key={negocio.id} to={`/negocio/${negocio.slug}`} className="group block relative rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
                <div 
                  className="h-48 w-full relative overflow-hidden" 
                  style={{ backgroundColor: negocio.color_primario || '#e2e8f0' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  {/* Mock image for aesthetics if logo is missing, or generic pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                  
                  {negocio.logo_url && (
                     <img src={negocio.logo_url} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-110 transition-transform duration-700" />
                  )}

                  <div className="absolute top-4 right-4 z-20">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-900 backdrop-blur-sm shadow-sm">
                      {negocio.categoria}
                    </span>
                  </div>
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-10 right-6 z-20">
                    <div className="h-16 w-16 bg-white rounded-full p-1 shadow-lg flex items-center justify-center overflow-hidden border border-gray-100">
                      {negocio.logo_url ? (
                        <img src={negocio.logo_url} className="h-full w-full object-cover rounded-full" alt="logo" />
                      ) : (
                        <div className="h-full w-full rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: negocio.color_primario || '#000' }}>
                          {negocio.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 mb-1 pr-16">
                    {negocio.nombre}
                  </h3>
                  <div className="flex items-center text-sm text-amber-500 mb-3">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current text-amber-200" />
                    <span className="ml-1 text-gray-500 font-medium">(4.8)</span>
                  </div>
                  {negocio.direccion && (
                    <div className="flex items-start text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 mt-0.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      <span className="line-clamp-2">{negocio.direccion}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {filteredNegocios.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos resultados</h3>
                <p className="text-gray-500">Intenta con otros términos o categorías.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
