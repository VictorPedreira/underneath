/* ==========================================================================
   UNDERNEATH — Search Intelligence
   Global header & footer, injected into every page of the site.

   Edit THIS file to change the header or footer everywhere at once —
   every page loads it and nothing else defines a <header> or <footer>.

   How it finds the site root automatically:
   The <script> tag that loads this file already has to point at this
   file's own path (e.g. "../assets/header-footer/header-footer.js" from
   one folder deep, or "../../assets/header-footer/header-footer.js" from
   two folders deep). We read that same path back from the script tag and
   strip "assets/header-footer/header-footer.js" off the end, so every
   link and image below is built correctly no matter how deep the page is.
   ========================================================================== */
(function () {
  "use strict";

  // Capture this script's own path synchronously (must happen at the top
  // level of the script, not inside a later callback).
  var thisScript = document.currentScript;
  var scriptSrc = thisScript ? thisScript.getAttribute("src") || "" : "";
  var ROOT = scriptSrc.replace(/assets\/header-footer\/header-footer\.js.*$/, "");

  // Current page path, used to highlight the active nav link.
  var currentPath = window.location.pathname;

  // Link da home sem "/index.html" ("./" quando já estamos na raiz).
  var HOME_HREF = ROOT || "./";

  // mobileMenu: no celular a aba sai da barra inferior e vai para o menu
  // que abre na seta ao lado do logo.
  var NAV_LINKS = [
    { label: "App", href: ROOT + "app/", match: "app", mobileMenu: true },
    { label: "Sobre", href: ROOT + "sobre/", match: "sobre" },
    { label: "Método", href: ROOT + "metodo/", match: "metodo" },
    { label: "Diagnóstico", href: ROOT + "diagnostico/", match: "diagnostico" },
    { label: "Cases", href: ROOT + "cases/", match: "cases" },
    { label: "Respostas", href: ROOT + "respostas/", match: "respostas" },
    { label: "Blog", href: ROOT + "blog/", match: "blog", mobileMenu: true }
  ];

  function isActive(match) {
    return currentPath.indexOf("/" + match + "/") !== -1;
  }

  // Computador: o App fica num box branco logo depois do logo, seguido das
  // demais abas. A home não tem aba própria: o logo já leva até ela.
  var isHome = !NAV_LINKS.some(function (link) { return isActive(link.match); });
  var navLinksHTML = NAV_LINKS.map(function (link) {
    var active = isActive(link.match);
    var classes = "navlink" + (link.match === "app" ? " navlink-app" : "") + (active ? " is-active" : "");
    return '<a class="' + classes + '" href="' + link.href + '"' + (active ? ' aria-current="page"' : "") + ">" + link.label + "</a>";
  }).join("\n    ");

  // Celular: barra inferior estilo aplicativo, com ícone dentro da barra e o
  // nome escrito logo abaixo, fora dela.
  var TAB_ICONS = {
    inicio: '<path d="M3.5 10.5L12 4l8.5 6.5"/><path d="M6 9v10.5h4.5V14h3v5.5H18V9"/>',
    sobre: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
    metodo: '<circle cx="5.5" cy="6" r="2"/><circle cx="5.5" cy="18" r="2"/><circle cx="18.5" cy="12" r="2"/><path d="M7.5 6h3a3 3 0 013 3v0a3 3 0 003 3M7.5 18h3a3 3 0 003-3v0a3 3 0 013-3"/>',
    diagnostico: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    cases: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 6v1.5M3.5 12.5h17"/>',
    respostas: '<path d="M4 5.5h16v10H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
    app: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    blog: '<path d="M5 3.5h10l4 4v13H5z"/><path d="M14.5 3.5v4.5h4.5M8.5 12h7M8.5 15.5h7M8.5 9h3"/>'
  };
  var TABS = [{ label: "Início", href: HOME_HREF, match: "inicio", active: isHome }].concat(
    NAV_LINKS.filter(function (link) { return !link.mobileMenu; }).map(function (link) {
      return { label: link.label, href: link.href, match: link.match, active: isActive(link.match) };
    })
  );
  var tabbarHTML = TABS.map(function (tab) {
    return '<a class="tab' + (tab.active ? " is-active" : "") + '" href="' + tab.href + '"' +
      (tab.active ? ' aria-current="page"' : "") + ">" +
      '<span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + TAB_ICONS[tab.match] + "</svg></span>" +
      '<span class="tab-label">' + tab.label + "</span></a>";
  }).join("");

  // Celular: seta ao lado do logo abre um menu com App e Blog.
  var moreLinks = NAV_LINKS.filter(function (link) { return link.mobileMenu; });
  var moreActive = moreLinks.some(function (link) { return isActive(link.match); });
  var moreHTML =
    '<button type="button" class="nav-more" id="navMore" aria-label="Mais opções" aria-expanded="false" aria-controls="navMoreMenu">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5l5.5 5.5 5.5-5.5"/></svg></button>' +
    '<div class="nav-more-menu" id="navMoreMenu">' +
    moreLinks.map(function (link) {
      var active = isActive(link.match);
      return '<a class="nav-more-item' + (active ? " is-active" : "") + '" href="' + link.href + '"' +
        (active ? ' aria-current="page"' : "") + ">" +
        '<span class="nav-more-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + TAB_ICONS[link.match] + "</svg></span>" +
        "<span>" + link.label + "</span></a>";
    }).join("") +
    "</div>";

  var headerHTML =
    '<div class="nav' + (moreActive ? " more-active" : "") + '">' +
    '  <div class="brand-wrap">' +
    '  <a href="' + HOME_HREF + '" class="brand">' +
    '    <img class="brand-word" src="' + ROOT + 'assets/images/logo-wordmark.png" alt="UNDERNEATH">' +
    "  </a>" +
    "  " + moreHTML +
    "  </div>" +
    '  <nav class="links" id="navLinks">' +
    "    " + navLinksHTML +
    "  </nav>" +
    '  <div class="nav-right">' +
    '    <a class="cta-btn nav-cta" href="' + ROOT + 'contato/">Analisar meu site<span class="nav-cta-fill nav-cta-trail" aria-hidden="true"></span><span class="nav-cta-fill" aria-hidden="true"></span><span class="nav-cta-fill nav-cta-text" aria-hidden="true">Analisar meu site</span></a>' +
    '    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    "  </div>" +
    "</div>";

  // Páginas que terminam em fundo escuro (home, diagnóstico e as .dark-page) usam o logo
  // com texto claro no rodapé.
  var darkFooter = document.body &&
    (document.body.classList.contains("has-hero") || document.body.classList.contains("page-iceberg") ||
     document.body.classList.contains("dark-page"));
  var FOOTER_LOGO = darkFooter ? "logo-full-light.png" : "logo-full.png";

  // Rodapé padrão de todas as páginas: logo no centro, redes sociais dos
  // lados, links legais e créditos embaixo.
  // IMPORTANTE: troque os links de SOCIAL e LEGAL pelos endereços reais.
  var SOCIAL = {
    whatsapp: { label: "WhatsApp", href: "https://wa.me/5511940881109",
      icon: '<path d="M4 20l1.2-3.6A8 8 0 1 1 8 19z"/><path d="M9.2 8.6c.2-.5.6-.5.9-.5.3 0 .5.4.8 1 .2.5-.4.9-.4 1.2.4 1 1.3 1.9 2.3 2.3.3 0 .7-.6 1.2-.4.6.3 1 .5 1 .8 0 .3 0 .7-.5.9-.6.4-1.7.4-3.2-.5a7.6 7.6 0 0 1-2.4-2.4c-.8-1.5-.8-2.6-.4-3.1z"/>' },
    instagram: { label: "Instagram", href: "https://instagram.com/underneathsi",
      icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>' },
    email: { label: "E-mail", href: "mailto:" + (typeof CONTACT_EMAIL !== "undefined" ? CONTACT_EMAIL : "underneath.search@gmail.com"),
      icon: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>' },
    twitter: { label: "X (Twitter)", href: "https://x.com/underneathsi",
      icon: '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15" stroke-width="1.9"/>' }
  };
  var LEGAL = [
    { label: "Política de Privacidade", href: "#" },
    { label: "Termos de Uso", href: "#" },
    { label: "Política de Cookies", href: "#" },
    { label: "Perguntas Frequentes", href: ROOT + "respostas/", strong: true }
  ];

  function socialLink(key) {
    var item = SOCIAL[key];
    var external = item.href.indexOf("http") === 0;
    return '<a class="foot-social" href="' + item.href + '" aria-label="' + item.label + '"' +
      (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + item.icon + "</svg></a>";
  }

  // Data/hora da última atualização do arquivo publicado (vem do servidor).
  var updated = new Date(document.lastModified);
  if (isNaN(updated.getTime())) updated = new Date();
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var updatedText = pad(updated.getDate()) + "/" + pad(updated.getMonth() + 1) + "/" + updated.getFullYear() +
    " | " + pad(updated.getHours()) + ":" + pad(updated.getMinutes());

  var footerHTML =
    '<div class="wrap foot">' +
    '  <button type="button" class="foot-top-btn" id="backToTop" aria-label="Voltar ao topo">' +
    '<svg viewBox="0 0 24 20" aria-hidden="true"><path d="M12 1L23 19H1z"/></svg></button>' +
    '  <div class="foot-top">' +
    '    <div class="foot-socials">' + socialLink("whatsapp") + socialLink("instagram") + "</div>" +
    '    <a class="foot-logo" href="' + HOME_HREF + '"><img src="' + ROOT + "assets/images/" + FOOTER_LOGO + '" alt="UNDERNEATH — Search Intelligence"></a>' +
    '    <div class="foot-socials">' + socialLink("email") + socialLink("twitter") + "</div>" +
    "  </div>" +
    '  <div class="foot-slogan">Fortaleça a base e ganhe destaque.</div>' +
    '  <nav class="foot-legal" aria-label="Links legais">' +
    LEGAL.map(function (link) {
      return '<a href="' + link.href + '"' + (link.strong ? ' class="is-strong"' : "") + ">" + link.label + "</a>";
    }).join('<span aria-hidden="true">|</span>') +
    "  </nav>" +
    '  <p class="foot-copy">© ' + new Date().getFullYear() + " UNDERNEATH - Search Intelligence. Desenvolvimento: UNDERNEATH. Todos os direitos reservados.</p>" +
    '  <p class="foot-updated">Site atualizado em: ' + updatedText + "</p>" +
    "</div>";

  function mount() {
    var headerMount = document.getElementById("site-header");
    var footerMount = document.getElementById("site-footer");
    if (headerMount) headerMount.innerHTML = headerHTML;
    if (footerMount) footerMount.innerHTML = footerHTML;

    var backToTop = document.getElementById("backToTop");
    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    var more = document.getElementById("navMore");
    var moreMenu = document.getElementById("navMoreMenu");
    if (more && moreMenu) {
      var setMore = function (open) {
        moreMenu.classList.toggle("is-open", open);
        more.setAttribute("aria-expanded", open ? "true" : "false");
      };
      more.addEventListener("click", function (event) {
        event.stopPropagation();
        setMore(!moreMenu.classList.contains("is-open"));
      });
      document.addEventListener("click", function (event) {
        if (!moreMenu.contains(event.target)) setMore(false);
      });
      document.addEventListener("keydown", function (event) { if (event.key === "Escape") setMore(false); });
    }

    if (!document.querySelector(".tabbar")) {
      var tabbar = document.createElement("nav");
      tabbar.className = "tabbar";
      tabbar.setAttribute("aria-label", "Navegação principal");
      tabbar.innerHTML = '<div class="tabbar-pill">' + tabbarHTML + "</div>";
      document.body.appendChild(tabbar);
    }

    // Botão do cabeçalho: um brilho azul em degradê segue o mouse e uma
    // segunda camada, mais lenta, vem atrás formando o rastro. As posições
    // vão para --x/--y (frente) e --tx/--ty (rastro); o CSS desenha.
    var cta = document.querySelector(".nav-cta");
    if (cta) {
      var target = { x: 0, y: 0 };
      var head = { x: 0, y: 0 }, tail = { x: 0, y: 0 }, frame = null;
      var follow = function () {
        head.x += (target.x - head.x) * 0.22;
        head.y += (target.y - head.y) * 0.22;
        tail.x += (target.x - tail.x) * 0.07;
        tail.y += (target.y - tail.y) * 0.07;
        cta.style.setProperty("--x", head.x + "px");
        cta.style.setProperty("--y", head.y + "px");
        cta.style.setProperty("--tx", tail.x + "px");
        cta.style.setProperty("--ty", tail.y + "px");
        frame = Math.abs(target.x - tail.x) + Math.abs(target.y - tail.y) > 0.3
          ? requestAnimationFrame(follow) : null;
      };
      var aim = function (event, jump) {
        var box = cta.getBoundingClientRect();
        target.x = event.clientX - box.left;
        target.y = event.clientY - box.top;
        if (jump) { head.x = tail.x = target.x; head.y = tail.y = target.y; }
        if (!frame) frame = requestAnimationFrame(follow);
      };
      cta.addEventListener("mouseenter", function (event) { aim(event, true); });
      cta.addEventListener("mousemove", function (event) { aim(event, false); });
    }

    var toggle = document.getElementById("menuToggle");
    var links = document.getElementById("navLinks");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  // Links para a home (logo, "Início"): na própria home só voltam ao topo,
  // sem recarregar; vindos de outra página, abrem a home sem a abertura.
  var HOME_PATH = new URL(HOME_HREF + "index.html", window.location.href).pathname;
  function isHomePath(path) {
    return path === HOME_PATH || path === HOME_PATH.replace(/index\.html$/, "");
  }
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey) return;
    var url = new URL(link.getAttribute("href"), window.location.href);
    if (url.origin !== window.location.origin || !isHomePath(url.pathname) || url.hash) return;
    if (isHomePath(window.location.pathname)) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      try { sessionStorage.setItem("skipIntro", "1"); } catch (e) {}
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
