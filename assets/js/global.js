/* JS global, carregado por todas as páginas: monta o cabeçalho e o rodapé dos 3 idiomas
   (textos em TEXT, abas em NAV, redes em SOCIAL) e os comportamentos comuns.
   O que é de uma página só fica no JS da pasta dela. */

// E-mail que recebe os contatos (rodapé e formulário). Também está escrito nas páginas de contato.
var CONTACT_EMAIL = "contact@underneathsi.com";

(function () {
  "use strict";

  var thisScript = document.currentScript;
  var scriptSrc = thisScript ? thisScript.getAttribute("src") || "" : "";
  var ROOT = scriptSrc.replace(/assets\/js\/global\.js.*$/, "");

  var currentPath = window.location.pathname;

  var HTML_LANG = (document.documentElement.lang || "pt").toLowerCase();
  var LANG = HTML_LANG.indexOf("en") === 0 ? "en" : HTML_LANG.indexOf("es") === 0 ? "es" : "pt";
  var BASE = ROOT + (LANG === "pt" ? "" : LANG + "/");
  var PATHS = {
    pt: { contact: "contato/", answers: "respostas/" },
    en: { contact: "contact/", answers: "answers/" },
    es: { contact: "contacto/", answers: "respuestas/" }
  }[LANG];

  var LANG_FROM = null;
  try { LANG_FROM = sessionStorage.getItem("langFrom"); sessionStorage.removeItem("langFrom"); } catch (e) {}
  if (LANG_FROM === LANG) LANG_FROM = null;
  if (LANG_FROM) document.documentElement.classList.add("lang-enter");

  var TEXT = {
    pt: {
      home: "Início", cta: "Analisar meu site", more: "Mais opções", openMenu: "Abrir menu", mainNav: "Navegação principal",
      language: "Idioma", backToTop: "Voltar ao topo", legalNav: "Links legais", slogan: "Fortaleça a base e ganhe destaque.",
      privacy: "Política de Privacidade", terms: "Termos de Uso", cookies: "Política de Cookies", faq: "Perguntas Frequentes",
      copy: "UNDERNEATH - Search Intelligence. Desenvolvimento: UnderneathSI. Todos os direitos reservados.",
      updated: "Site atualizado em: "
    },
    en: {
      home: "Home", cta: "Analyze my site", more: "More options", openMenu: "Open menu", mainNav: "Main navigation",
      language: "Language", backToTop: "Back to top", legalNav: "Legal links", slogan: "Build below. Rise above.",
      privacy: "Privacy Policy", terms: "Terms of Use", cookies: "Cookie Policy", faq: "FAQ",
      copy: "UNDERNEATH - Search Intelligence. Development: UnderneathSI. All rights reserved.",
      updated: "Site updated on: "
    },
    es: {
      home: "Inicio", cta: "Analizar mi web", more: "Más opciones", openMenu: "Abrir menú", mainNav: "Navegación principal",
      language: "Idioma", backToTop: "Volver arriba", legalNav: "Enlaces legales", slogan: "Construye abajo. Destaca arriba.",
      privacy: "Política de Privacidad", terms: "Aviso Legal", cookies: "Política de Cookies", faq: "Preguntas Frecuentes",
      copy: "UNDERNEATH - Search Intelligence. Desarrollo: UnderneathSI. Todos los derechos reservados.",
      updated: "Web actualizada el: "
    }
  }[LANG];

  var HOME_HREF = BASE || "./";

  // Abas do menu. path = pasta da página no idioma; match = trecho do endereço que marca a aba
  // como ativa; mobileMenu = no celular a aba vai para o menu da seta ao lado do logo.
  var NAV = {
    pt: [
      { label: "Sobre", path: "sobre/", icon: "sobre" },
      { label: "Método", path: "metodo/", icon: "metodo" },
      { label: "Diagnóstico", path: "diagnostico/", icon: "diagnostico" },
      { label: "Cases", path: "cases/", icon: "cases" },
      { label: "Respostas", path: "respostas/", icon: "respostas" },
      { label: "Blog", path: "blog/", icon: "blog", mobileMenu: true },
      { label: "App", path: "app/", icon: "app", mobileMenu: true }
    ],
    en: [
      { label: "About", path: "about/", icon: "sobre" },
      { label: "Method", path: "method/", icon: "metodo" },
      { label: "Diagnosis", path: "diagnosis/", icon: "diagnostico" },
      { label: "Cases", path: "cases/", icon: "cases" },
      { label: "Answers", path: "answers/", icon: "respostas" },
      { label: "Blog", path: "blog/", icon: "blog", mobileMenu: true },
      { label: "App", path: "app/", icon: "app", mobileMenu: true }
    ],
    es: [
      { label: "Nosotros", path: "sobre-nosotros/", icon: "sobre" },
      { label: "Método", path: "metodo/", icon: "metodo" },
      { label: "Diagnóstico", path: "diagnostico/", icon: "diagnostico" },
      { label: "Casos", path: "casos/", icon: "cases" },
      { label: "Respuestas", path: "respuestas/", icon: "respostas" },
      { label: "Blog", path: "blog/", icon: "blog", mobileMenu: true },
      { label: "App", path: "app/", icon: "app", mobileMenu: true }
    ]
  };
  var NAV_LINKS = NAV[LANG].map(function (link) {
    return { label: link.label, href: BASE + link.path, match: link.path.replace("/", ""), icon: link.icon, mobileMenu: link.mobileMenu };
  });

  // Espanhol oculto até a publicação: para reativar, descomente a linha do ES.
  var LANGS = [["pt", "PT", "pt-BR", "Português"], ["en", "EN", "en", "English"]
    // , ["es", "ES", "es-ES", "Español"]
  ];
  function alternateHref(lang) {
    var code = LANGS.filter(function (l) { return l[0] === lang; })[0][2];
    var link = document.querySelector('link[rel="alternate"][hreflang="' + code + '"]');
    var path = link ? new URL(link.href).pathname.replace(/^\//, "") : (lang === "pt" ? "" : lang + "/");
    return ROOT + path || "./";
  }
  var langSwitchHTML = function (extraClass) {
    return '<div class="lang-switch is-' + LANG + (extraClass ? " " + extraClass : "") + '" role="group" aria-label="' + TEXT.language + '">' +
      LANGS.map(function (l) {
        var current = l[0] === LANG;
        return '<a href="' + (current ? "#" : alternateHref(l[0])) + '" hreflang="' + l[2] + '" lang="' + l[2] + '" title="' + l[3] + '" aria-label="' + l[3] + '"' +
          (current ? ' class="is-active" aria-current="true"' : "") + "></a>";
      }).join("") + "</div>";
  };

  function isActive(match) {
    return currentPath.indexOf("/" + match + "/") !== -1;
  }

  var isHome = !NAV_LINKS.some(function (link) { return isActive(link.match); });
  var navLinksHTML = NAV_LINKS.map(function (link) {
    var active = isActive(link.match);
    var classes = "navlink" + (active ? " is-active" : "");
    return '<a class="' + classes + '" href="' + link.href + '"' + (active ? ' aria-current="page"' : "") + ">" + link.label + "</a>";
  }).join("\n    ");

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
  var TABS = [{ label: TEXT.home, href: HOME_HREF, icon: "inicio", active: isHome }].concat(
    NAV_LINKS.filter(function (link) { return !link.mobileMenu; }).map(function (link) {
      return { label: link.label, href: link.href, icon: link.icon, active: isActive(link.match) };
    })
  );
  var tabbarHTML = TABS.map(function (tab) {
    return '<a class="tab' + (tab.active ? " is-active" : "") + '" href="' + tab.href + '"' +
      (tab.active ? ' aria-current="page"' : "") + ">" +
      '<span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + TAB_ICONS[tab.icon] + "</svg></span>" +
      '<span class="tab-label">' + tab.label + "</span></a>";
  }).join("");

  var moreLinks = NAV_LINKS.filter(function (link) { return link.mobileMenu; });
  var moreActive = moreLinks.some(function (link) { return isActive(link.match); });
  var moreHTML =
    '<button type="button" class="nav-more" id="navMore" aria-label="' + TEXT.more + '" aria-expanded="false" aria-controls="navMoreMenu">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5l5.5 5.5 5.5-5.5"/></svg></button>' +
    '<div class="nav-more-menu" id="navMoreMenu">' +
    moreLinks.map(function (link) {
      var active = isActive(link.match);
      return '<a class="nav-more-item' + (active ? " is-active" : "") + '" href="' + link.href + '"' +
        (active ? ' aria-current="page"' : "") + ">" +
        '<span class="nav-more-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + TAB_ICONS[link.icon] + "</svg></span>" +
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
    '    <a class="cta-btn nav-cta" href="' + BASE + PATHS.contact + '">' + TEXT.cta + '<span class="nav-cta-fill nav-cta-trail" aria-hidden="true"></span><span class="nav-cta-fill" aria-hidden="true"></span><span class="nav-cta-fill nav-cta-text" aria-hidden="true">' + TEXT.cta + "</span></a>" +
    "    " + langSwitchHTML() +
    '    <button class="menu-toggle" id="menuToggle" aria-label="' + TEXT.openMenu + '" aria-expanded="false"><span></span><span></span><span></span></button>' +
    "  </div>" +
    "  " + langSwitchHTML("lang-switch-mobile") +
    "</div>";

  var darkFooter = document.body &&
    (document.body.classList.contains("has-hero") || document.body.classList.contains("page-iceberg") ||
     document.body.classList.contains("dark-page"));
  var FOOTER_LOGO = darkFooter ? "logo-full-light.png" : "logo-full.png";

  var SOCIAL = {
    // WhatsApp do Brasil no site em português; o internacional nas demais versões.
    whatsapp: { label: "WhatsApp", href: LANG === "pt" ? "https://wa.me/5511939525622" : "https://wa.me/5511940881109",
      icon: '<path d="M4 20l1.2-3.6A8 8 0 1 1 8 19z"/><path d="M9.2 8.6c.2-.5.6-.5.9-.5.3 0 .5.4.8 1 .2.5-.4.9-.4 1.2.4 1 1.3 1.9 2.3 2.3.3 0 .7-.6 1.2-.4.6.3 1 .5 1 .8 0 .3 0 .7-.5.9-.6.4-1.7.4-3.2-.5a7.6 7.6 0 0 1-2.4-2.4c-.8-1.5-.8-2.6-.4-3.1z"/>' },
    instagram: { label: "Instagram", href: "https://instagram.com/underneathsi",
      icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>' },
    email: { label: "E-mail", href: "mailto:" + (typeof CONTACT_EMAIL !== "undefined" ? CONTACT_EMAIL : "contact@underneathsi.com"),
      icon: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>' },
    twitter: { label: "X (Twitter)", href: "https://x.com/underneathsi",
      icon: '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15" stroke-width="1.9"/>' }
  };
  // PENDENTE: Privacidade, Termos e Cookies ainda apontam para "#". Troque pelos endereços reais.
  var LEGAL = [
    { label: TEXT.privacy, href: "#" },
    { label: TEXT.terms, href: "#" },
    { label: TEXT.cookies, href: "#" },
    { label: TEXT.faq, href: BASE + PATHS.answers, strong: true }
  ];

  function socialLink(key) {
    var item = SOCIAL[key];
    var external = item.href.indexOf("http") === 0;
    return '<a class="foot-social" href="' + item.href + '" aria-label="' + item.label + '"' +
      (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + item.icon + "</svg></a>";
  }

  var updated = new Date(document.lastModified);
  if (isNaN(updated.getTime())) updated = new Date();
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var updatedText = (LANG === "en"
      ? pad(updated.getMonth() + 1) + "/" + pad(updated.getDate())
      : pad(updated.getDate()) + "/" + pad(updated.getMonth() + 1)) + "/" + updated.getFullYear() +
    " | " + pad(updated.getHours()) + ":" + pad(updated.getMinutes());

  var footerHTML =
    '<div class="wrap foot">' +
    '  <button type="button" class="foot-top-btn" id="backToTop" aria-label="' + TEXT.backToTop + '">' +
    '<svg viewBox="0 0 24 20" aria-hidden="true"><path d="M12 1L23 19H1z"/></svg></button>' +
    '  <div class="foot-top">' +
    '    <div class="foot-socials">' + socialLink("whatsapp") + socialLink("instagram") + "</div>" +
    '    <a class="foot-logo" href="' + HOME_HREF + '"><img src="' + ROOT + "assets/images/" + FOOTER_LOGO + '" alt="UNDERNEATH — Search Intelligence"></a>' +
    '    <div class="foot-socials">' + socialLink("email") + socialLink("twitter") + "</div>" +
    "  </div>" +
    '  <div class="foot-slogan">' + TEXT.slogan + "</div>" +
    '  <nav class="foot-legal" aria-label="' + TEXT.legalNav + '">' +
    LEGAL.map(function (link) {
      return '<a href="' + link.href + '"' + (link.strong ? ' class="is-strong"' : "") + ">" + link.label + "</a>";
    }).join('<span aria-hidden="true">|</span>') +
    "  </nav>" +
    '  <p class="foot-copy">© ' + new Date().getFullYear() + " " + TEXT.copy + "</p>" +
    '  <p class="foot-updated">' + TEXT.updated + updatedText + "</p>" +
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
      var toggleBackToTop = function () {
        backToTop.classList.toggle("is-visible", window.scrollY > 40);
      };
      window.addEventListener("scroll", toggleBackToTop, { passive: true });
      toggleBackToTop();
    }

    var switches = document.querySelectorAll(".lang-switch");
    document.querySelectorAll(".lang-switch a").forEach(function (a) {
      a.addEventListener("click", function (event) {
        if (a.classList.contains("is-active")) { event.preventDefault(); return; }
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        var to = a.getAttribute("hreflang").slice(0, 2);
        try {
          sessionStorage.setItem("langFrom", LANG);
          if (isHome) sessionStorage.setItem("skipIntro", "1");
        } catch (e) {}
        event.preventDefault();
        switches.forEach(function (s) { s.classList.remove("is-pt", "is-en", "is-es"); s.classList.add("is-" + to); });
        document.documentElement.classList.add("lang-leave");
        setTimeout(function () { window.location.href = a.href; }, 420);
      });
    });
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        document.documentElement.classList.remove("lang-leave");
        switches.forEach(function (s) { s.classList.remove("is-pt", "is-en", "is-es"); s.classList.add("is-" + LANG); });
      }
    });
    if (document.documentElement.classList.contains("lang-enter")) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { document.documentElement.classList.remove("lang-enter"); });
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
      tabbar.setAttribute("aria-label", TEXT.mainNav);
      tabbar.innerHTML = '<div class="tabbar-pill">' + tabbarHTML + "</div>";
      document.body.appendChild(tabbar);
    }

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

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!("IntersectionObserver" in window)) return;
    var sections = document.querySelectorAll("main .section");
    if (!sections.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: "-40px 0px -40px 0px" });
    Array.prototype.forEach.call(sections, function (section, i) {
      var blocks = section.querySelectorAll(".wrap > *");
      Array.prototype.forEach.call(blocks, function (block, j) {
        block.setAttribute("data-reveal", i % 2 === 0 ? "left" : "right");
        block.style.transitionDelay = Math.min(j, 4) * 0.08 + "s";
        observer.observe(block);
      });
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    var carousel = document.querySelector(".case-carousel");
    if (!carousel) return;
    var track = carousel.querySelector(".case-track");
    var cards = track.children;
    var prev = carousel.querySelector(".case-arrow-prev");
    var next = carousel.querySelector(".case-arrow-next");
    var index = 0;
    var perView = function () { return window.innerWidth <= 760 ? 1 : window.innerWidth <= 1020 ? 2 : 3; };
    var update = function () {
      var max = Math.max(0, cards.length - perView());
      index = Math.min(Math.max(index, 0), max);
      var step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 20);
      track.style.transform = "translateX(" + (-index * step) + "px)";
      prev.disabled = index === 0;
      next.disabled = index >= max;
    };
    prev.addEventListener("click", function () { index -= 1; update(); });
    next.addEventListener("click", function () { index += 1; update(); });
    window.addEventListener("resize", update);
    update();
  });
})();
