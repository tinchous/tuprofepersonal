// api/verify-api.js
// Verifica que la API Key funcione correctamente

const fetch = require('node-fetch');

async function verifyGeminiAPI(apiKey) {
    try {
        console.log('🔍 Verificando API Key de Gemini...');
        
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Responde 'OK' si estás funcionando"
                        }]
                    }]
                })
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Key válida');
            console.log('📊 Modelo: Gemini Pro');
            console.log('🔗 Estado: Conectado correctamente');
            return true;
        } else {
            console.error('❌ Error en API:', response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return false;
    }
}

// Verificar usando variable de entorno
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error('🚨 ERROR: No se encontró API_KEY en variables de entorno');
    console.log('📋 Solución:');
    console.log('1. En Vercel: Add Environment Variable → GEMINI_API_KEY');
    console.log('2. Localmente: Crear archivo .env.local con GEMINI_API_KEY=tu_clave');
    process.exit(1);
}

// Ejecutar verificación
verifyGeminiAPI(apiKey).then(isValid => {
    if (isValid) {
        console.log('🎉 Todas las herramientas deberían funcionar:');
        console.log('   🧩 TizaIA - ✓');
        console.log('   ✏️ GTE - ✓'); 
        console.log('   📝 TEP - ✓');
        process.exit(0);
    } else {
        console.log('⚠️  La API Key no funciona. Revísala en:');
        console.log('   https://aistudio.google.com/apikey');
        process.exit(1);
    }
});
