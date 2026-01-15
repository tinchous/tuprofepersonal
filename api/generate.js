// api/generate.js - API UNIFICADA CORREGIDA
const API_CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY,
    
    // Verificar que la API Key existe
    validateAPIKey: function() {
        if (!this.GEMINI_API_KEY) {
            throw new Error('API_KEY no configurada. Configura GEMINI_API_KEY en Vercel Environment Variables');
        }
        return true;
    }
};

export default async function handler(req, res) {
    try {
        // 1. Validar API Key
        API_CONFIG.validateAPIKey();
        
        // 2. Obtener parámetros
        const { prompt, type = 'explain', level = 'beginner' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Se requiere un prompt' });
        }
        
        // 3. Determinar qué herramienta usar
        let systemPrompt = '';
        switch(type) {
            case 'explain':
                // 🧩 TizaIA
                systemPrompt = \Eres TizaIA, un tutor educativo. Explica de forma clara y con ejemplos reales: \\;
                break;
            case 'exercises':
                // ✏️ GeneraTusEjercicios
                systemPrompt = \Genera 5 ejercicios prácticos sobre: \. Nivel: \. Incluye soluciones paso a paso.\;
                break;
            case 'exam':
                // 📝 TuExamenPersonal
                systemPrompt = \Crea un examen simulado con 10 preguntas sobre: \. Incluye múltiple opción, verdadero/falso y desarrollo.\;
                break;
            default:
                systemPrompt = prompt;
        }
        
        // 4. Llamar a Gemini API
        const response = await fetch(
            \https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\\,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: systemPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(\Error de Gemini API: \\);
        }
        
        const data = await response.json();
        const result = data.candidates[0].content.parts[0].text;
        
        // 5. Devolver respuesta
        res.status(200).json({
            success: true,
            tool: type,
            response: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            solution: 'Verifica que GEMINI_API_KEY esté configurada en Vercel Environment Variables'
        });
    }
}
