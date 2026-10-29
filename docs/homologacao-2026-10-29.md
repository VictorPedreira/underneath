# Homologação pré-lançamento — UNDERNEATH

**Data:** 29/10/2026 · **Branch:** `homologacao-cloudflare` · **Base:** `main` em `065a331`

**Veredito: GO para integrar ao Cloudflare Pages**, seguindo o plano da seção E. Não há bloqueio técnico. O lançamento depende de 3 passos operacionais, todos na seção E: fixar a data real dos artigos, levar o DNS para o Cloudflare preservando o e-mail e desativar o GitHub Pages.

## A. Auditoria

| # | Problema | Evidência | Arquivos | Sev. | Situação |
|---|---|---|---|---|---|
| 1 | Não havia separação entre o repositório e o site publicado: publicar a raiz levaria ao ar rascunhos e a versão em espanhol, e o sitemap era mantido à mão. | O site era servido direto da raiz; `es/` e `sitemap.xml` manual no repositório. | — | P0 | **Corrigido**: manifesto + build que gera `dist/` só com o que pode ir ao ar (seção C). |
| 2 | O GitHub Pages está ativo e público, servindo o repositório inteiro, inclusive `/es/`. É uma homologação aberta. | `https://victorpedreira.github.io/underneath/` responde 200; API do GitHub: `has_pages: true`. | Configuração do GitHub | P1 | **Pendente (ação no GitHub)**: desativar em Settings → Pages quando o Cloudflare estiver no ar. |
| 3 | Datas de publicação de artigos que nunca foram ao ar (25/10). Nas versões em inglês, `dateModified` ficou em 25/10, embora tenham sido editadas em 28 e 29/10. | JSON-LD e `post-meta` dos 10 artigos. | `blog/*`, `en/blog/*` | P1 | **Corrigido**: as datas vêm do manifesto e serão a do lançamento real. Uma trava impede o build de produção sem elas. |
| 4 | Animações não respeitavam `prefers-reduced-motion`: abertura de 5 s da home, órbitas em SVG, radar, iceberg, ícones do blog e símbolo do Sobre continuavam animados. | Só `contato.css` e o morph da home tratavam a preferência. | `assets/css/global.css`, `home.css`, `home.js` | P1 | **Corrigido**: com redução de movimento, a abertura é pulada, as órbitas congelam e as animações CSS vão direto ao estado final. Sem a preferência, nada muda (testado). |
| 5 | Sem cabeçalhos de segurança. | Nenhum `_headers`. | `_headers` | P1 | **Corrigido**: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, HSTS e `noindex` em `*.pages.dev`. A CSP libera só o próprio domínio e o Web3Forms; o hash do script inline da home é calculado no build. |
| 6 | Páginas em inglês de Método e Cases pulavam de H1 para H3. As versões em português já usavam H2. | Auditoria no navegador: 6 páginas. | `en/method/`, `en/cases/` e os 4 cases | P2 | **Corrigido**: H2 com as mesmas classes do português. O estilo computado é idêntico ao anterior. |
| 7 | Texto de exemplo da busca simulada com contraste 2,64:1 (mínimo 4,5:1). | Lighthouse em `/respostas/`. | `respostas/respostas.css` | P2 | **Corrigido**: `#9AA0A6` passou a `#70757A`, com contraste de 4,65:1. Vale para PT e EN. |
| 8 | `BlogPosting` da listagem em inglês sem `@id`. | JSON-LD de `/en/blog/`. | `en/blog/index.html` | P2 | **Corrigido**: a listagem é gerada pelo build. |
| 9 | 3 títulos de artigos em inglês têm 79 a 88 caracteres e devem ser cortados nos resultados de busca. | `multimodal-search-and-social-seo`, `native-ai-hyper-personalization`, `php-flaws-and-deindexing`. | `en/blog/*` | P2 | **Pendente (aprovação editorial)**: sugestões abaixo. |
| 10 | Perfil do Instagram não verificável sem login. O do X existe (@UnderneathSI). | `instagram.com/underneathsi` devolve só a tela de login. | `assets/js/global.js` | P2 | **Pendente**: confirmar que o perfil existe e é da empresa. |
| 11 | A página 404 existe só em português. | O Cloudflare Pages serve um único `404.html`. | `404.html` | P2 | Sem correção: impacto baixo. Se quiser, dá para deixar o texto bilíngue. |
| 12 | Performance da home oscila muito em laboratório. O trabalho principal é estilo e layout das animações contínuas (abertura e órbitas), não JavaScript. | Lighthouse mobile local: nota de 55 a 90 entre rodadas iguais; CLS ≤ 0,01. | `index.html`, `en/index.html` | P2 | Sem correção: as animações fazem parte da identidade e ficam preservadas. Medir de novo no PageSpeed depois do deploy. |
| 13 | Recursos do Cloudflare que injetam scripts ou cookies podem contradizer a política de privacidade: Email Obfuscation, Web Analytics, Zaraz, Rocket Loader e Bot Fight Mode. | Vêm ligados ou sugeridos por padrão numa zona nova. | Configuração do Cloudflare | P1 | **Pendente (na integração)**: deixar desligados (seção E). |

