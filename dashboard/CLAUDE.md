# Proyecto: Dashboard (Sheets privado -> GitHub Pages)

## Objetivo
Dashboard público (React + Vite + GitHub Pages) que muestra métricas agregadas a partir de un Google Sheet PRIVADO (1 pestaña con datos crudos).
Actualización automática 10 veces al día (GitHub Actions cron). El dashboard NUNCA debe leer Google directamente.

## Arquitectura obligatoria
- Fuente: Google Sheets PRIVADO (sin "Publish to web")
- Backend de actualización: GitHub Actions (Node 20 + googleapis)
- Script: scripts/fetch_and_aggregate.mjs
- Output público: public/data.json (SOLO agregados, sin filas crudas)
- Frontend: Vite+React consume ./data.json

## Seguridad (NO negociable)
- Nunca guardar credenciales en el repo.
- No exponer el Google Sheet en público.
- Credenciales en GitHub Secrets:
  - GSHEET_SERVICE_ACCOUNT_JSON
  - GSHEET_ID
  - GSHEET_RANGE
- public/data.json solo debe contener:
  generatedAt, metaMensual, currentMonth, current, series

## Reglas de datos
- Solo importan 3 técnicos (alias configurables en scripts/config.json)
- Meta mensual fija: 120
- "Realizado" puede ser:
  - conteo de filas (count_rows)
  - suma de columna numérica (sum_column)
  Elegible por config.

## Comandos
- Desarrollo: npm run dev
- Build: npm run build
- Generar data local: node scripts/fetch_and_aggregate.mjs (requiere envs)
- Validar data: node scripts/validate_public_json.mjs

## Definition of Done
- Workflow cron + deploy Pages funcional
- El repo no contiene secretos
- data.json validado y sin datos sensibles
- UI coincide con mockup (cards + chart + panel pagos + tabla)
