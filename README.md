
# Resenha & Café — Search Worker V4

Worker de busca acadêmica multi-provider para a plataforma **Resenha & Café**.
Executa no **Cloudflare Workers** e agrega artigos científicos de seis fontes
diferentes, com deduplicação, enriquecimento, ranking e cache.

---

Funcionalidades

- Busca acadêmica unificada (`/search`)
- Consulta de artigo por DOI (`/article`)
- Health check (`/health`)
- Métricas internas (`/metrics`)
- Limpeza/estado do cache (`/cache`)

- 6 providers integrados:
  - OpenAlex
  - CrossRef
  - Semantic Scholar
  - Europe PMC
  - SciELO
  - CORE

- Pipeline de 10 etapas:
  `Search → Adapt → Normalize → Validate → Merge → Enrich → Confidence → Quality → Rank`

- Arquitetura em camadas:
  - Domain-Driven Design (DDD)
  - Clean Architecture
  - Composição via Dependency Injection

---

Estrutura de pastas

```

src/
├── index.js               # Entry point (fetch → bootstrap)
├── bootstrap.js           # Composition Root
├── routes.js              # Rotas HTTP
├── core/                  # Orquestração, planejamento, ranking, cache, DI
├── domain/                # Entidades, VOs, políticas e eventos de domínio
├── application/           # Use cases, mappers, builders, contextos
├── infrastructure/        # Adapters e providers externos
├── pipeline/              # Engine e steps do pipeline
├── engines/               # Merge, confidence, quality e ranking
├── enrichers/             # PDF e citações
├── validators/            # Validação de artigos e lotes
├── utils/                 # Funções utilitárias
├── events/                # EventBus
├── metrics/               # Coletor de métricas
└── config/                # Configurações centralizadas

```

---

Configuração local

1. Instalar dependências

npm install


2. Rodar localmente

npm run dev


Acesse http://localhost:8787.

3. Fazer deploy

npm run deploy


---

Variáveis de ambiente / Secrets

Algumas APIs exigem chave ou email para melhorar o rate limit.

Secret Descrição
CROSSREF_EMAIL  - Email para o polite pool do CrossRef
OPENALEX_EMAIL - Email para o OpenAlex (opcional, usa CROSSREF_EMAIL - como fallback)
SEMANTIC_SCHOLAR_API_KEY - Chave da API do Semantic Scholar
CORE_API_KEY - Chave da API do CORE

Configure com:

npx wrangler secret put CROSSREF_EMAIL

---

Endpoints

GET /health

Retorna o status do Worker.

{
  "success": true,
  "status": "healthy",
  "version": "4.0.0"
}


GET /search?q=...&limit=...

Busca artigos em múltiplos providers.

Parâmetros:

· q — termo de busca (obrigatório)
· limit — limite de resultados (padrão 20, máximo 100)
· yearStart / yearEnd
· language
· openAccess

GET /article?doi=...

Busca um artigo específico por DOI.

GET /metrics

Retorna métricas internas do Worker.

GET /cache?action=clear

Limpa o cache (apenas em ambiente de desenvolvimento).

---

Como funciona a busca

1. O Planner seleciona os providers mais adequados.
2. Os Providers consultam suas respectivas APIs em paralelo.
3. Os Adapters normalizam o acesso HTTP e erros.
4. O ArticleMapper converte os dados para o domínio.
5. O Resolver faz deduplicação e merge.
6. O Ranker ordena por relevância.
7. O EnrichmentPipeline adiciona PDF e citações quando possível.

---

 Problemas conhecidos (18/08/2026)

· OpenAlex 429: o orçamento diário gratuito pode esgotar. O sistema continua com outros providers.
· SciELO 530/1016: falha de DNS na Cloudflare do SciELO. É um problema externo.
· Semantic Scholar 429: limite de requisições. Uma API key ajuda a mitigar.

---

Testes

Para rodar testes:

npm test


---

Licença

Projeto interno da plataforma Resenha & Café.

...
