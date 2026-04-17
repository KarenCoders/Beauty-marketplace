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
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 font-medium">
                      <p>{cita.servicios?.nombre}</p>
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
                  <div className="mt-2 flex justify-between">
                    <p className="text-sm font-bold text-gray-800">{cita.cliente_nombre}</p>
                    <p className="text-sm text-gray-600">{cita.servicios?.nombre}</p>
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
