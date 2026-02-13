import fs from "node:fs";

const allowedTop = new Set(["generatedAt", "metaMensual", "currentMonth", "current", "series"]);
const allowedCurrent = new Set(["mk", "total", "cumplidas", "noCumplidas", "tecnicos"]);
const allowedTecnico = new Set(["tecnico", "realizado", "meta", "balance", "pct", "estado", "accion"]);
const allowedSeriesKeys = new Set(["month", "MARIA", "ANDER", "CRISTHIAN"]);

const raw = fs.readFileSync("public/data.json", "utf-8");
const data = JSON.parse(raw);

for (const k of Object.keys(data)) {
  if (!allowedTop.has(k)) throw new Error(`public/data.json tiene clave no permitida: ${k}`);
}

if (data.current) {
  for (const k of Object.keys(data.current)) {
    if (!allowedCurrent.has(k)) throw new Error(`current tiene clave no permitida: ${k}`);
  }
  for (const t of (data.current.tecnicos || [])) {
    for (const k of Object.keys(t)) {
      if (!allowedTecnico.has(k)) throw new Error(`tecnico tiene clave no permitida: ${k}`);
    }
  }
}

for (const s of (data.series || [])) {
  for (const k of Object.keys(s)) {
    if (!allowedSeriesKeys.has(k)) throw new Error(`series item tiene clave no permitida: ${k}`);
  }
}

const maxSizeBytes = 300_000; // ajustable
if (Buffer.byteLength(raw, "utf-8") > maxSizeBytes) {
  throw new Error(`public/data.json excede tamaño permitido (${maxSizeBytes} bytes)`);
}

console.log("OK: public/data.json validado.");
