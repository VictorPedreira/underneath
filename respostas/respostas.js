/* Página Respostas: cards por tema e a janela de busca. Carregado depois do global.js. */
(function () {
  "use strict";

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
})();
