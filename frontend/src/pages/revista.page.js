import { Header } from '../components/header.js';
import { Footer } from '../components/footer.js';
import { SearchForm } from '../components/search/search-form.js';
import { ResultsList } from '../components/search/results-list.js';
import { Loading } from '../components/ui/loading.js';
import { EmptyState } from '../components/ui/empty-state.js';
import { ErrorState } from '../components/ui/error-state.js';
import { searchService } from '../services/search.service.js';
import { LibraryService } from '../services/library/library.service.js';

export class RevistaPage {
  constructor() {
    this.headerRoot = document.getElementById('header-root');
    this.footerRoot = document.getElementById('footer-root');
    this.searchFormRoot = document.getElementById('search-form-root');
    this.resultsRoot = document.getElementById('results-root');
    this.loadingRoot = document.getElementById('loading-root');
    this.errorRoot = document.getElementById('error-root');
    this.emptyRoot = document.getElementById('empty-root');

    this._assertRoots();

    this.header = new Header({ root: this.headerRoot });
    this.footer = new Footer({ root: this.footerRoot });
    this.searchForm = new SearchForm({
      root: this.searchFormRoot,
      onSubmit: (query) => this.handleSearch(query),
    });

    this.libraryService = new LibraryService();
    this.resultsList = new ResultsList({
      root: this.resultsRoot,
      items: [],
      libraryService: this.libraryService,
    });

    this.loadingComponent = null;
    this.emptyComponent = null;
    this.errorComponent = null;
    this.searchRequestId = 0;
  }

  _assertRoots() {
    const roots = {
      headerRoot: this.headerRoot,
      footerRoot: this.footerRoot,
      searchFormRoot: this.searchFormRoot,
      resultsRoot: this.resultsRoot,
      loadingRoot: this.loadingRoot,
      errorRoot: this.errorRoot,
      emptyRoot: this.emptyRoot,
    };
    for (const [name, root] of Object.entries(roots)) {
      if (!root) {
        throw new Error(`[RevistaPage] Elemento obrigatório ausente: #${name}`);
      }
    }
  }

  mount() {
    this.header.mount();
    this.footer.mount();
    this.searchForm.mount();
    this.resultsList.mount();
    this.loadingRoot.hidden = true;
    this.errorRoot.hidden = true;
    this.emptyRoot.hidden = true;
  }

  async handleSearch(searchQuery) {
    const requestId = ++this.searchRequestId;
    this.resultsList.update([]);
    this.searchForm.setLoading(true);
    this.showLoading();
    this.hideError();
    this.hideEmpty();

    try {
      const result = await searchService.search(searchQuery);
      if (requestId !== this.searchRequestId) return;
      this.resultsList.update(result);
      if (!result.hasResults) {
        this.showEmpty('Nenhum resultado encontrado', 'Tente ajustar os filtros.');
      }
    } catch (error) {
      if (requestId !== this.searchRequestId) return;
      this.showError('Erro na busca', error.message || 'Não foi possível carregar os resultados.');
    } finally {
      if (requestId === this.searchRequestId) {
        this.searchForm.setLoading(false);
        this.hideLoading();
      }
    }
  }

  showLoading() {
    this.loadingRoot.hidden = false;
    if (this.loadingComponent) this.loadingComponent.destroy();
    this.loadingComponent = new Loading({ root: this.loadingRoot });
    this.loadingComponent.mount();
  }

  hideLoading() {
    this.loadingRoot.hidden = true;
    if (this.loadingComponent) {
      this.loadingComponent.destroy();
      this.loadingComponent = null;
    }
  }

  showEmpty(title, message) {
    this.emptyRoot.hidden = false;
    if (this.emptyComponent) this.emptyComponent.destroy();
    this.emptyComponent = new EmptyState({ root: this.emptyRoot, title, message, icon: '📄' });
    this.emptyComponent.mount();
  }

  hideEmpty() {
    this.emptyRoot.hidden = true;
    if (this.emptyComponent) {
      this.emptyComponent.destroy();
      this.emptyComponent = null;
    }
  }

  showError(title, message) {
    this.errorRoot.hidden = false;
    if (this.errorComponent) this.errorComponent.destroy();
    this.errorComponent = new ErrorState({ root: this.errorRoot, title, message });
    this.errorComponent.mount();
  }

  hideError() {
    this.errorRoot.hidden = true;
    if (typeof document !== 'undefined' && document.getElementById('header-root')) {
  const page = new ArticlePage();
  page.mount();
    }
  }
}

