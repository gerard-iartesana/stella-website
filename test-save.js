const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        console.log("Simulating delete operations...");
        
        // 1. Delete servicios
        const resDelS = await fetch(`${URL}/servicios?titulo=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete servicios status:", resDelS.status);
        if (resDelS.status >= 400) console.log(await resDelS.text());

        // 2. Delete lookbook
        const resDelL = await fetch(`${URL}/lookbook?categoria=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete lookbook status:", resDelL.status);
        if (resDelL.status >= 400) console.log(await resDelL.text());

        // 3. Delete categorias
        const resDelC = await fetch(`${URL}/categorias?nombre=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete categorias status:", resDelC.status);
        if (resDelC.status >= 400) console.log(await resDelC.text());

    } catch (e) {
        console.error(e);
    }
}
run();
