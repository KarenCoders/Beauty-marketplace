import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Calendar as CalendarIcon, Star, CheckCircle2, Award } from 'lucide-react';

export default function ClientPanel() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [citas, setCitas] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('citas');

  useEffect(() => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    
    const sess = JSON.parse(sessionStr);
    if (sess.role !== 'cliente') {
      navigate('/login');
      return;
    }
    
    setSession(sess);
    fetchData(sess.id);
  }, [navigate]);

  async function fetchData(clienteId) {
    setLoading(true);
    try {
      const [citasRes, tarjetasRes] = await Promise.all([
        supabase
          .from('citas')
          .select('*, negocios(nombre), servicios(nombre)')
          .eq('cliente_id', clienteId)
          .order('fecha', { ascending: true }),
        supabase
          .from('tarjetas_fidelidad')
          .select('*, negocios(nombre, logo_url)')
          .eq('cliente_id', clienteId)
      ]);

      if (citasRes.error) throw citasRes.error;
      if (tarjetasRes.error) throw tarjetasRes.error;

      setCitas(citasRes.data || []);
      setTarjetas(tarjetasRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('session');
    navigate('/login');
  };

  if (!session) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const proximasCitas = citas.filter(c => c.fecha >= todayStr && c.estado !== 'cancelada' && c.estado !== 'completada');
  const historialCitas = citas.filter(c => c.fecha < todayStr || c.estado === 'completada' || c.estado === 'cancelada');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">Mi Cuenta</h1>
          <p className="mt-2 text-blue-100 font-medium text-lg">Hola, {session.nombre}</p>
        </div>
        <button onClick={handleLogout} className="relative z-10 mt-4 md:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-bold transition-all border border-white/30 shadow-lg">
          Cerrar Sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('citas')} className={`py-4 px-6 border-b-2 font-bold text-sm flex items-center transition-colors ${activeTab === 'citas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <CalendarIcon className="mr-2 h-5 w-5" /> Mis Citas
        </button>
        <button onClick={() => setActiveTab('fidelidad')} className={`py-4 px-6 border-b-2 font-bold text-sm flex items-center transition-colors ${activeTab === 'fidelidad' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Star className="mr-2 h-5 w-5" /> Tarjetas de Fidelidad
        </button>
      </div>

      {activeTab === 'citas' && (
        <div className="space-y-12">
          {/* Próximas Citas */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              Próximas Citas
            </h2>
            {loading ? <p className="text-gray-500">Cargando...</p> : proximasCitas.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 border-dashed">
                <p className="text-gray-500 font-medium">No tienes citas programadas.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proximasCitas.map(cita => (
                  <div key={cita.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
                    <div className="relative z-10">
                      <div className="text-sm font-bold text-blue-600 mb-1">{cita.negocios?.nombre}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{cita.servicios?.nombre}</h3>
                      <div className="flex items-center text-gray-600 text-sm font-medium mb-2">
                        <CalendarIcon className="h-4 w-4 mr-2" /> {new Date(cita.fecha + 'T00:00:00').toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm font-medium">
                        <ClockIcon time={cita.hora.substring(0,5)} /> 
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center opacity-75">
              Historial
            </h2>
            {historialCitas.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                      <th className="px-6 py-4 font-bold text-gray-700">Negocio</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Servicio</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Fecha</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialCitas.map(cita => (
                      <tr key={cita.id} className="border-b border-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-900">{cita.negocios?.nombre}</td>
                        <td className="px-6 py-4 text-gray-600">{cita.servicios?.nombre}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                            cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {cita.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'fidelidad' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            Tarjetas de Fidelidad
          </h2>
          {loading ? <p className="text-gray-500">Cargando...</p> : tarjetas.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 border-dashed">
              <p className="text-gray-500 font-medium">Aún no tienes tarjetas de fidelidad. Completá tus citas para ganar puntos.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {tarjetas.map(t => (
                <div key={t.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    {t.negocios?.logo_url ? (
                      <img src={t.negocios.logo_url} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" alt=""/>
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center text-xl font-bold bg-white/10">
                        {t.negocios?.nombre?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">{t.negocios?.nombre}</h3>
                      <p className="text-gray-400 font-medium text-sm">Cliente Frecuente</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-4">
                    <div className="font-bold text-gray-300">Progreso</div>
                    <div className="text-3xl font-black text-amber-400">{t.puntos} <span className="text-lg text-gray-500">/ {t.puntos_totales}</span></div>
                  </div>

                  {/* Stamp Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {[...Array(t.puntos_totales)].map((_, idx) => (
                      <div key={idx} className={`aspect-square rounded-full flex items-center justify-center transition-all duration-500 ${
                        idx < t.puntos 
                          ? 'bg-amber-400 text-yellow-900 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-110' 
                          : 'bg-white/10 text-white/20 border border-white/5'
                      }`}>
                        {idx === t.puntos_totales - 1 ? <Award className="h-1/2 w-1/2" /> : <Star className="h-1/2 w-1/2" />}
                      </div>
                    ))}
                  </div>
                  
                  {t.puntos >= t.puntos_totales && (
                    <div className="mt-6 bg-amber-400/20 text-amber-300 border border-amber-400/30 p-3 rounded-xl text-center font-bold text-sm animate-pulse">
                      ¡Felicidades! Has completado tu tarjeta. Pide tu recompensa.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClockIcon({ time }) {
  return (
    <>
      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {time}
    </>
  )
}
