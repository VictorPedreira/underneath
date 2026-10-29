#!/usr/bin/env python3
"""Build e publicação editorial do site UNDERNEATH.

O repositório guarda todas as páginas, inclusive artigos em rascunho. O build copia
para dist/ só o que pode ir ao ar, segundo content/editorial.json, e gera a partir
dele as listagens do blog, o "Continue lendo", os hreflang, as datas e o sitemap.

Uso (detalhes em PUBLICACAO.md):
  python3 tools/editorial.py build              gera dist/ (comando do Cloudflare Pages)
  python3 tools/editorial.py status             lista os artigos e seus status
  python3 tools/editorial.py publish SLUG...    libera artigos (status published + data de hoje)
  python3 tools/editorial.py launch --date D    preenche a data dos artigos publicados sem data
  python3 tools/editorial.py update SLUG        registra atualização relevante (updatedAt)
  python3 tools/editorial.py schedule SLUG --planned D
  python3 tools/editorial.py archive SLUG [--redirect /caminho/]
  python3 tools/editorial.py stamp              atualiza o lastmod das páginas que mudaram

Só usa a biblioteca padrão do Python 3.8+.
"""
import argparse
import base64
import copy
import datetime
import hashlib
import html
import json
import os
import posixpath
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = "content/editorial.json"
LASTMOD = "content/lastmod.json"
STATUSES = ("draft", "scheduled", "published", "archived")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Nunca vão para o site publicado.
EXCLUDED_DIRS = {".git", ".github", ".claude", ".vscode", "dist", "tools", "tests", "content",
                 "node_modules", "__pycache__"}
EXCLUDED_FILES = {"sitemap.xml", ".gitignore", ".gitattributes", "_headers", "_redirects"}
EXCLUDED_EXT = {".md", ".py", ".pyc"}

MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
             "setembro", "outubro", "novembro", "dezembro"]
MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August",
             "September", "October", "November", "December"]
MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"]


class BuildError(Exception):
    pass


# ---------------------------------------------------------------- manifesto

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def article_path(manifest, art):
    return manifest["config"]["locales"][art["locale"]]["blog"] + art["slug"] + "/"


def is_public(manifest, art):
    loc = manifest["config"]["locales"].get(art["locale"], {})
    return art["status"] == "published" and loc.get("enabled", False)


def validate_manifest(manifest, root):
    errors = []
    cfg = manifest.get("config", {})
    locales = cfg.get("locales", {})
    if not cfg.get("site", "").startswith("https://"):
        errors.append("config.site precisa ser uma URL https")
    seen, featured = set(), {}
    groups = {}
    for i, art in enumerate(manifest.get("articles", [])):
        tag = "artigo %d (%s)" % (i + 1, art.get("slug"))
        for key in ("slug", "locale", "status", "translationGroup"):
            if not art.get(key):
                errors.append("%s: campo %s obrigatório" % (tag, key))
        if art.get("locale") not in locales:
            errors.append("%s: idioma %r não existe em config.locales" % (tag, art.get("locale")))
            continue
        if art.get("status") not in STATUSES:
            errors.append("%s: status %r inválido (use %s)" % (tag, art.get("status"), ", ".join(STATUSES)))
        for key in ("plannedDate", "publishedAt", "updatedAt"):
            v = art.get(key)
            if v is not None and not DATE_RE.match(str(v)):
                errors.append("%s: %s deve ser AAAA-MM-DD ou null" % (tag, key))
        if art.get("updatedAt") and not art.get("publishedAt"):
            errors.append("%s: updatedAt sem publishedAt" % tag)
        if art.get("updatedAt") and art.get("publishedAt") and art["updatedAt"] < art["publishedAt"]:
            errors.append("%s: updatedAt anterior a publishedAt" % tag)
        if art.get("status") == "published" and not locales[art["locale"]].get("enabled"):
            errors.append("%s: publicado num idioma desativado (%s)" % (tag, art["locale"]))
        path = article_path(manifest, art)
        if path in seen:
            errors.append("%s: caminho duplicado %s" % (tag, path))
        seen.add(path)
        if not os.path.isfile(os.path.join(root, path, "index.html")):
            errors.append("%s: arquivo %sindex.html não existe" % (tag, path))
        key = (art.get("translationGroup"), art["locale"])
        if key in groups:
            errors.append("%s: já existe um artigo em %s no grupo %s" % (tag, art["locale"], key[0]))
        groups[key] = art
        if art.get("featured") and is_public(manifest, art):
            if art["locale"] in featured:
                errors.append("%s: mais de um destaque publicado em %s" % (tag, art["locale"]))
            featured[art["locale"]] = art
        if art.get("redirectTo") and art.get("status") != "archived":
            errors.append("%s: redirectTo só vale para status archived" % tag)
    # Todo artigo que existe no repositório precisa estar no manifesto: um artigo
    # esquecido fora dele nunca é publicado por engano.
    for loc in locales.values():
        blog_dir = os.path.join(root, loc["blog"])
        if not os.path.isdir(blog_dir):
            continue
        for name in sorted(os.listdir(blog_dir)):
            if os.path.isfile(os.path.join(blog_dir, name, "index.html")) and loc["blog"] + name + "/" not in seen:
                errors.append("artigo %s%s/ existe no repositório mas não está no manifesto" % (loc["blog"], name))
    return errors


