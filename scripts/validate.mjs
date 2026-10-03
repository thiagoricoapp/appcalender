import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (p) => readFile(new URL(p, root), "utf8");
const exists = async (p) => { try { await access(new URL(p, root), constants.F_OK); return true; } catch { return false; } };
const errors = [];
const html = await read("index.html");
const js = await read("app-v8.js");
const manifest = await read("manifest.webmanifest");
const sw = await read("sw.js");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = ids.filter((id,i,a) => a.indexOf(id) !== i);
if (duplicates.length) errors.push("Duplicate HTML ids: " + [...new Set(duplicates)].join(", "));
for (const id of ["authScreen","appShell","sidebar","calendarView","calendar","globalModal","globalModalContent","globalModalClose"]) if (!ids.includes(id)) errors.push("Missing required id: " + id);
for (const view of [...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1])) if (!ids.includes(view + "View")) errors.push("Nav view has no matching section: " + view + "View");
for (const src of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) if (!/^(https?:|data:|#)/.test(src) && !(await exists(src))) errors.push("Missing local asset: " + src);
for (const asset of ["icon-192.png","icon-512.png"]) if (!(await exists(asset))) errors.push("Missing PWA icon: " + asset);

const duplicateFunctions = [...js.matchAll(/(?:^|\n)function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]).filter((n,i,a) => a.indexOf(n) !== i);
if (duplicateFunctions.length) errors.push("Duplicate function declarations: " + [...new Set(duplicateFunctions)].join(", "));
const syntax = spawnSync(process.execPath, ["--check","app-v8.js"], { stdio:"inherit" });
if (syntax.status !== 0) errors.push("app-v8.js failed syntax check.");
if (/service_role|secret_key/i.test(await read("supabase-client.js"))) errors.push("Privileged Supabase key pattern found in browser config.");
for (const asset of ["./app-v8.js","./styles-v8.css","./supabase-client.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png"]) if (!sw.includes(asset)) errors.push("Service worker does not cache " + asset);
if (!/"192x192"/.test(manifest) || !/"512x512"/.test(manifest)) errors.push("Manifest must declare 192x192 and 512x512 icons.");

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Validation complete.");
