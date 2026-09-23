import { mapSearchResult } from './src/services/mappers/search-result.mapper.js';

const url =
  'https://resenha-cafe-search.wy30032000.workers.dev/search?q=saúde&limit=20';

const response = await fetch(url);
const raw = await response.json();

console.log('\n=== WORKER ===');
console.log('HTTP:', response.status);
console.log('success:', raw.success);
console.log('total:', raw.total);
console.log('raw.results:', raw.results?.length);

console.log('\n=== PRIMEIRO RAW ===');
console.dir(raw.results?.[0], { depth: 5 });

const mapped = mapSearchResult(raw, 'saúde');

console.log('\n=== MAPPER ===');
console.dir(mapped, { depth: 5 });

console.log('\n=== RESULTADO ===');
console.log('mapped.articles:', mapped?.articles?.length);
console.log('mapped.results:', mapped?.results?.length);

console.log('\n=== PRIMEIRO ARTICLE ===');
console.dir(
  mapped?.articles?.[0] ?? mapped?.results?.[0] ?? null,
  { depth: 5 }
);
