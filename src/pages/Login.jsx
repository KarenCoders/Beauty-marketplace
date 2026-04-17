import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        // Validar en tabla negocios
        const { data, error } = await supabase
          .from('negocios')
          .select('id, nombre, admin_email')
          .eq('admin_email', email)
          .eq('admin_password', password)
          .single();

        if (error || !data) throw new Error('Credenciales de administrador incorrectas');

        localStorage.setItem('session', JSON.stringify({
          role: 'admin',
          id: data.id,
          nombre: data.nombre,
          email: data.admin_email
        }));
        navigate('/admin');
      } else {
        // Validar en tabla empleados
        const { data, error } = await supabase
          .from('empleados')
          .select('id, nombre, negocio_id, email')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) throw new Error('Credenciales de especialista incorrectas');

        localStorage.setItem('session', JSON.stringify({
          role: 'empleado',
          id: data.id,
          negocio_id: data.negocio_id,
          nombre: data.nombre,
          email: data.email
        }));
        navigate('/empleado');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/20 blur-[100px]"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-3 group justify-center mb-6">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Scissors className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
              BeautyBook
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Acceso al Panel
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Ingresa tus credenciales para continuar.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-100">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Selecciona tu Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 px-4 border-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'admin' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('empleado')}
                    className={`py-3 px-4 border-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'empleado' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    Especialista
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-600 transition-colors text-gray-900 font-medium"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-600 transition-colors text-gray-900 font-medium"
                  placeholder="Tu contraseña"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-indigo-500/30 text-white font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 transition-all overflow-hidden"
              >
                {loading ? 'Verificando...' : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-4">
              Demo Admin: admin@demo.com / demo
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
