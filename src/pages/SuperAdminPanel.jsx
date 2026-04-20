import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Trash2, Edit2, Plus, Store, Settings, LogOut, CheckCircle2, X 
} from 'lucide-react';

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [negocios, setNegocios] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    categoria: '',
    admin_email: '',
    admin_password: '',
    descripcion_corta: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  });

  useEffect(() => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    
    const sess = JSON.parse(sessionStr);
    if (sess.role !== 'superadmin') {
      navigate('/login');
      return;
    }
    
    setSession(sess);
    fetchNegocios();
  }, [navigate]);

  async function fetchNegocios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setNegocios(data || []);
    } catch (error) {
      console.error('Error fetching negocios:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('session');
    navigate('/login');
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!editingId) {
      setForm({ ...form, nombre: val, slug: generateSlug(val) });
    } else {
      setForm({ ...form, nombre: val });
    }
  };

  function openForm(negocio = null) {
    if (negocio) {
      setForm({
        nombre: negocio.nombre || '',
        slug: negocio.slug || '',
        categoria: negocio.categoria || '',
        admin_email: negocio.admin_email || '',
        admin_password: negocio.admin_password || '',
        descripcion_corta: negocio.descripcion_corta || '',
        direccion: negocio.direccion || '',
        telefono: negocio.telefono || '',
        whatsapp: negocio.whatsapp || '',
        facebook: negocio.facebook || '',
        instagram: negocio.instagram || '',
        tiktok: negocio.tiktok || ''
      });
      setEditingId(negocio.id);
    } else {
      setForm({
        nombre: '',
        slug: '',
        categoria: '',
        admin_email: '',
        admin_password: '',
        descripcion_corta: '',
        direccion: '',
        telefono: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        tiktok: ''
      });
      setEditingId(null);
    }
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('negocios')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('negocios')
          .insert([form]);
        if (error) throw error;
      }
      
      setShowForm(false);
      fetchNegocios();
      alert('Negocio guardado exitosamente.');
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este negocio? Esta acción borrará todos sus servicios, especialistas y citas.')) return;
    try {
      const { error } = await supabase.from('negocios').delete().eq('id', id);
      if (error) throw error;
      setNegocios(negocios.filter(n => n.id !== id));
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Store className="mr-3 h-8 w-8 text-pink-600" /> Panel Super Administrador
          </h1>
          <p className="mt-2 text-gray-500 font-medium">Gestiona todos los negocios de la plataforma.</p>
        </div>
        <button onClick={handleLogout} className="mt-4 md:mt-0 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl flex items-center transition-colors">
          <LogOut className="mr-2 h-5 w-5" /> Cerrar Sesión
        </button>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Negocios Registrados ({negocios.length})</h2>
        <button onClick={() => openForm()} className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center transition-all shadow-lg shadow-pink-600/30">
          <Plus className="h-5 w-5 mr-2" /> Añadir Negocio
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-extrabold mb-6">{editingId ? 'Editar Negocio' : 'Nuevo Negocio'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input required type="text" value={form.nombre} onChange={handleNameChange} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Ej. Glamour Spa" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Slug (URL)</label>
                <input required type="text" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors font-mono text-sm bg-gray-50" placeholder="glamour-spa" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <input required type="text" value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Ej. Barbería, Salón de Belleza, Spa" />
              </div>
              
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="font-bold text-indigo-600 mb-4 flex items-center"><Store className="mr-2 h-5 w-5"/> Información de Contacto</h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Física</label>
                <input type="text" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Ej. Av. Principal 123, Ciudad" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Ej. 555-1234" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
                <input type="text" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Ej. +1234567890" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción Corta</label>
                <textarea value={form.descripcion_corta} onChange={e=>setForm({...form,descripcion_corta:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" rows="2" placeholder="Eslogan o breve descripción"></textarea>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="font-bold text-indigo-600 mb-4 flex items-center"><Store className="mr-2 h-5 w-5"/> Redes Sociales (Opcional)</h4>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Facebook URL</label>
                <input type="url" value={form.facebook} onChange={e=>setForm({...form,facebook:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="https://facebook.com/..." />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Instagram URL</label>
                <input type="url" value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="https://instagram.com/..." />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">TikTok URL</label>
                <input type="url" value={form.tiktok} onChange={e=>setForm({...form,tiktok:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="https://tiktok.com/@..." />
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="font-bold text-indigo-600 mb-4 flex items-center"><Settings className="mr-2 h-5 w-5"/> Acceso Administrador (Dueño del Negocio)</h4>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email del Admin</label>
                <input required type="email" value={form.admin_email} onChange={e=>setForm({...form,admin_email:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="admin@negocio.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña del Admin</label>
                <input required type="text" value={form.admin_password} onChange={e=>setForm({...form,admin_password:e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition-colors" placeholder="Asigna una contraseña" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-3 bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-600/30 hover:bg-pink-700 transition-colors">Guardar Negocio</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Negocio</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Acceso Admin</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {negocios.map((negocio) => (
                <tr key={negocio.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {negocio.logo_url ? (
                          <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={negocio.logo_url} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                            {negocio.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{negocio.nombre}</div>
                        <div className="text-sm text-gray-500 font-mono text-xs">/{negocio.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-800">
                      {negocio.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{negocio.admin_email || 'No asignado'}</div>
                    <div className="text-xs text-gray-400">Pass: {negocio.admin_password ? '••••••' : 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openForm(negocio)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(negocio.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {negocios.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No hay negocios registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
