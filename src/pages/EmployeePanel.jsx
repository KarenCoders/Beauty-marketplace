import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function EmployeePanel() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .select(`*, servicios (nombre, duracion_min)`)
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
          
        if (tarjeta) {
          await supabase.from('tarjetas_fidelidad').update({ puntos: tarjeta.puntos + 1 }).eq('id', tarjeta.id);
        } else {
          await supabase.from('tarjetas_fidelidad').insert([{ cliente_id: cita.cliente_id, negocio_id: cita.negocio_id, puntos: 1 }]);
        }
      }
    } catch (error) { alert('Error al completar cita'); }
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
                        {cita.estado === 'pendiente' && (
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
                      {cita.estado === 'pendiente' && (
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
    </div>
  );
}
