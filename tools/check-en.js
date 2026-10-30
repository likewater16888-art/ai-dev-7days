/* =============================================================================
 * tools/check-en.js —— 英文覆盖自检（node tools/check-en.js）
 * -----------------------------------------------------------------------------
 * 课程正文的英文在 js/data/en/*.js，key 是「位置」（d1-l2.s0.say 这种）。
 * 语言能来回切，但漏翻不会报错（会原样显示中文），所以这里把三件事变成硬指标：
 *
 *   1. 漏翻 = 0：每个中文位置都要有英文
 *   2. 失效 = 0：登记了英文、但中文数据里已经没有这个位置（改了正文忘了改 key）
 *   3. 未译中文 = 0：英文值里不该再出现汉字（允许清单里的是刻意的字面量，
 *      例如学生自己 echo 进 README 的「# 情感分类」）
 *
 * 另外跑一遍「中文 → 英文 → 中文」，要求正文完全复原：来回切不能把原文改坏。
 * ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var js = function (rel) { return require(path.join(ROOT, 'js', rel)); };

global.window = global;
var store = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

/* 这套检查不需要真 DOM，但切语言时 i18n 会顺手刷一下静态文案，
 * 所以给一个「什么都没有」的最小 document。 */
global.document = {
  title: '',
  documentElement: { setAttribute: function () {}, getAttribute: function () { return null; } },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  getElementById: function () { return null; },
  createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {} }; }
};

/* 英文值里**允许**保留汉字的位置：学生要照抄进终端的字面量。
 * 这些串翻成英文反而会和实际跑出来的对不上，所以值就是中文原文。 */
var ALLOW_CJK = {
  'd1-l4.s2.expect': 'cat 的期望输出就是学生 echo 进去的中文',
  'd1-l4.s2.watch0': '同上，高亮的不变部分',
  'd1-g2.brief': '关卡文案里引用了要照抄的「# 情感分类」',
  'd1-g2.why0': '同上',
  'd1-c1.brief': '挑战文案里引用了要照抄的「# 实验 2」'
};

var CJK = /[\u4e00-\u9fff]/;

