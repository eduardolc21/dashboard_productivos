# Skill: wire-sheets-aggregator

Objetivo: implementar scripts/fetch_and_aggregate.mjs usando Google Sheets API (service account)
y generar public/data.json con SOLO agregados.

Entradas:
- env: GSHEET_ID, GSHEET_RANGE, GSHEET_SERVICE_ACCOUNT_JSON
- config: scripts/config.json

Tareas:
1) Leer rango con googleapis (readonly).
2) Transformar filas a objetos por header.
3) Normalizar nombres y mapear al técnico (3 técnicos con aliases).
4) Agrupar por mes (fecha YYYY-MM-DD o DD/MM/YYYY).
5) Calcular métricas y escribir public/data.json.
6) Agregar logs útiles.
7) Asegurar compatibilidad con Node 20.

Restricciones:
- No exportar filas crudas a public/data.json.
- Si headers faltan, fallar con error claro.
