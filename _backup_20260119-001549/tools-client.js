// public/js/tools-client.js
// Cliente mejorado para TizaIA, GTE y TEP

class ElProfeTools {
    constructor() {
        this.baseURL = window.location.origin;
        this.isInitialized = false;
        this.queue = [];
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.RATE_LIMIT_DELAY = 1000; // 1 segundo entre requests
        
        this.init();
    }
    
    init() {
        console.log('🛠️ Inicializando herramientas ElProfeTino...');
        
        // Configurar listeners para los botones/tools
        this.setupEventListeners();
        this.setupServiceWorker();
        
        this.isInitialized = true;
        console.log('✅ Herramientas listas');
    }
    
    setupEventListeners() {
        // Buscar botones por data attributes
        document.addEventListener('click', (e) => {
            const toolBtn = e.target.closest('[data-tool]');
            if (toolBtn) {
                const toolType = toolBtn.dataset.tool;
                const inputElement = document.querySelector(toolBtn.dataset.input || '#prompt-input');
                
                if (inputElement && inputElement.value.trim()) {
                    this.processTool(toolType, inputElement.value.trim());
                } else {
                    this.showNotification('⚠️ Escribe algo primero', 'warning');
                }
            }
        });
    }
    
    async processTool(tool, prompt) {
        try {
            // Mostrar estado de carga
            this.showLoading(tool);
            
            // Generar cache key único
            const cacheKey = \\_\\;
            
            // Verificar cache local
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 minutos
                    console.log('📦 Usando respuesta cacheada');
                    this.displayResponse(tool, parsed.response);
                    this.hideLoading(tool);
                    return;
                }
            }
            
            // Rate limiting local
            const now = Date.now();
            if (now - this.lastRequestTime < this.RATE_LIMIT_DELAY) {
                await new Promise(resolve => 
                    setTimeout(resolve, this.RATE_LIMIT_DELAY - (now - this.lastRequestTime))
                );
            }
            
