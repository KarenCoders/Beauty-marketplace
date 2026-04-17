import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Función auxiliar para subir imágenes al bucket 'imagenes'
 * @param {File} file - El archivo de imagen a subir
 * @param {string} folder - Carpeta dentro del bucket (ej. 'logos', 'empleados', 'servicios')
 * @returns {Promise<string>} - La URL pública de la imagen
 */
export async function uploadImage(file, folder = 'general') {
  if (!file) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('imagenes')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('imagenes')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error subiendo imagen:', error.message);
    throw error;
  }
}
