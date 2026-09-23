import { Header } from '../components/header.js';
import { Footer } from '../components/footer.js';
import { ArticleHeader } from '../components/article/article-header.js';
import { ArticleMetadata } from '../components/article/article-metadata.js';
import { ArticleAbstract } from '../components/article/article-abstract.js';
import { ArticleReferences } from '../components/article/article-references.js';
import { Loading } from '../components/ui/loading.js';
import { ErrorState } from '../components/ui/error-state.js';
import { EmptyState } from '../components/ui/empty-state.js';
import { articleService } from '../services/article.service.js';

export class ArticlePage {
  constructor() {
    this.headerRoot = document.getElementById('header-root');
    this.footerRoot = document.getElementById('footer-root');
    this.mainRoot = document.querySelector('.article-page');
    this.articleHeaderRoot = document.getElementById('article-header-root');
    this.articleMetadataRoot = document.getElementById('article-metadata-root');
    this.articleAbstractRoot = document.getElementById('article-abstract-root');
    this.articleReferencesRoot = document.getElementById('article-references-root');
    this.loadingRoot = document.getElementById('loading-root');
    this.errorRoot = document.getElementById('error-root');
    this.emptyRoot = document.getElementById('empty-root');

    this.header = new Header({ root: this.headerRoot });
    this.footer = new Footer({ root: this.footerRoot });
    this.articleHeader = null;
    this.articleMetadata = null;
    this.articleAbstract = null;
    this.articleReferences = null;
    this.loadingComponent = null;
    this.errorComponent = null;
    this.emptyComponent = null;
  }

  async mount() {
    this.header.mount();
    this.footer.mount();
    this.hideLoading();
    this.hideError();
    this.hideEmpty();
    this._clearArticleComponents();

    const doi = this._getDoiFromUrl();
    if (!doi) {
      this.showError('DOI ausente', 'Nenhum DOI foi informado na URL.');
      return;
    }
    await this._loadArticle(doi);
  }

  async _loadArticle(doi) {
    this.showLoading();
    this.hideError();
    this.hideEmpty();
    this._clearArticleComponents();
    try {
      const article = await articleService.getByDoi(doi);
      if (!article || !article.hasDoi) {
        this.showEmpty('Artigo não encontrado', 'Verifique o DOI e tente novamente.');
        return;
      }
      this._mountArticleComponents(article);
    } catch (error) {
      this.showError('Erro ao carregar artigo', error.message || 'Não foi possível carregar o artigo.');
    } finally {
      this.hideLoading();
    }
  }

  _mountArticleComponents(article) {
    this.articleHeader = new ArticleHeader({ root: this.articleHeaderRoot, article });
    this.articleHeader.mount();
    this.articleMetadata = new ArticleMetadata({ root: this.articleMetadataRoot, article });
    this.articleMetadata.mount();
    this.articleAbstract = new ArticleAbstract({ root: this.articleAbstractRoot, article });
    this.articleAbstract.mount();
    this.articleReferences = new ArticleReferences({ root: this.articleReferencesRoot, article });
    this.articleReferences.mount();
  }

  _clearArticleComponents() {
    if (this.articleHeader) { this.articleHeader.destroy(); this.articleHeader = null; }
    if (this.articleMetadata) { this.articleMetadata.destroy(); this.articleMetadata = null; }
    if (this.articleAbstract) { this.articleAbstract.destroy(); this.articleAbstract = null; }
    if (this.articleReferences) { this.articleReferences.destroy(); this.articleReferences = null; }
    this.articleHeaderRoot.innerHTML = '';
    this.articleMetadataRoot.innerHTML = '';
    this.articleAbstractRoot.innerHTML = '';
    this.articleReferencesRoot.innerHTML = '';
  }

  _getDoiFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('doi')?.trim() || '';
  }

  showLoading() {
    this.loadingRoot.hidden = false;
    if (this.mainRoot) this.mainRoot.setAttribute('aria-busy', 'true');
    if (this.loadingComponent) this.loadingComponent.destroy();
    this.loadingComponent = new Loading({ root: this.loadingRoot });
    this.loadingComponent.mount();
  }

  hideLoading() {
    this.loadingRoot.hidden = true;
    if (this.mainRoot) this.mainRoot.removeAttribute('aria-busy');
    if (this.loadingComponent) { this.loadingComponent.destroy(); this.loadingComponent = null; }
  }

  showError(title, message) {
    this.errorRoot.hidden = false;
    if (this.errorComponent) this.errorComponent.destroy();
    this.errorComponent = new ErrorState({ root: this.errorRoot, title, message });
    this.errorComponent.mount();
  }

  hideError() {
    this.errorRoot.hidden = true;
    if (this.errorComponent) { this.errorComponent.destroy(); this.errorComponent = null; }
  }

  showEmpty(title, message) {
    this.emptyRoot.hidden = false;
    if (this.emptyComponent) this.emptyComponent.destroy();
    this.emptyComponent = new EmptyState({ root: this.emptyRoot, title, message, icon: '📄' });
    this.emptyComponent.mount();
  }

  hideEmpty() {
    this.emptyRoot.hidden = true;
    if (typeof document !== 'undefined' && document.getElementById('header-root')) {
  
    }
  }
}
