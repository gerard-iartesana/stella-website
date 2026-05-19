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

// =====================================================
// Segundo cliente: iARTESANA (para incidencias de soporte)
// =====================================================
const IARTESANA_SUPABASE_URL = 'https://icwodxquqqbhjrltjzzj.supabase.co';
const IARTESANA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd29keHF1cXFiaGpybHRqenpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzU1MjgsImV4cCI6MjA5NDE1MTUyOH0.02ogsrpmUdvyOqeM-2cU37a7isJhN1WANCe6DDjve5I';

// ⚠️ CONFIGURAR: UUIDs del proyecto iARTESANA
// Estos valores hay que obtenerlos del Supabase de iARTESANA una vez aplicadas las migraciones
const IARTESANA_ORG_ID = 'eacf5078-b140-42d7-9f71-79a8d53b2ad5';      // UUID de la organización iARTESANA
const IARTESANA_STELLA_CLIENT_ID = 'f42e7afb-4700-430a-b0cf-14354ea10cf3';  // UUID de "Roots by Stella" como cliente en iARTESANA

let iartesanaClient = null;

function initIartesana() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            iartesanaClient = supabase.createClient(IARTESANA_SUPABASE_URL, IARTESANA_SUPABASE_ANON_KEY);
            console.log('✅ iARTESANA client inicializado (soporte)');
            return iartesanaClient;
        }
    } catch (e) {
        console.warn('⚠️ Error inicializando iARTESANA client:', e.message);
    }
    return null;
}

function isIartesanaConfigured() {
    return IARTESANA_ORG_ID !== 'PENDIENTE_UUID_ORGANIZACION' && IARTESANA_STELLA_CLIENT_ID !== 'PENDIENTE_UUID_CLIENTE';
}

