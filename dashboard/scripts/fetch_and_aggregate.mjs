#!/usr/bin/env node
// scripts/fetch_and_aggregate.mjs
// Lee Google Sheet privado vía Service Account, agrega por AÑO+MES y técnico,
// y genera public/data.json SOLO con agregados (nunca filas crudas).

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));
const DATA_PATH = join(__dirname, '..', 'public', 'data.json');

const META = CONFIG.metaMensual;
const TECNICO_KEYS = Object.keys(CONFIG.tecnicos);

// ── Utilidades ────────────────────────────────────────────────────────────────

const MONTH_MAP = {
  ENERO: '01', FEBRERO: '02', MARZO: '03', ABRIL: '04',
  MAYO: '05',  JUNIO: '06',  JULIO: '07', AGOSTO: '08',
  SEPTIEMBRE: '09', OCTUBRE: '10', NOVIEMBRE: '11', DICIEMBRE: '12',
};

function normalize(str) {
  return String(str).trim().toUpperCase().replace(/\s+/g, ' ');
}

function resolveTecnico(raw) {
  const norm = normalize(raw);
  for (const [key, aliases] of Object.entries(CONFIG.tecnicos)) {
    if (aliases.some(a => normalize(a) === norm)) return key;
  }
  return null;
}

function mesTextoANumero(mesTexto) {
  return MONTH_MAP[normalize(mesTexto)] ?? null;
}

// ── Google Sheets ─────────────────────────────────────────────────────────────

async function fetchFromSheets() {
  const saJson = process.env.GSHEET_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GSHEET_ID;
  const range = process.env.GSHEET_RANGE;

  if (!saJson || !sheetId || !range) return null;

  const credentials = JSON.parse(saJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
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

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawAno = row[iAno];
    const rawMes = row[iMes];
    const rawExp = row[iExp];

    if (!rawAno || !rawMes || !rawExp) continue;

    const ano = String(rawAno).trim();
    const mesNum = mesTextoANumero(rawMes);
    if (!mesNum) continue;

    const tecnico = resolveTecnico(rawExp);
    if (!tecnico) continue;

    const mk = ano + '-' + mesNum;
    if (!monthly[mk]) {
      monthly[mk] = Object.fromEntries(TECNICO_KEYS.map(t => [t, 0]));
    }
    monthly[mk][tecnico]++;
  }

  if (Object.keys(monthly).length === 0) {
    throw new Error('No se encontraron filas válidas con técnicos conocidos.');
  }

  // Series ordenadas cronológicamente
  const sortedMonths = Object.keys(monthly).sort();
  const series = sortedMonths.map(mk => {
    const entry = { month: mk };
    for (const t of TECNICO_KEYS) entry[t] = monthly[mk][t] ?? 0;
    return entry;
  });

  // Mes actual = último del dataset
  const currentMk = sortedMonths[sortedMonths.length - 1];
  const cur = monthly[currentMk];

  const tecnicos = TECNICO_KEYS.map(t => {
    const realizado = cur[t] ?? 0;
    const balance = realizado - META;
    const pct = Math.round((realizado / META) * 100) / 100;
    const cumple = realizado >= META;
    return {
      tecnico: t,
      realizado,
      meta: META,
      balance,
      pct,
      estado: cumple ? 'PAGO OK' : 'OBSERVADO',
      accion: cumple ? 'PROCESAR PAGO' : 'RETENER PAGO',
    };
  });

  const total = tecnicos.reduce((s, t) => s + t.realizado, 0);

  return {
    generatedAt: new Date().toISOString(),
    metaMensual: META,
    currentMonth: currentMk,
    current: {
      mk: currentMk,
      total,
      cumplidas: tecnicos.filter(t => t.realizado >= META).length,
      noCumplidas: tecnicos.filter(t => t.realizado < META).length,
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

  const seed = {
    generatedAt: now.toISOString(),
    metaMensual: META,
    currentMonth: mk,
    current: {
      mk,
      total: 0,
      cumplidas: 0,
      noCumplidas: TECNICO_KEYS.length,
      tecnicos: TECNICO_KEYS.map(t => ({
        tecnico: t, realizado: 0, meta: META, balance: -META,
        pct: 0, estado: 'OBSERVADO', accion: 'RETENER PAGO',
      })),
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
