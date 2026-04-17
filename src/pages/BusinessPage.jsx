import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Clock, DollarSign, MapPin, Phone, Calendar as CalendarIcon, 
  User, ChevronRight, CheckCircle2, X, ChevronLeft 
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, 
  isBefore, startOfDay, parseISO 
} from 'date-fns';
import { es } from 'date-fns/locale';

export default function BusinessPage() {
  const { slug } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Booking State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info/Fecha, 2: Datos Cliente, 3: Success

  // Calendar State
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  useEffect(() => {
    fetchBusinessData();
  }, [slug]);

  useEffect(() => {
    if (negocio) {
      document.documentElement.style.setProperty('--color-primary', negocio.color_primario || '#0f172a');
      document.documentElement.style.setProperty('--color-secondary', negocio.color_secundario || '#334155');
    }
  }, [negocio]);

  // Si hay un solo empleado, seleccionarlo automáticamente
  useEffect(() => {
    if (empleados.length === 1 && !selectedEmployee) {
      setSelectedEmployee(empleados[0].id);
    }
  }, [empleados, selectedEmployee]);

  // Fetchear horas cuando haya fecha y empleado seleccionado
  useEffect(() => {
    if (selectedDate && selectedEmployee) {
      fetchAvailableTimes();
    } else {
      setAvailableTimes([]);
      setSelectedTime('');
    }
  }, [selectedDate, selectedEmployee]);

  async function fetchBusinessData() {
    try {
      const { data: nData, error: nError } = await supabase
        .from('negocios')
        .select('*')
        .eq('slug', slug)
        .single();
      if (nError) throw nError;
      setNegocio(nData);

      const [sRes, eRes] = await Promise.all([
        supabase.from('servicios').select('*').eq('negocio_id', nData.id),
        supabase.from('empleados').select('*').eq('negocio_id', nData.id)
      ]);

      if (sRes.error) throw sRes.error;
      if (eRes.error) throw eRes.error;

      setServicios(sRes.data || []);
      setEmpleados(eRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableTimes() {
    const allTimes = [];
    // Generar horas de 9:00 a 18:00
    for (let i = 9; i <= 18; i++) {
      allTimes.push(`${i.toString().padStart(2, '0')}:00:00`);
      if (i !== 18) allTimes.push(`${i.toString().padStart(2, '0')}:30:00`);
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('citas')
        .select('hora')
        .eq('empleado_id', selectedEmployee)
        .eq('fecha', formattedDate)
        .in('estado', ['pendiente', 'confirmada']);

      if (error) throw error;

      const bookedTimes = data.map(cita => cita.hora);
      const freeTimes = allTimes.filter(t => !bookedTimes.includes(t));
      setAvailableTimes(freeTimes);
    } catch (error) {
      console.error('Error fetching times:', error);
    }
  }

  function openServiceModal(servicio) {
    setSelectedService(servicio);
    setGalleryIndex(0);
    setStep(1);
    setSelectedDate(null);
    setSelectedTime('');
    // El empleado se autoselecciona arriba si solo hay 1
    if (empleados.length > 1) setSelectedEmployee(''); 
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
  }

  function closeModal() {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!selectedTime || !selectedDate || !selectedEmployee) return;

    setBookingLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('citas')
        .insert([{
          negocio_id: negocio.id,
          servicio_id: selectedService.id,
          empleado_id: selectedEmployee,
          fecha: formattedDate,
          hora: selectedTime,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono
        }]);

      if (error) throw error;

      setStep(3); // Mostrar Success
      
      // Abrir WhatsApp
      const empName = empleados.find(e => e.id === selectedEmployee)?.nombre;
      const fTime = selectedTime.substring(0,5);
      const msg = `Hola ${negocio.nombre}, agendé el servicio "${selectedService.nombre}" para el ${format(selectedDate, 'dd/MM/yyyy')} a las ${fTime} con ${empName}. Mi nombre es ${clienteNombre}.`;
      
      const phone = negocio.whatsapp ? negocio.whatsapp.replace(/\D/g, '') : '';
      if (phone) {
        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        }, 1500);
      }

    } catch (error) {
      console.error('Error booking:', error.message);
      alert('Hubo un error al agendar la cita.');
    } finally {
      setBookingLoading(false);
    }
  }

  // --- CALENDAR RENDER HELPERS ---
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-xs text-gray-400 py-2">
          {format(addMonths(startDate, i), 'EEEEEE', { locale: es }).toUpperCase()}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isPast = isBefore(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div key={day} className="p-1">
            <button
              type="button"
              disabled={isPast || !isCurrentMonth}
              onClick={() => setSelectedDate(cloneDay)}
              className={`w-full aspect-square flex items-center justify-center rounded-xl text-sm transition-all
                ${!isCurrentMonth ? 'text-gray-300' : isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 font-medium hover:bg-theme-primary/10'}
                ${isSelected ? 'bg-theme-primary text-white font-bold shadow-md transform scale-105 hover:bg-theme-primary' : ''}
                ${isSameDay(day, today) && !isSelected ? 'border-2 border-theme-primary text-theme-primary' : ''}
              `}
            >
              <span>{formattedDate}</span>
            </button>
          </div>
        );
        day = addMonths(day, 1); // Helper to add 1 day, wait addDays(day, 1) is needed but I imported addMonths. Let's fix this inline.
        // JS Date add day:
        day = new Date(day.getTime() + 86400000);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  );
  
  if (!negocio) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20">
      <h2 className="text-2xl font-bold text-gray-900">Negocio no encontrado</h2>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-20">
      {/* Premium Header V2 */}
      <div className="relative bg-theme-gradient text-white overflow-hidden shadow-2xl">
        {/* Animated Background Blobs for Premium Feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[120%] bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[120%] bg-black/20 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent mix-blend-multiply"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="relative group">
              {negocio.logo_url ? (
                <img src={negocio.logo_url} alt={negocio.nombre} className="relative h-32 w-32 rounded-full object-cover border-4 border-white shadow-2xl" />
              ) : (
                <div className="relative h-32 w-32 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-5xl font-bold bg-white text-gray-900">
                  {negocio.nombre.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white mb-3 uppercase tracking-wider">
                {negocio.categoria}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md">{negocio.nombre}</h1>
              
              {negocio.descripcion_corta && (
                <p className="mt-2 text-lg opacity-90 leading-relaxed max-w-2xl text-white drop-shadow-sm font-medium">
                  {negocio.descripcion_corta}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4 text-sm md:text-base opacity-90 font-medium items-center md:items-start justify-center md:justify-start">
                {negocio.direccion && (
                  <div className="flex items-center bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <MapPin className="h-5 w-5 mr-2" />
                    {negocio.direccion}
                  </div>
                )}
                {negocio.whatsapp && (
                  <div className="flex items-center bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Phone className="h-5 w-5 mr-2" />
                    {negocio.whatsapp}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Menú de Servicios</h2>
          <span className="text-gray-500 font-medium bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">{servicios.length} disponibles</span>
        </div>
        
        {/* Catálogo Limpio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicios.map(servicio => (
            <div 
              key={servicio.id} 
              onClick={() => openServiceModal(servicio)}
              className="group cursor-pointer bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-theme-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-theme-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-theme-primary transition-colors mb-3 tracking-tight">
                  {servicio.nombre}
                </h3>
                {servicio.descripcion && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                    {servicio.descripcion}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <Clock className="h-4 w-4 mr-1.5" /> {servicio.duracion_min}m
                  </span>
                  <span className="text-xl font-black text-theme-primary drop-shadow-sm">
                    ${servicio.precio}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-full bg-white shadow-md text-gray-400 flex items-center justify-center group-hover:bg-theme-primary group-hover:text-white group-hover:shadow-lg transition-all duration-300 transform group-hover:rotate-12">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
          {servicios.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-100 border-dashed">
              <p className="text-gray-500 font-medium text-lg">Este negocio aún no tiene servicios listados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Ubicación movida debajo de los servicios */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20">
        {(negocio.mapa_embed || negocio.mapa_enlace) && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center">
                <MapPin className="mr-2 h-6 w-6 text-theme-primary" /> Nuestra Ubicación
              </h2>
              <p className="text-gray-600 mb-6">{negocio.direccion}</p>
              {negocio.mapa_enlace && (
                <a 
                  href={negocio.mapa_enlace} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-theme-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-theme-primary/30"
                >
                  📍 Cómo llegar en Google Maps
                </a>
              )}
            </div>
            {negocio.mapa_embed && (
              <div className="w-full md:w-1/2 h-48 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-100">
                <iframe 
                  src={negocio.mapa_embed} 
                  width="100%" 
                  height="100%" 
                  style={{border:0}} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa del negocio"
                ></iframe>
              </div>
            )}
          </div>
        )}
      </div>


      {/* MODAL DE RESERVA */}
      {isModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute top-4 right-4 h-8 w-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-20">
              <X className="h-5 w-5" />
            </button>

            {step === 1 && (
              <div className="p-6 sm:p-8">
                {/* Detalles del Servicio */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-primary mb-2 block">Detalles del Servicio</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{selectedService.nombre}</h2>
                  
                  {/* Carrusel de Galería */}
                  {selectedService.galeria_urls && selectedService.galeria_urls.length > 0 && (
                    <div className="relative w-full h-48 sm:h-64 mb-6 rounded-2xl overflow-hidden bg-gray-100 shadow-inner group">
                      <img 
                        src={selectedService.galeria_urls[galleryIndex]} 
                        className="w-full h-full object-cover transition-opacity duration-300" 
                        alt="Trabajo previo" 
                      />
                      
                      {selectedService.galeria_urls.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev === 0 ? selectedService.galeria_urls.length - 1 : prev - 1); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev === selectedService.galeria_urls.length - 1 ? 0 : prev + 1); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {selectedService.galeria_urls.map((_, idx) => (
                              <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === galleryIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}></div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selectedService.descripcion && (
                    <p className="text-gray-600 leading-relaxed mb-4">{selectedService.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    <span className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-50 font-bold text-gray-700 border border-gray-200">
                      <Clock className="h-5 w-5 mr-2 text-gray-400" /> {selectedService.duracion_min} minutos
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-xl bg-green-50 font-extrabold text-green-700 border border-green-200">
                      <DollarSign className="h-5 w-5 mr-1" /> {selectedService.precio}
                    </span>
                  </div>
                </div>

                {/* Caso sin empleados */}
                {empleados.length === 0 && (
                  <div className="mb-8 p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm font-bold text-center border border-yellow-200">
                    Aún no hay especialistas asignados a este negocio. No es posible reservar en este momento.
                  </div>
                )}

                {/* Paso 1: Especialista */}
                {empleados.length > 1 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><User className="h-5 w-5 mr-2 text-theme-primary" /> Elige a tu Especialista</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {empleados.map(emp => (
                        <button
                          type="button"
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp.id)}
                          className={`p-3 rounded-xl border-2 text-sm font-bold text-left transition-all flex items-center ${
                            selectedEmployee === emp.id ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {emp.foto_url ? (
                            <img src={emp.foto_url} alt="" className={`h-8 w-8 rounded-full mr-3 object-cover border-2 ${selectedEmployee === emp.id ? 'border-theme-primary' : 'border-transparent'}`} />
                          ) : (
                            <div className={`h-8 w-8 rounded-full mr-3 flex items-center justify-center text-white ${selectedEmployee === emp.id ? 'bg-theme-primary' : 'bg-gray-300'}`}>
                              {emp.nombre.charAt(0)}
                            </div>
                          )}
                          {emp.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paso 2: Calendario */}
                {(empleados.length === 1 || selectedEmployee) && (
                  <div className="mb-8 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><CalendarIcon className="h-5 w-5 mr-2 text-theme-primary" /> Selecciona la Fecha</h3>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      {renderHeader()}
                      {renderDays()}
                      {renderCells()}
                    </div>
                  </div>
                )}

                {/* Paso 3: Horas */}
                {selectedDate && selectedEmployee && (
                  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><Clock className="h-5 w-5 mr-2 text-theme-primary" /> Horarios Disponibles</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimes.length === 0 ? (
                        <div className="col-span-4 text-center py-4 text-sm text-red-500 font-medium bg-red-50 rounded-lg">
                          No hay disponibilidad para este día.
                        </div>
                      ) : (
                        availableTimes.map(time => (
                          <button
                            type="button"
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-1 text-sm font-bold rounded-xl transition-all ${
                              selectedTime === time 
                                ? 'bg-theme-primary text-white shadow-lg transform scale-105 ring-2 ring-theme-primary ring-offset-1' 
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-theme-primary hover:text-theme-primary'
                            }`}
                          >
                            {time.substring(0,5)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedTime}
                  onClick={() => setStep(2)}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex justify-center items-center ${
                    selectedTime ? 'bg-theme-primary hover:opacity-90 shadow-lg shadow-theme-primary/30' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {empleados.length === 0 ? 'Reserva no disponible' : 
                   !selectedEmployee ? 'Elige un especialista primero' : 
                   !selectedDate ? 'Selecciona una fecha' : 
                   !selectedTime ? 'Selecciona un horario' : 
                   'Continuar Reserva'} 
                  {selectedTime && <ChevronRight className="ml-2 h-5 w-5" />}
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleBook} className="p-6 sm:p-8 animate-in slide-in-from-right-8">
                <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-medium text-sm flex items-center hover:text-gray-900 mb-6">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Volver
                </button>

                <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Tus Datos</h2>
                
                {/* Resumen */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
                  <div className="font-bold text-gray-900 mb-1">{selectedService.nombre}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span><CalendarIcon className="inline h-4 w-4 mr-1" /> {format(selectedDate, 'dd/MM/yyyy')}</span>
                    <span><Clock className="inline h-4 w-4 mr-1" /> {selectedTime.substring(0,5)}</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-theme-primary transition-colors font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      placeholder="+52 555 555 5555"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-theme-primary transition-colors font-medium outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || !clienteNombre || !clienteTelefono}
                  className="w-full mt-8 py-4 rounded-xl font-bold text-lg text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 transition-all shadow-lg shadow-green-600/30 flex justify-center items-center"
                >
                  {bookingLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>Confirmar por WhatsApp</>
                  )}
                </button>
              </form>
            )}

            {step === 3 && (
              <div className="p-10 text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Cita Solicitada!</h2>
                <p className="text-gray-500 mb-8">Se abrirá WhatsApp en un momento para enviar la confirmación a <b>{negocio.nombre}</b>.</p>
                <button onClick={closeModal} className="w-full py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
