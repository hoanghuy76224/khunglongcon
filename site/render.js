/* Sinh index.html từ site/template.html + site/content.json.
   Chạy được cả trong trình duyệt (admin.html) lẫn Node (site/build.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DinoRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FONT_WEIGHTS = {
    serif: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
    sans: 'wght@300;400;500;600;700',
  };
  // Các font đều có đủ dấu tiếng Việt trên Google Fonts
  const SERIF_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Lora', 'EB Garamond', 'Noto Serif'];
  const SANS_FONTS = ['Inter', 'Be Vietnam Pro', 'Montserrat', 'Roboto', 'Nunito'];

  const THEME_COLORS = {
    accent: '#C5A880', accentDeep: '#AA8B56', ink: '#1A1613',
    paper: '#FAF8F5', soft: '#F5F2EB', muted: '#5A524C',
  };

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Chuỗi nằm trong selectTemplate('...') của thuộc tính onclick
  const jsAttr = (v) => esc(String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' '));

  // Link chỉ cho http(s), mailto, tel, neo trong trang
  const safeUrl = (v) => {
    const s = String(v == null ? '' : v).trim();
    return /^(https?:|mailto:|tel:|#)/i.test(s) ? esc(s) : '#';
  };

  const domainOf = (url) => {
    const m = String(url || '').match(/^https?:\/\/([^/?#]+)/i);
    return m ? esc(m[1]) : esc(url);
  };

  /* Cú pháp chữ trong admin: **đậm**, *nghiêng nhấn màu*, __đậm màu nhấn__, xuống dòng = <br> */
  function rich(text, tags) {
    let s = esc(text);
    const t = tags || {};
    s = s.replace(/\*\*(.+?)\*\*/g, (_, x) => (t.bold ? t.bold.replace('$', () => x) : `<b>${x}</b>`));
    s = s.replace(/__(.+?)__/g, (_, x) => (t.gold ? t.gold.replace('$', () => x) : `<b>${x}</b>`));
    s = s.replace(/\*(.+?)\*/g, (_, x) => (t.em ? t.em.replace('$', () => x) : `<i>${x}</i>`));
    return s.replace(/\r?\n/g, ' <br>');
  }

  function parse(template) {
    const blocks = {};
    const shell = template.replace(/<!--@block (\w+)-->\n([\s\S]*?)\n<!--@end-->\n?/g, (_, name, body) => {
      blocks[name] = body;
      return '';
    });
    return { shell, blocks };
  }

  const fill = (str, map) => str.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m));

  function fontHref(serif, sans) {
    const fam = (name, w) => `family=${name.replace(/ /g, '+')}:${w}`;
    return `https://fonts.googleapis.com/css2?${fam(serif, FONT_WEIGHTS.serif)}&${fam(sans, FONT_WEIGHTS.sans)}&display=swap`;
  }

  function applyTheme(html, theme) {
    const map = {};
    Object.keys(THEME_COLORS).forEach((k) => {
      if (theme[k] && /^#[0-9a-f]{6}$/i.test(theme[k])) map[THEME_COLORS[k].toLowerCase()] = theme[k];
    });
    if (!Object.keys(map).length) return html;
    const re = new RegExp(Object.keys(map).join('|'), 'gi');
    return html.replace(re, (m) => map[m.toLowerCase()] || m);
  }

  const featureClass = {
    normal: 'flex items-center gap-2',
    strong: 'flex items-center gap-2 font-medium text-[#1A1613] dark:text-[#FAF8F5]',
    gold: 'flex items-center gap-2 font-semibold text-[#AA8B56]',
  };

  function render(template, c) {
    const { shell, blocks: b } = parse(template);
    const items = (c.templates.items || []).filter((t) => t.visible !== false);
    const inlineStrong = '<strong class="text-[#1A1613] dark:text-white font-semibold">$</strong>';

    const sections = {
      hero() {
        const h = c.hero;
        return fill(b.hero, {
          eyebrowIcon: esc(h.eyebrowIcon), eyebrow: esc(h.eyebrow),
          title: rich(h.title, { em: '<span class="italic text-[#C5A880]">$</span>' }),
          subtitle: rich(h.subtitle),
          noteTitle: esc(h.noteTitle),
          noteText: rich(h.noteText, { bold: '<span class="font-semibold text-[#1A1613] dark:text-[#FAF8F5]">$</span>' }),
          ctaPrimary: esc(h.ctaPrimary), ctaSecondary: esc(h.ctaSecondary), hint: esc(h.hint),
          firstUrl: items[0] ? safeUrl(items[0].url) : 'about:blank',
          tabs: items.map((t, i) => fill(b.tab, {
            id: esc(t.id), tab: esc(t.tab || t.title), tabClass: i === 0 ? b.tabActive : b.tabNormal,
          })).join('\n'),
        });
      },
      about() {
        const a = c.about;
        return fill(b.about, {
          tag: esc(a.tag), quote: esc(a.quote), note: esc(a.note),
          paragraphs: (a.paragraphs || []).map((p) => fill(b.para, {
            text: rich(p.text, { bold: inlineStrong, gold: '<strong class="text-[#AA8B56] font-medium">$</strong>' }),
          })).join('\n'),
        });
      },
      templates() {
        const t = c.templates;
        return fill(b.templates, {
          title: esc(t.title), subtitle: esc(t.subtitle),
          cards: items.map((i) => fill(b.card, {
            id: esc(i.id), domain: domainOf(i.url), url: safeUrl(i.url),
            previewBg: i.darkPreview ? 'bg-black' : 'bg-white',
            badge: esc(i.badge), title: esc(i.title), description: esc(i.description),
            selectName: jsAttr(i.selectName || i.title),
          })).join('\n\n'),
        });
      },
      services() {
        const s = c.services;
        return fill(b.services, {
          title: esc(s.title), subtitle: esc(s.subtitle),
          items: (s.items || []).map((i) => fill(b.serviceItem, {
            icon: esc(i.icon), title: esc(i.title), description: esc(i.description),
          })).join('\n'),
        });
      },
      process() {
        const p = c.process;
        const list = p.items || [];
        return fill(b.process, {
          title: esc(p.title), subtitle: esc(p.subtitle),
          items: list.map((i, n) => fill(n === list.length - 1 ? b.processLast : b.processItem, {
            num: String(n + 1).padStart(2, '0'), title: esc(i.title), description: esc(i.description),
          })).join('\n'),
        });
      },
      pricing() {
        const p = c.pricing;
        const plans = p.plans || [];
        return fill(b.pricing, {
          title: esc(p.title), subtitle: esc(p.subtitle), note: esc(p.note),
          gridClass: plans.length >= 3 ? 'md:grid-cols-3 max-w-6xl' : 'md:grid-cols-2 max-w-4xl',
          plans: plans.map((pl, n) => fill(pl.featured ? b.planFeatured : b.plan, {
            reveal: n % 2 ? 'reveal-right' : 'reveal-left',
            name: esc(pl.name), tagline: esc(pl.tagline), price: esc(pl.price), unit: esc(pl.unit),
            ctaLabel: esc(pl.ctaLabel), selectName: jsAttr(pl.selectName || pl.name),
            badgeHtml: pl.badge ? fill(pl.featured ? b.badgeFeatured : b.badgeNormal, { badge: esc(pl.badge) }) : '',
            features: (pl.features || []).map((f) => `<li class="${featureClass[f.style] || featureClass.normal}">✓ ${rich(f.text)}</li>`).join('\n                            '),
          })).join('\n\n'),
        });
      },
      order() {
        const o = c.order;
        const plain = {};
        ['nameLabel', 'namePlaceholder', 'phoneLabel', 'phonePlaceholder', 'serviceLabel', 'messageLabel', 'messagePlaceholder', 'submitLabel']
          .forEach((k) => { plain[k] = esc(o[k]); });
        return fill(b.order, Object.assign(plain, {
          title: rich(o.title), description: esc(o.description), formAction: safeUrl(o.formAction),
          trust: (o.trust || []).map((t) => fill(b.trustItem, { icon: esc(t.icon), text: esc(t.text) })).join('\n'),
          options: (o.options || []).map((x) => `<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('\n                            '),
        }));
      },
    };

    const layout = (c.layout || []).filter((s) => s.visible !== false && sections[s.key]);
    const demoUrls = {};
    items.forEach((t) => { demoUrls[t.id] = t.url; });
    const th = c.theme || {};
    const fontSerif = th.fontSerif || 'Cormorant Garamond';
    const fontSans = th.fontSans || 'Inter';

    const html = fill(shell, {
      metaTitle: esc(c.meta.title), metaDescription: esc(c.meta.description),
      fontHref: fontHref(fontSerif, fontSans), fontSerif: esc(fontSerif), fontSans: esc(fontSans),
      brand: esc(c.brand), headerCta: esc(c.headerCta),
      NAV: layout.filter((s) => s.navLabel).map((s) => fill(b.navItem, { key: s.key, label: esc(s.navLabel) })).join('\n'),
      BANNER: c.banner.visible === false ? '' : fill(b.banner, { icon: esc(c.banner.icon), text: esc(c.banner.text) }),
      SECTIONS: layout.map((s) => sections[s.key]()).join('\n\n'),
      DEMO_URLS: JSON.stringify(demoUrls).replace(/</g, '\\u003c'),
      successTitle: esc(c.order.successTitle), successText: esc(c.order.successText), successButton: esc(c.order.successButton),
      footerTagline: esc(c.footer.tagline), footerCopyright: esc(c.footer.copyright),
      messengerUrl: safeUrl(c.contact.messengerUrl), zaloUrl: safeUrl(c.contact.zaloUrl),
    });
    return applyTheme(html, th);
  }

  return { render, SERIF_FONTS, SANS_FONTS };
});
