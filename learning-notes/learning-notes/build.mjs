import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const local = path => new URL(path, import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const notes = readdirSync(local('./notes/')).filter(file => file.endsWith('.json')).sort().map(file => {
  const slug = file.slice(0, -5);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === 'index') {
    throw new Error('無效筆記檔名 ' + file);
  }
  const note = JSON.parse(readFileSync(local('./notes/' + file), 'utf8'));
  for (const field of ['title', 'subtitle', 'category', 'summary']) {
    if (typeof note[field] !== 'string' || !note[field].trim()) throw new Error(file + ' 缺少 ' + field);
  }
  if (!Array.isArray(note.sections) || !note.sections.length) throw new Error(file + ' 缺少章節');
  return { ...note, slug };
});

function stepperHtml(block) {
  if (!Array.isArray(block.steps) || block.steps.length < 2) throw new Error('逐步例題至少需要兩步');
  const steps = block.steps.map((step, index) =>
    `<div data-step${index ? ' hidden' : ''}><h3 tabindex="-1">${escape(step.title)}</h3><p>${escape(step.text)}</p></div>`
  ).join('');
  return `<div class="activity" data-stepper><p class="progress" aria-live="polite" data-progress>步驟 1 / ${block.steps.length}</p>${steps}<div class="controls"><button type="button" data-prev disabled>上一步</button><button type="button" data-next>下一步</button></div></div>`;
}

function quizHtml(block) {
  if (!Array.isArray(block.questions) || !block.questions.length) throw new Error('測驗至少需要一題');
  const questions = block.questions.map((question, index) => {
    if (question.options.length < 2 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
      throw new Error('測驗選項或答案索引有誤');
    }
    const options = question.options.map((option, value) =>
      `<label class="choice"><input type="radio" name="question-${index}" value="${value}" required> <span>${escape(option)}</span></label>`
    ).join('');
    return `<fieldset data-answer="${question.answer}"><legend>${index + 1}. ${escape(question.prompt)}</legend>${options}<p class="feedback" data-feedback hidden><strong></strong> ${escape(question.explanation)}</p></fieldset>`;
  }).join('');
  return `<form class="activity" data-quiz>${questions}<div class="controls"><button type="submit">對答案</button><button type="reset">重做測驗</button></div><p class="progress" data-score role="status"></p></form>`;
}



function blockHtml(block) {
  switch (block.kind) {
    case 'stepper': return stepperHtml(block);
    case 'quiz': return quizHtml(block);
    case 'paragraph': return `<p>${escape(block.text)}</p>`;
    case 'callout': return `<p class="result">${escape(block.text)}</p>`;
    case 'code': return `<pre><code>${escape(block.text)}</code></pre>`;
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      return `<${tag}>${block.items.map(item => `<li>${escape(item)}</li>`).join('')}</${tag}>`;
    }
    case 'table': {
      const headers = block.headers.map(value => `<th scope="col">${escape(value)}</th>`).join('');
      const rows = block.rows.map(row => `<tr>${row.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('');
      return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escape(block.caption)}"><table><caption>${escape(block.caption)}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    default: throw new Error('未知的筆記區塊 ' + block.kind);
  }
}

function page(title, main) {
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><link rel="stylesheet" href="./styles.css"><script src="./interactive.js" defer></script></head>
<body><header><nav class="wrap"><a href="./index.html">學習筆記庫</a></nav></header><main class="wrap">${main}</main></body></html>`;
}

const categories = new Map();
for (const note of notes) {
  if (!categories.has(note.category)) categories.set(note.category, []);
  categories.get(note.category).push(note);
}
const index = Array.from(categories, ([category, group]) => {
  const cards = group.map(note => `<a class="card" href="./${note.slug}.html"><span>${escape(note.subtitle)}</span><h3>${escape(note.title)}</h3><p>${escape(note.summary)}</p><strong>閱讀筆記 →</strong></a>`).join('');
  return `<section class="category"><h2>${escape(category)}</h2><div class="cards">${cards}</div></section>`;
}).join('');

const pages = new Map();
pages.set('index.html', page('學習筆記庫', `<section class="hero"><div><h1>學習筆記庫</h1><p>逐步操作例題，再用小測驗確認理解。</p><a class="button" href="#notes">瀏覽筆記 ↓</a></div></section><div id="notes">${index}</div>`));
for (const note of notes) {
  const sections = note.sections.map(section => `<section><h2>${escape(section.heading)}</h2>${section.blocks.map(blockHtml).join('')}</section>`).join('');
  pages.set(note.slug + '.html', page(note.title + '｜學習筆記庫', `<article><a href="./index.html#notes">← 返回筆記索引</a><p class="subtitle">${escape(note.category)} · ${escape(note.subtitle)}</p><h1>${escape(note.title)}</h1><p class="intro">${escape(note.summary)}</p>${sections}</article>`));
}
mkdirSync(local('./docs/'), { recursive: true });
copyFileSync(local('./styles.css'), local('./docs/styles.css'));
copyFileSync(local('./interactive.js'), local('./docs/interactive.js'));
writeFileSync(local('./docs/.nojekyll'), '');
for (const [name, html] of pages) writeFileSync(local('./docs/' + name), html);
console.log('已產生首頁與 ' + notes.length + ' 篇筆記');