function boot() {
  js('util.js');
  js('i18n.js');
  js('sandbox.js');
  js('sandbox-ai.js');
  js('day.js');
  js('gate.js');
  js('progress.js');
  js('report.js');
  js('quiz.js');
  js('dict.js');
  js('data/glossary.js');
  js('data/skills.js');
  js('data/d0.js');
  ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].forEach(function (d) { js('data/' + d + '.js'); });
  ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].forEach(function (d) { js('data/quiz/' + d + '.js'); });
  js('data/en.js');

  /* 英文文件和 index.html 用同一份清单，避免「加了文件忘了引」 */
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  /* 资源地址可能带 ?v=<内容哈希>（tools/stamp-assets.js 打的），只取路径 */
  var re = /<script src="(js\/data\/en\/[^"?]+)(?:\?[^"]*)?"><\/script>/g;
  var list = [];
  var m;
  while ((m = re.exec(html))) list.push(m[1]);
  if (!list.length) throw new Error('index.html 里没有找到 js/data/en/*.js');
  list.forEach(function (rel) {
    var abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) throw new Error('index.html 引用了不存在的文件：' + rel);
    js(rel.replace(/^js\//, ''));
  });
  return list;
}

var loaded = boot();
var LX = global.LX;

var pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  NG  ' + label + (extra ? '  ->  ' + extra : '')); }
}
function nice(s) { return String(s).replace(/\s+/g, ' ').slice(0, 80); }

/* ---------------------------- 0. 机制就位 ---------------------------- */

console.log('\n[1] 英文词典机制');
ok(!!LX.EN && typeof LX.EN.add === 'function', 'js/data/en.js 提供了 LX.EN.add');
ok(typeof LX.I18N.contentSlots === 'function', 'js/i18n.js 提供 contentSlots()');
ok(!LX.DaysEN, '旧的 LX.DaysEN（只翻标题的补丁）已经删掉');
ok(loaded.length >= 2, 'index.html 至少引了两个 js/data/en/*.js', loaded.join(', '));

var slots = LX.I18N.contentSlots();
ok(slots.length > 1000, '找得到可翻译位置', String(slots.length) + ' 处');
ok(LX.EN.size() > 0, 'LX.EN 里登记了译文', String(LX.EN.size()) + ' 条');

/* ---------------------------- 1. 漏翻 ---------------------------- */

var missing = slots.filter(function (r) { return !r.en; });

console.log('\n[2] 覆盖率');
var total = 0, done = 0;
slots.forEach(function (r) { total += r.zh.length; if (r.en) done += r.zh.length; });
console.log('  位置 ' + (slots.length - missing.length) + '/' + slots.length +
  '，字数 ' + done + '/' + total +
  '（' + Math.round(done / total * 100) + '%）');

/* 按页统计，方便逐页补译 */
var groups = {};
slots.forEach(function (r) {
  var g = r.key.split(/[.|-]/)[0];
  if (g === 'gl') g = 'glossary';
  else if (g === 'q') g = 'quiz';
  else if (g === 'sk') g = 'skills';
  groups[g] = groups[g] || { n: 0, miss: 0 };
  groups[g].n++;
  if (!r.en) groups[g].miss++;
});
Object.keys(groups).forEach(function (g) {
  var s = groups[g];
  var flag = s.miss ? '  <- 还缺 ' + s.miss : '';
  console.log('  ' + (g + '        ').slice(0, 9) + (s.n - s.miss) + '/' + s.n + flag);
});

ok(missing.length === 0, '漏翻的位置为 0', missing.length + ' 处，例如：' +
  missing.slice(0, 5).map(function (r) { return r.key + ' = ' + nice(r.zh); }).join(' | '));

/* ---------------------------- 2. 失效 key ---------------------------- */

var live = {};
slots.forEach(function (r) { live[r.key] = true; });
var stale = Object.keys(LX.EN.all()).filter(function (k) { return !live[k]; });

console.log('\n[3] 失效条目');
ok(stale.length === 0, '登记的 key 都能对上中文数据', stale.length + ' 条，例如：' +
  stale.slice(0, 5).map(function (k) { return k + ' = ' + nice(LX.EN.get(k)); }).join(' | '));

/* ---------------------------- 3. 英文里不留汉字 ---------------------------- */

var cjk = [];
slots.forEach(function (r) {
  if (!r.en || !CJK.test(r.en)) return;
  if (ALLOW_CJK[r.key]) return;
  cjk.push(r.key + ' = ' + nice(r.en));
});

console.log('\n[4] 英文值里没有残留汉字');
ok(cjk.length === 0, '除允许清单外的英文值不含汉字', cjk.length + ' 条，例如：' +
  cjk.slice(0, 5).join(' | '));

/* ---------------------------- 4. 来回切能复原 ---------------------------- */

console.log('\n[5] 中英来回切换');
function snap() {
  return JSON.stringify({
    days: LX.Days.all(),
    start: LX.Start,
    quiz: LX.QuizData,
    glossary: LX.Glossary,
    skills: LX.Skills
  });
}
var before = snap();

LX.I18N.setLang('en', { persist: false, notify: false });
ok(LX.I18N.isEn(), '切到英文');
ok(LX.Days.get('d1').title === 'Project foundations: read the map, then build the house',
  '英文界面下 Day1 标题是英文', LX.Days.get('d1').title);

LX.I18N.setLang('zh', { persist: false, notify: false });
ok(snap() === before, '切回中文后所有正文与切换前完全一致');

LX.I18N.setLang('en', { persist: false, notify: false });
LX.I18N.setLang('zh', { persist: false, notify: false });
ok(LX.Days.get('d1').lessons[0].body.indexOf('进任何一台机器') >= 0,
  '连切两次仍然复原', nice(LX.Days.get('d1').lessons[0].body));

console.log('\n' + (fail ? 'EN FAIL' : 'EN PASS') + '：' + pass + ' 通过 / ' + fail + ' 失败\n');
process.exit(fail ? 1 : 0);
