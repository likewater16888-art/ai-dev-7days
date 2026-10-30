/* =============================================================================
 * tools/check-ui.js —— 无浏览器环境下的界面冒烟测试（node tools/check-ui.js）
 *
 * 用一套两百多行的迷你 DOM 顶上真实浏览器，把 index.html 里列出的脚本按顺序
 * 执行一遍，然后验证：路由、小节/关卡渲染、点「▶ 运行」、自动重判、
 * 切天换工作区、主题切换、快捷键、结业报告、各类重置。
 *
 * 不需要装任何依赖，也不需要开浏览器；真实交互仍建议手动过一遍。
 * ========================================================================== */
'use strict';

const fs = require('fs');
const vm = require('vm');
const ROOT = require('path').join(__dirname, '..');
const at = function (rel) { return require('path').join(ROOT, rel); };

/* ------------------------------- 迷你 DOM ------------------------------- */

function clsList(s) {
  return String(s || '').split(/\s+/).filter(Boolean);
}

function El(tag) {
  this.tagName = String(tag || 'div').toUpperCase();
  this.id = '';
  this.className = '';
  this._children = [];
  this._attrs = {};
  this._on = {};
  this._text = '';
  this._html = '';
  this.parentNode = null;
  this.value = '';
  this.scrollTop = 0;
  this.scrollHeight = 0;
  this.style = { setProperty: function (k, v) { this[k] = v; } };
  this.dataset = {};
}

Object.defineProperty(El.prototype, 'classList', {
  get: function () {
    const self = this;
    return {
      add: function (c) { const l = clsList(self.className); if (l.indexOf(c) < 0) l.push(c); self.className = l.join(' '); },
      remove: function (c) { self.className = clsList(self.className).filter(function (x) { return x !== c; }).join(' '); },
      contains: function (c) { return clsList(self.className).indexOf(c) >= 0; },
      toggle: function (c) { if (this.contains(c)) { this.remove(c); return false; } this.add(c); return true; }
    };
  }
});

Object.defineProperty(El.prototype, 'childNodes', {
  get: function () { return this._children; }
});

Object.defineProperty(El.prototype, 'textContent', {
  get: function () { return this._text; },
  set: function (v) { this._text = String(v == null ? '' : v); this._children = []; this._html = ''; }
});

Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v == null ? '' : v); this._children = []; this._text = ''; }
});

El.prototype.appendChild = function (c) {
  if (c && typeof c === 'object') { c.parentNode = this; this._children.push(c); }
  return c;
};
El.prototype.removeChild = function (c) {
  this._children = this._children.filter(function (x) { return x !== c; });
  return c;
};
El.prototype.insertBefore = function (c) { return this.appendChild(c); };
El.prototype.setAttribute = function (k, v) {
  this._attrs[k] = String(v);
  if (k === 'id') this.id = String(v);
  if (k === 'class') this.className = String(v);
  if (k === 'value') this.value = String(v);
};
El.prototype.getAttribute = function (k) {
  if (k === 'id' && this.id) return this.id;
  return Object.prototype.hasOwnProperty.call(this._attrs, k) ? this._attrs[k] : null;
};
El.prototype.removeAttribute = function (k) { delete this._attrs[k]; if (k === 'id') this.id = ''; };
El.prototype.addEventListener = function (t, f) { (this._on[t] = this._on[t] || []).push(f); };
El.prototype.removeEventListener = function (t, f) {
  this._on[t] = (this._on[t] || []).filter(function (x) { return x !== f; });
};
El.prototype.dispatch = function (t, extra) {
  const ev = Object.assign({ type: t, target: this, preventDefault: function () {}, stopPropagation: function () {} }, extra || {});
  (this._on[t] || []).slice().forEach(function (f) { f(ev); });
};
El.prototype.click = function () { this.dispatch('click'); };
El.prototype.focus = function () {};
El.prototype.blur = function () {};
El.prototype.select = function () {};
El.prototype.setSelectionRange = function () {};
El.prototype.matches = function (sel) {
  sel = String(sel).trim();
  if (!sel) return false;
  if (sel.charAt(0) === '#') return this.id === sel.slice(1) || this._attrs.id === sel.slice(1);
  if (sel.charAt(0) === '.') {
    const want = sel.split('.').filter(Boolean);
    const have = clsList(this.className);
    return want.every(function (c) { return have.indexOf(c) >= 0; });
  }
  return this.tagName === sel.toUpperCase();
};
El.prototype.querySelectorAll = function (sel) {
  const out = [];
  (function walk(node) {
    node._children.forEach(function (c) {
      if (!(c instanceof El)) return;
      if (c.matches(sel)) out.push(c);
      walk(c);
    });
  })(this);
  return out;
};
El.prototype.querySelector = function (sel) { return this.querySelectorAll(sel)[0] || null; };


