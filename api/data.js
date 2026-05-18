const { Redis } = require('@upstash/redis');
const fs = require('fs');
const path = require('path');

// Inicializa Redis solo si existen las credenciales en el entorno (Vercel)
const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) 
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

module.exports = async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const dataFilePath = path.join(process.cwd(), 'data.json');

    if (req.method === 'GET') {
        try {
            if (redis) {
                // Leer de la base de datos Upstash Redis (Vercel KV)
                let data = await redis.get('appData');
                if (!data) {
                    // Si la base de datos está vacía, la inicializamos con el archivo local
                    const localData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
                    await redis.set('appData', localData);
                    data = localData;
                }
                res.status(200).json(data);
            } else {
                // Fallback local: Leer de data.json
                const localData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
                res.status(200).json(localData);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else if (req.method === 'POST') {
        try {
            const newData = req.body;
            if (redis) {
                // Guardar en la base de datos Upstash Redis
                await redis.set('appData', newData);
                res.status(200).json({ message: 'Data saved successfully to Upstash Redis' });
            } else {
                // Fallback local: Escribir en data.json
                fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2), 'utf8');
                res.status(200).json({ message: 'Data saved successfully to local file' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to save data' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