**Sugestões de título (item 9):**

| Atual | Sugestão |
|---|---|
| Search is no longer a straight line: social SEO and multimodal search \| UNDERNEATH (82) | Social SEO and multimodal search: where buyers search \| UNDERNEATH (65) |
| Websites that adapt to every visitor: embedded AI and hyper-personalization \| UNDERNEATH (88) | Embedded AI and website hyper-personalization \| UNDERNEATH (58) |
| Alert: critical PHP flaws and the risk of disappearing from Google \| UNDERNEATH (79) | Critical PHP flaws and the risk of vanishing from Google \| UNDERNEATH (68) |

**Conferido sem problemas:**

- **Canonical:** 1 por página e sem duplicidade.
- **Metadados:** `og:url` igual ao canonical; nenhum title ou description duplicado; `og:locale` coerente com o idioma; imagens sociais existem.
- **Hreflang e seletor de idioma:** hreflang recíproco PT/EN e seletor de idioma apontando para a tradução certa.
- **JSON-LD:** válido em todas as páginas. Tipos: Organization, ProfessionalService, WebSite, WebPage, AboutPage, BreadcrumbList, Blog, BlogPosting e FAQPage. As perguntas do FAQPage estão todas no texto visível.
- **Telefones por idioma:** +55-11-93952-5622 (PT) e +55-11-94088-1109 (EN), no JSON-LD e no WhatsApp.
- **Documentos legais:** os 6 estão presentes, com razão social e CNPJ.
- **Formulário:** validação, `botcheck`, mensagens e envio, testados com a CSP ativa.
- **Navegação:** menu mobile funciona e não há rolagem horizontal a 390 px.
- **Imagens e acessibilidade básica:** nenhuma imagem quebrada ou sem `alt`, nenhum link ou campo sem nome acessível.
- **Links externos:** todos respondem. O Axios devolve 403 só para robôs.

**Privacidade:**

- Nenhuma página faz requisição a terceiros, com fontes, scripts e imagens no próprio domínio. A exceção é o envio ao Web3Forms, que só acontece quando a pessoa clica em enviar.
- Não há cookies nem `localStorage`. O `sessionStorage` usa só `langFrom` e `skipIntro`, exatamente como a política de cookies declara.
- Não há analytics nem pixels.

## B. Plano editorial

**Lançamento (semana 1): os 5 artigos prontos, em PT e EN (10 URLs).** Decisão do cliente nesta homologação: o limite de 5 se refere a 5 artigos por idioma.

| Tema | PT | EN | Intenção |
|---|---|---|---|
| GEO (destaque) | `/blog/seo-para-geo/` | `/en/blog/from-seo-to-geo/` | Informacional, com ponte para o diagnóstico |
| Zero-click | `/blog/buscas-sem-clique/` | `/en/blog/zero-click-searches/` | Informacional (queda de cliques) |
| Busca social e multimodal | `/blog/busca-multimodal-social-seo/` | `/en/blog/multimodal-search-and-social-seo/` | Informacional |
| IA embutida e personalização | `/blog/ia-nativa-hiperpersonalizacao/` | `/en/blog/native-ai-hyper-personalization/` | Informacional |
| Falhas no PHP | `/blog/falha-php-desindexacao/` | `/en/blog/php-flaws-and-deindexing/` | Alerta, dor de "sumir do Google" |