# ---------------------------------------------------------------- utilidades HTML

def page_url_path(rel_file):
    """blog/x/index.html -> /blog/x/ ; 404.html -> /404.html"""
    rel_file = rel_file.replace(os.sep, "/")
    if rel_file == "index.html":
        return "/"
    if rel_file.endswith("/index.html"):
        return "/" + rel_file[:-len("index.html")]
    return "/" + rel_file


def resolve(page_path, ref, site):
    """Resolve um href/src para um caminho absoluto do site, ou None se for externo."""
    ref = html.unescape(ref.strip())
    if not ref or ref.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    if ref.startswith(site):
        ref = ref[len(site):] or "/"
    elif re.match(r"^[a-z][a-z0-9+.-]*:|^//", ref, re.I):
        return None
    ref = re.split(r"[?#]", ref)[0]
    if not ref:
        return None
    base = page_path if page_path.endswith("/") else posixpath.dirname(page_path) + "/"
    joined = ref if ref.startswith("/") else posixpath.join(base, ref)
    # normpath engole ".." acima da raiz; um caminho assim só funcionaria num subdiretório
    # (como o GitHub Pages em /underneath/), então é marcado com "!".
    depth = 0
    for part in joined.split("/"):
        if part == "..":
            depth -= 1
            if depth < 0:
                return "!" + joined
        elif part and part != ".":
            depth += 1
    norm = posixpath.normpath(joined)
    if ref.endswith("/") and not norm.endswith("/"):
        norm += "/"
    return norm


def relative(from_page, to_path):
    rel = posixpath.relpath(to_path, from_page if from_page.endswith("/") else posixpath.dirname(from_page))
    if to_path.endswith("/") and not rel.endswith("/"):
        rel += "/"
    return rel


