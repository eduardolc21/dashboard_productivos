# Skill: security-review

Objetivo: revisar que el repo cumpla seguridad.

Checklist:
- No hay JSON de service account en repo.
- .gitignore incluye .env y archivos sensibles.
- public/data.json no contiene filas crudas ni PII innecesaria.
- Frontend no contiene keys ni llama a APIs de Google.
- Workflow usa Secrets y permisos mínimos.

Salida:
- Lista de hallazgos (si existen) y correcciones sugeridas.
