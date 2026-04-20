import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Star, Award, CheckCircle2, X } from 'lucide-react';

export default function EmployeePanel() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCard, setViewingCard] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    
    const sess = JSON.parse(sessionStr);
    if (sess.role !== 'empleado') {
      navigate('/login');
      return;
    }
    
    setSession(sess);
    fetchCitas(sess.id);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('session');
    navigate('/login');
  };

  async function fetchCitas(empleadoId) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`*, servicios (nombre, duracion_min), negocios (id, nombre, logo_url, color_primario, fidelidad_puntos_meta, fidelidad_recompensa)`)
        .eq('empleado_id', empleadoId)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setCitas(data || []);
    } catch (error) {
      console.error('Error fetching citas:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelarCita(cita) {
    const motivo = prompt('¿Cancelar esta cita? Por favor, ingresa el motivo para notificar al cliente:');
    if (motivo === null) return;

    try {
      await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id);
      setCitas(citas.map(c => c.id === cita.id ? { ...c, estado: 'cancelada' } : c));
      const phone = cita.cliente_telefono ? cita.cliente_telefono.replace(/\D/g, '') : '';
      if (phone && motivo.trim() !== '') {
        const msg = `Hola ${cita.cliente_nombre}, lamentamos informarte que tu cita del ${cita.fecha} a las ${cita.hora.substring(0,5)} fue cancelada. Motivo: ${motivo}. ¿Deseas reprogramarla?`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (error) { alert('Error al cancelar'); }
  }

  async function handleConfirmarCita(cita) {
    try {
      await supabase.from('citas').update({ estado: 'confirmada' }).eq('id', cita.id);
      setCitas(citas.map(c => c.id === cita.id ? { ...c, estado: 'confirmada' } : c));
      
      const phone = cita.cliente_telefono ? cita.cliente_telefono.replace(/\D/g, '') : '';
      if (phone) {
        const msg = `¡Hola ${cita.cliente_nombre}! Tu cita para el ${cita.fecha} a las ${cita.hora.substring(0,5)} ha sido confirmada. ¡Te esperamos!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (error) { alert('Error al confirmar'); }
  }

  async function handleCompletarCita(cita) {
    if (!confirm('¿Marcar esta cita como completada? Si el cliente tiene cuenta, ganará 1 punto de fidelidad.')) return;
    try {
      await supabase.from('citas').update({ estado: 'completada' }).eq('id', cita.id);
      setCitas(citas.map(c => c.id === cita.id ? { ...c, estado: 'completada' } : c));
      
      if (cita.cliente_id) {
        const { data: tarjeta } = await supabase
          .from('tarjetas_fidelidad')
          .select('*')
          .eq('cliente_id', cita.cliente_id)
          .eq('negocio_id', cita.negocio_id)
          .single();
          
        const hoy = new Date().toISOString().split('T')[0];
        const meta = cita.negocios?.fidelidad_puntos_meta || 10;
          
        if (tarjeta) {
          await supabase.from('tarjetas_fidelidad').update({ 
            puntos: tarjeta.puntos + 1,
            historial_sellos: [...(tarjeta.historial_sellos || []), hoy]
          }).eq('id', tarjeta.id);
        } else {
          await supabase.from('tarjetas_fidelidad').insert([{ 
            cliente_id: cita.cliente_id, 
            negocio_id: cita.negocio_id, 
            puntos: 1, 
            puntos_totales: meta,
            historial_sellos: [hoy]
          }]);
        }
      }
    } catch (error) { alert('Error al completar cita'); }
  }

  async function openTarjetaModal(cita) {
    if (!cita.cliente_id) {
      alert('Este cliente agendó sin cuenta, por lo que no tiene tarjeta de fidelidad.');
      return;
    }
    const { data: tarjeta } = await supabase
      .from('tarjetas_fidelidad')
      .select('*')
      .eq('cliente_id', cita.cliente_id)
      .eq('negocio_id', cita.negocio_id)
      .single();
    
    setViewingCard({ cita, tarjeta: tarjeta || { puntos: 0, historial_sellos: [], puntos_totales: cita.negocios?.fidelidad_puntos_meta || 10 } });
  }

  async function handleSellarManualmente() {
    if (!viewingCard || !viewingCard.cita.cliente_id) return;
    const { cita, tarjeta } = viewingCard;
    const meta = cita.negocios?.fidelidad_puntos_meta || 10;
    
    if (tarjeta.puntos >= meta) {
      alert('La tarjeta ya está llena.');
      return;
    }

    const fechaSello = prompt('Ingresa la fecha para este sello (ej. ' + new Date().toISOString().split('T')[0] + '):', new Date().toISOString().split('T')[0]);
    if (!fechaSello) return;

    try {
      const nuevoHistorial = [...(tarjeta.historial_sellos || []), fechaSello];
      const nuevosPuntos = tarjeta.puntos + 1;
      
      let res;
      if (tarjeta.id) {
        res = await supabase.from('tarjetas_fidelidad').update({
          puntos: nuevosPuntos,
          historial_sellos: nuevoHistorial
        }).eq('id', tarjeta.id).select().single();
      } else {
        res = await supabase.from('tarjetas_fidelidad').insert([{
          cliente_id: cita.cliente_id,
          negocio_id: cita.negocio_id,
          puntos: nuevosPuntos,
          puntos_totales: meta,
          historial_sellos: nuevoHistorial
        }]).select().single();
      }

      if (res.error) throw res.error;
      
      setViewingCard({ ...viewingCard, tarjeta: res.data });
      alert('Sello agregado manualmente.');
    } catch (error) {
      alert('Error al agregar sello.');
    }
  }

  if (!session) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const citasDelDia = citas.filter(c => c.fecha === todayStr && c.estado !== 'cancelada');
  const proximasCitas = citas.filter(c => c.fecha > todayStr && c.estado !== 'cancelada');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Mi Agenda</h1>
          <p className="text-gray-500 mt-1">Especialista: {session.nombre}</p>
        </div>
        <button onClick={handleLogout} className="text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg">
          Cerrar Sesión
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Citas de Hoy</h2>
          {loading ? <p>Cargando...</p> : citasDelDia.length === 0 ? <p className="text-gray-500">No tienes citas programadas para hoy.</p> : (
            <ul className="space-y-3">
              {citasDelDia.map(cita => (
                <li key={cita.id} className="bg-white shadow overflow-hidden rounded-xl px-6 py-4 border-l-4 border-indigo-500">
                  <div className="flex justify-between">
                    <div className="text-sm font-extrabold text-indigo-600 text-lg">{cita.hora.substring(0,5)}</div>
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
                      {cita.estado}
                    </span>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm font-bold text-gray-800">
                        {cita.cliente_nombre} <span className="text-gray-400 font-normal ml-2">({cita.cliente_telefono})</span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between sm:mt-0 font-medium sm:w-1/2">
                      <p className="text-sm text-gray-500">{cita.servicios?.nombre}</p>
                      <div className="flex gap-2">
                        {cita.cliente_id && (
                          <button onClick={() => openTarjetaModal(cita)} className="text-xs text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition-colors border border-amber-100 font-bold flex items-center">
                            <Star className="w-3 h-3 mr-1" /> Tarjeta
                          </button>
                        )}
                        {cita.estado === 'pendiente' && (
                          <button onClick={() => handleConfirmarCita(cita)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-100 font-bold">
                            Confirmar
                          </button>
                        )}
                        {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                          <button onClick={() => handleCompletarCita(cita)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors border border-green-100 font-bold">
                            Completar
                          </button>
                        )}
                        {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                          <button onClick={() => handleCancelarCita(cita)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors border border-red-100">
                            Cancelar Cita
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Próximas Citas</h2>
          {loading ? <p>Cargando...</p> : proximasCitas.length === 0 ? <p className="text-gray-500">No hay citas futuras agendadas.</p> : (
            <ul className="space-y-3 opacity-90">
              {proximasCitas.map(cita => (
                <li key={cita.id} className="bg-gray-50 shadow-sm overflow-hidden rounded-xl px-6 py-4 border border-gray-200">
                  <div className="flex justify-between">
                    <div className="text-sm font-bold text-gray-700">{cita.fecha} a las {cita.hora.substring(0,5)}</div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{cita.cliente_nombre} <span className="text-gray-400 font-normal ml-1">({cita.cliente_telefono})</span></p>
                      <p className="text-sm text-gray-600">{cita.servicios?.nombre}</p>
                    </div>
                    <div className="flex gap-2">
                      {cita.cliente_id && (
                        <button onClick={() => openTarjetaModal(cita)} className="text-xs text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition-colors border border-amber-100 font-bold flex items-center">
                          <Star className="w-3 h-3 mr-1" /> Tarjeta
                        </button>
                      )}
                      {cita.estado === 'pendiente' && (
                        <button onClick={() => handleConfirmarCita(cita)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-100 font-bold">
                          Confirmar
                        </button>
                      )}
                      {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                        <button onClick={() => handleCompletarCita(cita)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors border border-green-100 font-bold">
                          Completar
                        </button>
                      )}
                      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                        <button onClick={() => handleCancelarCita(cita)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors border border-red-100">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {viewingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setViewingCard(null)}></div>
          <div className="bg-[#fafafa] rounded-2xl shadow-2xl relative z-10 w-full max-w-lg p-8 sm:p-10 border border-gray-200 text-center animate-in zoom-in-95">
            <button type="button" onClick={() => setViewingCard(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            {(() => {
              const meta = viewingCard.cita.negocios?.fidelidad_puntos_meta || 10;
              const recompensa = viewingCard.cita.negocios?.fidelidad_recompensa || 'Premio sorpresa al completar tu tarjeta';
              const completada = viewingCard.tarjeta.puntos >= meta;
              const primaryColor = viewingCard.cita.negocios?.color_primario || '#000000';

              return (
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase text-gray-900" style={{ fontFamily: 'sans-serif' }}>
                      Tarjeta de
                    </h2>
                    <h3 className="text-3xl sm:text-4xl -mt-2 mb-6" style={{ fontFamily: 'cursive', color: primaryColor }}>
                      fidelidad
                    </h3>
                  </div>

                  <p className="text-gray-500 font-medium tracking-wide mb-8 text-sm">
                    {recompensa}
                  </p>

                  <div className={`flex flex-wrap justify-center gap-3 mb-8 w-full`}>
                    {[...Array(meta)].map((_, idx) => {
                      const isStamped = idx < viewingCard.tarjeta.puntos;
                      const isReward = idx === meta - 1;
                      
                      if (isReward) {
                        return (
                          <div key={idx} onClick={!isStamped && viewingCard.tarjeta.puntos === idx ? handleSellarManualmente : undefined} className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-black leading-tight shadow-md transition-transform ${!isStamped && viewingCard.tarjeta.puntos === idx ? 'cursor-pointer hover:scale-110 ring-4 ring-amber-300 animate-pulse' : ''}`} style={{ backgroundColor: primaryColor }}>
                            <span className="text-[10px]">PREMIO</span>
                            {isStamped && <CheckCircle2 className="h-4 w-4 mt-1" />}
                          </div>
                        )
                      }
                      
                      return (
                        <div key={idx} onClick={!isStamped && viewingCard.tarjeta.puntos === idx ? handleSellarManualmente : undefined} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${!isStamped && viewingCard.tarjeta.puntos === idx ? 'cursor-pointer hover:scale-110 ring-4 ring-amber-300 animate-pulse bg-white' : ''}`} style={{ 
                          border: `2px solid ${primaryColor}`,
                          backgroundColor: isStamped ? `${primaryColor}15` : 'transparent'
                        }}>
                          {isStamped && (
                            <div className="w-8 h-8 rounded-full flex flex-col items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="w-full bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-medium mb-4">
                    Cliente: <strong>{viewingCard.cita.cliente_nombre}</strong><br/>
                    Puntos actuales: <strong>{viewingCard.tarjeta.puntos} / {meta}</strong>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Para sellar manualmente un punto, haz clic en el siguiente círculo disponible.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