**Semanas 2 a 8: sugestão de 2 artigos por semana (1 PT e 1 EN), todos com status `proposta` e sujeitos a aprovação.**

Os temas foram separados por mercado e não são traduções automáticas. Seguindo a linha editorial, os textos explicam o que está em jogo e os sinais de alerta, e deixam o "como resolver" para o diagnóstico. Os 2 CTAs fixos são "Analisar meu site" (`/contato/`) e "Analyze my site" (`/en/contact/`).

| Sem. | Mercado | Artigo proposto | Intenção principal | Pergunta que responde | Links internos |
|---|---|---|---|---|---|
| 2 | BR | Por que meu site não aparece no Google | Informacional com intenção comercial | "Meu site está no ar, por que ninguém encontra?" | `/diagnostico/`, `/respostas/`, `seo-para-geo` |
| 2 | US/CA | Why your business website doesn't show up on Google | Informacional com intenção comercial | "My site is live, why can't customers find it?" | `/en/diagnosis/`, `/en/answers/`, `from-seo-to-geo` |
| 3 | BR | Site bonito que não gera contatos | Comercial | "Tenho visitas, por que não viram clientes?" | `/metodo/`, `/cases/`, `buscas-sem-clique` |
| 3 | US/CA | How AI Overviews decide which businesses to mention | Informacional (IA) | "Why do AI answers mention competitors and not us?" | `from-seo-to-geo`, `zero-click-searches` |
| 4 | BR | Perfil da Empresa no Google e site: por que as informações precisam bater | Local | "Por que apareço no mapa e não na busca, ou o contrário?" | `/diagnostico/`, `seo-para-geo` |
| 4 | US/CA | Website traffic that doesn't turn into leads | Comercial | "Why doesn't my traffic convert?" | `/en/method/`, `/en/cases/` |
| 5 | BR | Site novo, posições perdidas: o risco de trocar de site | Informacional, alta urgência | "Troquei o site e sumi do Google. O que aconteceu?" | `falha-php-desindexacao`, `/respostas/` |
| 5 | US/CA | Google Business Profile and your website: why consistency matters | Local | "Why do I show up on Maps but not in search?" | `/en/diagnosis/`, `from-seo-to-geo` |
| 6 | BR | Como as IAs escolhem quais empresas recomendar | Informacional (IA) | "Por que o ChatGPT recomenda o concorrente?" | `seo-para-geo`, `busca-multimodal-social-seo` |
| 6 | US/CA | Redesigns and lost rankings: what happens in a site migration | Informacional, alta urgência | "We relaunched our site and lost traffic. Why?" | `php-flaws-and-deindexing`, `/en/answers/` |
| 7 | BR | Mais páginas, menos visibilidade: conteúdo duplicado e páginas fracas | Informacional | "Publico muito e não cresço. Por quê?" | `buscas-sem-clique`, `/metodo/` |
| 7 | US/CA | Reviews, mentions and trust: what search engines and AIs look for | Informacional | "Do reviews affect whether AI recommends us?" | `from-seo-to-geo`, `/en/cases/` |
| 8 | BR | Dados estruturados: o que são e por que Google e IAs leem | Informacional | "O que são dados estruturados e por que importam?" | `seo-para-geo`, `/diagnostico/` |
| 8 | US/CA | More pages, less visibility: thin and duplicate content | Informacional | "We publish a lot, why don't we grow?" | `zero-click-searches`, `/en/method/` |

Nenhum desses textos foi escrito nesta etapa. Cada um entra no manifesto como `draft` e só vai ao ar com `publish`, depois da aprovação.

## C. Sistema de publicação

