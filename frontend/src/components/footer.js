export class Footer {
  constructor({ root }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[Footer] root deve ser um nó DOM válido.');
    }
    this.root = root;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';
    this.container = document.createElement('footer');
    this.container.className = 'footer';

    const copyright = document.createElement('p');
    copyright.className = 'footer__copyright';
    copyright.textContent = `© ${new Date().getFullYear()} Resenha & Café. Todos os direitos reservados.`;
    this.container.appendChild(copyright);

    const nav = document.createElement('nav');
    nav.className = 'footer__nav';
    nav.setAttribute('aria-label', 'Links institucionais');

    const ul = document.createElement('ul');
    ul.className = 'footer__nav-list';

    const links = [
      { href: 'pages/quem-somos.html', label: 'Sobre' },
      { href: 'pages/podcast.html', label: 'Podcast' },
      { href: 'mailto:contato@resenhaecafe.com.br', label: 'Contato' },
    ];

    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'footer__nav-link';
      a.textContent = link.label;
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    this.container.appendChild(nav);
    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isMounted = false;
  }
}

export default Footer;
