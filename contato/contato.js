
var WEB3FORMS_KEY = "";

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var TEXTS = {
      en: {
        waiting: "waiting for an address", ready: "ready to analyze", placeholder: "yoursite.com",
        subject: "Analyze my site — ", newContact: "new contact", name: "Name: ", email: "Email: ", site: "Site: ", symptom: "Main issue: ",
        sending: "Sending…", sent: "<strong>Message sent.</strong> We received your message and will reply to ", fail: "Sending failed",
        error: "We couldn't send it right now. Try again or ", errorLink: "send it from your email", formName: "UNDERNEATH website"
      },
      es: {
        waiting: "esperando una dirección", ready: "lista para analizar", placeholder: "tuweb.es",
        subject: "Analizar mi web — ", newContact: "nuevo contacto", name: "Nombre: ", email: "Correo: ", site: "Web: ", symptom: "Principal problema: ",
        sending: "Enviando…", sent: "<strong>Mensaje enviado.</strong> Hemos recibido tu mensaje y te responderemos en el correo ", fail: "Error en el envío",
        error: "No hemos podido enviarlo ahora. Inténtalo de nuevo o ", errorLink: "envíalo desde tu correo", formName: "Web UNDERNEATH"
      },
      pt: {
        waiting: "aguardando endereço", ready: "pronto para analisar", placeholder: "seusite.com.br",
        subject: "Analisar meu site — ", newContact: "novo contato", name: "Nome: ", email: "E-mail: ", site: "Site: ", symptom: "Principal incômodo: ",
        sending: "Enviando…", sent: "<strong>Mensagem enviada.</strong> Recebemos o seu relato e respondemos no e-mail ", fail: "Falha no envio",
        error: "Não foi possível enviar agora. Tente de novo ou ", errorLink: "envie pelo seu e-mail", formName: "Site UNDERNEATH"
      }
    };
    var TXT = TEXTS[document.documentElement.lang.toLowerCase().slice(0, 2)] || TEXTS.pt;

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

      if (preview) {
        var host = form.site.value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
        var ready = /^[^\s.]+\.[^\s]{2,}/.test(host);
        preview.classList.toggle("ready", ready);
        previewUrl.textContent = host || TXT.placeholder;
        previewStatus.textContent = ready ? TXT.ready : TXT.waiting;
      }
    };
    form.site.addEventListener("input", function () {
      var clean = form.site.value.replace(/^\s*https?:\/\//i, "");
      if (clean !== form.site.value) form.site.value = clean;
    });
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    refresh();

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.classList.add("tried");
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var siteHost = form.site.value.trim().replace(/^https?:\/\//i, "");
      var site = siteHost ? "https://" + siteHost : "";
      var message = form.message.value.trim();
      var symptom = form.querySelector("input[name=symptom]:checked");

      var subject = TXT.subject + (name || TXT.newContact);
      var bodyLines = [
        TXT.name + name,
        TXT.email + email,
        site ? TXT.site + site : null,
        symptom ? TXT.symptom + symptom.value : null,
        "",
        message
      ].filter(function (line) { return line !== null; });

      var mailtoUrl =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      if (!WEB3FORMS_KEY || !window.fetch) {
        window.location.href = mailtoUrl;
        return;
      }

      var button = form.querySelector(".ct-btn");
      var status = form.querySelector(".ct-status");
      var setStatus = function (kind, html) {
        status.className = "ct-status" + (kind ? " is-" + kind : "");
        status.innerHTML = html;
      };
      form.classList.add("is-sending");
      button.disabled = true;
      setStatus("sending", TXT.sending);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: subject,
          from_name: TXT.formName,
          replyto: email,
          name: name,
          email: email,
          site: site || "—",
          "principal incômodo": symptom ? symptom.value : "—",
          message: message,
          botcheck: form.botcheck && form.botcheck.checked ? true : ""
        })
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (!data.success) throw new Error(data.message || TXT.fail);
          form.classList.remove("is-sending");
          form.classList.add("is-sent");
          setStatus("ok", TXT.sent + email.replace(/[<>&"]/g, "") + ".");
        })
        .catch(function () {
          form.classList.remove("is-sending");
          button.disabled = false;
          setStatus("error", TXT.error + "<a href=\"" + mailtoUrl.replace(/"/g, "&quot;") + "\">" + TXT.errorLink + "</a>.");
        });
    });
  });
})();
