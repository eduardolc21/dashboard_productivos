## Dashboard (Sheets privado -> GitHub Pages)

### Setup local
1) npm ci
2) Copia .env.example a .env y completa variables
3) node scripts/fetch_and_aggregate.mjs
4) node scripts/validate_public_json.mjs
5) npm run dev

### Deploy automático
- Configura GitHub Secrets:
  - GSHEET_ID
  - GSHEET_RANGE
  - GSHEET_SERVICE_ACCOUNT_JSON
- Activa Pages: Settings -> Pages -> Source: GitHub Actions
- El workflow actualiza 10 veces al día.
