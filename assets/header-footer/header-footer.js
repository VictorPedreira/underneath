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

  var NAV_LINKS = [
    { label: "Diagnóstico", href: ROOT + "diagnostico/index.html", match: "diagnostico" },
    { label: "Método", href: ROOT + "metodo/index.html", match: "metodo" },
    { label: "Cases", href: ROOT + "cases/index.html", match: "cases" },
    { label: "Respostas", href: ROOT + "respostas/index.html", match: "respostas" },
    { label: "Sobre", href: ROOT + "sobre/index.html", match: "sobre" }
  ];

  function isActive(match) {
    return currentPath.indexOf("/" + match + "/") !== -1;
  }

  var navLinksHTML = NAV_LINKS.map(function (link) {
    var activeClass = isActive(link.match) ? " is-active" : "";
    return '<a class="navlink' + activeClass + '" href="' + link.href + '">' + link.label + "</a>";
  }).join("\n    ");

  var headerHTML =
    '<div class="nav">' +
    '  <a href="' + ROOT + 'index.html" class="brand">' +
    '    <img class="brand-word" src="' + ROOT + 'assets/images/logo-wordmark.png" alt="UNDERNEATH">' +
    "  </a>" +
    '  <nav class="links" id="navLinks">' +
    "    " + navLinksHTML +
    "  </nav>" +
    '  <div class="nav-right">' +
    '    <a class="cta-btn nav-cta" href="' + ROOT + 'contato/index.html">Analisar meu site<span class="nav-cta-fill nav-cta-trail" aria-hidden="true"></span><span class="nav-cta-fill" aria-hidden="true"></span><span class="nav-cta-fill nav-cta-text" aria-hidden="true">Analisar meu site</span></a>' +
    '    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    "  </div>" +
    "</div>";

  // Páginas que terminam em fundo escuro (home, diagnóstico e as .dark-page) usam o logo
  // com texto claro no rodapé.
  var darkFooter = document.body &&
    (document.body.classList.contains("has-hero") || document.body.classList.contains("page-iceberg") ||
     document.body.classList.contains("dark-page"));
  var FOOTER_LOGO = darkFooter ? "logo-full-light.png" : "logo-full.png";

  var footerHTML =
    '<div class="wrap foot-grid">' +
    "  <div>" +
    '    <img src="' + ROOT + 'assets/images/' + FOOTER_LOGO + '" alt="UNDERNEATH — Search Intelligence" style="width:180px; height:auto;">' +
    '    <div class="foot-slogan">Fortaleça a base e ganhe destaque.</div>' +
    "  </div>" +
    '  <div class="foot-links">' +
    '    <a href="' + ROOT + 'metodo/index.html">Método</a>' +
    '    <a href="' + ROOT + 'cases/index.html">Cases</a>' +
    '    <a href="' + ROOT + 'respostas/index.html">Respostas</a>' +
    '    <a href="' + ROOT + 'contato/index.html">Contato</a>' +
    "  </div>" +
    "</div>";

  function mount() {
    var headerMount = document.getElementById("site-header");
    var footerMount = document.getElementById("site-footer");
    if (headerMount) headerMount.innerHTML = headerHTML;
    if (footerMount) footerMount.innerHTML = footerHTML;

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
  var HOME_PATH = new URL(ROOT + "index.html", window.location.href).pathname;
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
