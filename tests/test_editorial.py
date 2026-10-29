"""Testes do build editorial. Rodar com: python3 -m unittest discover -s tests"""
import copy
import os
import re
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools"))
import editorial as E  # noqa: E402

ROOT = E.ROOT
SITE = "https://underneathsi.com"


def manifest():
    return E.load_json(os.path.join(ROOT, E.MANIFEST))


def art(m, slug):
    return next(a for a in m["articles"] if a["slug"] == slug)


def read(out, path):
    with open(os.path.join(out, path.strip("/"), "index.html") if path.endswith("/") else os.path.join(out, path.strip("/")),
              encoding="utf-8") as f:
        return f.read()


def sitemap_locs(out):
    return re.findall(r"<loc>([^<]+)</loc>", read(out, "/sitemap.xml"))


class BuildCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="underneath-test-")
        self.out = os.path.join(self.tmp, "dist")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def build(self, m, env=None):
        return E.build(ROOT, self.out, manifest=m, env=env or {}, quiet=True)


class TestCurrentSite(BuildCase):
    def test_build_valido_e_artigos_publicados(self):
        m = manifest()
        self.build(m)
        public = [a for a in m["articles"] if E.is_public(m, a)]
        for a in public:
            self.assertTrue(os.path.isfile(os.path.join(self.out, E.article_path(m, a), "index.html")), a["slug"])
            self.assertIn(SITE + "/" + E.article_path(m, a), sitemap_locs(self.out))

    def test_espanhol_fora_do_build(self):
        self.build(manifest())
        self.assertFalse(os.path.exists(os.path.join(self.out, "es")))
        self.assertFalse(any("/es/" in loc for loc in sitemap_locs(self.out)))
        for path, doc in E.dist_pages(self.out).items():
            self.assertNotIn('hreflang="es', doc, path)

    def test_arquivos_internos_fora_do_build(self):
        self.build(manifest())
        for name in ("tools", "tests", "content", ".git", "PUBLICACAO.md", ".gitignore"):
            self.assertFalse(os.path.exists(os.path.join(self.out, name)), name)

    def test_build_deterministico(self):
        m = manifest()
        self.build(m)
        first = {p: d for p, d in E.dist_pages(self.out).items()}
        sm1 = read(self.out, "/sitemap.xml")
        self.build(m)
        self.assertEqual(first, E.dist_pages(self.out))
        self.assertEqual(sm1, read(self.out, "/sitemap.xml"))

    def test_telefones_por_idioma(self):
        self.build(manifest())
        pt, en = read(self.out, "/"), read(self.out, "/en/")
        self.assertIn("+55-11-93952-5622", pt)
        self.assertIn("+55-11-94088-1109", en)
        with open(os.path.join(self.out, "assets/js/global.js"), encoding="utf-8") as f:
            js = f.read()
        self.assertIn("wa.me/5511939525622", js)
        self.assertIn("wa.me/5511940881109", js)

    def test_documentos_legais_presentes(self):
        self.build(manifest())
        for p in ("/privacidade/", "/termos/", "/cookies/", "/en/privacy/", "/en/terms/", "/en/cookies/"):
            self.assertIn(SITE + p, sitemap_locs(self.out))
            self.assertIn("52.090.660/0001-04", read(self.out, p), p)

    def test_csp_libera_script_inline_da_home(self):
        self.build(manifest())
        headers = read(self.out, "/_headers")
        self.assertNotIn("{{SCRIPT_HASHES}}", headers)
        self.assertIn("'sha256-", headers)
        self.assertIn("https://api.web3forms.com", headers)

    def test_lastmod_em_dia(self):
        m = manifest()
        stale = E.stale_stamps(ROOT, m, E.load_json(os.path.join(ROOT, E.LASTMOD)))
        self.assertEqual(stale, [], "rode python3 tools/editorial.py stamp")


