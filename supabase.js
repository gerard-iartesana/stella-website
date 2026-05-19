/**
 * Supabase Client Configuration
 * Roots by Stella — Dashboard CMS
 */

const SUPABASE_URL = 'https://ojhvwskgsovvlzqastaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

// Se inicializa cuando se carga el script de Supabase via CDN
let supabaseClient = null;

function initSupabase() {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase no configurado. Usando modo local (data.json).');
        return null;
    }
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client inicializado');
            return supabaseClient;
        }
    } catch (e) {
        console.warn('⚠️ Error inicializando Supabase:', e.message);
    }
    return null;
}

// Helper: Detectar si Supabase está configurado
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'TU_SUPABASE_URL_AQUI' && SUPABASE_URL.includes('supabase.co');
}

