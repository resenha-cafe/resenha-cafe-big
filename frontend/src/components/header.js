export class Header {
  constructor({ root }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[Header] root deve ser um nó DOM válido.');
    }
    this.root = root;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';
    this.container = document.createElement('header');
    this.container.className = 'header';

    const brandLink = document.createElement('a');
    brandLink.href = 'index.html';
    brandLink.className = 'header__brand';
    brandLink.textContent = 'Resenha & Café';

    const logo = document.createElement('span');
    logo.className = 'header__logo';
    logo.setAttribute('aria-hidden', 'true');
    logo.textContent = '☕';
    brandLink.insertBefore(logo, brandLink.firstChild);
    this.container.appendChild(brandLink);

    const nav = document.createElement('nav');
    nav.className = 'header__nav';
    nav.setAttribute('aria-label', 'Navegação principal');

    const ul = document.createElement('ul');
    ul.className = 'header__nav-list';

    const links = [
      { href: 'pages/revista.html', label: 'Revista' },
      { href: 'pages/podcast.html', label: 'Podcast' },
      { href: 'pages/quem-somos.html', label: 'Quem Somos' },
    ];

    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'header__nav-link';
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
export default Header;