class TestPublicacao(BuildCase):
    def base(self):
        """Manifesto com só GEO e zero-click publicados, para simular liberações."""
        m = manifest()
        for a in m["articles"]:
            if a["status"] == "published" and a["translationGroup"] not in ("seo-geo", "zero-click"):
                a["status"] = "scheduled"
                a["plannedDate"] = "2026-11-10"
        for a in m["articles"]:
            if a["status"] == "published":
                a["publishedAt"] = "2026-11-03"
        return m

    def assert_absent(self, m, slug):
        a = art(m, slug)
        path = "/" + E.article_path(m, a)
        self.assertFalse(os.path.exists(os.path.join(self.out, path.strip("/"))), "%s no build" % slug)
        self.assertNotIn(SITE + path, sitemap_locs(self.out))
        for page, doc in E.dist_pages(self.out).items():
            self.assertNotIn(SITE + path, doc, "%s citado em %s" % (slug, page))
            self.assertNotIn('href="%s"' % E.relative(page, path), doc, "%s linkado em %s" % (slug, page))

    def test_1_agendado_fora_do_sitemap_build_listagens(self):
        m = self.base()
        self.build(m)
        for slug in ("busca-multimodal-social-seo", "ia-nativa-hiperpersonalizacao", "falha-php-desindexacao",
                     "multimodal-search-and-social-seo", "native-ai-hyper-personalization", "php-flaws-and-deindexing"):
            self.assert_absent(m, slug)
        blog = read(self.out, "/blog/")
        self.assertEqual(len(re.findall(r'<a class="post-card', blog)), 2)
        self.assertEqual(blog.count("post-card-featured"), 1)

    def test_2_publicar_um_artigo(self):
        m = self.base()
        a = art(m, "busca-multimodal-social-seo")
        a["status"], a["publishedAt"] = "published", "2026-11-10"
        self.build(m)
        self.assertIn(SITE + "/blog/busca-multimodal-social-seo/", sitemap_locs(self.out))
        self.assertIn('href="busca-multimodal-social-seo/"', read(self.out, "/blog/"))
        # Só ele entrou: os outros agendados continuam fora.
        for slug in ("ia-nativa-hiperpersonalizacao", "falha-php-desindexacao", "multimodal-search-and-social-seo"):
            self.assert_absent(m, slug)
        # Sem a tradução publicada, não há hreflang para o inglês.
        doc = read(self.out, "/blog/busca-multimodal-social-seo/")
        self.assertNotIn('hreflang="en"', doc)
        self.assertIn('<time datetime="2026-11-10">10 de novembro de 2026</time>', doc)
        self.assertIn('"datePublished": "2026-11-10"', doc)
        # O mais recente vem logo depois do destaque na listagem.
        cards = re.findall(r'class="post-card[^"]*" href="([^"]+)"', read(self.out, "/blog/"))
        self.assertEqual(cards, ["seo-para-geo/", "busca-multimodal-social-seo/", "buscas-sem-clique/"])

    def test_3_publicar_dois_artigos(self):
        m = self.base()
        for slug in ("busca-multimodal-social-seo", "multimodal-search-and-social-seo"):
            a = art(m, slug)
            a["status"], a["publishedAt"] = "published", "2026-11-10"
        self.build(m)
        pt = read(self.out, "/blog/busca-multimodal-social-seo/")
        en = read(self.out, "/en/blog/multimodal-search-and-social-seo/")
        self.assertIn('hreflang="en" href="%s/en/blog/multimodal-search-and-social-seo/"' % SITE, pt)
        self.assertIn('hreflang="pt-BR" href="%s/blog/busca-multimodal-social-seo/"' % SITE, en)
        for slug in ("ia-nativa-hiperpersonalizacao", "falha-php-desindexacao",
                     "native-ai-hyper-personalization", "php-flaws-and-deindexing"):
            self.assert_absent(m, slug)
        self.assertEqual(len([l for l in sitemap_locs(self.out) if "/blog/" in l and not l.endswith("/blog/")]), 6)

    def test_4_rascunho_some_dos_relacionados_e_da_faq(self):
        m = manifest()
        art(m, "falha-php-desindexacao")["status"] = "draft"
        self.build(m)
        self.assert_absent(m, "falha-php-desindexacao")
        ia = read(self.out, "/blog/ia-nativa-hiperpersonalizacao/")
        self.assertEqual(ia.count('class="post-card"'), 2)  # completa com outro publicado
        self.assertNotIn("ler sobre falhas de segurança".lower(), read(self.out, "/respostas/").lower())
        # A tradução publicada perde o hreflang para o rascunho.
        self.assertNotIn('hreflang="pt-BR"', read(self.out, "/en/blog/php-flaws-and-deindexing/"))
        self.assertIn('hreflang="x-default" href="%s/en/blog/php-flaws-and-deindexing/"' % SITE,
                      read(self.out, "/en/blog/php-flaws-and-deindexing/"))

    def test_5_alterar_um_artigo_nao_publica_outros(self):
        m = self.base()
        self.build(m)
        before = set(E.dist_pages(self.out))
        a = art(m, "seo-para-geo")
        a["updatedAt"] = "2026-11-20"
        self.build(m)
        self.assertEqual(before, set(E.dist_pages(self.out)))
        self.assertIn("Atualizado em <time datetime=\"2026-11-20\">", read(self.out, "/blog/seo-para-geo/"))

    def test_6_arquivado_com_redirecionamento(self):
        m = manifest()
        a = art(m, "falha-php-desindexacao")
        a["status"], a["redirectTo"] = "archived", "/blog/"
        self.build(m)
        self.assert_absent(m, "falha-php-desindexacao")
        self.assertIn("/blog/falha-php-desindexacao/ /blog/ 301", read(self.out, "/_redirects"))

    def test_7_producao_exige_data_real(self):
        m = manifest()
        for a in m["articles"]:
            a["publishedAt"] = None if a["status"] == "published" else a["publishedAt"]
        env = {"CF_PAGES": "1", "CF_PAGES_BRANCH": "main"}
        with self.assertRaises(E.BuildError):
            self.build(m, env)
        self.build(m, {"CF_PAGES": "1", "CF_PAGES_BRANCH": "preview"})  # prévia pode
        for a in m["articles"]:
            if a["status"] == "published":
                a["publishedAt"] = "2026-11-03"
        self.build(m, env)

    def test_8_artigo_fora_do_manifesto_bloqueia(self):
        m = manifest()
        m["articles"] = [a for a in m["articles"] if a["slug"] != "seo-para-geo"]
        with self.assertRaises(E.BuildError):
            self.build(m)

    def test_9_publicar_em_idioma_desativado_bloqueia(self):
        m = manifest()
        art(m, "del-seo-al-geo")["status"] = "published"
        with self.assertRaises(E.BuildError):
            self.build(m)


