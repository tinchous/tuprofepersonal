// middleware.js - SOLUCIÓN PARA CORS Y RATE LIMITING
import { NextResponse } from 'next/server';

// Rate limiting en memoria (simple)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 10; // 10 requests por minuto

export function middleware(request) {
    const { nextUrl, ip } = request;
    const path = nextUrl.pathname;
    
    // Aplicar solo a rutas API
    if (path.startsWith('/api/')) {
        const now = Date.now();
        const clientKey = ip || 'unknown';
        
        // Verificar rate limiting
        if (rateLimit.has(clientKey)) {
            const { count, resetTime } = rateLimit.get(clientKey);
            
            if (now < resetTime && count >= MAX_REQUESTS) {
                return new NextResponse(
                    JSON.stringify({ 
                        error: 'Rate limit exceeded', 
                        retryAfter: Math.ceil((resetTime - now) / 1000) 
                    }),
                    { 
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Retry-After': Math.ceil((resetTime - now) / 1000)
                        }
                    }
                );
            }
            
            if (now >= resetTime) {
                rateLimit.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
            } else {
                rateLimit.set(clientKey, { count: count + 1, resetTime });
            }
        } else {
            rateLimit.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }
        
        // Headers CORS para todas las respuestas API
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Credentials': 'true',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        };
        
        // Manejar preflight OPTIONS
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { 
                status: 200,
                headers 
            });
        }
        
        const response = NextResponse.next();
        
        // Añadir headers CORS a la respuesta
        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        
        return response;
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*'
};