def text_of(fragment):
    fragment = re.sub(r"<(script|style)\b.*?</\1>", " ", fragment, flags=re.S | re.I)
    fragment = re.sub(r"<!--.*?-->", " ", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def content_hash(page_html):
    """Hash do conteúdo que importa para o lastmod: título, descrição e texto do <main>."""
    title = re.search(r"<title>(.*?)</title>", page_html, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', page_html)
    main = re.search(r"<main\b.*?</main>", page_html, re.S)
    parts = [title.group(1) if title else "", desc.group(1) if desc else "",
             main.group(0) if main else page_html]
    return hashlib.sha1(text_of(" | ".join(parts)).encode("utf-8")).hexdigest()[:16]


def fmt_date(iso, locale):
    d = datetime.date.fromisoformat(iso)
    if locale.startswith("pt"):
        return "%d de %s de %d" % (d.day, MONTHS_PT[d.month - 1], d.year)
    if locale.startswith("es"):
        return "%d de %s de %d" % (d.day, MONTHS_ES[d.month - 1], d.year)
    return "%s %d, %d" % (MONTHS_EN[d.month - 1], d.day, d.year)


UPDATED_LABEL = {"pt": "Atualizado em", "en": "Updated", "es": "Actualizado el"}


def article_info(src_html):
    """Dados do card extraídos do próprio artigo, para não duplicar texto."""
    def grab(pattern, what):
        m = re.search(pattern, src_html, re.S)
        if not m:
            raise BuildError("não encontrei %s no artigo" % what)
        return m.group(1)
    return {
        "title": grab(r"<h1>(.*?)</h1>", "o <h1>"),
        "cat": grab(r'<span class="post-cat">(.*?)</span>', "a categoria (post-cat)"),
        "accent": grab(r'<body[^>]*style="--accent:([^;"]+);', "a cor (--accent no <body>)"),
        "desc": grab(r'<meta name="description" content="([^"]*)"', "a meta description"),
        "read": grab(r'<div class="post-meta">.*<span>([^<]*)</span></div>', "o tempo de leitura"),
    }


# ---------------------------------------------------------------- build

class Site:
    def __init__(self, root, manifest):
        self.root = root
        self.m = manifest
        self.cfg = manifest["config"]
        self.site = self.cfg["site"].rstrip("/")
        self.locales = self.cfg["locales"]
        self.articles = manifest["articles"]
        for i, a in enumerate(self.articles):
            a["_i"] = i
            a["_path"] = "/" + article_path(manifest, a)
            a["_public"] = is_public(manifest, a)
        self.public = [a for a in self.articles if a["_public"]]
        self.hidden_paths = {a["_path"] for a in self.articles if not a["_public"]}
        self.hidden_roots = ["/" + l["root"] for l in self.locales.values() if not l["enabled"] and l["root"]]
        self.by_path = {a["_path"]: a for a in self.articles}
        self.info = {}
        for a in self.public:
            with open(os.path.join(root, a["_path"].strip("/"), "index.html"), encoding="utf-8") as f:
                try:
                    self.info[a["_path"]] = article_info(f.read())
                except BuildError as e:
                    raise BuildError("%s: %s" % (a["_path"], e))

    def is_hidden(self, path):
        if not path or path.startswith("!"):
            return False
        p = path if path.endswith("/") else posixpath.dirname(path) + "/"
        return any(p.startswith(h) for h in self.hidden_paths) or any(path.startswith(r) for r in self.hidden_roots)

    def blog_order(self, locale):
        arts = [a for a in self.public if a["locale"] == locale]
        arts.sort(key=lambda a: (a.get("publishedAt") or "9999-12-31", -a["_i"]), reverse=True)
        feat = [a for a in arts if a.get("featured")]
        if feat:
            arts.remove(feat[0])
            arts.insert(0, feat[0])
        return arts

    def card(self, page_path, art, heading, featured=False):
        info = self.info[art["_path"]]
        excerpt = html.escape(art["excerpt"], quote=False) if art.get("excerpt") else info["desc"]
        img = relative(page_path, "/assets/images/blog/%s-card.webp" % art.get("cover", art["slug"]))
        return (
            '        <a class="post-card%s" href="%s" style="--accent:%s;">\n'
            '          <div class="post-card-art"><img src="%s" alt="" width="800" height="450"%s decoding="async"></div>\n'
            '          <div class="post-card-body">\n'
            '            <span class="post-cat">%s</span>\n'
            '            <%s>%s</%s>\n'
            '            <p>%s</p>\n'
            '            <span class="post-card-meta">%s <span aria-hidden="true">→</span></span>\n'
            '          </div>\n'
            '        </a>'
        ) % (" post-card-featured" if featured else "", relative(page_path, art["_path"]), info["accent"], img,
             "" if featured else ' loading="lazy"', info["cat"], heading, info["title"], heading, excerpt, info["read"])

    def related(self, art):
        same = [a for a in self.public if a["locale"] == art["locale"] and a is not art]
        by_group = {a["translationGroup"]: a for a in same}
        chosen = [by_group[g] for g in art.get("related", []) if g in by_group][:2]
        for a in self.blog_order(art["locale"]):
            if len(chosen) >= 2:
                break
            if a is not art and a not in chosen:
                chosen.append(a)
        return chosen

    # -- transformações

    @staticmethod
    def replace_cards(doc, grid_re, new_cards):
        m = re.search(grid_re, doc)
        if not m:
            return None
        card_re = re.compile(r'\s*<a class="post-card[^"]*"[^>]*>.*?</a>', re.S)
        pos = end = m.end()
        while True:
            cm = card_re.match(doc, pos)
            if not cm:
                break
            pos = end = cm.end()
        return doc[:m.end()] + "\n" + "\n".join(new_cards) + doc[end:]

    def alternates(self, art):
        members = {a["locale"]: a for a in self.public if a["translationGroup"] == art["translationGroup"]}
        lines = []
        for loc in self.locales:
            if loc in members:
                lines.append('<link rel="alternate" hreflang="%s" href="%s%s">' % (loc, self.site, members[loc]["_path"]))
        default = members.get("pt-BR") or art
        lines.append('<link rel="alternate" hreflang="x-default" href="%s%s">' % (self.site, default["_path"]))
        return "\n".join(lines)

    def transform(self, page_path, doc):
        # Comentários com hreflang de idiomas ocultos não vão ao ar.
        doc = re.sub(r"\n?<!--[^\n]*?hreflang.*?-->", "", doc)
        art = self.by_path.get(page_path)
        if art:
            doc = self.transform_article(page_path, art, doc)
        else:
            doc = re.sub(r'\n<link rel="alternate" hreflang="[^"]+" href="([^"]+)">',
                         lambda m: "" if self.is_hidden(resolve(page_path, m.group(1), self.site)) else m.group(0), doc)
        for loc_name, loc in self.locales.items():
            if loc["enabled"] and page_path == "/" + loc["blog"]:
                doc = self.transform_blog_index(page_path, loc_name, doc)
        return self.drop_hidden_links(page_path, doc)

    def transform_article(self, page_path, art, doc):
        pub, upd = art.get("publishedAt"), art.get("updatedAt")
        lang = art["locale"][:2]
        # hreflang só entre traduções publicadas.
        block = re.search(r'<link rel="alternate" hreflang=.*?(?=\n<(?!link rel="alternate"))', doc, re.S)
        if block:
            doc = doc[:block.start()] + self.alternates(art) + doc[block.end():]
        # Datas visíveis.
        spans = ""
        if pub:
            spans += '<span><time datetime="%s">%s</time></span>' % (pub, fmt_date(pub, art["locale"]))
            if upd and upd != pub:
                spans += '<span>%s <time datetime="%s">%s</time></span>' % (UPDATED_LABEL[lang], upd, fmt_date(upd, art["locale"]))
        doc = re.sub(r'(<div class="post-meta"><span>[^<]*</span>)(?:<span>[^<]*<time.*?</time></span>)*',
                     lambda m: m.group(1) + spans, doc, count=1, flags=re.S)
        # Datas no JSON-LD.
        def fix_post(node):
            if node.get("@type") == "BlogPosting":
                set_dates(node, pub, upd)
        doc = edit_jsonld(doc, fix_post)
        # Continue lendo.
        rel = self.related(art)
        if not rel:
            doc = re.sub(r'\n\s*<section class="post-more">.*?</section>', "", doc, flags=re.S)
        else:
            new = self.replace_cards(doc, r'<section class="post-more">\s*<h2>[^<]*</h2>\s*<div class="post-grid[^"]*">',
                                     [self.card(page_path, a, "h3") for a in rel])
            if new is not None:
                doc = new
        return doc

    def transform_blog_index(self, page_path, locale, doc):
        arts = self.blog_order(locale)
        cards = [self.card(page_path, a, "h2", featured=(i == 0)) for i, a in enumerate(arts)]
        new = self.replace_cards(doc, r'<div class="post-grid">', cards)
        if new is None:
            raise BuildError("%s: não encontrei a grade de artigos (div.post-grid)" % page_path)
        doc = new

        def fix_blog(node):
            if node.get("@type") == "Blog":
                posts = []
                for a in arts:
                    p = {"@type": "BlogPosting", "headline": text_of(self.info[a["_path"]]["title"]),
                         "@id": self.site + a["_path"] + "#post", "url": self.site + a["_path"]}
                    set_dates(p, a.get("publishedAt"), a.get("updatedAt"))
                    posts.append(p)
                node["blogPost"] = posts
        return edit_jsonld(doc, fix_blog)

    def drop_hidden_links(self, page_path, doc):
        """Links para artigos não publicados: blocos (cards, 'ler mais') somem; links no texto viram texto."""
        def repl(m):
            target = resolve(page_path, m.group(2), self.site)
            if not self.is_hidden(target):
                return m.group(0)
            if re.search(r'class="[^"]*\b(post-card|ans-link)\b', m.group(1)):
                return ""
            return m.group(3)
        return re.sub(r'(<a\b[^>]*?\bhref="([^"]*)"[^>]*>)(.*?)</a>', repl, doc, flags=re.S)

    # -- saídas

    def sitemap(self, out, lastmod):
        urls = []
        for dirpath, _, files in os.walk(out):
            if "index.html" not in files:
                continue
            rel = os.path.relpath(os.path.join(dirpath, "index.html"), out)
            path = page_url_path(rel)
            with open(os.path.join(dirpath, "index.html"), encoding="utf-8") as f:
                doc = f.read()
            robots = re.search(r'<meta name="robots" content="([^"]*)"', doc)
            canon = re.search(r'<link rel="canonical" href="([^"]+)"', doc)
            if (robots and "noindex" in robots.group(1)) or not canon or canon.group(1) != self.site + path:
                continue
            art = self.by_path.get(path)
            if art:
                mod = art.get("updatedAt") or art.get("publishedAt")
            else:
                mod = (lastmod.get(path) or {}).get("lastmod")
                for loc in self.locales.values():
                    if path == "/" + loc["blog"]:
                        dates = [a.get("updatedAt") or a.get("publishedAt") for a in self.public
                                 if a["_path"].startswith(path)]
                        mod = max([d for d in dates + [mod] if d] or [None]) if any(dates + [mod]) else None
            urls.append((path, mod))
        order = {"/" + l["root"]: i for i, l in enumerate(self.locales.values())}

        def key(item):
            path = item[0]
            loc_rank = max((i for r, i in order.items() if r != "/" and path.startswith(r)), default=0)
            return (loc_rank, path.count("/"), path)
        lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for path, mod in sorted(urls, key=key):
            lines.append("  <url>")
            lines.append("    <loc>%s%s</loc>" % (self.site, html.escape(path)))
            if mod:
                lines.append("    <lastmod>%s</lastmod>" % mod)
            lines.append("  </url>")
        lines.append("</urlset>")
        return "\n".join(lines) + "\n"


def set_dates(node, pub, upd):
    """Grava datePublished/dateModified mantendo a ordem das chaves; remove se não houver data."""
    items = [(k, v) for k, v in node.items() if k not in ("datePublished", "dateModified")]
    keys = list(node.keys())
    anchor = keys.index("datePublished") if "datePublished" in keys else len(items)
    anchor = min(anchor, len(items))
    dates = [("datePublished", pub), ("dateModified", upd or pub)] if pub else []
    new = items[:anchor] + dates + items[anchor:]
    node.clear()
    node.update(new)


def edit_jsonld(doc, fn):
    def repl(m):
        data = json.loads(m.group(2))
        before = json.dumps(data, sort_keys=True)
        for node in data.get("@graph", [data]):
            fn(node)
        if json.dumps(data, sort_keys=True) == before:
            return m.group(0)
        return m.group(1) + json.dumps(data, indent=2, ensure_ascii=False) + m.group(3)
    return re.sub(r'(<script type="application/ld\+json">\n)(.*?)(\n</script>)', repl, doc, flags=re.S)


def inline_script_hashes(out):
    hashes = set()
    for dirpath, _, files in os.walk(out):
        for name in files:
            if name.endswith(".html"):
                with open(os.path.join(dirpath, name), encoding="utf-8") as f:
                    for body in re.findall(r"<script>(.*?)</script>", f.read(), re.S):
                        digest = hashlib.sha256(body.encode("utf-8")).digest()
                        hashes.add("'sha256-%s'" % base64.b64encode(digest).decode())
    return " ".join(sorted(hashes))


def build(root=ROOT, out=None, manifest=None, env=None, quiet=False):
    """Gera o site publicável em `out`. Devolve a lista de avisos; erros levantam BuildError."""
    out = out or os.path.join(root, "dist")
    env = os.environ if env is None else env
    manifest = copy.deepcopy(manifest or load_json(os.path.join(root, MANIFEST)))
    errors = validate_manifest(manifest, root)
    if errors:
        raise BuildError("manifesto inválido:\n  " + "\n  ".join(errors))
    site = Site(root, manifest)

    # Trava de produção: no Cloudflare, o branch de produção só gera o site se
    # todo artigo publicado tiver a data real de publicação preenchida.
    if env.get("CF_PAGES") == "1" and env.get("CF_PAGES_BRANCH") == site.cfg.get("productionBranch", "main"):
        missing = [a["_path"] for a in site.public if not a.get("publishedAt")]
        if missing:
            raise BuildError("produção bloqueada: artigos publicados sem publishedAt (rode "
                             "'python3 tools/editorial.py launch --date AAAA-MM-DD'):\n  " + "\n  ".join(missing))

    lastmod_path = os.path.join(root, LASTMOD)
    lastmod = load_json(lastmod_path) if os.path.exists(lastmod_path) else {}

    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(out)
    out_abs = os.path.abspath(out)
    for dirpath, dirnames, files in os.walk(root):
        rel_dir = os.path.relpath(dirpath, root).replace(os.sep, "/")
        rel_dir = "" if rel_dir == "." else rel_dir + "/"
        keep = []
        for d in sorted(dirnames):
            full = os.path.abspath(os.path.join(dirpath, d))
            url = "/" + rel_dir + d + "/"
            if full == out_abs or (not rel_dir and d in EXCLUDED_DIRS) or d in ("__pycache__", ".git"):
                continue
            if url in site.hidden_paths or any(url.startswith(r) for r in site.hidden_roots):
                continue
            keep.append(d)
        dirnames[:] = keep
        for name in files:
            if (not rel_dir and name in EXCLUDED_FILES) or os.path.splitext(name)[1] in EXCLUDED_EXT:
                continue
            src = os.path.join(dirpath, name)
            dst = os.path.join(out, rel_dir, name)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if name.endswith(".html"):
                with open(src, encoding="utf-8") as f:
                    doc = f.read()
                doc = site.transform(page_url_path(rel_dir + name), doc)
                with open(dst, "w", encoding="utf-8", newline="\n") as f:
                    f.write(doc)
            else:
                shutil.copyfile(src, dst)

    with open(os.path.join(out, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write(site.sitemap(out, lastmod))

    headers_src = os.path.join(root, "_headers")
    if os.path.exists(headers_src):
        with open(headers_src, encoding="utf-8") as f:
            headers = f.read().replace("{{SCRIPT_HASHES}}", inline_script_hashes(out))
        with open(os.path.join(out, "_headers"), "w", encoding="utf-8", newline="\n") as f:
            f.write(headers)

    redirects = []
    redirects_src = os.path.join(root, "_redirects")
    if os.path.exists(redirects_src):
        with open(redirects_src, encoding="utf-8") as f:
            redirects.append(f.read().rstrip("\n"))
    for a in site.articles:
        if a["status"] == "archived" and a.get("redirectTo"):
            redirects.append("%s %s 301" % (a["_path"], a["redirectTo"]))
    if redirects:
        with open(os.path.join(out, "_redirects"), "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(redirects) + "\n")

    problems = check_dist(out, manifest)
    if problems:
        raise BuildError("o site gerado tem problemas:\n  " + "\n  ".join(problems))

    warnings = stale_stamps(root, manifest, lastmod)
    if not quiet:
        print("dist/ gerado: %d artigos publicados, %d URLs no sitemap"
              % (len(site.public), open(os.path.join(out, "sitemap.xml"), encoding="utf-8").read().count("<loc>")))
        for w in warnings:
            print("aviso:", w)
    return warnings


# ---------------------------------------------------------------- verificação do dist

def dist_pages(out):
    pages = {}
    for dirpath, _, files in os.walk(out):
        for name in files:
            if name.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, name), out).replace(os.sep, "/")
                with open(os.path.join(dirpath, name), encoding="utf-8") as f:
                    pages[page_url_path(rel)] = f.read()
    return pages


def exists_in(out, path):
    local = os.path.join(out, path.lstrip("/"))
    if path.endswith("/"):
        return os.path.isfile(os.path.join(local, "index.html"))
    return os.path.isfile(local) or os.path.isfile(os.path.join(local, "index.html"))


def check_dist(out, manifest):
    """Regras que, se quebradas, impedem o build. Os testes chamam esta função também."""
    site_url = manifest["config"]["site"].rstrip("/")
    probs = []
    pages = dist_pages(out)
    locales = manifest["config"]["locales"]
    hidden = {"/" + article_path(manifest, a) for a in manifest["articles"] if not is_public(manifest, a)}
    hidden_roots = ["/" + l["root"] for l in locales.values() if not l["enabled"] and l["root"]]

    for path in hidden:
        if exists_in(out, path):
            probs.append("artigo não publicado presente no build: %s" % path)
    for r in hidden_roots:
        if os.path.exists(os.path.join(out, r.strip("/"))):
            probs.append("idioma desativado presente no build: %s" % r)

    canon_owner = {}
    alt_map = {}
    for path, doc in sorted(pages.items()):
        live = re.sub(r"<!--.*?-->", "", doc, flags=re.S)
        if "/underneath/" in live:
            probs.append("%s: caminho do GitHub Pages (/underneath/)" % path)
        canons = re.findall(r'<link rel="canonical" href="([^"]+)"', live)
        if path.endswith("/") and path != "/404.html":
            if len(canons) != 1:
                probs.append("%s: %d canonicals" % (path, len(canons)))
            for c in canons:
                if c in canon_owner:
                    probs.append("%s: canonical duplicado com %s (%s)" % (path, canon_owner[c], c))
                canon_owner[c] = path
                if not c.startswith(site_url + "/") or not exists_in(out, c[len(site_url):]):
                    probs.append("%s: canonical aponta para página inexistente (%s)" % (path, c))
        alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"', live)
        if alts:
            alt_map[path] = dict(alts)
        for attr, ref in re.findall(r'\b(href|src|content)="([^"]*)"', live):
            if attr == "content" and not ref.startswith(site_url):
                continue
            target = resolve(path, ref, site_url)
            if target is None:
                continue
            if target.startswith("!"):
                probs.append("%s: caminho sai da raiz do domínio: %s" % (path, ref))
            elif any(target == h or target.startswith(h) for h in hidden) or any(target.startswith(r) for r in hidden_roots):
                probs.append("%s: link para página não publicada: %s" % (path, ref))
            elif not exists_in(out, target):
                probs.append("%s: recurso inexistente: %s" % (path, ref))
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', live, re.S):
            try:
                json.loads(block)
            except ValueError as e:
                probs.append("%s: JSON-LD inválido (%s)" % (path, e))

    for path, alts in alt_map.items():
        me = site_url + path
        if me not in alts.values():
            probs.append("%s: hreflang sem autorreferência" % path)
        for lang, href in alts.items():
            target = href[len(site_url):] if href.startswith(site_url) else None
            if not target or not exists_in(out, target):
                probs.append("%s: hreflang %s aponta para página inexistente (%s)" % (path, lang, href))
                continue
            if lang != "x-default" and me not in alt_map.get(target, {}).values():
                probs.append("%s: hreflang %s sem retorno de %s" % (path, lang, target))

    for dirpath, _, files in os.walk(out):
        for name in files:
            if name.endswith(".css"):
                rel = "/" + os.path.relpath(os.path.join(dirpath, name), out).replace(os.sep, "/")
                with open(os.path.join(dirpath, name), encoding="utf-8") as f:
                    for ref in re.findall(r'url\(["\']?([^"\')]+)', f.read()):
                        t = resolve(rel, ref, site_url)
                        if t and (t.startswith("!") or not exists_in(out, t)):
                            probs.append("%s: url() inexistente: %s" % (rel, ref))

    sm_path = os.path.join(out, "sitemap.xml")
    if os.path.exists(sm_path):
        with open(sm_path, encoding="utf-8") as f:
            sm = f.read()
        locs = re.findall(r"<loc>([^<]+)</loc>", sm)
        if len(locs) != len(set(locs)):
            probs.append("sitemap com URLs duplicadas")
        for loc in locs:
            p = loc[len(site_url):] if loc.startswith(site_url) else None
            if not p or not exists_in(out, p):
                probs.append("sitemap aponta para URL sem página: %s" % loc)
            elif any(p.startswith(h) for h in hidden):
                probs.append("sitemap inclui artigo não publicado: %s" % loc)
            elif "noindex" in (re.search(r'<meta name="robots" content="([^"]*)"', pages.get(p, "")) or [None, ""])[1]:
                probs.append("sitemap inclui página noindex: %s" % loc)
        import xml.dom.minidom
        try:
            xml.dom.minidom.parseString(sm.encode("utf-8"))
        except Exception as e:
            probs.append("sitemap.xml não é XML válido (%s)" % e)
    else:
        probs.append("sitemap.xml ausente")
    return probs


# ---------------------------------------------------------------- lastmod

def source_pages(root, manifest):
    """Páginas não-artigo publicáveis, para o lastmod do sitemap."""
    s = Site(root, manifest)
    art_paths = {a["_path"] for a in s.articles}
    result = {}
    for dirpath, dirnames, files in os.walk(root):
        rel_dir = os.path.relpath(dirpath, root).replace(os.sep, "/")
        rel_dir = "" if rel_dir == "." else rel_dir + "/"
        dirnames[:] = [d for d in dirnames if not (not rel_dir and d in EXCLUDED_DIRS) and d != "__pycache__"
                       and not any(("/" + rel_dir + d + "/").startswith(r) for r in s.hidden_roots)]
        if "index.html" in files:
            path = page_url_path(rel_dir + "index.html")
            if path not in art_paths:
                result[path] = os.path.join(dirpath, "index.html")
    return result


def stale_stamps(root, manifest, lastmod):
    out = []
    for path, file in sorted(source_pages(root, manifest).items()):
        with open(file, encoding="utf-8") as f:
            h = content_hash(f.read())
        if (lastmod.get(path) or {}).get("hash") != h:
            out.append("%s mudou desde o último lastmod (rode 'python3 tools/editorial.py stamp')" % path)
    return out


def stamp(root, date):
    manifest = load_json(os.path.join(root, MANIFEST))
    path_json = os.path.join(root, LASTMOD)
    lastmod = load_json(path_json) if os.path.exists(path_json) else {}
    changed = []
    pages = source_pages(root, manifest)
    for path, file in sorted(pages.items()):
        with open(file, encoding="utf-8") as f:
            h = content_hash(f.read())
        if (lastmod.get(path) or {}).get("hash") != h:
            lastmod[path] = {"lastmod": date, "hash": h}
            changed.append(path)
    lastmod = {k: lastmod[k] for k in sorted(lastmod) if k in pages}
    save_json(path_json, lastmod)
    return changed


# ---------------------------------------------------------------- comandos

def find_articles(manifest, refs):
    found = []
    for ref in refs:
        ref = ref.strip("/").split("/")[-1]
        match = [a for a in manifest["articles"] if a["slug"] == ref]
        if not match:
            raise BuildError("artigo %r não está no manifesto" % ref)
        found.extend(match)
    return found


def today():
    return datetime.date.today().isoformat()


def main(argv=None):
    p = argparse.ArgumentParser(description="Build e publicação do site UNDERNEATH")
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build", help="gera dist/")
    b.add_argument("--out", default=os.path.join(ROOT, "dist"))
    sub.add_parser("status", help="lista os artigos")
    for name in ("publish", "update"):
        c = sub.add_parser(name)
        c.add_argument("slugs", nargs="+")
        c.add_argument("--date", default=None)
    c = sub.add_parser("launch")
    c.add_argument("--date", required=True)
    c = sub.add_parser("schedule")
    c.add_argument("slugs", nargs="+")
    c.add_argument("--planned", default=None)
    c = sub.add_parser("draft")
    c.add_argument("slugs", nargs="+")
    c = sub.add_parser("archive")
    c.add_argument("slugs", nargs="+")
    c.add_argument("--redirect", default=None)
    c = sub.add_parser("stamp")
    c.add_argument("--date", default=None)
    args = p.parse_args(argv)

    mpath = os.path.join(ROOT, MANIFEST)
    try:
        if args.cmd == "build":
            build(ROOT, args.out)
            return 0
        if args.cmd == "stamp":
            changed = stamp(ROOT, args.date or today())
            print("lastmod atualizado: %s" % (", ".join(changed) if changed else "nenhuma página mudou"))
            return 0
        manifest = load_json(mpath)
        if args.cmd == "status":
            for a in manifest["articles"]:
                print("%-10s %-6s %-11s %-11s %s" % (a["status"], a["locale"], a.get("publishedAt") or "-",
                                                    a.get("plannedDate") or "-", article_path(manifest, a)))
            return 0
        for k in ("date", "planned"):
            v = getattr(args, k, None)
            if v and not DATE_RE.match(v):
                raise BuildError("data deve ser AAAA-MM-DD")
        if args.cmd == "launch":
            arts = [a for a in manifest["articles"] if a["status"] == "published" and not a.get("publishedAt")]
        else:
            arts = find_articles(manifest, args.slugs)
        for a in arts:
            if args.cmd in ("publish", "launch"):
                a["status"] = "published"
                a["publishedAt"] = a.get("publishedAt") or args.date or today()
            elif args.cmd == "update":
                if a["status"] != "published" or not a.get("publishedAt"):
                    raise BuildError("%s ainda não foi publicado" % a["slug"])
                a["updatedAt"] = args.date or today()
            elif args.cmd == "schedule":
                if a.get("publishedAt"):
                    raise BuildError("%s já foi publicado; use archive para retirar" % a["slug"])
                a["status"] = "scheduled"
                a["plannedDate"] = args.planned or a.get("plannedDate")
            elif args.cmd == "draft":
                if a.get("publishedAt"):
                    raise BuildError("%s já foi publicado; use archive para retirar" % a["slug"])
                a["status"] = "draft"
            elif args.cmd == "archive":
                a["status"] = "archived"
                if args.redirect:
                    a["redirectTo"] = args.redirect
        errors = validate_manifest(manifest, ROOT)
        if errors:
            raise BuildError("\n  ".join(errors))
        save_json(mpath, manifest)
        for a in arts:
            print("%s: %s%s" % (a["slug"], a["status"], " em " + a["publishedAt"] if a.get("publishedAt") else ""))
        print("Agora rode 'python3 tools/editorial.py build' para conferir, faça commit e push.")
        return 0
    except BuildError as e:
        print("ERRO: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
