const URL = 'https://ojhvwskgsovvlzqastaf.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHZ3c2tnc292dmx6cWFzdGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzQ5MDAsImV4cCI6MjA5NDc1MDkwMH0.OUgU-a64fTrHrConmGjK5YKJjpSMPqq_BiJv6LtoLso';

async function run() {
    try {
        console.log("Checking table columns via Postgrest OpenAPI spec...");
        const res = await fetch(`${URL}/`, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        const spec = await res.json();
        
        console.log("Tables found in OpenAPI spec:", Object.keys(spec.definitions));
        
        console.log("\nDefinition for 'servicios':");
        console.log(JSON.stringify(spec.definitions.servicios.properties, null, 2));

        console.log("\nDefinition for 'categorias':");
        console.log(JSON.stringify(spec.definitions.categorias?.properties || "Not found", null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
