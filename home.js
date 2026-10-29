(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var intro = document.getElementById("intro");
    if (!intro) return;
    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Sem abertura e com as órbitas (animação SVG, que o CSS não para) congeladas.
      root.classList.remove("intro-active");
      Array.prototype.forEach.call(document.querySelectorAll("svg.bg-orbits"), function (svg) {
        if (svg.pauseAnimations) svg.pauseAnimations();
      });
    }
    if (!root.classList.contains("intro-active")) {
      intro.parentNode.removeChild(intro);
      return;
    }
    setTimeout(function () {
      root.classList.remove("intro-active");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 5000);
  });

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
      setTimeout(finish, 560);
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
        left = (hero.clientWidth - w) / 2;
        top = c.y + 34;
      } else {
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
})();