            // Enviar solicitud
            const response = await fetch(\\/api/generate\, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    type: tool,
                    cacheKey
                })
            });
            
            this.lastRequestTime = Date.now();
            this.requestCount++;
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('⚠️ Demasiadas solicitudes. Espera un minuto.');
                }
                throw new Error(\Error \: \\);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Guardar en cache local
                localStorage.setItem(cacheKey, JSON.stringify({
                    response: data.response,
                    timestamp: Date.now(),
                    tool: data.tool
                }));
                
                // Mostrar respuesta
                this.displayResponse(tool, data.response);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
            
        } catch (error) {
            console.error(\❌ Error en \:\, error);
            this.showNotification(\Error: \\, 'error');
            
            // Intentar fallback a mensaje estático
            this.showFallbackResponse(tool, prompt);
            
        } finally {
            this.hideLoading(tool);
        }
    }
    
    displayResponse(tool, response) {
        // Buscar contenedor de resultados
        const resultContainer = document.getElementById(\\-result\) || 
                               document.querySelector('.tool-results') ||
                               document.createElement('div');
        
        if (!resultContainer.id) {
            resultContainer.id = 'tool-results';
            resultContainer.className = 'tool-results-container';
            document.querySelector('main').appendChild(resultContainer);
        }
        
        // Crear elemento de respuesta
        const responseElement = document.createElement('div');
        responseElement.className = 'tool-response';
        responseElement.innerHTML = \
            <div class="tool-header">
                <h3>\</h3>
                <span class="timestamp">\</span>
            </div>
            <div class="tool-content">\</div>
            <div class="tool-actions">
                <button onclick="this.closest('.tool-response').remove()">× Cerrar</button>
                <button onclick="navigator.clipboard.writeText('\')">📋 Copiar</button>
            </div>
        \;
        
        // Insertar al principio
        resultContainer.insertBefore(responseElement, resultContainer.firstChild);
        
        // Limitar a 5 respuestas
        const responses = resultContainer.querySelectorAll('.tool-response');
        if (responses.length > 5) {
            responses[responses.length - 1].remove();
        }
        
        this.showNotification('✅ Respuesta generada', 'success');
    }
    
    showFallbackResponse(tool, prompt) {
        const fallbackResponses = {
            'explain': \<strong>🧩 TizaIA (modo offline)</strong><br>
                       Basándome en "\", te sugiero revisar estos recursos:<br>
                       • Khan Academy (gratuito)<br>
                       • Videos educativos en YouTube<br>
                       • Libros de texto de la materia<br><br>
                       <em>Nota: La API está temporalmente no disponible. Intenta en unos minutos.</em>\,
            
            'exercises': \<strong>✏️ Ejercicios sugeridos</strong><br>
                        1. Investiga sobre "\" y resume 3 puntos clave<br>
                        2. Busca ejemplos prácticos en internet<br>
                        3. Crea tu propio ejercicio basado en lo aprendido<br><br>
                        <em>Prueba con un tema más específico cuando la API esté disponible.</em>\,
            
            'exam': \<strong>📝 Estrategia de estudio</strong><br>
                    Para preparar un examen sobre "\":<br>
                    1. Revisa tus apuntes y subraya conceptos clave<br>
                    2. Crea tarjetas de estudio (flashcards)<br>
                    3. Practica con exámenes anteriores<br>
                    4. Enseña el tema a alguien más<br><br>
                    <em>La función de simulación estará disponible pronto.</em>\
        };
        
        this.displayResponse(tool, fallbackResponses[tool] || 'Intenta recargar la página.');
    }
    
    getToolName(tool) {
        const names = {
            'explain': '🧩 TizaIA',
            'exercises': '✏️ GeneraTusEjercicios', 
            'exam': '📝 TuExamenPersonal'
        };
        return names[tool] || 'Herramienta';
    }
    
    formatResponse(text) {
        // Formatear texto básico
        return text
            .replace(/\\n\\n/g, '</p><p>')
            .replace(/\\n/g, '<br>')
            .replace(/\\*(.*?)\\*/g, '<strong></strong>')
            .replace(/_(.*?)_/g, '<em></em>')
            .replace(/^# (.*$)/gm, '<h4></h4>')
            .replace(/^## (.*$)/gm, '<h5></h5>')
            .replace(/^\\d+\\.\\s+(.*$)/gm, '<li></li>')
            .replace(/^-\\s+(.*$)/gm, '<li></li>');
    }
    
    showLoading(tool) {
        const loadingId = \loading-\\;
        let loader = document.getElementById(loadingId);
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = loadingId;
            loader.className = 'tool-loading';
            loader.innerHTML = \
                <div class="spinner"></div>
                <span>\ procesando...</span>
            \;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'block';
    }
    
    hideLoading(tool) {
        const loader = document.getElementById(\loading-\\);
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Crear o reusar notificación
        let notification = document.getElementById('tool-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'tool-notification';
            notification.className = 'tool-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = \	ool-notification \\;
        notification.style.display = 'block';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    console.log('✅ Service Worker registrado:', reg.scope);
                    
                    // Cachear recursos críticos
                    caches.open('elprofetino-v1').then(cache => {
                        cache.addAll([
                            '/',
                            '/api/generate',
                            '/public/js/tools-client.js'
                        ]);
                    });
                })
                .catch(err => {
                    console.log('❌ Service Worker falló:', err);
                });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.ElProfeTools = new ElProfeTools();
    
    // Añadir estilos CSS para las herramientas
    const styles = document.createElement('style');
    styles.textContent = \
        .tool-results-container {
            margin: 20px 0;
            max-width: 800px;
        }
        
        .tool-response {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #4a90e2;
        }
        
        .tool-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .tool-header h3 {
            margin: 0;
            color: #2c3e50;
        }
        
        .timestamp {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .tool-content {
            line-height: 1.6;
            color: #34495e;
        }
        
        .tool-content p {
            margin: 10px 0;
        }
        
        .tool-actions {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        
        .tool-actions button {
            padding: 8px 15px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .tool-actions button:hover {
            background: #e9ecef;
        }
        
        .tool-loading {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a90e2;
            color: white;
            padding: 15px;
            border-radius: 8px;
            display: none;
            z-index: 1000;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .tool-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            display: none;
            z-index: 1000;
            max-width: 300px;
        }
        
        .tool-notification.success {
            background: #27ae60;
        }
        
        .tool-notification.error {
            background: #e74c3c;
        }
        
        .tool-notification.warning {
            background: #f39c12;
        }
        
        .tool-notification.info {
            background: #3498db;
        }
    \;
    document.head.appendChild(styles);
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElProfeTools;
}
