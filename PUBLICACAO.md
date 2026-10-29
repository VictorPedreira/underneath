# Publicação do site UNDERNEATH

O repositório guarda todas as páginas, inclusive artigos ainda não liberados. O site que vai ao ar é gerado na pasta `dist/` pelo comando de build, que copia só o que pode ser publicado e monta, a partir do manifesto `content/editorial.json`:

- a listagem do blog (PT e EN) e o bloco "Continue lendo" de cada artigo;
- os `hreflang` entre traduções (só entre versões publicadas);
- as datas visíveis e as do JSON-LD;
- o `sitemap.xml`;
- os cabeçalhos `_headers` (com o hash do script inline da home) e o `_redirects`.

Nada disso deve ser editado à mão em `dist/`. A pasta não vai para o Git.

Precisa só de Python 3.8 ou mais novo, sem instalar nada.

## Status de um artigo

| Status | O que acontece |
|---|---|
| `draft` | Rascunho. Fica fora do site: a URL dá 404, não entra no sitemap, no blog, nos relacionados nem nos hreflang. |
| `scheduled` | Programado. Igual ao rascunho; `plannedDate` é só referência. **Nada é publicado sozinho pela data.** |
| `published` | No ar a partir do próximo deploy. |
| `archived` | Retirado. Sai do site; com `redirectTo`, a URL antiga redireciona (301), sem ele dá 404. |

O espanhol está desativado em `config.locales`: a pasta `es/` inteira fica fora do build, e o build recusa publicar artigo em idioma desativado.

## Liberar um artigo novo

1. Escreva o artigo na pasta do blog (`blog/<slug>/index.html` ou `en/blog/<slug>/index.html`), seguindo a estrutura dos existentes (H1, `post-cat`, `--accent` no `<body>`, meta description, tempo de leitura no `post-meta`). As capas ficam em `assets/images/blog/<capa>.webp`, `.jpg` e `<capa>-card.webp`.
2. Inclua o artigo no manifesto com `"status": "draft"`. O build se recusa a rodar se existir uma pasta de artigo fora do manifesto, para nada ir ao ar por esquecimento.
3. Quando a publicação for aprovada:

   ```
   python3 tools/editorial.py publish <slug>
   python3 tools/editorial.py build
   ```

   O `publish` muda o status para `published` e grava a data de hoje como `publishedAt`; use `--date AAAA-MM-DD` se a publicação for em outro dia. Para publicar a versão PT e a EN juntas, passe os 2 slugs.
4. Faça commit e push para `main`. O Cloudflare Pages gera e publica o site.

Card do blog, "Continue lendo", hreflang com a tradução, sitemap e JSON-LD se atualizam sozinhos.

## Outros comandos

```
python3 tools/editorial.py status                       # lista artigos, status e datas
python3 tools/editorial.py schedule <slug> --planned 2026-11-12
python3 tools/editorial.py draft <slug>                 # volta para rascunho (só se nunca foi publicado)
python3 tools/editorial.py update <slug>                # registra atualização relevante (mostra "Atualizado em")
python3 tools/editorial.py archive <slug> --redirect /blog/
python3 tools/editorial.py launch --date 2026-11-03     # dia do lançamento: data em todos os publicados sem data
python3 tools/editorial.py stamp                        # atualiza o lastmod das páginas institucionais que mudaram
python3 -m unittest discover -s tests                   # testes
```

Use `update` só para mudança relevante de conteúdo; correção de digitação não precisa.

## Campos do manifesto

| Campo | Uso |
|---|---|
| `slug`, `locale` | Definem o endereço: `blog/<slug>/` (pt-BR) ou `en/blog/<slug>/` (en). |
| `status` | `draft`, `scheduled`, `published` ou `archived`. |
| `plannedDate` | Data prevista, só para planejamento. |
| `publishedAt`, `updatedAt` | Datas reais. Preenchidas pelos comandos `publish`, `launch` e `update`. |
| `translationGroup` | Liga as traduções de um mesmo artigo (gera os hreflang). |
| `featured` | Artigo em destaque no topo do blog (1 por idioma). |
| `cover` | Nome-base das imagens de capa em `assets/images/blog/`. |
| `related` | Grupos sugeridos para o "Continue lendo"; se algum não estiver publicado, o build completa com o mais recente. |
| `excerpt` | Opcional: resumo do card quando ele não é igual à meta description. |
| `redirectTo` | Só para `archived`: destino do 301. |

## Datas e lastmod

- Artigos: o sitemap usa `updatedAt` ou, se não houver, `publishedAt`.
- Demais páginas: `content/lastmod.json` guarda a data e um hash do texto de cada página. Depois de mudar o texto de uma página, rode `stamp`; o build avisa quando esqueceu.

## Trava de produção

No Cloudflare, o build do branch de produção (`main`) falha se algum artigo publicado estiver sem `publishedAt`. Isso garante que nenhum artigo vá ao ar sem a data real. Nas prévias (outros branches) o build passa e mostra os artigos sem data.

## Cloudflare Pages

| Configuração | Valor |
|---|---|
| Branch de produção | `main` |
| Comando de build | `python3 tools/editorial.py build` |
| Diretório de saída | `dist` |
| Variável de ambiente | `PYTHON_VERSION` = `3.12` |

O `404.html` da raiz é servido automaticamente para endereços inexistentes, com status 404.
