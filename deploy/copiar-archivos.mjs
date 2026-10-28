// Copia los archivos de Storage de Supabase al Storage del servidor de la empresa, uno por uno,
// con la llave service_role de cada lado. Lo llama trasladar-desde-supabase.sh.
//   node copiar-archivos.mjs /datos/archivos.json
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [lista] = process.argv.slice(2);
const { ORIGEN_URL, ORIGEN_SERVICE_KEY, DESTINO_URL, DESTINO_SERVICE_KEY } = process.env;
const archivos = JSON.parse(readFileSync(lista, 'utf8'));
const ruta = (b, n) => `${encodeURIComponent(b)}/${n.split('/').map(encodeURIComponent).join('/')}`;
const sql = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

let copiados = 0;
const fallidos = [];
for (const a of archivos) {
  try {
    const bajada = await fetch(`${ORIGEN_URL}/storage/v1/object/${ruta(a.bucket, a.nombre)}`, {
      headers: { Authorization: `Bearer ${ORIGEN_SERVICE_KEY}`, apikey: ORIGEN_SERVICE_KEY },
    });
    if (!bajada.ok) throw new Error(`Supabase respondió ${bajada.status}`);
    const contenido = Buffer.from(await bajada.arrayBuffer());
    const subida = await fetch(`${DESTINO_URL}/storage/v1/object/${ruta(a.bucket, a.nombre)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DESTINO_SERVICE_KEY}`, apikey: DESTINO_SERVICE_KEY,
        'Content-Type': a.tipo || 'application/octet-stream', 'x-upsert': 'true',
      },
      body: contenido,
    });
    if (!subida.ok) throw new Error(`destino respondió ${subida.status}: ${await subida.text()}`);
    copiados++;
  } catch (e) {
    fallidos.push(`${a.bucket}/${a.nombre}: ${e.message}`);
  }
}

writeFileSync(path.join(path.dirname(lista), 'duenos.sql'), archivos
  .filter((a) => a.dueno)
  .map((a) => `update storage.objects set owner = ${sql(a.dueno)}, owner_id = ${sql(a.dueno)} where bucket_id = ${sql(a.bucket)} and name = ${sql(a.nombre)};`)
  .join('\n') + '\n');

console.log(`   archivos copiados: ${copiados} de ${archivos.length}`);
if (fallidos.length) {
  console.error(fallidos.map((f) => `   FALLÓ ${f}`).join('\n'));
  process.exit(1);
}
