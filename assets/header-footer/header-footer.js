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
    '  <div class="nav-right">' +
    '    <a class="cta-btn" href="' + ROOT + 'contato/index.html">Analisar meu site</a>' +
    '    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    "  </div>" +
    "</div>" +
    '<nav class="links" id="navLinks">' +
    "  " + navLinksHTML +
    "</nav>";

  var footerHTML =
    '<div class="wrap foot-grid">' +
    "  <div>" +
    '    <img src="' + ROOT + 'assets/images/logo-full.png" alt="UNDERNEATH — Search Intelligence" style="width:180px; height:auto;">' +
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