| Arquivo | Função |
|---|---|
| `content/editorial.json` | Manifesto: status, datas, traduções, destaque e relacionados de cada artigo, além dos idiomas ativos. |
| `content/lastmod.json` | `lastmod` das páginas institucionais. O valor inicial veio do histórico do Git: é a data real da última mudança de texto. |
| `tools/editorial.py` | Build e comandos editoriais. Só biblioteca padrão do Python, determinístico. |
| `tests/test_editorial.py` | 23 testes. |
| `_headers` | Cabeçalhos do Cloudflare (template). |
| `PUBLICACAO.md` | Instruções de uso. |
| `.gitignore` | Ignora `dist/`. |
| `sitemap.xml` (raiz) | **Removido**: agora é gerado no build. |

**Para liberar um artigo novo:** `python3 tools/editorial.py publish <slug>`, depois commit e push. Não é preciso editar à mão o sitemap, a home, o blog nem os relacionados.

**O que o build garante e verifica (ele falha se houver problema):**

- Artigos `draft`, `scheduled` e `archived`, assim como o espanhol, ficam fora de `dist/`: a URL responde 404, não entra no sitemap, na listagem, nos relacionados nem nos hreflang. Links no texto para esses artigos viram texto simples, e o link "Ler sobre…" da FAQ some.
- Uma tradução não publicada não aparece como hreflang. O `x-default` vai para o PT ou, sem ele, para a própria página.
- A listagem do blog, o JSON-LD `Blog` e o "Continue lendo" são gerados a partir do próprio artigo (título, categoria, cor, descrição e tempo de leitura). Para o conteúdo atual, o resultado é idêntico ao HTML que já estava homologado.
- O build verifica:
  - canonical único;
  - recursos e links internos existentes;
  - caminhos que só funcionariam num subdiretório (GitHub Pages);
  - hreflang recíproco;
  - sitemap válido e sem URLs órfãs ou `noindex`;
  - JSON-LD válido;
  - pastas de artigo fora do manifesto.
- **Trava de produção:** no branch `main` do Cloudflare, nenhum artigo vai ao ar sem `publishedAt`.
- Arquivar com `--redirect` gera um 301 no `_redirects`. Sem redirecionamento, a URL dá 404. O Cloudflare Pages não oferece 410.

**Mudança de comportamento:** o site publicado passa a ser `dist/`, e não a raiz do repositório. O `sitemap.xml` deixa de ter `priority`, que o Google ignora.

## D. Validação

| Teste | Resultado |
|---|---|
| Testes automatizados (`python3 -m unittest discover -s tests`) | **23/23 OK**. Cobrem os 9 casos do handoff, mais publicação simulada de 1 e de 2 artigos, rascunho saindo dos relacionados e da FAQ, arquivamento com 301, trava de produção, idioma desativado e build determinístico. |
| Auditoria no Chrome, desktop e celular (390 px), em 45 URLs (sitemap, app, 404, `/es/`, URL sem barra) | Nenhum erro de JS ou de CSP, nenhuma requisição com falha, nenhum host externo, nenhuma imagem quebrada, nenhuma rolagem horizontal. Os únicos achados (hierarquia EN) foram corrigidos. |
| Interação (21 verificações) | **21/21 OK**: abertura da home, `reduced-motion`, menu mobile, bandeiras de idioma, formulário PT/EN com CSP e resposta simulada do Web3Forms. Nenhum e-mail foi disparado. |
| Metadados e JSON-LD em todo o `dist/` | OK, salvo os títulos do item 9. |
| Links externos (30) | OK (Axios: 403 só para robôs). |
| Lighthouse mobile, local | Acessibilidade 100, boas práticas 100 e SEO 100 nas 6 páginas medidas (Respostas chegou a 100 depois da correção de contraste). Performance de 66 a 93, com alta variação. CLS de 0,001 a 0,08. LCP de 1,2 s a 3,8 s. |
| Build a partir de um clone limpo, com as variáveis do Cloudflare | OK em prévia. Em produção, bloqueia como previsto enquanto não houver `publishedAt`. |

**Limitações:**