class TestVerificacoes(BuildCase):
    """O verificador precisa acusar cada tipo de problema."""

    def built(self):
        self.build(manifest())
        return manifest()

    def write(self, path, text):
        with open(os.path.join(self.out, path), "w", encoding="utf-8") as f:
            f.write(text)

    def test_canonical_duplicado(self):
        m = self.built()
        doc = read(self.out, "/cases/")
        self.write("cases/index.html", doc.replace(SITE + "/cases/\"", SITE + "/metodo/\"", 1))
        self.assertTrue(any("canonical duplicado" in p for p in E.check_dist(self.out, m)))

    def test_imagem_ou_script_ausente(self):
        m = self.built()
        os.remove(os.path.join(self.out, "assets/images/blog/seo-para-geo.webp"))
        os.remove(os.path.join(self.out, "assets/js/global.js"))
        probs = E.check_dist(self.out, m)
        self.assertTrue(any("seo-para-geo.webp" in p for p in probs))
        self.assertTrue(any("global.js" in p for p in probs))

    def test_hreflang_para_traducao_inexistente(self):
        m = self.built()
        shutil.rmtree(os.path.join(self.out, "en/blog/from-seo-to-geo"))
        self.assertTrue(any("hreflang en aponta" in p for p in E.check_dist(self.out, m)))

    def test_sitemap_com_url_sem_pagina(self):
        m = self.built()
        sm = read(self.out, "/sitemap.xml").replace("</urlset>", "  <url><loc>%s/nao-existe/</loc></url>\n</urlset>" % SITE)
        self.write("sitemap.xml", sm)
        self.assertTrue(any("sem página" in p for p in E.check_dist(self.out, m)))

    def test_rascunho_copiado_por_engano(self):
        m = self.built()
        shutil.copytree(os.path.join(ROOT, "es"), os.path.join(self.out, "es"))
        art(m, "seo-para-geo")["status"] = "draft"
        probs = E.check_dist(self.out, m)
        self.assertTrue(any("idioma desativado" in p for p in probs))
        self.assertTrue(any("não publicado presente" in p for p in probs))

    def test_caminho_que_so_funciona_no_github_pages(self):
        m = self.built()
        doc = read(self.out, "/sobre/")
        self.write("sobre/index.html", doc.replace('href="../assets/css/global.css"', 'href="../../assets/css/global.css"', 1))
        self.write("metodo/index.html", read(self.out, "/metodo/").replace("</body>", '<a href="/underneath/">x</a></body>'))
        probs = E.check_dist(self.out, m)
        self.assertTrue(any("sai da raiz" in p for p in probs))
        self.assertTrue(any("GitHub Pages" in p for p in probs))


if __name__ == "__main__":
    unittest.main()
