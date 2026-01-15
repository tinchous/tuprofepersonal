# ============================================
# COMANDOS PARA DEPLOY CORREGIDO
# ============================================

# 1. Agregar todos los archivos
git add .

# 2. Commit con mensaje descriptivo
git commit -m "fix: Solución completa para errores de API y CORS

- 🔧 Middleware para CORS y rate limiting
- 🛡️ Manejo mejorado de errores 429 (rate limit)
- 📦 Cache local y service worker
- 🚀 Cliente JavaScript robusto con fallbacks
- 🔍 Script de diagnóstico integrado
- 🐛 Fix Tracking Prevention con headers adecuados"

# 3. Subir a GitHub (Vercel deploy automático)
git push origin main

# 4. Verificar deploy en Vercel
Start-Process "https://vercel.com/tinchous/tuprofepersonal/deployments"

# 5. Probar diagnóstico
Start-Process "https://tuprofepersonal.vercel.app/api/diagnostic"

# 6. Probar herramientas
Start-Process "https://tuprofepersonal.vercel.app"

Write-Host "
📋 PASOS MANUALES EN VERCEL:" -ForegroundColor Yellow
Write-Host "1. Dashboard Vercel → tuprofepersonal" -ForegroundColor White
Write-Host "2. Settings → Environment Variables" -ForegroundColor White
Write-Host "3. Verificar que GEMINI_API_KEY está configurada" -ForegroundColor White
Write-Host "4. Deployments → 'Redeploy' si es necesario" -ForegroundColor White

Write-Host "
🔍 PARA PROBAR:" -ForegroundColor Cyan
Write-Host "1. Abre https://tuprofepersonal.vercel.app" -ForegroundColor White
Write-Host "2. F12 → Console: Debería verse '✅ Herramientas listas'" -ForegroundColor White
Write-Host "3. Usa las herramientas con prompts cortos primero" -ForegroundColor White
Write-Host "4. Si hay error 429, espera 1 minuto (rate limiting)" -ForegroundColor White
