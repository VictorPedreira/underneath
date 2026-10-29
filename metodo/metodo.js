(function () {
  "use strict";

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
        if (step) step.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  });
})();