- O Lighthouse rodou num servidor local sem compressão nem CDN e mostrou alta variação entre rodadas. Os números não substituem a medição no domínio final.
- Ainda não há dados de campo (CrUX): o domínio não está no ar.
- Os cabeçalhos foram testados num servidor local que imita o Cloudflare Pages. Eles, o redirecionamento do `www` e o HSTS precisam ser conferidos no domínio real.
- O formulário foi testado com resposta simulada. O envio real foi confirmado antes por você.
- Testes só no Chrome. Safari/iOS e leitores de tela não foram testados.

## E. Plano Cloudflare

**1. Projeto Pages**

- Workers & Pages → Create → Pages → Connect to Git → `VictorPedreira/underneath`.
- Branch de produção: `main`.
- Framework preset: None.
- Build command: `python3 tools/editorial.py build`.
- Output: `dist`.
- Variável `PYTHON_VERSION` = `3.12`.
- Em Settings → Deployments, deixar as prévias ligadas e proteger com o Cloudflare Access ("Enable access policy" nas prévias). O `noindex` em `*.pages.dev` já sai pelo `_headers`, mas não controla acesso.
- Até o dia do lançamento, o build de `main` falha de propósito por causa da trava de datas. Para testar antes, use a URL de prévia de um branch.

**2. DNS (cuidado com o e-mail)**

O domínio usa os nameservers do Namecheap e o e-mail `core9.email`. O Cloudflare Pages exige que o domínio-raiz seja uma zona no Cloudflare.

- Adicione `underneathsi.com` ao Cloudflare (plano Free).
- **Antes de trocar os nameservers**, confira se foram importados:
  - MX `mx1.core9.email` (prioridade 10);
  - TXT `v=spf1 include:_spf.core9.email ~all`;
  - CNAME `default._domainkey` → `default._domainkey.core9.email`, em modo **DNS only** (nuvem cinza).
- Troque os nameservers no Namecheap pelos 2 indicados pelo Cloudflare.
- Depois, teste o recebimento em contact@underneathsi.com e um envio do formulário.
- Recomendado em seguida: criar um registro DMARC (hoje não existe).

**3. Domínios**

- Pages → Custom domains → adicionar `underneathsi.com` e `www.underneathsi.com`.
- `www` → raiz: em Rules → Redirect Rules, regra "hostname igual a `www.underneathsi.com`" → `https://underneathsi.com${caminho}`, 301, preservando a query string.
- SSL/TLS: Full (strict), Always Use HTTPS ligado.
- O HSTS já sai pelo `_headers` (1 ano, sem subdomínios). Só considere `includeSubDomains`/preload depois de confirmar que todos os subdomínios usam HTTPS.

**4. Manter a política de privacidade verdadeira**

Deixar desligados na zona:

- Email Address Obfuscation (Scrape Shield), que injeta script e altera os links de e-mail;
- Web Analytics / RUM;
- Zaraz;
- Rocket Loader;
- Bot Fight Mode, que pode gravar cookie.

Se algum for ligado, a política de cookies precisa ser revista antes.

**5. Dia do lançamento**

1. `python3 tools/editorial.py launch --date AAAA-MM-DD`, com a data em que o site vai ao ar.
2. `python3 tools/editorial.py build` e `python3 -m unittest discover -s tests`.
3. Commit e push para `main`.
4. Conferir no domínio:
   - `curl -I https://underneathsi.com/`, para ver os cabeçalhos;
   - `/sitemap.xml`;
   - uma URL inexistente, que deve dar 404;
   - `www`, que deve dar 301;
   - um envio real do formulário PT e um do EN.
5. No Web3Forms, restringir o domínio a `underneathsi.com`.
6. Desativar o GitHub Pages (item 2).
7. Search Console (propriedade de domínio via TXT) e Bing Webmaster Tools: enviar o sitemap.
8. Rodar o PageSpeed Insights na home e num artigo, e o inventário de cookies e requisições no domínio real.

**Reverter:** em Pages → Deployments, qualquer deploy anterior pode ser promovido de volta com 1 clique.
