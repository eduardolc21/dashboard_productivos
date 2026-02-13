# Skill: ui-match-mock

Objetivo: hacer que la UI se parezca al mockup:
- Header + meta
- 4 KPI cards
- 2 columnas (chart + panel pagos)
- Tabla inferior

Tareas:
1) Consumir ./data.json (fetch) y manejar loading/error.
2) Implementar diseño limpio con CSS (sin frameworks si no es necesario).
3) Recharts: gráfico con barras por técnico y línea meta (ReferenceLine).
4) PaymentStatus: tarjetas por técnico (PAGO OK / OBSERVADO) + progress bar.
5) ProductionTable: balance con color y botón/etiqueta (PROCESAR/RETENER).

Restricciones:
- No usar datos sensibles ni conectar con Google.
- Debe ser responsive.
