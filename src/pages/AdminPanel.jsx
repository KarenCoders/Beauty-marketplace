import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadImage } from '../lib/supabase';
import { 
  Trash2, Edit2, Plus, Calendar as CalendarIcon, 
  Settings, Scissors, User, Map, Image as ImageIcon, CheckCircle2, X 
} from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('citas');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [negocio, setNegocio] = useState(null);
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // Forms
  const [showSrvForm, setShowSrvForm] = useState(false);
  const [editingSrvId, setEditingSrvId] = useState(null);
  const [formSrv, setFormSrv] = useState({ nombre: '', precio: '', duracion_min: '', descripcion: '', imagen_url: '', galeria_urls: [] });

  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [formEmp, setFormEmp] = useState({ nombre: '', email: '', password: '', foto_url: '' });

  // Uploading states
  const [uploadingObj, setUploadingObj] = useState(null); // 'logo', 'emp', 'srv'

  useEffect(() => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    
    const sess = JSON.parse(sessionStr);
    if (sess.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    setSession(sess);
    fetchData(sess.id);
  }, [navigate]);

  useEffect(() => {
    if (negocio) {
      document.documentElement.style.setProperty('--color-primary', negocio.color_primario || '#0f172a');
      document.documentElement.style.setProperty('--color-secondary', negocio.color_secundario || '#334155');
    }
  }, [negocio]);

  async function fetchData(negocioId) {
    setLoading(true);
    try {
      const [nRes, cRes, sRes, eRes] = await Promise.all([
        supabase.from('negocios').select('*').eq('id', negocioId).single(),
        supabase.from('citas').select('*, servicios(nombre), empleados(nombre)').eq('negocio_id', negocioId).order('fecha', { ascending: true }),
        supabase.from('servicios').select('*').eq('negocio_id', negocioId).order('nombre', { ascending: true }),
        supabase.from('empleados').select('*').eq('negocio_id', negocioId).order('nombre', { ascending: true })
      ]);

      setNegocio(nRes.data);
      setCitas(cRes.data || []);
      setServicios(sRes.data || []);
      setEmpleados(eRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('session');
    navigate('/login');
  };

  // --- SUBIDA DE IMÁGENES ---
  const handleImageUpload = async (e, type, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingObj(type);
    try {
      const folder = type === 'logo' ? 'logos' : type === 'emp' ? 'empleados' : 'servicios';
      const url = await uploadImage(file, folder);
      
      if (type === 'logo') {
        const { error } = await supabase.from('negocios').update({ logo_url: url }).eq('id', negocio.id);
        if (error) throw error;
        setNegocio({ ...negocio, logo_url: url });
      } else if (type === 'srv_galeria') {
        setter(prev => ({ ...prev, galeria_urls: [...(prev.galeria_urls || []), url] }));
      } else {
        setter(prev => ({ ...prev, [type === 'emp' ? 'foto_url' : 'imagen_url']: url }));
      }
      alert('Imagen subida con éxito');
    } catch (err) {
      alert('Error subiendo imagen. Verifica que creaste el bucket "imagenes" público en Supabase Storage.');
    } finally {
      setUploadingObj(null);
    }
  };

  // --- CONFIGURACIÓN DE NEGOCIO ---
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const { error, data } = await supabase.from('negocios').update({
        color_primario: negocio.color_primario,
        color_secundario: negocio.color_secundario,
        mapa_enlace: negocio.mapa_enlace,
        mapa_embed: negocio.mapa_embed,
        descripcion_corta: negocio.descripcion_corta
      }).eq('id', negocio.id).select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se actualizó ningún registro. (Posible problema de permisos RLS o ID incorrecto).');
      
      alert('Configuración guardada con éxito.');
    } catch (err) {
      console.error('Error config:', err);
      alert('Error al guardar configuración: ' + (err.message || 'Error desconocido. Verifica la consola.'));
    }
  };

  // --- CITAS ---
  async function handleCancelarCita(id) {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', id);
      setCitas(citas.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c));
    } catch (error) { alert('Error'); }
  }

  // --- SERVICIOS ---
  function openSrvForm(servicio = null) {
    if (servicio) { setFormSrv({...servicio, galeria_urls: servicio.galeria_urls || []}); setEditingSrvId(servicio.id); }
    else { setFormSrv({ nombre: '', precio: '', duracion_min: '', descripcion: '', imagen_url: '', galeria_urls: [] }); setEditingSrvId(null); }
    setShowSrvForm(true);
  }

  async function handleSaveSrv(e) {
    e.preventDefault();
    try {
      const sData = { ...formSrv, negocio_id: negocio.id };
      if (editingSrvId) await supabase.from('servicios').update(sData).eq('id', editingSrvId);
      else await supabase.from('servicios').insert([sData]);
      setShowSrvForm(false);
      fetchData(negocio.id);
    } catch (error) { alert('Error al guardar'); }
  }

  async function handleDeleteSrv(id) {
    if (!confirm('¿Eliminar servicio?')) return;
    await supabase.from('servicios').delete().eq('id', id);
    setServicios(servicios.filter(s => s.id !== id));
  }

  // --- EMPLEADOS ---
  function openEmpForm(emp = null) {
    if (emp) { setFormEmp(emp); setEditingEmpId(emp.id); }
    else { setFormEmp({ nombre: '', email: '', password: '', foto_url: '' }); setEditingEmpId(null); }
    setShowEmpForm(true);
  }

  async function handleSaveEmp(e) {
    e.preventDefault();
    try {
      const eData = { ...formEmp, negocio_id: negocio.id };
      if (editingEmpId) await supabase.from('empleados').update(eData).eq('id', editingEmpId);
      else await supabase.from('empleados').insert([eData]);
      setShowEmpForm(false);
      fetchData(negocio.id);
    } catch (error) { alert('Error al guardar'); }
  }

  async function handleDeleteEmp(id) {
    if (!confirm('¿Eliminar especialista? Perderá el acceso y sus citas asociadas.')) return;
    await supabase.from('empleados').delete().eq('id', id);
    setEmpleados(empleados.filter(e => e.id !== id));
  }


  if (loading) return <div className="text-center py-20">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Administración</h1>
          <p className="mt-2 text-gray-500">Hola, {session.nombre}. Gestiona tu negocio aquí.</p>
        </div>
        <button onClick={handleLogout} className="mt-4 md:mt-0 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg">
          Cerrar Sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          <button onClick={() => setActiveTab('citas')} className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center ${activeTab === 'citas' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <CalendarIcon className="mr-2 h-5 w-5" /> Citas
          </button>
          <button onClick={() => setActiveTab('servicios')} className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center ${activeTab === 'servicios' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Scissors className="mr-2 h-5 w-5" /> Servicios
          </button>
          <button onClick={() => setActiveTab('especialistas')} className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center ${activeTab === 'especialistas' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <User className="mr-2 h-5 w-5" /> Especialistas
          </button>
          <button onClick={() => setActiveTab('config')} className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center ${activeTab === 'config' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Settings className="mr-2 h-5 w-5" /> Configuración
          </button>
        </nav>
      </div>

      {/* --- TAB CITAS --- */}
      {activeTab === 'citas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ... Misma tabla de citas que antes ... */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Fecha/Hora</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <td className="px-6 py-4"><div className="font-bold">{cita.fecha}</div><div className="text-sm text-theme-primary">{cita.hora.substring(0,5)}</div></td>
                  <td className="px-6 py-4"><div className="font-bold">{cita.cliente_nombre}</div><div className="text-sm text-gray-500">{cita.cliente_telefono}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cita.servicios?.nombre}<br/><span className="text-xs">con {cita.empleados?.nombre}</span></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold">{cita.estado}</span></td>
                  <td className="px-6 py-4 text-right">
                    {cita.estado !== 'cancelada' && <button onClick={() => handleCancelarCita(cita.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">Cancelar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB SERVICIOS --- */}
      {activeTab === 'servicios' && (
        <div>
          <button onClick={() => openSrvForm()} className="mb-6 bg-theme-primary text-white px-4 py-2 rounded-xl font-bold flex items-center">
            <Plus className="h-5 w-5 mr-2" /> Nuevo Servicio
          </button>

          {showSrvForm && (
            <form onSubmit={handleSaveSrv} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold mb-1">Nombre</label><input required type="text" value={formSrv.nombre} onChange={e=>setFormSrv({...formSrv,nombre:e.target.value})} className="w-full p-2 border rounded" /></div>
              <div><label className="block text-sm font-bold mb-1">Precio ($)</label><input required type="number" value={formSrv.precio} onChange={e=>setFormSrv({...formSrv,precio:e.target.value})} className="w-full p-2 border rounded" /></div>
              <div><label className="block text-sm font-bold mb-1">Duración (min)</label><input required type="number" value={formSrv.duracion_min} onChange={e=>setFormSrv({...formSrv,duracion_min:e.target.value})} className="w-full p-2 border rounded" /></div>
              <div>
                <label className="block text-sm font-bold mb-1">Subir Imagen</label>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'srv', setFormSrv)} className="text-sm border rounded p-1 w-full" />
                  {uploadingObj === 'srv' && <span className="text-xs text-gray-500 self-center">Subiendo...</span>}
                </div>
              </div>
              <div className="col-span-2"><label className="block text-sm font-bold mb-1">Descripción</label><textarea value={formSrv.descripcion} onChange={e=>setFormSrv({...formSrv,descripcion:e.target.value})} className="w-full p-2 border rounded" rows="2"></textarea></div>
              <div className="col-span-2 border-t mt-2 pt-4">
                <label className="block text-sm font-bold mb-2 text-indigo-600"><ImageIcon className="inline h-4 w-4 mr-1"/> Galería de Trabajos Previos</label>
                <div className="flex gap-2 mb-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'srv_galeria', setFormSrv)} className="text-sm border rounded p-1 w-full" />
                  {uploadingObj === 'srv_galeria' && <span className="text-xs text-gray-500 self-center">Subiendo...</span>}
                </div>
                {formSrv.galeria_urls && formSrv.galeria_urls.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {formSrv.galeria_urls.map((url, idx) => (
                      <div key={idx} className="relative h-20 w-20 group">
                        <img src={url} alt="" className="h-full w-full object-cover rounded-lg shadow-sm border border-gray-200" />
                        <button type="button" onClick={() => setFormSrv({...formSrv, galeria_urls: formSrv.galeria_urls.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowSrvForm(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-theme-primary text-white font-bold rounded">Guardar</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map(srv => (
              <div key={srv.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative group">
                {srv.imagen_url && <img src={srv.imagen_url} alt="" className="h-32 w-full object-cover" />}
                <div className="p-4">
                  <h3 className="font-bold text-lg">{srv.nombre}</h3>
                  <div className="flex gap-2 mt-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openSrvForm(srv)} className="bg-white p-1 rounded shadow text-blue-600"><Edit2 className="h-4 w-4"/></button>
                    <button onClick={() => handleDeleteSrv(srv.id)} className="bg-white p-1 rounded shadow text-red-600"><Trash2 className="h-4 w-4"/></button>
                  </div>
                  <p className="text-sm text-gray-500">${srv.precio} • {srv.duracion_min} min</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB ESPECIALISTAS --- */}
      {activeTab === 'especialistas' && (
        <div>
          <button onClick={() => openEmpForm()} className="mb-6 bg-theme-primary text-white px-4 py-2 rounded-xl font-bold flex items-center">
            <Plus className="h-5 w-5 mr-2" /> Nuevo Especialista
          </button>

          {showEmpForm && (
            <form onSubmit={handleSaveEmp} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold mb-1">Nombre</label><input required type="text" value={formEmp.nombre} onChange={e=>setFormEmp({...formEmp,nombre:e.target.value})} className="w-full p-2 border rounded" /></div>
              <div>
                <label className="block text-sm font-bold mb-1">Foto de Perfil</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'emp', setFormEmp)} className="text-sm border rounded p-1 w-full" />
                {uploadingObj === 'emp' && <span className="text-xs text-gray-500">Subiendo...</span>}
              </div>
              <div className="col-span-2 border-t mt-2 pt-4">
                <h4 className="font-bold text-sm mb-2 text-indigo-600">Datos de Acceso al Panel</h4>
              </div>
              <div><label className="block text-sm font-bold mb-1">Correo (Email)</label><input type="email" value={formEmp.email} onChange={e=>setFormEmp({...formEmp,email:e.target.value})} className="w-full p-2 border rounded" placeholder="Para iniciar sesión" /></div>
              <div><label className="block text-sm font-bold mb-1">Contraseña</label><input type="text" value={formEmp.password} onChange={e=>setFormEmp({...formEmp,password:e.target.value})} className="w-full p-2 border rounded" placeholder="Asigna una contraseña" /></div>
              
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowEmpForm(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-theme-primary text-white font-bold rounded">Guardar</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {empleados.map(emp => (
              <div key={emp.id} className="bg-white rounded-2xl p-6 border border-gray-200 text-center relative group">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEmpForm(emp)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 className="h-4 w-4"/></button>
                  <button onClick={() => handleDeleteEmp(emp.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4"/></button>
                </div>
                {emp.foto_url ? (
                  <img src={emp.foto_url} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-gray-50 shadow-sm" alt="" />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-indigo-100 text-indigo-500 flex items-center justify-center text-2xl font-bold">{emp.nombre.charAt(0)}</div>
                )}
                <h3 className="font-bold text-lg">{emp.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1">{emp.email || 'Sin acceso configurado'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB CONFIGURACIÓN --- */}
      {activeTab === 'config' && negocio && (
        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6">
            <h3 className="font-bold text-xl mb-4 flex items-center"><Settings className="mr-2 h-5 w-5"/> Personalización</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={negocio.color_primario || '#0f172a'} onChange={e => setNegocio({...negocio, color_primario: e.target.value})} className="h-10 w-10 border rounded cursor-pointer" />
                  <span className="text-sm font-mono">{negocio.color_primario}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Color Secundario</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={negocio.color_secundario || '#334155'} onChange={e => setNegocio({...negocio, color_secundario: e.target.value})} className="h-10 w-10 border rounded cursor-pointer" />
                  <span className="text-sm font-mono">{negocio.color_secundario}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Descripción Corta</label>
              <textarea value={negocio.descripcion_corta || ''} onChange={e => setNegocio({...negocio, descripcion_corta: e.target.value})} className="w-full px-4 py-2 border rounded-xl" rows="2" placeholder="Escribe una breve descripción o eslogan para tu negocio..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Enlace de Google Maps (Para botón "Cómo llegar")</label>
              <input type="url" value={negocio.mapa_enlace || ''} onChange={e => setNegocio({...negocio, mapa_enlace: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="https://maps.app.goo.gl/..." />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Embed de Google Maps (Iframe Src)</label>
              <input type="url" value={negocio.mapa_embed || ''} onChange={e => setNegocio({...negocio, mapa_embed: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="https://www.google.com/maps/embed?pb=..." />
              <p className="text-xs text-gray-500 mt-1">Extrae solo la URL que va dentro de src="..." en Google Maps &gt; Compartir &gt; Insertar un mapa.</p>
            </div>

            <button type="submit" className="w-full py-3 bg-theme-primary text-white font-bold rounded-xl shadow-lg">Guardar Configuración</button>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-xl mb-4 flex items-center"><ImageIcon className="mr-2 h-5 w-5"/> Logo del Negocio</h3>
            {negocio.logo_url && (
              <img src={negocio.logo_url} className="h-32 w-32 rounded-full object-cover border-4 border-gray-100 shadow-md mb-6" alt="Logo" />
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} id="logo-upload" className="hidden" />
              <label htmlFor="logo-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg inline-flex items-center">
                {uploadingObj === 'logo' ? 'Subiendo...' : 'Seleccionar Nueva Imagen'}
              </label>
              <p className="text-xs text-gray-500 mt-3">Sube tu logo para que se muestre en tu página. Require el Bucket "imagenes" en Supabase.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
