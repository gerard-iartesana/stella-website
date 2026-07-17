const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        console.log("Fetching current data from Vercel KV...");
        // Since Vercel KV has the correct 5 services and lookbook items, let's fetch it
        const fallbackRes = await fetch('https://stella-website-ruby.vercel.app/api/data');
        const appData = await fallbackRes.json();
        
        console.log(`Loaded ${appData.servicios.length} services, ${appData.lookbook.length} lookbook items, ${appData.categorias?.length || 0} categories.`);
        
        // Add a category like the user would
        if (!appData.categorias) appData.categorias = [];
        appData.categorias.push({
            id: 'cat-' + Date.now(),
            nombre: 'Categoria Test ' + Date.now(),
            orden: appData.categorias.length
        });

        console.log("Simulating saveData...");

        // 1. Delete
        const resDelS = await fetch(`${URL}/servicios?titulo=neq.000`, {
            method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete servicios:", resDelS.status);

        const resDelL = await fetch(`${URL}/lookbook?categoria=neq.000`, {
            method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete lookbook:", resDelL.status);

        const resDelC = await fetch(`${URL}/categorias?nombre=neq.000`, {
            method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        console.log("Delete categorias:", resDelC.status);

        // 2. Prepare inserts
        const sToInsert = appData.servicios.map((s, i) => { const {id, created_at, updated_at, ...rest} = s; return { ...rest, orden: i }; });
        const lToInsert = appData.lookbook.map((l, i) => { const {id, created_at, ...rest} = l; return { ...rest, orden: i }; });
        const cToInsert = appData.categorias.map((c, i) => { const {id, created_at, ...rest} = c; return { ...rest, orden: i }; });

        // 3. Insert and print details
        console.log("Inserting services...");
        const resInsS = await fetch(`${URL}/servicios`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(sToInsert)
        });
        console.log("Insert servicios status:", resInsS.status);
        if (resInsS.status >= 400) console.log(await resInsS.text());

        console.log("Inserting lookbook...");
        const resInsL = await fetch(`${URL}/lookbook`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(lToInsert)
        });
        console.log("Insert lookbook status:", resInsL.status);
        if (resInsL.status >= 400) console.log(await resInsL.text());

        console.log("Inserting categories...");
        const resInsC = await fetch(`${URL}/categorias`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cToInsert)
        });
        console.log("Insert categorias status:", resInsC.status);
        if (resInsC.status >= 400) console.log(await resInsC.text());

    } catch (e) {
        console.error(e);
    }
}
run();
