// config/api-config.js
// NO SUBIR A GITHUB - Usar variables de entorno en producción

module.exports = {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
    
    tools: {
        tizaia: {
            name: "🧩 TizaIA",
            description: "Responde dudas y explica temas con ejemplos reales",
            endpoint: "/api/generate",
            model: "gemini-pro",
            maxTokens: 1500
        },
        gte: {
            name: "✏️ GeneraTusEjercicios", 
            description: "Genera práctica con ejercicios adaptados al nivel",
            endpoint: "/api/generate?type=exercises",
            model: "gemini-pro",
            maxQuestions: 10
        },
        tep: {
            name: "📝 TuExamenPersonal",
            description: "Simula un examen real con tiempo y corrección",
            endpoint: "/api/generate?type=exam",
            model: "gemini-pro",
            timeLimit: 3600
        }
    }
};
