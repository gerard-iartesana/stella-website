const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        console.log("Simulating full dashboard save with error checking...");

        // 1. Delete all
        console.log("Deleting servicios...");
        let res = await fetch(`${URL}/servicios?titulo=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'return=minimal' }
        });
        console.log("Delete servicios:", res.status);

        console.log("Deleting lookbook...");
        res = await fetch(`${URL}/lookbook?categoria=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'return=minimal' }
        });
        console.log("Delete lookbook:", res.status);

        console.log("Deleting categorias...");
        res = await fetch(`${URL}/categorias?nombre=neq.000`, {
            method: 'DELETE',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'return=minimal' }
        });
        console.log("Delete categorias:", res.status);

        // 2. Insert mock data
        const sToInsert = [
            { titulo: 'Trenzado Fulani', descripcion: 'Desc', duracion: '2h', precio: '50', orden: 0, categoria: 'Trenzas' },
            { titulo: 'Sistema Capilar', descripcion: 'Desc', duracion: '2h', precio: '80', orden: 1, categoria: 'Sistemas Capilares' }
        ];

        const cToInsert = [
            { nombre: 'Trenzas', orden: 0 },
            { nombre: 'Sistemas Capilares', orden: 1 },
            { nombre: 'Peinados', orden: 2 }
        ];

        console.log("Inserting services...");
        res = await fetch(`${URL}/servicios`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(sToInsert)
        });
        console.log("Insert servicios status:", res.status);
        if (res.status >= 400) console.log(await res.text());

        console.log("Inserting categories...");
        res = await fetch(`${URL}/categorias`, {
            method: 'POST',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(cToInsert)
        });
        console.log("Insert categorias status:", res.status);
        if (res.status >= 400) console.log(await res.text());

    } catch (e) {
        console.error(e);
    }
}
run();
