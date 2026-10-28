// Genera deploy/.env con claves nuevas para GEEPI (contraseñas de la base, secreto JWT y
// las llaves anon/service que reemplazan a las de Supabase). Se corre una sola vez por servidor:
//   node deploy/generar-claves.mjs https://geepi.fombisol.com.co
import { randomBytes, createHmac } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const destino = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
if (existsSync(destino)) {
  console.error(`Ya existe ${destino}. No se sobrescribe: borrarlo cambiaría las claves y dejaría a todos sin sesión.`);
  process.exit(1);
}

const url = (process.argv[2] ?? 'http://localhost:8787').replace(/\/$/, '');
const secreto = () => randomBytes(32).toString('base64url');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

const jwtSecret = randomBytes(48).toString('base64url');
const firmar = (rol) => {
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ role: rol, iss: 'geepi-fombisol', iat: ahora, exp: ahora + 10 * 365 * 24 * 3600 })}`;
  return `${cuerpo}.${createHmac('sha256', jwtSecret).update(cuerpo).digest('base64url')}`;
};

writeFileSync(destino, [
  `URL_PUBLICA=${url}`,
  'PUERTO_LOCAL=127.0.0.1:8787',
  `POSTGRES_PASSWORD=${secreto()}`,
  `SERVICIOS_PASSWORD=${secreto()}`,
  `JWT_SECRET=${jwtSecret}`,
  `ANON_KEY=${firmar('anon')}`,
  `SERVICE_KEY=${firmar('service_role')}`,
  '',
].join('\n'), { mode: 0o600 });

console.log(`Listo: ${destino}`);