/* ------------------------------ document / window ------------------------------ */

const html = fs.readFileSync(at('index.html'), 'utf8');

const docOn = {};
const document = {
  readyState: 'complete',
  title: '',
  documentElement: new El('html'),
  body: new El('body'),
  createElement: function (t) { return new El(t); },
  createDocumentFragment: function () { return new El('fragment'); },
  createTextNode: function (t) { return { nodeValue: String(t) }; },
  getElementById: function (id) { return document.body.querySelector('#' + id); },
  querySelector: function (sel) { return document.body.querySelector(sel); },
  querySelectorAll: function (sel) { return document.body.querySelectorAll(sel); },
  addEventListener: function (t, f) { (docOn[t] = docOn[t] || []).push(f); },
  removeEventListener: function (t, f) { docOn[t] = (docOn[t] || []).filter(function (x) { return x !== f; }); },
  execCommand: function () { return true; }
};

/* 按 index.html 里出现的 id 建一套静态骨架（够 app.js 取引用即可） */
[...new Set([...html.matchAll(/id="([^"]+)"/g)].map(function (m) { return m[1]; }))].forEach(function (id) {
  const el = new El('div');
  el.id = id;
  document.body.appendChild(el);
});

const winOn = {};
const sandbox = {};
vm.createContext(sandbox);
const g = vm.runInContext('this', sandbox);

g.window = g;
g.innerWidth = 1280;
g.innerHeight = 800;
g.document = document;
g.navigator = { clipboard: null };
g.localStorage = {
  _m: {},
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; },
  setItem: function (k, v) { this._m[k] = String(v); },
  removeItem: function (k) { delete this._m[k]; }
};
g.location = { hash: '', reload: function () {} };
g.scrollTo = function () {};
g.confirm = function () { return true; };
g.alert = function () {};
g.addEventListener = function (t, f) { (winOn[t] = winOn[t] || []).push(f); };
g.removeEventListener = function (t, f) { winOn[t] = (winOn[t] || []).filter(function (x) { return x !== f; }); };
g.Blob = function (parts, opts) { this.parts = parts; this.type = (opts || {}).type; };
g.URL = { createObjectURL: function () { return 'blob:smoke'; }, revokeObjectURL: function () {} };
g.requestAnimationFrame = function (fn) { return setTimeout(fn, 0); };
g.console = console;
g.setTimeout = setTimeout;
g.clearTimeout = clearTimeout;
g.setInterval = setInterval;
g.clearInterval = clearInterval;

/* ------------------------------ 加载所有脚本 ------------------------------ */

