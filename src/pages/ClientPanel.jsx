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
          .select('*, negocios(id, nombre, logo_url, color_primario, color_secundario, fidelidad_puntos_meta, fidelidad_recompensa), servicios(nombre)')
          .eq('cliente_id', clienteId)
          .order('fecha', { ascending: true }),
        supabase
          .from('tarjetas_fidelidad')
          .select('*')
          .eq('cliente_id', clienteId)
      ]);

      if (citasRes.error) throw citasRes.error;
      if (tarjetasRes.error) throw tarjetasRes.error;

      setCitas(citasRes.data || []);
      
      const reales = tarjetasRes.data || [];
      const negociosUnicos = new Map();
      
      (citasRes.data || []).forEach(c => {
        if (c.negocios && !negociosUnicos.has(c.negocio_id)) {
          negociosUnicos.set(c.negocio_id, c.negocios);
        }
      });

      const tarjetasMostradas = [];
      negociosUnicos.forEach((negocio, negocio_id) => {
        const tarjetaReal = reales.find(t => t.negocio_id === negocio_id);
        if (tarjetaReal) {
          tarjetasMostradas.push({ ...tarjetaReal, negocios: negocio });
        } else {
          tarjetasMostradas.push({
            id: 'virtual-' + negocio_id,
            cliente_id: clienteId,
            negocio_id: negocio_id,
            puntos: 0,
            puntos_totales: negocio.fidelidad_puntos_meta || 10,
            negocios: negocio
          });
        }
      });

      setTarjetas(tarjetasMostradas);
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Mi Cuenta</h1>
          <p className="mt-2 text-rose-50 font-medium text-xl drop-shadow-sm flex items-center justify-center md:justify-start">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm mr-3 backdrop-blur-md border border-white/30">Nivel VIP</span>
            Hola, {session.nombre}
          </p>
        </div>
        <button onClick={handleLogout} className="relative z-10 mt-6 md:mt-0 bg-white text-pink-600 hover:bg-rose-50 px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
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
              {tarjetas.map(t => {
                const meta = t.negocios?.fidelidad_puntos_meta || t.puntos_totales || 10;
                const recompensa = t.negocios?.fidelidad_recompensa || 'Premio sorpresa al completar tu tarjeta';
                const completada = t.puntos >= meta;
                const primaryColor = t.negocios?.color_primario || '#000000';

                return (
                <div key={t.id} className="relative bg-[#fafafa] rounded-xl p-8 sm:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-200 hover:shadow-[0_15px_50px_rgba(0,0,0,0.12)] transition-shadow duration-300 flex flex-col items-center text-center">
                  
                  {/* Header / Titles */}
                  <div className="mb-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-gray-900" style={{ fontFamily: 'sans-serif' }}>
                      Tarjeta de
                    </h2>
                    <h3 className="text-4xl sm:text-5xl -mt-2 mb-6" style={{ fontFamily: 'cursive', color: primaryColor }}>
                      fidelidad
                    </h3>
                  </div>

                  <p className="text-gray-500 font-medium tracking-wide mb-8 text-sm sm:text-base">
                    {recompensa}
                  </p>

                  {/* Stamp Grid */}
                  <div className={`flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 w-full`}>
                    {[...Array(meta)].map((_, idx) => {
                      const isStamped = idx < t.puntos;
                      const isReward = idx === meta - 1;
                      
                      let fechaStr = '';
                      if (isStamped && t.historial_sellos && t.historial_sellos[idx]) {
                        const dateParts = t.historial_sellos[idx].split('-');
                        if (dateParts.length === 3) {
                          fechaStr = `${dateParts[2]}/${dateParts[1]}`;
                        }
                      }
                      
                      if (isReward) {
                        return (
                          <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center text-white font-black leading-tight shadow-md transition-transform hover:scale-105" style={{ backgroundColor: primaryColor }}>
                            <span className="text-xs sm:text-sm">PREMIO</span>
                            {isStamped && <span className="text-[10px] sm:text-xs mt-1 font-medium bg-white/20 px-2 py-0.5 rounded-full">{fechaStr || '✓'}</span>}
                          </div>
                        )
                      }
                      
                      return (
                        <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300" style={{ 
                          border: `2px solid ${primaryColor}`,
                          backgroundColor: isStamped ? `${primaryColor}15` : 'transparent'
                        }}>
                          {isStamped && (
                            <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                              {fechaStr ? <span className="text-[10px] sm:text-xs font-bold leading-none">{fechaStr}</span> : <CheckCircle2 className="h-5 w-5" />}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Footer / Social Info */}
                  <div className="mt-auto w-full flex flex-col items-center pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-1">
                      {t.negocios?.logo_url && <img src={t.negocios.logo_url} className="w-6 h-6 rounded-full object-cover" alt="" />}
                      {t.negocios?.nombre}
                    </div>
                    <div className="flex text-gray-400 gap-1 mt-2">
                      {/* Generics icons acting as social media */}
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><User className="h-3 w-3 text-gray-600"/></div>
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><Star className="h-3 w-3 text-gray-600"/></div>
                    </div>
                  </div>
                  
                  {completada && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 transform animate-in zoom-in-95 duration-500">
                        <div className="mx-auto w-20 h-20 rounded-full mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                          <Award className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">¡Felicidades!</h3>
                        <p className="text-gray-600 mb-6 font-medium">Has completado tu tarjeta de fidelidad. Muéstrale esta pantalla a {t.negocios?.nombre} para reclamar tu premio.</p>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
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
