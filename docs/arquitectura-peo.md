# PEO — Arquitectura (borrador 2026 → 2027)

## Objetivo 2026
Sistema educativo práctico para clases presenciales con 3 módulos:
1) TizaIA (dudas + explicación)
2) GeneraTusEjercicios (práctica adaptada)
3) TuExamenPersonal (simulacros)

## Objetivo 2027
Alineación institucional (ANEP / Plan Ceibal): IA como apoyo al aprendizaje, no sustituto.
- Transparencia, explicabilidad, supervisión docente
- Enfoque en razonamiento y competencias

## Estructura propuesta (monorepo simple)
/public                -> landing estática
/apps
  /tizaia              -> app chat (UI + reglas + logging educativo)
  /genera-tus-ejercicios -> generador de práctica (por tema/nivel)
  /tu-examen-personal  -> simulador (tiempo + corrección)
/shared
  /content             -> contenidos/temarios por curso (ANEP)
  /rules               -> políticas IA responsable
  /ui                  -> componentes reutilizables
/docs
  prompt base, manifiesto, decisiones

## Decisiones clave
- Mobile-first
- Accesibilidad: contraste, tamaños, teclado, lectores
- Telemetría educativa ética (sin invadir): mejoras del sistema

## Próximo entregable técnico
- Definir stack (Next.js o Vite) para apps, manteniendo landing estática aparte.
- Definir “perfil alumno” (curso, objetivo, ritmo).
