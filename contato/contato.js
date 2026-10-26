/* Página Contato: formulário (progresso, prévia do site e envio).
   Usa CONTACT_EMAIL, definido no assets/js/global.js. */

// Envio automático do formulário de contato pelo Web3Forms (https://web3forms.com).
// Gere a chave gratuita em web3forms.com com o e-mail acima e cole aqui.
// Enquanto estiver vazia, o formulário abre o programa de e-mail da pessoa.
var WEB3FORMS_KEY = "";

(function () {
  "use strict";

  // Contact form (only present on /contato/index.html) — builds a mailto:
  // link from the fields and hands off to the visitor's own mail client.
  // There is no backend here, so this is the honest way to "send" a
  // message without pretending a submission was received.
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    // Textos do formulário no idioma da página.
    var EN = document.documentElement.lang.toLowerCase().indexOf("en") === 0;
    var TXT = EN ? {
      waiting: "waiting for an address", ready: "ready to analyze", placeholder: "yoursite.com",
      subject: "Analyze my site — ", newContact: "new contact", name: "Name: ", email: "Email: ", site: "Site: ", symptom: "Main issue: ",
      sending: "Sending…", sent: "<strong>Message sent.</strong> We received your message and will reply to ", fail: "Sending failed",
      error: "We couldn't send it right now. Try again or ", errorLink: "send it from your email", formName: "UNDERNEATH website"
    } : {
      waiting: "aguardando endereço", ready: "pronto para analisar", placeholder: "seusite.com.br",
      subject: "Analisar meu site — ", newContact: "novo contato", name: "Nome: ", email: "E-mail: ", site: "Site: ", symptom: "Principal incômodo: ",
      sending: "Enviando…", sent: "<strong>Mensagem enviada.</strong> Recebemos o seu relato e respondemos no e-mail ", fail: "Falha no envio",
      error: "Não foi possível enviar agora. Tente de novo ou ", errorLink: "envie pelo seu e-mail", formName: "Site UNDERNEATH"
    };

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
        previewUrl.textContent = host || TXT.placeholder;
        previewStatus.textContent = ready ? TXT.ready : TXT.waiting;
      }
    };
    // Campo do site: o "https://" já está fixo; se a pessoa colar com ele, tira do texto.
    form.site.addEventListener("input", function () {
      var clean = form.site.value.replace(/^\s*https?:\/\//i, "");
      if (clean !== form.site.value) form.site.value = clean;
    });
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
      // O "https://" fica fixo no campo; aqui ele volta para o endereço completo.
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

      // Sem chave configurada (ou navegador sem fetch): abre o e-mail da pessoa.
      if (!WEB3FORMS_KEY || !window.fetch) {
        window.location.href = mailtoUrl;
        return;
      }

      // Envio automático: a mensagem vai direto para o CONTACT_EMAIL.
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
