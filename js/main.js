/* ==========================================================================
   UNDERNEATH — Search Intelligence
   Page-level scripts (anything that is NOT the shared header/footer,
   which lives in /assets/header-footer/header-footer.js instead).
   ========================================================================== */

// IMPORTANT: replace with the real business address before publishing.
var CONTACT_EMAIL = "contato@underneath.com.br";

(function () {
  "use strict";

  // Intro da home — remove a camada assim que as portas terminam de abrir.
  document.addEventListener("DOMContentLoaded", function () {
    var intro = document.getElementById("intro");
    if (!intro) return;
    var root = document.documentElement;
    if (!root.classList.contains("intro-active")) {
      intro.parentNode.removeChild(intro);
      return;
    }
    setTimeout(function () {
      root.classList.remove("intro-active");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 5000);
  });

  // Botão principal do topo: o neon atrás dele segue o mouse com leve atraso.
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".hero-cta");
    if (!btn) return;
    var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, frame = null;
    var follow = function () {
      pos.x += (target.x - pos.x) * 0.15;
      pos.y += (target.y - pos.y) * 0.15;
      btn.style.setProperty("--x", pos.x + "px");
      btn.style.setProperty("--y", pos.y + "px");
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3
        ? requestAnimationFrame(follow) : null;
    };
    var aim = function (event, jump) {
      var box = btn.getBoundingClientRect();
      target.x = event.clientX - box.left;
      target.y = event.clientY - box.top;
      if (jump) { pos.x = target.x; pos.y = target.y; }
      if (!frame) frame = requestAnimationFrame(follow);
    };
    btn.addEventListener("mouseenter", function (event) { aim(event, true); });
    btn.addEventListener("mousemove", function (event) { aim(event, false); });
  });

  // Constelação: clicar num ponto abre o card dele perto do ponto; tirar o
  // mouse do ponto (ou clicar fora) fecha o card e o nome.
  document.addEventListener("DOMContentLoaded", function () {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var nodes = hero.querySelectorAll(".c-node[data-node]");
    var openNode = null;

    var close = function () {
      if (!openNode) return;
      openNode.classList.remove("is-open");
      var card = hero.querySelector('.c-card[data-card="' + openNode.getAttribute("data-node") + '"]');
      if (card) card.classList.remove("is-open");
      openNode = null;
    };

    var open = function (node) {
      close();
      var card = hero.querySelector('.c-card[data-card="' + node.getAttribute("data-node") + '"]');
      if (!card) return;
      var heroBox = hero.getBoundingClientRect();
      var dot = node.querySelector(".c-dot").getBoundingClientRect();
      var cx = dot.left + dot.width / 2 - heroBox.left;
      var cy = dot.top + dot.height / 2 - heroBox.top;
      var w = card.offsetWidth, h = card.offsetHeight, gap = 72, edge = 16;
      var header = document.getElementById("site-header");
      var minTop = (header ? header.offsetHeight : 0) + edge;
      // ao lado do ponto, de preferência à direita (longe do título); se não
      // couber, à esquerda. Centralizado na altura do ponto.
      var left = cx + gap;
      if (left + w > hero.clientWidth - edge) left = cx - gap - w;
      left = Math.max(edge, left);
      var top = Math.min(Math.max(minTop, cy - h / 2), hero.clientHeight - h - edge);
      card.style.top = top + "px";
      card.style.left = left + "px";
      card.classList.add("is-open");
      node.classList.add("is-open");
      openNode = node;
    };

    Array.prototype.forEach.call(nodes, function (node) {
      node.addEventListener("click", function (event) {
        event.stopPropagation();
        if (openNode === node) close(); else open(node);
      });
      node.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (openNode === node) close(); else open(node);
      });
      node.addEventListener("mouseleave", function () { if (openNode === node) close(); });
      node.addEventListener("blur", function () { if (openNode === node) close(); });
    });
    document.addEventListener("click", close);
    window.addEventListener("resize", close);
  });

  // Método: marca a etapa no centro da tela como ativa, gira o número do
  // painel fixo, enche a barra de progresso e deixa as etapas clicáveis.
  document.addEventListener("DOMContentLoaded", function () {
    var flow = document.querySelector(".method-flow");
    if (!flow || !("IntersectionObserver" in window)) return;
    var steps = flow.querySelectorAll(".mstep");
    var buttons = flow.querySelectorAll(".method-rail button");
    var digits = flow.querySelector(".method-rail-digits");
    var fill = flow.querySelector(".method-rail-fill");
    var setActive = function (index) {
      Array.prototype.forEach.call(steps, function (step, i) { step.classList.toggle("is-active", i === index); });
      Array.prototype.forEach.call(buttons, function (btn, i) { btn.classList.toggle("is-active", i === index); });
      if (digits) digits.style.transform = "translateY(" + (-index) + "em)";
      if (fill) fill.style.height = ((index + 1) / steps.length * 100) + "%";
    };
    setActive(0);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(Number(entry.target.getAttribute("data-step")));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    Array.prototype.forEach.call(steps, function (step) { observer.observe(step); });
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var step = steps[Number(btn.getAttribute("data-step"))];
        if (step) step.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  });

  // Respostas: clicar numa pergunta "digita" a busca na janela, mostra a
  // barrinha de carregamento e abre a resposta. O #slug na URL abre direto.
  document.addEventListener("DOMContentLoaded", function () {
    var win = document.querySelector(".ans-window");
    if (!win) return;
    var queryEl = win.querySelector(".ans-query");
    var urlEl = win.querySelector(".ans-window-url");
    var baseUrl = urlEl.textContent;
    var results = win.querySelectorAll(".ans-result");
    var questions = document.querySelectorAll(".ans-q");
    var typing = null, reveal = null, current = null;

    var show = function (slug, instant) {
      var result = win.querySelector('.ans-result[data-answer="' + slug + '"]');
      if (!result || slug === current) return;
      current = slug;
      clearInterval(typing);
      clearTimeout(reveal);
      Array.prototype.forEach.call(questions, function (q) {
        q.classList.toggle("is-active", q.getAttribute("data-answer") === slug);
      });
      Array.prototype.forEach.call(results, function (r) { r.classList.remove("is-open"); });
      win.classList.remove("has-answer", "is-loading");
      win.classList.add("has-query");
      urlEl.textContent = baseUrl + "/" + slug;
      try { history.replaceState(null, "", "#" + slug); } catch (e) {}

      var text = result.getAttribute("data-query");
      var finish = function () {
        queryEl.textContent = text;
        void win.offsetWidth; // reinicia a animação da barrinha de carregamento
        win.classList.add("is-loading");
        reveal = setTimeout(function () {
          result.classList.add("is-open");
          win.classList.add("has-answer");
        }, instant ? 0 : 380);
      };
      if (instant) { finish(); return; }
      var i = 0;
      queryEl.textContent = "";
      typing = setInterval(function () {
        i += 1;
        queryEl.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(typing); finish(); }
      }, 22);
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest && event.target.closest(".ans-q, .ans-related-q");
      if (!trigger) return;
      show(trigger.getAttribute("data-answer"));
      if (window.innerWidth <= 960) win.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var initial = window.location.hash.slice(1);
    if (initial && win.querySelector('.ans-result[data-answer="' + initial + '"]')) {
      show(initial, true);
      win.scrollIntoView({ block: "start" });
    }
  });

  // Home: carrossel de cases. As setas deslizam um card por vez; cada seta
  // some quando não há mais cards naquela direção.
  document.addEventListener("DOMContentLoaded", function () {
    var carousel = document.querySelector(".case-carousel");
    if (!carousel) return;
    var track = carousel.querySelector(".case-track");
    var cards = track.children;
    var prev = carousel.querySelector(".case-arrow-prev");
    var next = carousel.querySelector(".case-arrow-next");
    var index = 0;
    var perView = function () { return window.innerWidth <= 760 ? 1 : 2; };
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

  // Seções abaixo do topo: cada bloco desliza para dentro vindo de um lado,
  // alternando esquerda/direita por seção, sempre que entra na tela — ao
  // descer e também ao subir de volta (sai da tela, volta a ficar escondido).
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

  // Contact form (only present on /contato/index.html) — builds a mailto:
  // link from the fields and hands off to the visitor's own mail client.
  // There is no backend here, so this is the honest way to "send" a
  // message without pretending a submission was received.
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var site = form.site.value.trim();
      var message = form.message.value.trim();

      var subject = "Analisar meu site — " + (name || "novo contato");
      var bodyLines = [
        "Nome: " + name,
        "E-mail: " + email,
        site ? "Site: " + site : null,
        "",
        message
      ].filter(function (line) { return line !== null; });

      var mailtoUrl =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailtoUrl;
    });
  });
})();
