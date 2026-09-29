/* ==========================================================================
   UNDERNEATH — Search Intelligence
   Page-level scripts (anything that is NOT the shared header/footer,
   which lives in /assets/header-footer/header-footer.js instead).
   ========================================================================== */

// IMPORTANT: replace with the real business address before publishing.
var CONTACT_EMAIL = "contato@underneath.com.br";

(function () {
  "use strict";

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
