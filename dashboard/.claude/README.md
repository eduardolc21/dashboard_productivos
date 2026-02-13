# Claude Code - Guía rápida del repo

## Qué debe hacer Claude
1) Mantener la arquitectura definida en /CLAUDE.md
2) No proponer hacer público Google Sheets
3) Trabajar por cambios pequeños y verificables (build + validate_public_json)

## Skills
Usa los playbooks en .claude/skills/* para:
- scaffold-dashboard: estructura/archivos base
- wire-sheets-aggregator: script de Sheets -> data.json
- ui-match-mock: UI similar al mockup
- security-review: check de secretos y data.json

## Flujo recomendado
1) Ejecutar scaffold-dashboard
2) Configurar scripts/config.json (headers + aliases + modo)
3) Probar scripts/fetch_and_aggregate.mjs con envs
4) Activar workflow update-and-deploy.yml
5) Ajustar UI y validar con public/data.json
