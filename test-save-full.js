const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        // Fetch current data
        const sRes = await fetch(`${URL}/servicios?select=*&order=orden.asc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
        const services = await sRes.json();
        const lRes = await fetch(`${URL}/lookbook?select=*&order=orden.asc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
        const lookbook = await lRes.json();
        const cRes = await fetch(`${URL}/categorias?select=*&order=orden.asc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
        const categories = await cRes.json();

        console.log(`Loaded ${services.length} services, ${lookbook.length} lookbook items, ${categories.length} categories.`);

        // Add a new category
        categories.push({ id: 'cat-test', nombre: 'Test Category', orden: categories.length });

        console.log("Simulating saveData...");

        // Delete all
        await fetch(`${URL}/servicios?titulo=neq.000`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
        await fetch(`${URL}/lookbook?categoria=neq.000`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
        await fetch(`${URL}/categorias?nombre=neq.000`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });

        // Map and insert
        const sToInsert = services.map((s, i) => { const {id, created_at, updated_at, ...rest} = s; return { ...rest, orden: i }; });
        const lToInsert = lookbook.map((l, i) => { const {id, created_at, ...rest} = l; return { ...rest, orden: i }; });
        const cToInsert = categories.map((c, i) => { const {id, created_at, ...rest} = c; return { ...rest, orden: i }; });

        console.log("Inserting services...");
        const sInsertRes = await fetch(`${URL}/servicios`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(sToInsert)
        });
        console.log("Services insert status:", sInsertRes.status);
        if (sInsertRes.status >= 400) console.log(await sInsertRes.text());

        console.log("Inserting lookbook...");
        const lInsertRes = await fetch(`${URL}/lookbook`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(lToInsert)
        });
        console.log("Lookbook insert status:", lInsertRes.status);
        if (lInsertRes.status >= 400) console.log(await lInsertRes.text());

        console.log("Inserting categories...");
        const cInsertRes = await fetch(`${URL}/categorias`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cToInsert)
        });
        console.log("Categories insert status:", cInsertRes.status);
        if (cInsertRes.status >= 400) console.log(await cInsertRes.text());

    } catch (e) {
        console.error(e);
    }
}
run();
