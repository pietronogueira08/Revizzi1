# Revizzi Centro Automotivo (v2 - Tailwind)

## Stack
- **Base:** HTML5 semântico + Tailwind CSS 3.4 via CDN (`cdn.tailwindcss.com?plugins=forms,container-queries`)
- **Arquivo único:** `index.html` — tudo inline
- **CSS:** `<script id="tailwind-config">` no `<head>` com tema custom
- **JS:** `<script>` antes de `</body>` — vanilla, sem modules
- **Fontes:** Google Fonts — Bebas Neue + Inter (`display=swap`)
- **Ícones:** Material Symbols Outlined (Google CDN)
- **Modo:** Dark mode (`<html class="dark">`, `darkMode: "class"` em tailwind config)

## Design Constraints (inegociáveis)
- **Paleta:** Preto (#0C0C0C) e branco puros — sem cores de acento
- **Tipografia:**
  - Bebas Neue: Headlines/display (≥28px), sempre `uppercase`
  - Inter: Body, labels, prices
- **Border Radius:** Sempre `2px` (hardcoded: `"DEFAULT": "2px", "lg": "2px", "xl": "2px"`)
- **Transições:** Somente `opacity` e `transform`, máximo 350ms
- **Superfícies:**
  - `surface-main`: #0C0C0C (bg principal, header)
  - `surface-card`: #131313 (cards, containers)
  - `surface-container`: #201F1F (nested containers)

## Tailwind Config (theme.extend)
### Colors (30+ semânticas)
- Surface: main, card, bright, container, container-low, container-high, container-highest, dim
- Primary/Secondary: primary, secondary, tertiary (+ fixed, fixed-dim variants)
- Semantic: on-primary, on-secondary, on-tertiary, error, outline, outline-variant, border-subtle

### Typography (fontFamily + fontSize)
```
fontFamily:
  - headline-lg, display-lg, body-md, body-lg
  - price-display, label-caps, headline-xl, headline-lg-mobile

fontSize: cada um com [size, {lineHeight, letterSpacing, fontWeight}]
```

### Spacing (custom)
- `gutter`: 24px — gap padrão entre cards
- `margin-mobile`: 16px
- `margin-desktop`: 64px
- `section-padding`: 120px
- `base`: 4px

## Seções (estrutura atual)
| Elemento | Descrição |
|----------|-----------|
| `header` | Sticky navbar (logo, nav links, ícones search/person/cart com badge) |
| `main > section:1` | Hero: headline + subtitle + buttons + trust items + bg image |
| `main > section:2` | Trust strip (4 items: shipping, verified, warranty, support) |
| `main > section:3` | Categories carousel (8 categorias horizontais) |
| `main > section:4` | Featured products: 4 cards (imagem, brand, title, price, "Add to Cart") |
| `main > section:5` | Shipping banner (24h expedição, 12x card, 5% PIX) |
| `footer` | 4-col grid (brand, navigation, categories, contact) + copyright |

## JS Atual (mínimo)
```js
// Header: muda shadow em scroll > 50px
window.addEventListener('scroll', () => { ... })

// Cards: hover muda border-opacity
document.querySelectorAll('.group').forEach(card => { ... })
```

## Próximos passos
- [ ] Carrinho funcional (estado + click handlers)
- [ ] Modals para detalhe de produto
- [ ] Filtros e sort (section de produtos nova)
- [ ] Newsletter, testimonials
- [ ] Checkout flow (formulários, máscaras)
- [ ] Mobile nav (drawer)
