import fs from 'fs';
import path from 'path';

function addLog(filePath, anchor, logLine, mode = 'after') {
  const full = path.resolve(filePath);
  const src = fs.readFileSync(full, 'utf8');
  const lines = src.split('\n');

  const idx = lines.findIndex((l) => l.includes(anchor));
  if (idx === -1) {
    console.warn(`⚠️  Âncora não encontrada em ${filePath}: "${anchor}"`);
    return;
  }

  const insertAt = mode === 'after' ? idx + 1 : idx;
  lines.splice(insertAt, 0, logLine);
  fs.writeFileSync(full, lines.join('\n'), 'utf8');
  console.log(`✅ Log inserido em ${filePath} (${mode} "${anchor}")`);
}

// ============================================================
// 1. ArticleMapper.#fromOpenAlex — ver o dado bruto do OpenAlex
// ============================================================
addLog(
  'src/application/mappers/article.mapper.js',
  'static #fromOpenAlex(data) {',
  `    console.log('[DEBUG][#fromOpenAlex] data.doi =', data?.doi, '| data.ids?.doi =', data?.ids?.doi);`
);

// ============================================================
// 2. ArticleMapper.#fromOpenAlex — ver o DOI passado ao Article
// ============================================================
addLog(
  'src/application/mappers/article.mapper.js',
  'doi: data.doi || null,',
  `    console.log('[DEBUG][#fromOpenAlex] doi que será passado ao Article =', data.doi || null);`,
  'after'
);

// ============================================================
// 3. Article.#parseIdentifiers — ver o que chega e o que é criado
// ============================================================
addLog(
  'src/domain/entities/article.js',
  'static #parseIdentifiers(identifiers, doi = null, source = null) {',
  `    console.log('[DEBUG][#parseIdentifiers] doi recebido =', doi, '| identifiers =', JSON.stringify(identifiers));`
);

addLog(
  'src/domain/entities/article.js',
  'if (doi && !collection.has("doi")) {',
  `      console.log('[DEBUG][#parseIdentifiers] Vai adicionar DOI:', doi);`,
  'after'
);

// ============================================================
// 4. Article.toPlainObject — ver o DOI no momento da serialização
// ============================================================
addLog(
  'src/domain/entities/article.js',
  'toPlainObject() {',
  `    console.log('[DEBUG][toPlainObject] this.doi =', this.doi, '| identifiers.toPlainObject() =', JSON.stringify(this.identifiers?.toPlainObject?.()));`
);

// ============================================================
// 5. GetArticleUseCase — ver o Article antes de retornar
// ============================================================
addLog(
  'src/application/use-cases/get-article.use-case.js',
  'if (useCache && this.cache && article) {',
  `    console.log('[DEBUG][GetArticleUseCase] article.doi =', article?.doi, '| source =', article?.source);`
);

console.log('\n✅ Logs adicionados. Reinicie o Worker: npm run dev');
