export const STORAGE_KEYS = Object.freeze({
  RECENT_SEARCHES: "resenha:recent-searches",
  FAVORITES: "resenha:favorites",
  THEME: "resenha:theme",
});

export const SEARCH_LANGUAGES = Object.freeze([
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "de", label: "Alemão" },
  { value: "it", label: "Italiano" },
]);

export const ERROR_CODES = Object.freeze({
  EMPTY_QUERY: "EMPTY_QUERY",
  INVALID_YEAR: "INVALID_YEAR",
  YEAR_RANGE_INVALID: "YEAR_RANGE_INVALID",
  INVALID_LANGUAGE: "INVALID_LANGUAGE",
  INVALID_LIMIT: "INVALID_LIMIT",
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
});

export const ERROR_MESSAGES = Object.freeze({
  EMPTY_QUERY: "Digite pelo menos 2 caracteres para buscar.",
  NETWORK_ERROR: "Não foi possível conectar ao servidor.",
  TIMEOUT_ERROR: "A requisição demorou demais e foi cancelada.",
  NO_RESULTS: "Nenhum resultado encontrado para essa busca.",
  RESOURCE_NOT_FOUND: "O recurso solicitado não foi encontrado.",
  BAD_REQUEST: "Requisição inválida.",
  UNKNOWN_ERROR: "Ocorreu um erro desconhecido.",
  REQUEST_ABORTED: "A requisição foi cancelada.",
  UNEXPECTED_ERROR: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
  INVALID_DOI: "O DOI informado é inválido.",
  INVALID_YEAR: "O ano informado é inválido.",
  YEAR_RANGE_INVALID: "O ano inicial não pode ser maior que o ano final.",
  INVALID_LANGUAGE: "O idioma selecionado é inválido.",
  INVALID_LIMIT: "O limite informado é inválido.",
  LIMIT_EXCEEDED: "O limite não pode ser maior que 100.",
});
