export function buildArticleUrl(doi) {
  if (!doi || typeof doi !== 'string') return '#';
  return `artigo.html?doi=${encodeURIComponent(doi.trim())}`;
}
export default buildArticleUrl;
