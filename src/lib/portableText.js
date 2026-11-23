// تحويل نصّ Sanity (Portable Text) إلى HTML بقواعد القوالب المعتمدة.
// يعيد أيضاً عناوين المحاور (لجداول المحتويات) والهوامش (للدراسات).

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeHref = (h = '') => (/^(https?:|mailto:|\/|#)/i.test(h) ? h : '#');

export function renderBody(blocks = [], opts = {}) {
  const { numberH2 = false, inlineAdAfter = 0, adHtml = '' } = opts;
  const out = [];
  const headings = [];
  const footnotes = [];
  let list = null;
  let paraCount = 0;
  let adDone = !inlineAdAfter || !adHtml;
  let axis = 0;

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  const spans = (block) => {
    const defs = Object.fromEntries((block.markDefs || []).map((d) => [d._key, d]));
    return (block.children || [])
      .map((child) => {
        let html = esc(child.text || '').replace(/\n/g, '<br>');
        let note = '';
        for (const m of child.marks || []) {
          if (m === 'strong') html = `<strong>${html}</strong>`;
          else if (m === 'em') html = `<em>${html}</em>`;
          else if (m === 'underline') html = `<u>${html}</u>`;
          else if (m === 'strike-through') html = `<s>${html}</s>`;
          else if (m === 'mark') html = `<mark class="pt-mark">${html}</mark>`;
          else if (m === 'big' || m === 'small' || /^c-(red|blue|green|gray)$/.test(m)) html = `<span class="pt-${m}">${html}</span>`;
          else if (defs[m]?._type === 'link') {
            const ext = /^https?:/i.test(defs[m].href || '');
            html = `<a href="${esc(safeHref(defs[m].href))}"${ext ? ' target="_blank" rel="noopener"' : ''}>${html}</a>`;
          } else if (defs[m]?._type === 'footnote') {
            footnotes.push(defs[m].text || '');
            const n = footnotes.length;
            note = `<sup class="fn"><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`;
          }
        }
        return html + note;
      })
      .join('');
  };

  for (const b of blocks) {
    if (b._type === 'block') {
      const style = b.style || 'normal';
      if (b.listItem) {
        const tag = b.listItem === 'number' ? 'ol' : 'ul';
        if (list !== tag) {
          closeList();
          out.push(`<${tag} class="prose-list">`);
          list = tag;
        }
        out.push(`<li>${spans(b)}</li>`);
        continue;
      }
      closeList();
      const inner = spans(b);
      if (style === 'h2') {
        const id = `s${headings.length + 1}`;
        const text = (b.children || []).map((c) => c.text).join('');
        headings.push({ id, text });
        const isIntro = /^مقدّ?مة/.test(text.trim());
        if (!isIntro) axis++;
        headings[headings.length - 1].n = isIntro ? null : axis;
        const num = numberH2 && !isIntro ? `<span class="axis-n">${axis}</span>` : '';
        out.push(`<h2 id="${id}" class="prose-h2">${num}${inner}</h2>`);
      } else if (style === 'h3') {
        out.push(`<h3 class="prose-h3">${inner}</h3>`);
      } else if (style === 'h4') {
        out.push(`<h4 class="prose-h4">${inner}</h4>`);
      } else if ((style === 'lead' || style === 'small') && inner.trim()) {
        out.push(`<p class="prose-p prose-${style}">${inner}</p>`);
        paraCount++;
      } else if (style === 'blockquote') {
        out.push(`<blockquote class="pull">${inner}</blockquote>`);
      } else if (inner.trim()) {
        out.push(`<p class="prose-p">${inner}</p>`);
        paraCount++;
        if (!adDone && paraCount === inlineAdAfter) {
          out.push(adHtml);
          adDone = true;
        }
      }
    } else if (b._type === 'image' && b.url) {
      closeList();
      out.push(
        `<figure class="fig"><img src="${esc(b.url)}?w=1200&auto=format" alt="${esc(b.alt || '')}" loading="lazy">` +
          (b.caption || b.credit ? `<figcaption>${esc(b.caption || '')}${b.credit ? ` · ${esc(b.credit)}` : ''}</figcaption>` : '') +
          `</figure>`
      );
    } else if (b._type === 'evidence') {
      closeList();
      out.push(
        `<figure class="doc-fig"><span class="doc-label">${esc(b.label || 'وثيقة')}</span>` +
          (b.url ? `<img src="${esc(b.url)}?w=1200&auto=format" alt="${esc(b.alt || '')}" loading="lazy">` : '') +
          `<figcaption>${esc(b.caption || '')}</figcaption></figure>`
      );
    } else if (b._type === 'chart') {
      closeList();
      out.push(
        `<figure class="chart-fig"><span class="chart-title">${esc(b.title || '')}</span>` +
          (b.url ? `<img src="${esc(b.url || '')}" alt="${esc(b.title || '')}" loading="lazy">` : '') +
          (b.source ? `<figcaption>المصدر: ${esc(b.source)}</figcaption>` : '') +
          `</figure>`
      );
    } else if (b._type === 'embed' && b.url) {
      closeList();
      const yt = youtubeId(b.url);
      if (yt) out.push(`<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(b.title || 'فيديو')}" allowfullscreen loading="lazy"></iframe></div>`);
    }
  }
  closeList();
  return { html: out.join('\n'), headings, footnotes: footnotes.map(esc) };
}

export function youtubeId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
