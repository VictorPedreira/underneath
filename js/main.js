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

  // Constelação: passar o mouse mostra o nome e um balão "clique" acima do
  // ponteiro; clicar faz a bolinha crescer e virar o card. Tirar o mouse do
  // ponto (ou tocar fora) fecha, com o card voltando para a bolinha.
  document.addEventListener("DOMContentLoaded", function () {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var nodes = hero.querySelectorAll(".c-node[data-node]");
    var tip = hero.querySelector(".c-tip");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var openNode = null, morph = null, timer = null;

    var cardOf = function (node) {
      return hero.querySelector('.c-card[data-card="' + node.getAttribute("data-node") + '"]');
    };
    var dotCenter = function (node) {
      var heroBox = hero.getBoundingClientRect();
      var dot = node.querySelector(".c-dot").getBoundingClientRect();
      return { x: dot.left + dot.width / 2 - heroBox.left, y: dot.top + dot.height / 2 - heroBox.top };
    };
    var clearMorph = function () {
      clearTimeout(timer);
      if (morph && morph.parentNode) morph.parentNode.removeChild(morph);
      morph = null;
    };
    // anima uma bolinha (14px) até o retângulo do card, ou o contrário
    var animateMorph = function (card, from, to, done) {
      clearMorph();
      morph = document.createElement("div");
      morph.className = "c-morph" + (card.classList.contains("c-card-gold") ? " c-morph-gold" : "");
      hero.appendChild(morph);
      var frame = function (r) {
        return { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: r.radius };
      };
      var anim = morph.animate([frame(from), frame(to)], {
        duration: 460, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards"
      });
      var current = morph, finished = false;
      var finish = function () { if (finished || morph !== current) return; finished = true; done(); };
      anim.onfinish = finish;
      setTimeout(finish, 560); // garantia: o card abre mesmo se a animação não terminar
    };

    var close = function () {
      if (!openNode) return;
      var node = openNode, card = cardOf(node);
      openNode = null;
      node.classList.remove("is-open");
      if (!card) return;
      card.classList.remove("is-open");
      if (reduce) { clearMorph(); return; }
      var c = dotCenter(node);
      animateMorph(card,
        { left: card.offsetLeft, top: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight, radius: "14px" },
        { left: c.x - 7, top: c.y - 7, width: 14, height: 14, radius: "50%" },
        clearMorph);
    };

    var open = function (node) {
      close();
      var card = cardOf(node);
      if (!card) return;
      if (tip) tip.classList.remove("is-on");
      var c = dotCenter(node);
      var w = card.offsetWidth, h = card.offsetHeight, edge = 16, left, top;
      if (hero.clientWidth < 600) {
        // celular: card centralizado logo abaixo do ponto
        left = (hero.clientWidth - w) / 2;
        top = c.y + 34;
      } else {
        // ao lado do ponto, de preferência à direita (longe do título)
        var gap = 72;
        left = c.x + gap;
        if (left + w > hero.clientWidth - edge) left = c.x - gap - w;
        top = c.y - h / 2;
      }
      var header = document.getElementById("site-header");
      var minTop = (header ? header.offsetHeight : 0) + edge;
      left = Math.max(edge, left);
      top = Math.max(minTop, Math.min(top, hero.clientHeight - h - edge));
      card.style.left = left + "px";
      card.style.top = top + "px";
      node.classList.add("is-open");
      openNode = node;
      if (reduce) { card.classList.add("is-open"); return; }
      animateMorph(card,
        { left: c.x - 7, top: c.y - 7, width: 14, height: 14, radius: "50%" },
        { left: left, top: top, width: w, height: h, radius: "14px" },
        function () {
          card.classList.add("is-open");
          timer = setTimeout(clearMorph, 240);
        });
    };

    var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
    var moveTip = function (event) {
      if (!tip || !canHover) return;
      var box = hero.getBoundingClientRect();
      tip.style.left = (event.clientX - box.left) + "px";
      tip.style.top = (event.clientY - box.top) + "px";
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
      node.addEventListener("mouseenter", function (event) {
        if (!tip || !canHover || openNode === node) return;
        moveTip(event);
        tip.classList.add("is-on");
      });
      node.addEventListener("mousemove", moveTip);
      node.addEventListener("mouseleave", function () {
        if (tip) tip.classList.remove("is-on");
        if (openNode === node) close();
      });
      node.addEventListener("blur", function () { if (openNode === node) close(); });
    });
    document.addEventListener("click", close);
    window.addEventListener("resize", function () {
      if (!openNode) return;
      var node = openNode, card = cardOf(node);
      openNode = null;
      node.classList.remove("is-open");
      if (card) card.classList.remove("is-open");
      clearMorph();
    });
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
        // Alinha o card ao topo da tela (margem em .mstep scroll-margin-top), ao lado do painel fixo.
        if (step) step.scrollIntoView({ behavior: "smooth", block: "start" });
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
    var questions = document.querySelectorAll(".ans-q, .ans-sub");
    var cards = document.querySelectorAll(".ans-card");
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

    // Fecha a resposta e volta a janela para o estado inicial.
    var clear = function () {
      current = null;
      clearInterval(typing);
      clearTimeout(reveal);
      Array.prototype.forEach.call(questions, function (q) { q.classList.remove("is-active"); });
      Array.prototype.forEach.call(results, function (r) { r.classList.remove("is-open"); });
      win.classList.remove("has-answer", "is-loading", "has-query");
      queryEl.textContent = "";
      urlEl.textContent = baseUrl;
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
    };
    // Abre um card (e fecha os outros); null fecha todos.
    var openCard = function (card) {
      Array.prototype.forEach.call(cards, function (c) {
        var open = c === card;
        c.classList.toggle("is-open", open);
        c.querySelector(".ans-q").setAttribute("aria-expanded", open ? "true" : "false");
      });
    };
    var cardFor = function (slug) {
      var q = document.querySelector('.ans-q[data-answer="' + slug + '"], .ans-sub[data-answer="' + slug + '"]');
      return q && q.closest(".ans-card");
    };

    document.addEventListener("click", function (event) {
      var trigger = event.target.closest && event.target.closest(".ans-q, .ans-sub, .ans-related-q");
      if (!trigger) return;
      var slug = trigger.getAttribute("data-answer");
      if (trigger.classList.contains("ans-q")) {
        var card = trigger.closest(".ans-card");
        // Clicar de novo no card aberto fecha o card e tira a resposta.
        if (card.classList.contains("is-open")) { openCard(null); clear(); return; }
        openCard(card);
      } else {
        openCard(cardFor(slug));
      }
      show(slug);
      if (window.innerWidth <= 960 && !trigger.classList.contains("ans-related-q")) {
        win.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    var initial = window.location.hash.slice(1);
    if (initial && win.querySelector('.ans-result[data-answer="' + initial + '"]')) {
      openCard(cardFor(initial));
      show(initial, true);
      win.scrollIntoView({ block: "start" });
    }
  });

  // Carrossel de cases (home e /cases, 3 por vez). As setas deslizam um card por vez; cada seta
  // some quando não há mais cards naquela direção.
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

    // Barra de progresso: um segmento por campo (sintoma, nome, e-mail e relato).
    var bars = form.querySelectorAll(".ct-progress i");
    var preview = form.querySelector(".ct-preview");
    var previewUrl = form.querySelector(".ct-preview-url");
    var previewStatus = form.querySelector(".ct-preview-status");
    var refresh = function () {
      var steps = [
        !!form.querySelector("input[name=symptom]:checked"),
        form.name.value.trim() !== "",
        form.email.validity.valid && form.email.value.trim() !== "",
        form.message.value.trim() !== ""
      ];
      Array.prototype.forEach.call(bars, function (bar, i) { bar.classList.toggle("on", steps[i]); });

      // Prévia do endereço numa barra de navegador, sem o "https://" e a barra final.
      if (preview) {
        var host = form.site.value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
        var ready = /^[^\s.]+\.[^\s]{2,}/.test(host);
        preview.classList.toggle("ready", ready);
        previewUrl.textContent = host || "seusite.com.br";
        previewStatus.textContent = ready ? "pronto para analisar" : "aguardando endereço";
      }
    };
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    refresh();

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // O formulário usa novalidate para estilizar os erros do nosso jeito.
      if (!form.checkValidity()) {
        form.classList.add("tried");
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var site = form.site.value.trim();
      var message = form.message.value.trim();
      var symptom = form.querySelector("input[name=symptom]:checked");

      var subject = "Analisar meu site — " + (name || "novo contato");
      var bodyLines = [
        "Nome: " + name,
        "E-mail: " + email,
        site ? "Site: " + site : null,
        symptom ? "Principal incômodo: " + symptom.value : null,
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
