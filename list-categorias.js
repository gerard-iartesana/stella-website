const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        const res = await fetch(`${URL}/categorias?select=*&order=orden.asc`, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Categorias status:", res.status);
        const data = await res.json();
        console.log("Categorias list:", data);
    } catch (e) {
        console.error(e);
    }
}
run();
