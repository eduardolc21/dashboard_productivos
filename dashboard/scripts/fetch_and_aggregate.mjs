#!/usr/bin/env node
// scripts/fetch_and_aggregate.mjs
// Lee Google Sheet privado vía Service Account, agrega por AÑO+MES y técnico,
// y genera public/data.json SOLO con agregados (nunca filas crudas).

import 'dotenv/config';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));
const DATA_PATH = join(__dirname, '..', 'public', 'data.json');

const TECNICO_KEYS = Object.keys(CONFIG.tecnicos);
const METAS = CONFIG.metas; // { TECNICO: { "YYYY-MM": number } }
const IS_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

function getMeta(tecnico, monthKey) {
  return METAS[tecnico]?.[monthKey] ?? 0;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

const MONTH_MAP = {
  ENERO: '01', FEBRERO: '02', MARZO: '03', ABRIL: '04',
  MAYO: '05',  JUNIO: '06',  JULIO: '07', AGOSTO: '08',
  SEPTIEMBRE: '09', OCTUBRE: '10', NOVIEMBRE: '11', DICIEMBRE: '12',
};

function normalize(str) {
  return String(str)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function resolveTecnico(raw) {
  const norm = normalize(raw);
  for (const [key, aliases] of Object.entries(CONFIG.tecnicos)) {
    if (aliases.some(a => normalize(a) === norm)) return key;
  }
  return null;
}

function mesTextoANumero(mesTexto) {
  const mesNormalizado = normalize(mesTexto).replace(/[^A-Z]/g, '');
  if (MONTH_MAP[mesNormalizado]) return MONTH_MAP[mesNormalizado];

  // Corrige errores de digitación comunes por repetición de letras (ej. FEBREERO -> FEBRERO).
  const mesConDuplicadosComprimidos = mesNormalizado.replace(/([A-Z])\1+/g, '$1');
  return MONTH_MAP[mesConDuplicadosComprimidos] ?? null;
}

function parseServiceAccount(raw) {
  const input = String(raw ?? '').trim();

  if (!input) {
    throw new Error('GSHEET_SERVICE_ACCOUNT_JSON esta vacio.');
  }

  const parseJson = value => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  let credentials = parseJson(input);

  if (!credentials) {
    const decoded = Buffer.from(input, 'base64').toString('utf-8').trim();
    credentials = parseJson(decoded);
  }

  if (!credentials || typeof credentials !== 'object') {
    throw new Error(
      'GSHEET_SERVICE_ACCOUNT_JSON no es JSON valido. Usa JSON plano o JSON en base64.'
    );
  }

  if (typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Credenciales incompletas: faltan client_email/private_key en GSHEET_SERVICE_ACCOUNT_JSON.');
  }

  return credentials;
}

// ── Google Sheets ─────────────────────────────────────────────────────────────

async function fetchFromSheets() {
  const saJson = process.env.GSHEET_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GSHEET_ID;
  const range = process.env.GSHEET_RANGE;

  const providedVars = [saJson, sheetId, range].filter(Boolean).length;

  if (providedVars === 0) {
    if (IS_GITHUB_ACTIONS) {
      throw new Error(
        'No se encontraron secretos de Google Sheets en GitHub Actions. ' +
        'Configura GSHEET_SERVICE_ACCOUNT_JSON, GSHEET_ID y GSHEET_RANGE en Settings > Secrets and variables > Actions.'
      );
    }
    return null;
  }

  if (providedVars < 3) {
    throw new Error(
      'Configuracion incompleta para sincronizar Google Sheets. ' +
      'Define GSHEET_SERVICE_ACCOUNT_JSON, GSHEET_ID y GSHEET_RANGE.'
    );
  }

  const credentials = parseServiceAccount(saJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: String(sheetId).trim(),
    range: String(range).trim(),
  });

  return res.data.values;
}

// ── Procesamiento ─────────────────────────────────────────────────────────────

function processRows(rows) {
  if (!rows || rows.length < 2) {
    throw new Error('La hoja no tiene filas de datos (se esperaban al menos headers + 1 fila).');
  }

  const headers = rows[0].map(h => normalize(h));

  const colExpositor = normalize(CONFIG.sheet.colExpositor);
  const colAno = normalize(CONFIG.sheet.colAno);
  const colMes = normalize(CONFIG.sheet.colMes);

  const iExp = headers.indexOf(colExpositor);
  const iAno = headers.indexOf(colAno);
  const iMes = headers.indexOf(colMes);

  if (iExp === -1 || iAno === -1 || iMes === -1) {
    throw new Error(
      'Headers no coinciden con config.\n' +
      '  Esperados : "' + colAno + '", "' + colMes + '", "' + colExpositor + '"\n' +
      '  Detectados: ' + JSON.stringify(headers)
    );
  }

  // Acumular conteo: monthly["YYYY-MM"]["TECNICO"] = count
  const monthly = {};
  const diagnostics = {
    skippedMissingRequired: 0,
    skippedInvalidMonth: 0,
    skippedUnknownTecnico: 0,
    invalidMonthSamples: new Set(),
    unknownTecnicoSamples: new Set(),
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawAno = row[iAno];
    const rawMes = row[iMes];
    const rawExp = row[iExp];

    if (!rawAno || !rawMes || !rawExp) {
      diagnostics.skippedMissingRequired++;
      continue;
    }

    const ano = String(rawAno).trim();
    const mesNum = mesTextoANumero(rawMes);
    if (!mesNum) {
      diagnostics.skippedInvalidMonth++;
      if (diagnostics.invalidMonthSamples.size < 5) {
        diagnostics.invalidMonthSamples.add(String(rawMes).trim());
      }
      continue;
    }

    const tecnico = resolveTecnico(rawExp);
    if (!tecnico) {
      diagnostics.skippedUnknownTecnico++;
      if (diagnostics.unknownTecnicoSamples.size < 5) {
        diagnostics.unknownTecnicoSamples.add(String(rawExp).trim());
      }
      continue;
    }

    const mk = ano + '-' + mesNum;
    if (!monthly[mk]) {
      monthly[mk] = Object.fromEntries(TECNICO_KEYS.map(t => [t, 0]));
    }
    monthly[mk][tecnico]++;
  }

  if (Object.keys(monthly).length === 0) {
    throw new Error('No se encontraron filas válidas con técnicos conocidos.');
  }

  const totalSkipped =
    diagnostics.skippedMissingRequired +
    diagnostics.skippedInvalidMonth +
    diagnostics.skippedUnknownTecnico;

  if (totalSkipped > 0) {
    console.warn(
      '[WARN] Filas omitidas durante la agregación:',
      JSON.stringify({
        skippedMissingRequired: diagnostics.skippedMissingRequired,
        skippedInvalidMonth: diagnostics.skippedInvalidMonth,
        skippedUnknownTecnico: diagnostics.skippedUnknownTecnico,
        invalidMonthSamples: Array.from(diagnostics.invalidMonthSamples),
        unknownTecnicoSamples: Array.from(diagnostics.unknownTecnicoSamples),
      })
    );
  }

  // Series ordenadas cronológicamente, filtradas por seriesDesde
  const desde = CONFIG.seriesDesde ?? null;
  const sortedMonths = Object.keys(monthly).sort();
  const filteredMonths = desde ? sortedMonths.filter(mk => mk >= desde) : sortedMonths;
  const series = filteredMonths.map(mk => {
    const entry = { month: mk };
    for (const t of TECNICO_KEYS) {
      entry[t] = monthly[mk][t] ?? 0;
      entry['meta_' + t] = getMeta(t, mk);
    }
    return entry;
  });

  // Mes actual = último del dataset
  const currentMk = sortedMonths[sortedMonths.length - 1];
  const cur = monthly[currentMk];

  const tecnicos = TECNICO_KEYS.map(t => {
    const realizado = cur[t] ?? 0;
    const meta = getMeta(t, currentMk);
    const balance = realizado - meta;
    const pct = meta > 0 ? Math.round((realizado / meta) * 100) / 100 : 0;
    const cumple = meta > 0 && realizado >= meta;
    return {
      tecnico: t,
      realizado,
      meta,
      balance,
      pct,
      estado: cumple ? 'PAGO OK' : 'OBSERVADO',
      accion: cumple ? 'PROCESAR PAGO' : 'RETENER PAGO',
    };
  });

  const total = tecnicos.reduce((s, t) => s + t.realizado, 0);
  const totalMeta = tecnicos.reduce((s, t) => s + t.meta, 0);

  return {
    generatedAt: new Date().toISOString(),
    currentMonth: currentMk,
    current: {
      mk: currentMk,
      total,
      totalMeta,
      cumplidas: tecnicos.filter(t => t.meta > 0 && t.realizado >= t.meta).length,
      noCumplidas: tecnicos.filter(t => t.meta > 0 && t.realizado < t.meta).length,
      tecnicos,
    },
    series,
  };
}

// ── Fallback (sin env vars) ───────────────────────────────────────────────────

function handleFallback() {
  if (existsSync(DATA_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
      if (existing.generatedAt && existing.current) {
        console.log('Sin variables de entorno. Usando public/data.json existente (fallback).');
        return;
      }
    } catch { /* JSON roto, crear semilla */ }
  }

  console.log('Sin variables de entorno ni data.json valido. Creando semilla...');
  const now = new Date();
  const mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const seedTecnicos = TECNICO_KEYS.map(t => {
    const meta = getMeta(t, mk);
    return {
      tecnico: t, realizado: 0, meta, balance: -meta,
      pct: 0, estado: 'OBSERVADO', accion: 'RETENER PAGO',
    };
  });
  const totalMeta = seedTecnicos.reduce((s, t) => s + t.meta, 0);

  const seed = {
    generatedAt: now.toISOString(),
    currentMonth: mk,
    current: {
      mk,
      total: 0,
      totalMeta,
      cumplidas: 0,
      noCumplidas: seedTecnicos.filter(t => t.meta > 0).length,
      tecnicos: seedTecnicos,
    },
    series: [],
  };

  writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2));
  console.log('Semilla public/data.json creada.');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Obteniendo datos de Google Sheets...');

  const rows = await fetchFromSheets();

  if (rows === null) {
    handleFallback();
    return;
  }

  console.log('Recibidas ' + rows.length + ' filas. Procesando...');
  const data = processRows(rows);
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log('public/data.json generado (' + data.series.length + ' meses, actual: ' + data.currentMonth + ').');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
