import fs from 'fs';
import path from 'path';

function insertAfter(filePath, anchor, logLine) {
  const full = path.resolve(filePath);
  const src = fs.readFileSync(full, 'utf8');
  const lines = src.split('\n');
  const idx = lines.findIndex((l) => l.includes(anchor));
  if (idx === -1) {
    console.warn(`⚠️  Âncora não encontrada em ${filePath}: "${anchor}"`);
    return;
  }
  lines.splice(idx + 1, 0, logLine);
  fs.writeFileSync(full, lines.join('\n'), 'utf8');
  console.log(`✅ Log inserido em ${filePath}`);
}

// 1. Ver o plain object retornado pelo orchestrator antes de reconstruir o Article
insertAfter(
  'src/application/use-cases/get-article.use-case.js',
  'if (result && result.article) {',
  `        console.log('[DEBUG][GetArticleUseCase] result.article keys:', Object.keys(result.article || {}));\n        console.log('[DEBUG][GetArticleUseCase] result.article.doi =', result.article?.doi);`
);

// 2. Ver o Article após a reconstrução
insertAfter(
  'src/application/use-cases/get-article.use-case.js',
  'if (data && typeof data === "object") {',
  `          console.log('[DEBUG][GetArticleUseCase] data.doi antes do new Article =', data.doi);`
);

// 3. Ver o best retornado pelo orchestrator.executeDoiLookup
insertAfter(
  'src/core/orchestrator.js',
  'const best = mappedResults.find(r => r.authors && r.authors.length > 0) || mappedResults[0];',
  `        console.log('[DEBUG][executeDoiLookup] best keys:', Object.keys(best || {}));\n        console.log('[DEBUG][executeDoiLookup] best.doi =', best?.doi);`
);

console.log('\n✅ Logs adicionados. Reinicie o Worker: npm run dev');
