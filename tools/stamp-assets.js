/* =============================================================================
 * tools/stamp-assets.js —— 给静态资源打版本号（node tools/stamp-assets.js）
 * -----------------------------------------------------------------------------
 * 为什么需要它：
 *   GitHub Pages 对所有文件都回 `cache-control: max-age=600`（10 分钟，改不了）。
 *   push 之后浏览器可能还在用 10 分钟前缓存的 index.html 和 .js，看起来就
 *   「还是旧版本」。给资源地址挂一段内容哈希（`?v=xxxxxxxx`）之后，文件一变
 *   地址就变，浏览器只能重新下载；没变的文件地址不变，照旧走缓存。
 *
 * 做什么：
 *   1. index.html 里 `css/*.css`、`js/**\/*.js` 的 href/src 换成 `?v=<内容哈希>`
 *   2. 在 <html> 上加 `data-build="<整页构建号>"`，一眼看出线上是哪一版
 *   3. `--check`：只比对不写入；地址或构建号过期就退出码 1（部署前跑这个）
 *
 * 幂等：先剥掉旧的 `?v=` 和 `data-build`，再重新算，重复运行结果完全一样。
 * 只用 node 内置模块，不引入任何依赖。
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'index.html');
const CHECK = process.argv.indexOf('--check') >= 0;

/* href/src 指向的本地资源；已有的 ?v=… 一起吃掉，保证幂等 */
const RE_ASSET = /(href|src)="((?:css|js)\/[^"?#]+?\.(?:css|js))(\?[^"]*)?"/g;
const RE_BUILD_ATTR = /\s+data-build="[0-9a-f]{8}"/;
const RE_HTML_TAG = /<html[^>]*>/;

function md5(buf) { return crypto.createHash('md5').update(buf).digest('hex'); }

function read(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error('index.html 引用了不存在的文件：' + rel);
  return fs.readFileSync(file);
}

/* 剥掉旧的版本号 → 「干净」的 index.html */
function unstamp(html) {
  return html
    .replace(RE_ASSET, function (m, attr, url) { return attr + '="' + url + '"'; })
    .replace(RE_HTML_TAG, function (tag) { return tag.replace(RE_BUILD_ATTR, ''); });
}

function stamp(raw) {
  const rows = [];
  const html = unstamp(raw).replace(RE_ASSET, function (m, attr, url) {
    const buf = read(url);
    const hash = md5(buf).slice(0, 8);
    rows.push({ url: url, hash: hash, bytes: buf.length });
    return attr + '="' + url + '?v=' + hash + '"';
  });

  /* 构建号 = 所有资源版本 + 这份 html 的哈希：任何一处改动都会换号 */
  const id = md5(rows.map(function (r) { return r.url + ':' + r.hash; }).join('|') + '|' + html).slice(0, 8);
  return {
    html: html.replace(RE_HTML_TAG, function (tag) { return tag.replace(/>$/, ' data-build="' + id + '">'); }),
    rows: rows,
    id: id
  };
}

function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }

const raw = fs.readFileSync(ENTRY, 'utf8');
const out = stamp(raw);
const upToDate = out.html === raw;

console.log('\n静态资源版本号（' + path.relative(ROOT, ENTRY) + '）\n');
const width = out.rows.reduce(function (w, r) { return Math.max(w, r.url.length); }, 8);
out.rows.forEach(function (r) {
  console.log('  ' + r.url.padEnd(width) + '  ' + r.hash + '  ' + kb(r.bytes).padStart(9));
});
console.log('  ' + '-'.repeat(width + 24));
console.log('  ' + String(out.rows.length).padStart(width - 6) + ' 个资源，构建号 data-build="' + out.id + '"');

if (CHECK) {
  if (upToDate) {
    console.log('\nSTAMP PASS：index.html 的版本号与文件内容一致\n');
    process.exit(0);
  }
  console.log('\nSTAMP FAIL：index.html 的版本号过期了，先跑 `node tools/stamp-assets.js`\n');
  process.exit(1);
}

if (upToDate) {
  console.log('\nSTAMP OK：已经是最新，没有改动\n');
} else {
  fs.writeFileSync(ENTRY, out.html);
  console.log('\nSTAMP OK：已写入 index.html\n');
}