/* 资源地址形如 js/app.js?v=<内容哈希>（tools/stamp-assets.js 打的），只取路径 */
const order = [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(function (m) { return m[1]; });
order.forEach(function (f) {
  vm.runInContext(fs.readFileSync(at(f), 'utf8'), sandbox, { filename: f });
});

/* -------------------------------- 断言工具 -------------------------------- */

let pass = 0;
let fail = 0;
const failLog = [];

function ok(cond, label, extra) {
  if (cond) { pass += 1; console.log('  ok   ' + label); }
  else {
    fail += 1;
    failLog.push(label + (extra ? ' :: ' + extra : ''));
    console.log('  FAIL ' + label + (extra ? ' :: ' + extra : ''));
  }
}

const LX = g.LX;
const $ = function (sel) { return document.body.querySelector(sel); };
const $$ = function (sel) { return document.body.querySelectorAll(sel); };


/* -------------------------------- 断言 -------------------------------- */

const realGates = function () {
  return $$('.gate').filter(function (c) { return !c.classList.contains('is-challenge'); });
};

console.log('\n[1] 启动与首屏');
ok(!!LX && !!LX.Days && !!LX.Term, 'LX 命名空间与模块齐全');
ok(LX.Days.all().length === 7, '7 天课程数据已注册', String(LX.Days.all().length));
ok(LX.Days.gates().length === 21, '21 个关卡', String(LX.Days.gates().length));
ok($('#dayList')._children.length === 7, '侧栏列出 7 天', String($('#dayList')._children.length));
ok($$('.lesson').length === 5, '首屏 5 个小节卡片', String($$('.lesson').length));
ok(realGates().length === 3, '首屏 3 张关卡卡', String(realGates().length));
ok($$('.cmd-run').length > 0, '小节里有「▶ 运行」按钮');

console.log('\n[2] 点「▶ 运行」→ 命令进终端');
const termOut = $('#termOut');
const beforeBlocks = termOut._children.length;
$('.cmd-run').click();
ok(termOut._children.length > beforeBlocks, '终端多了一段输出',
  beforeBlocks + ' -> ' + termOut._children.length);
ok($('#termPanel').classList.contains('is-open'), '终端面板被打开');
ok(LX.Term.engine().scenario === 'ai-lab', '终端落在当天的工作区 ai-lab', LX.Term.engine().scenario);

console.log('\n[3] 跑完 Day1 所有示例命令 → 关卡自动变绿');
const day1 = LX.Days.get('d1');
day1.lessons.forEach(function (lesson) {
  (lesson.cmds || []).forEach(function (cmd) { LX.Term.exec(cmd, day1.scenario); });
});
const cards = realGates();
ok(cards.length === 3, '3 张关卡卡仍在', String(cards.length));
ok(cards.every(function (c) { return c.classList.contains('is-pass'); }),
  '三关全部 is-pass', cards.map(function (c) { return c.className; }).join(' | '));
ok(LX.Progress.overall().done >= 3, '进度已记录 ≥3 关', String(LX.Progress.overall().done));
ok($$('.gate-state.is-pass').length === 3, '关卡状态文案切到「已通过」');

console.log('\n[4] 切到 Day 7 → 路由 + 工作区跟着换');
g.location.hash = '#/d7';
(winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
ok($$('.lesson').length === 5, 'Day7 也渲染了 5 个小节', String($$('.lesson').length));
ok(realGates().length === 3, 'Day7 有 3 张关卡卡', String(realGates().length));
ok($$('.gate.is-challenge').length === 1, 'Day7 有 1 张闭卷挑战卡');
ok($$('.prj-item').length === 4, 'Day7 有 4 项结业项目', String($$('.prj-item').length));
ok($$('.quiz-card').length === 8, 'Day7 有 8 道自测题', String($$('.quiz-card').length));
ok(LX.Term.engine().scenario === 'ai-gpu', '终端已切到 ai-gpu', LX.Term.engine().scenario);
ok($('#termScenario').textContent.indexOf('运行与排障') >= 0, '终端标题显示「运行与排障」', $('#termScenario').textContent);

console.log('\n[5] 快捷键与主题');
const key = function (k) {
  (docOn.keydown || []).forEach(function (f) {
    f({ key: k, target: { tagName: 'BODY' }, preventDefault: function () {} });
  });
};
key('Escape');
ok(!$('#termPanel').classList.contains('is-open'), 'Esc 收起终端');
key('~');
ok($('#termPanel').classList.contains('is-open'), '~ 重新打开终端');
const theme0 = document.documentElement.getAttribute('data-theme');
$('#btnTheme').click();
ok(document.documentElement.getAttribute('data-theme') !== theme0, '主题切换生效',
  theme0 + ' -> ' + document.documentElement.getAttribute('data-theme'));

console.log('\n[6] 七天全流程（点运行 → 三关点亮）');
const runDay = function (day) {
  g.location.hash = '#/' + day.id;
  (winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
  day.lessons.forEach(function (lesson) {
    (lesson.cmds || []).forEach(function (cmd) { LX.Term.exec(cmd, day.scenario); });
  });
  const cs = realGates();
  return cs.length === 3 && cs.every(function (c) { return c.classList.contains('is-pass'); });
};
const badDays = [];
LX.Days.all().forEach(function (d) { if (!runDay(d)) badDays.push(d.id); });
ok(badDays.length === 0, '七天各自的三关都能点亮', badDays.join(','));
ok(LX.Progress.overall().done === 21, '总进度 21/21', String(LX.Progress.overall().done));
ok($$('.day-item.is-pass').length === 7, '侧栏七天全部标记通关',
  String($$('.day-item.is-pass').length));

console.log('\n[7] 结业报告');
const rep = LX.Report.render($('#reportBody'));
ok(!!rep && rep.days.length === 7, '报告汇总 7 天');
ok(LX.Report.text().indexOf('AI 应用开发 7 天') >= 0, 'Markdown 标题正确');
ok($$('.rep-day').length === 7, '报告渲染了 7 行', String($$('.rep-day').length));
$('#btnReport').click();
ok($('#reportModal').classList.contains('is-open'), '点「结业报告」打开弹层');
$('#reportClose').click();
ok(!$('#reportModal').classList.contains('is-open'), '关闭按钮生效');

console.log('\n[8] 重置');
const scNow = LX.Term.engine().scenario;
LX.Term.exec('mkdir -p ~/zz-smoke && echo hi > ~/zz-smoke/a.txt', scNow);
ok(!!LX.Term.engine().node('~/zz-smoke/a.txt'), '临时文件已建出来');
$('#termReset').click();
ok(!LX.Term.engine().node('~/zz-smoke'), '⟳ 重置单个工作区后目录清空');
ok(LX.Progress.overall().done === 21, '重置工作区不影响进度', String(LX.Progress.overall().done));
$('#btnResetAll').click();
ok(LX.Progress.overall().done === 0, '重置全部后进度清零', String(LX.Progress.overall().done));

console.log('\n[9] 内容深度：逐字拆解 / 诊所 / 小抄 / 词典');
ok($$('.step-card').length > 0, '命令卡渲染出来了', String($$('.step-card').length));
ok($$('.step-tok').length > 0, 'token 行渲染出来了', String($$('.step-tok').length));
ok($$('.clinic').length === $$('.lesson').length, '每个小节都有错误诊所',
  String($$('.clinic').length) + '/' + String($$('.lesson').length));
ok($$('.cheat').length === $$('.lesson').length, '每个小节都有小抄',
  String($$('.cheat').length) + '/' + String($$('.lesson').length));
ok(LX.Glossary.count() >= 120, '词典条目 ≥ 120', String(LX.Glossary.count()));
ok(LX.Quiz.all().length === 56, '自测题共 56 道', String(LX.Quiz.all().length));
ok(LX.Skills.count() >= 10, '能力项 ≥ 10', String(LX.Skills.count()));

const badTokens = [];
LX.Days.all().forEach(function (d) {
  d.lessons.forEach(function (l) {
    l.steps.forEach(function (s) {
      s.tokens.forEach(function (t) {
        if (!t.m) badTokens.push('无解释:' + t.t);
        if (t.ref && !LX.Glossary.get(t.ref) && !LX.Glossary.get(t.t)) badTokens.push('ref缺失:' + t.ref);
      });
    });
  });
});
ok(badTokens.length === 0, '每个 token 都有解释且 ref 能在词典里查到', badTokens.slice(0, 5).join(' | '));

console.log('\n[10] 词典抽屉与独立页');
const firstTok = $$('.tok')[0];
ok(!!firstTok, '页面上有可点的 token');
if (firstTok) firstTok.click();
ok(!!$('#dictDrawer') && $('#dictDrawer').classList.contains('is-open'), '点 token 打开词典抽屉');
ok($$('.dict-card').length > 0, '抽屉里渲染了词条', String($$('.dict-card').length));
LX.Dict.close();
ok(!$('#dictDrawer').classList.contains('is-open'), 'close() 收起抽屉');

g.location.hash = '#/dict';
(winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
const pageDict = $('#content');
ok($$('.dict-tab').length >= 7, '词典页有分组 tab', String($$('.dict-tab').length));
ok(pageDict.querySelectorAll('.dict-card').length >= 100, '词典页默认列出全部词条',
  String(pageDict.querySelectorAll('.dict-card').length));
const searchBox = pageDict.querySelector('.dict-search');
ok(!!searchBox, '词典页有搜索框');
if (searchBox) {
  searchBox.value = 'grep';
  searchBox.dispatch('input');
  const hits = pageDict.querySelectorAll('.dict-card').length;
  ok(hits > 0 && hits < 40, '搜索 grep 后结果收窄', String(hits));
}

console.log('\n[11] 自测 / 闭卷 / 项目交互');
g.location.hash = '#/d1';
(winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
const qAll = LX.Quiz.of('d1');
const q1 = $$('.quiz-card')[0];
ok(!!q1, 'Day1 有自测题');
const opts1 = q1 ? q1.querySelectorAll('.quiz-opt') : [];
ok(opts1.length === 4, '每题 4 个选项', String(opts1.length));
if (opts1[qAll[0].right]) opts1[qAll[0].right].click();
ok(LX.Progress.quizStat(qAll[0].id).ok, '答对后被记录');
ok(LX.Progress.quizSummary('d1').right === 1, '当天自测汇总 +1');

const q2 = qAll[1];
const card2 = $$('.quiz-card')[1];
const opts2 = card2 ? card2.querySelectorAll('.quiz-opt') : [];
const wrongIdx = (q2.right + 1) % 4;
if (opts2[wrongIdx]) opts2[wrongIdx].click();
ok(LX.Progress.wrongIds().indexOf(q2.id) >= 0, '答错进错题本');

const chCard = $('.gate.is-challenge');
ok(!!chCard, 'Day1 有闭卷挑战卡');
const chBtn = chCard ? chCard.querySelector('.gate-check-btn') : null;
ok(!!chBtn, '闭卷挑战有提交按钮');
if (chBtn) {
  chBtn.click();
  ok(LX.Progress.overall().done <= 21, '挑战通过与否都不改变 21 关的计数',
    String(LX.Progress.overall().done));
}

console.log('\n[12] 终端尺寸 / 全屏 / 字号');
LX.Term.open('ai-lab');
LX.Term.setSize(640, 320);
ok($('#termPanel').style.width === '640px', 'setSize 写入宽度', String($('#termPanel').style.width));
LX.Term.setFull(true);
ok($('#termPanel').classList.contains('is-full') && LX.Term.isFull(), '全屏开启');
key('Escape');
ok(!LX.Term.isFull() && $('#termPanel').classList.contains('is-open'), 'Esc 先退出全屏、不动终端');
const fs0 = LX.Progress.settings().term.fs || 13;
LX.Term.bumpFont(1);
ok((LX.Progress.settings().term.fs || 13) === fs0 + 1, '字号 +1 并持久化',
  String(LX.Progress.settings().term.fs));
LX.Term.setFull(false);

console.log('\n[13] 预备课页面');
g.location.hash = '#/start';
(winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
ok($$('.lesson').length === 3, '预备课有 3 个小节', String($$('.lesson').length));
ok($$('.step-card').length >= 8, '预备课有逐字拆解', String($$('.step-card').length));
const ph = $('#content').querySelector('.page-head');
const phH1 = ph ? ph.querySelector('h1') : null;
ok(!!phH1 && phH1.textContent.indexOf('开课前') >= 0, '预备课标题正确',
  phH1 ? phH1.textContent : 'no h1');

console.log('\n[14] 报告新增块');
const rep2 = LX.Report.build();
ok(rep2.quiz.total === 56, '报告里自测总数 56', String(rep2.quiz.total));
ok(rep2.skills.length >= 10, '报告里有能力矩阵', String(rep2.skills.length));
ok(rep2.challenges.length === 7, '报告里有 7 个闭卷挑战', String(rep2.challenges.length));
ok(!!rep2.project && rep2.project.total === 4, '报告里有结业项目 4 项');
LX.Report.render($('#reportBody'));
ok($$('.rep-stat').length === 4, '报告四宫格渲染', String($$('.rep-stat').length));
ok($$('.rep-skill').length >= 10, '能力矩阵渲染', String($$('.rep-skill').length));
ok(LX.Report.text().indexOf('能力矩阵') >= 0, 'Markdown 含能力矩阵');

console.log('\n[15] 使用说明页（#/guide）');
const goHash = function (h) {
  g.location.hash = h;
  (winOn.hashchange || []).forEach(function (f) { f({ type: 'hashchange' }); });
};
goHash('#/guide');
const gSecs = $$('.guide-sec');
ok(gSecs.length >= 8 && gSecs.length === LX.Guide.sections.length,
  '每个 guide.section 都渲染成一张卡片', String(gSecs.length));
ok(($('.guide-toc') ? $('.guide-toc').querySelectorAll('A').length : 0) === gSecs.length,
  '目录条目数 = 小节数',
  String($('.guide-toc') ? $('.guide-toc').querySelectorAll('A').length : 0));
const gH2 = gSecs.length ? gSecs[0].querySelector('h2') : null;
ok(!!gH2 && gH2.textContent.indexOf('这是什么') >= 0, '中文界面首节标题是中文',
  gH2 ? gH2.textContent : 'no h2');
ok(!!$('.guide-lang-hint'), '说明页顶部有切换语言的提示');
const gBodies = gSecs.filter(function (s) { return !!s.querySelector('.lesson-body'); }).length;
ok(gBodies === gSecs.length, '每节都有正文（Markdown 渲染）', String(gBodies));

console.log('\n[16] 中英文界面切换');
goHash('#/d1');
ok(LX.I18N.lang() === 'zh', '默认是中文界面', LX.I18N.lang());
ok(LX.Days.get('d1').title.indexOf('项目地基') >= 0, '中文界面 Day1 标题是中文',
  LX.Days.get('d1').title);
ok($('#btnLang').textContent === 'EN', '中文界面按钮显示 EN', $('#btnLang').textContent);

$('#btnLang').click();
ok(LX.I18N.lang() === 'en', '点按钮切到英文', LX.I18N.lang());
ok($('#btnLang').textContent === '中', '英文界面按钮变成「中」', $('#btnLang').textContent);
ok(document.documentElement.getAttribute('lang') === 'en', 'html 的 lang 改成 en',
  String(document.documentElement.getAttribute('lang')));
ok(document.title.indexOf(LX.I18N.t('doc.title')) >= 0, '网页标题跟着换', document.title);
ok(LX.Progress.settings().lang === 'en', '语言写进本机设置',
  String(LX.Progress.settings().lang));
ok(!/[\u4e00-\u9fff]/.test(LX.Days.get('d1').gates[0].brief), '关卡说明也换成英文',
  LX.Days.get('d1').gates[0].brief);
ok(LX.Days.get('d1').title === 'Project foundations: read the map, then build the house',
  'Day1 标题换成英文', LX.Days.get('d1').title);
ok(!/[\u4e00-\u9fff]/.test(LX.Days.get('d1').lessons[0].body), 'Day1 第 1 节正文换成英文');
ok(!/[\u4e00-\u9fff]/.test(LX.QuizData.d1[0].q), '自测题干换成英文', LX.QuizData.d1[0].q);
ok(LX.I18N.t('top.report') === 'Report', '顶栏按钮文案换成英文', LX.I18N.t('top.report'));
ok(LX.Report.text().indexOf(LX.I18N.t('md.skillsHead')) >= 0, '报告 Markdown 换成英文标题');

goHash('#/guide');
const gH2en = $$('.guide-sec').length ? $$('.guide-sec')[0].querySelector('h2') : null;
ok(!!gH2en && gH2en.textContent.indexOf('What this is') >= 0, '说明页也切成英文',
  gH2en ? gH2en.textContent : 'no h2');

goHash('#/d1');
$('#btnLang').click();
ok(LX.I18N.lang() === 'zh', '再点一次切回中文', LX.I18N.lang());
ok(LX.Days.get('d1').title.indexOf('项目地基') >= 0, 'Day1 标题复原成中文',
  LX.Days.get('d1').title);
ok(LX.Days.get('d1').lessons[0].body.indexOf('进任何一台机器') >= 0, '正文复原成中文');
ok($('#btnLang').textContent === 'EN', '按钮复原成 EN', $('#btnLang').textContent);

console.log('\n[17] 静态资源版本号（防浏览器缓存旧版）');
const buildTag = /<html[^>]*\sdata-build="([0-9a-f]{8})"[^>]*>/.exec(html);
ok(!!buildTag, 'index.html 的 <html> 上有 data-build 构建号', buildTag ? buildTag[1] : '没有');
const assetRefs = [...html.matchAll(/(?:href|src)="((?:css|js)\/[^"?#]+?\.(?:css|js))(?:\?v=([0-9a-f]{8}))?"/g)];
ok(assetRefs.length >= 40, '找得到 css/js 资源引用', String(assetRefs.length));
const noVer = assetRefs.filter(function (m) { return !m[2]; }).map(function (m) { return m[1]; });
ok(!noVer.length, '每个资源都带 ?v= 版本号（跑 node tools/stamp-assets.js）', noVer.join(', '));
const staleVer = assetRefs.filter(function (m) {
  const f = at(m[1]);
  if (!fs.existsSync(f)) return true;
  const real = require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
  return real !== (m[2] || '');
}).map(function (m) { return m[1]; });
ok(!staleVer.length, '版本号与文件内容一致（改完 js/css 要重新 stamp）', staleVer.join(', '));

console.log('\n' + (fail ? 'SMOKE FAIL' : 'SMOKE PASS') + '：' + pass + ' 通过 / ' + fail + ' 失败\n');
process.exit(fail ? 1 : 0);
