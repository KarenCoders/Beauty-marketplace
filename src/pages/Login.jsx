import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, ShieldCheck, ArrowRight, User, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [role, setRole] = useState('cliente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'superadmin') {
        if (email === 'superadmin@beauty.com' && password === 'superadmin123') {
          localStorage.setItem('session', JSON.stringify({
            role: 'superadmin',
            id: 'superadmin',
            nombre: 'Super Administrador',
            email: email
          }));
          navigate('/superadmin');
        } else {
          throw new Error('Credenciales de super administrador incorrectas');
        }
      } else if (role === 'cliente') {
        if (isRegistering) {
          const { data, error } = await supabase
            .from('clientes')
            .insert([{ nombre, email, password, telefono }])
            .select()
            .single();
          if (error) throw new Error('Error al registrar, el correo podría ya estar en uso');
          localStorage.setItem('session', JSON.stringify({
            role: 'cliente',
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono
          }));
          navigate('/cliente');
        } else {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
          if (error || !data) throw new Error('Credenciales de cliente incorrectas');
          localStorage.setItem('session', JSON.stringify({
            role: 'cliente',
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono
          }));
          navigate('/cliente');
        }
      } else if (role === 'admin') {
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRole('cliente'); setIsRegistering(false); }}
                    className={`py-3 px-2 border-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'cliente' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('empleado'); setIsRegistering(false); }}
                    className={`py-3 px-2 border-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'empleado' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    Especialista
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('admin'); setIsRegistering(false); }}
                    className={`py-3 px-2 border-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'admin' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Negocio
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('superadmin'); setIsRegistering(false); }}
                    className={`py-3 px-2 border-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                      role === 'superadmin' 
                      ? 'border-pink-600 bg-pink-50 text-pink-700 shadow-inner' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Crown className="h-5 w-5" />
                    Plataforma
                  </button>
                </div>
              </div>

              {role === 'cliente' && isRegistering && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-600 transition-colors text-gray-900 font-medium"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-600 transition-colors text-gray-900 font-medium"
                      placeholder="+52 555 555 5555"
                    />
                  </div>
                </>
              )}

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
                className={`group relative w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all overflow-hidden ${role === 'cliente' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30'}`}
              >
                {loading ? 'Procesando...' : (
                  <>
                    {isRegistering ? 'Crear Cuenta' : 'Ingresar al Sistema'}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {role === 'cliente' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                </button>
              </div>
            )}
            
            <p className="text-center text-xs text-gray-500 mt-4">
              Demo Admin: admin@demo.com / demo <br/>
              Demo Superadmin: superadmin@beauty.com / superadmin123
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
