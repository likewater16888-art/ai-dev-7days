/* =============================================================================
 * tools/check-course.js  —— 课程数据自检（node tools/check-course.js）
 * -----------------------------------------------------------------------------
 * 干两件事：
 *   1. 结构校验：7 天、lesson/gate id 唯一、check 类型都被 gate.js 支持
 *   2. 通关模拟：把每天所有 lesson 的 cmds 依次跑进沙盒，再判当天所有关卡，
 *      要求**全部通过** —— 这是「教材写的命令真的能过关」的唯一证据
 * ========================================================================== */
'use strict';

var ROOT = require('path').join(__dirname, '..');
var js = function (rel) { return require(ROOT + '/js/' + rel); };

global.window = global;
var store = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

js('util.js');
js('i18n.js');
js('sandbox.js');
js('sandbox-ai.js');
js('day.js');
js('gate.js');

var LX = global.LX;

/* 一个工作区一直开着：所有操作共用同一个 engine（和真实终端一致） */
var cache = {};
LX.Term = {
  engineFor: function (name) {
    if (!cache[name]) cache[name] = LX.Sandbox.create(name);
    return cache[name];
  }
};

js('progress.js');
js('report.js');
js('quiz.js');
js('data/glossary.js');
js('data/skills.js');
js('data/d1.js');
js('data/d2.js');
js('data/d3.js');
js('data/d4.js');
js('data/d5.js');
js('data/d6.js');
js('data/d7.js');
['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].forEach(function (d) { js('data/quiz/' + d + '.js'); });

var pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  NG  ' + label + (extra ? '  ->  ' + extra : '')); }
}

function nice(s) { return String(s).replace(/\s+/g, ' ').slice(0, 90); }

/* ------------------------------ 1. 结构校验 ------------------------------ */

var days = LX.Days.all();
ok(days.length === 7, '共 7 天', '实际 ' + days.length);
ok(days.map(function (d) { return d.id; }).join(',') === 'd1,d2,d3,d4,d5,d6,d7', '天 id 顺序 d1..d7');

var knownTypes = LX.Gate.types;
var lessonIds = {}, gateIds = {}, cmdCount = 0;

days.forEach(function (day) {
  ok(!!day.title && !!day.goal, day.id + ' 有 title/goal');
  ok(day.lessons.length >= 3, day.id + ' 至少 3 节', '实际 ' + day.lessons.length);
  ok(day.gates.length >= 2, day.id + ' 至少 2 关', '实际 ' + day.gates.length);
  ok((function () {
    try { return LX.Sandbox.create(day.scenario).scenario === day.scenario; } catch (err) { return false; }
  })(), day.id + ' 的 scenario 存在：' + day.scenario);

  day.lessons.forEach(function (l) {
    ok(!lessonIds[l.id], 'lesson id 唯一：' + l.id);
    lessonIds[l.id] = 1;
    ok(l.body.length > 80, l.id + ' 正文不是占位', '长度 ' + l.body.length);
    ok(!!l.title, l.id + ' 有标题');
    cmdCount += l.cmds.length;
  });

  day.gates.forEach(function (g) {
    ok(!gateIds[g.id], 'gate id 唯一：' + g.id);
    gateIds[g.id] = 1;
    ok(g.checks.length >= 1, g.id + ' 至少一条 check');
    ok(g.hints.length >= 1, g.id + ' 有关卡提示');
    ok(!!g.brief, g.id + ' 有 brief');
    g.checks.forEach(function (c) {
      ok(knownTypes.indexOf(c.t) >= 0, g.id + ' 使用已知检查类型：' + c.t);
      if (c.why === undefined) ok(false, g.id + ' 的 ' + c.t + ' 缺 why');
    });
  });
});
console.log('结构：' + days.length + ' 天 / ' + Object.keys(gateIds).length + ' 关 / ' + cmdCount + ' 条示例命令');

/* -------------------- 1.5 教学内容深度（硬门槛） -------------------- */

var G = LX.Glossary;
console.log('\n内容深度：');
var skillIds = LX.Skills.items.map(function (s) { return s.id; });
var qSeen = {};
var stepCount = 0, tokenCount = 0;

days.forEach(function (day) {
  ok(day.lessons.length >= 5, day.id + ' 至少 5 节', '实际 ' + day.lessons.length);

  day.lessons.forEach(function (l) {
    ok(l.steps.length >= 1, l.id + ' 有逐字拆解');
    ok(l.steps.length <= 7, l.id + ' 单节命令 ≤ 7 条', '实际 ' + l.steps.length);
    ok(l.clinic.length >= 2, l.id + ' 至少 2 条错误诊所', '实际 ' + l.clinic.length);
    ok(l.cheat.length >= 3, l.id + ' 至少 3 行小抄', '实际 ' + l.cheat.length);

    var bad = [];
    l.steps.forEach(function (s) {
      stepCount += 1;
      if (!s.tokens.length) bad.push(s.line + '(没拆解)');
      if (!s.expect) bad.push(s.line + '(没说该看到什么)');
      s.tokens.forEach(function (t) {
        tokenCount += 1;
        if (!t.m || t.m.length < 3) bad.push(t.t + '(解释太短)');
        if (t.ref && !G.get(t.ref)) bad.push(t.t + '(ref ' + t.ref + ' 查不到)');
      });
    });
    ok(bad.length === 0, l.id + ' 每个 token 都解释到位', bad.slice(0, 3).join(' | '));
  });

  /* 命令名必须能在词典里查到：保证"没解释的命令"不会被写进课程 */
  var unknownCmds = [];
  day.lessons.forEach(function (l) {
    l.steps.forEach(function (s) {
      var word = String(s.line).trim().split(/\s+/)[0];
      if (!word || word.charAt(0) === '#') return;
      if (!G.get(word)) unknownCmds.push(word);
    });
  });
  ok(unknownCmds.length === 0, day.id + ' 出现的命令都在词典里', unknownCmds.join(','));

  /* 自测题 */
  var qs = LX.Quiz.of(day.id);
  ok(qs.length >= 8, day.id + ' 至少 8 道自测题', '实际 ' + qs.length);
  qs.forEach(function (q) {
    ok(!qSeen[q.id], '题目 id 唯一：' + q.id);
    qSeen[q.id] = 1;
    ok(q.a.length === 4, q.id + ' 有 4 个选项', String(q.a.length));
    ok(q.right >= 0 && q.right < 4, q.id + ' 正确答案下标合法');
    ok((q.why || '').length >= 10, q.id + ' 有解释');
    ok(skillIds.indexOf(q.skill) >= 0, q.id + ' 指向已知能力：' + q.skill);
  });
});

ok(G.count() >= 120, '词典条目 ≥ 120', String(G.count()));
G.groups.forEach(function (g) {
  ok(G.byGroup(g.id).length >= 8, '词典分组「' + g.name + '」≥ 8 条', String(G.byGroup(g.id).length));
});
ok(!!G.get('grep') && !!G.get('-p') && !!G.get('>') && !!G.get('绝对路径'), '关键词都能查到（grep / -p / > / 绝对路径）');
ok(LX.Quiz.all().length >= 56, '自测题总数 ≥ 56', String(LX.Quiz.all().length));

/* 能力矩阵：每个能力都要有证据，每天都要覆盖到能力 */
var coveredSkills = {};
LX.Skills.items.forEach(function (s) {
  var hasQuiz = LX.Quiz.all().some(function (q) { return q.skill === s.id; });
  ok((s.gates && s.gates.length > 0) || hasQuiz, '能力「' + s.name + '」有关卡或自测证据');
  (s.gates || []).forEach(function (gid) {
    ok(!!LX.Days.gate(gid), '能力 ' + s.id + ' 引用的关卡存在：' + gid);
  });
});
days.forEach(function (d) {
  var list = LX.Skills.ofDay(d.id);
  ok(list.length >= 2, d.id + ' 覆盖至少 2 项能力', '实际 ' + list.length);
  list.forEach(function (id) { coveredSkills[id] = 1; });
});
ok(Object.keys(coveredSkills).length === LX.Skills.items.length,
  '每项能力都被至少一天覆盖',
  LX.Skills.items.filter(function (s) { return !coveredSkills[s.id]; }).map(function (s) { return s.id; }).join(','));

console.log('深度：' + stepCount + ' 条命令卡 / ' + tokenCount + ' 个 token / ' +
  LX.Quiz.all().length + ' 道题 / ' + G.count() + ' 条词典 / ' + LX.Skills.count() + ' 项能力');

/* ------------------------------ 2. 通关模拟 ------------------------------ */

days.forEach(function (day) {
  var engine = cache[day.scenario] || (cache[day.scenario] = LX.Sandbox.create(day.scenario));
  var bad = [];

  day.lessons.forEach(function (l) {
    l.cmds.forEach(function (cmd) {
      var r = engine.exec(cmd);
      /* grep 没匹配到会返回 1（真机也一样），这是「确认已清空」的正常结果 */
      if (r.code !== 0 && !(r.code === 1 && /\bgrep\b/.test(cmd))) {
        bad.push(cmd + '  =>  code ' + r.code + ' / ' + nice(r.err || ''));
      }
    });
  });
  ok(!bad.length, day.id + ' 所有 lesson 命令都执行成功', bad.join(' ;; '));

  var results = LX.Gate.evaluateDay(day.id);
  results.forEach(function (res) {
    var g = LX.Days.gate(res.id);
    var fails = res.results.filter(function (x) { return !x.ok; });
    ok(res.ok, day.id + ' / ' + g.title + ' 通关',
      fails.map(function (x) { return x.why + '（' + nice(x.got) + '）'; }).join(' | '));
  });
});

/* --------------------- 3. 闭卷挑战：必须"课程不通过、答案能通过" --------------------- */

console.log('\n闭卷挑战：');
days.forEach(function (day) {
  var ch = day.challenge;
  ok(!!ch, day.id + ' 有闭卷挑战');
  if (!ch) return;

  ok(ch.checks.length >= 2, ch.id + ' 至少 2 条检查', String(ch.checks.length));
  ok((ch.solution || []).length >= 1, ch.id + ' 带参考答案（证明可解）');
  ch.checks.forEach(function (c) {
    ok(knownTypes.indexOf(c.t) >= 0, ch.id + ' 使用已知检查类型：' + c.t);
    ok(c.why !== undefined, ch.id + ' 的 ' + c.t + ' 缺 why');
  });

  var before = LX.Gate.evaluate(ch);
  ok(!before.ok, ch.id + ' 只看课程不应自动通过（否则不算闭卷）',
    before.results.filter(function (r) { return r.ok; }).map(function (r) { return r.why; }).join(' | '));

  var engine = cache[day.scenario];
  var badSol = [];
  (ch.solution || []).forEach(function (line) {
    var r = engine.exec(line);
    if (r.code !== 0) badSol.push(line + ' → code ' + r.code + ' ' + nice(r.err || ''));
  });
  ok(badSol.length === 0, ch.id + ' 参考答案全部能执行', badSol.join(' ;; '));

  var after = LX.Gate.evaluate(ch);
  ok(after.ok, ch.id + ' 参考答案能过关',
    after.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.why; }).join(' | '));
});

/* --------------------------- 4. 结业项目 + 报告 --------------------------- */

console.log('\n结业项目与报告：');
var prj = LX.Days.project();
ok(!!prj, '存在结业项目');
if (prj) {
  ok(prj.items.length >= 4, '项目至少 4 项', String(prj.items.length));
  var prjScenario = LX.Days.get('d7').scenario;
  var prjMiss = [];
  prj.items.forEach(function (it) {
    ok(it.checks.length >= 1, it.id + ' 有检查项');
    ok(it.id.indexOf('prj-') === 0, it.id + ' 用 prj- 前缀（避免和题目 id 冲突）');
    it.checks.forEach(function (c) {
      ok(knownTypes.indexOf(c.t) >= 0, it.id + ' 使用已知检查类型：' + c.t);
    });
    var r = LX.Gate.evaluate({ id: it.id, scenario: prjScenario, checks: it.checks });
    if (!r.ok) prjMiss.push(it.text + '：' + r.results.filter(function (x) { return !x.ok; }).map(function (x) { return x.why; }).join(','));
  });
  ok(prjMiss.length === 0, '跑完 7 天后结业项目全部满足', prjMiss.join(' | '));
}

/* 把真实结果写进进度，验证报告能正确汇总 */
days.forEach(function (d) {
  LX.Gate.evaluateDay(d.id).forEach(function (r) { LX.Progress.recordGate(r); });
  LX.Days.get(d.id).challenge && LX.Progress.recordGate(LX.Gate.evaluate(d.challenge));
});
LX.Quiz.all().forEach(function (q) { LX.Progress.recordQuiz(q.id, true); });

var rep = LX.Report.build();
ok(rep.overall.done === 21, '报告：21 关全过', String(rep.overall.done));
ok(rep.quiz.total >= 56 && rep.quiz.right === rep.quiz.total, '报告：自测全对',
  rep.quiz.right + '/' + rep.quiz.total);
ok(rep.challenges.length === 7, '报告：7 个闭卷挑战', String(rep.challenges.length));
ok(rep.skills.length >= 10, '报告：能力矩阵 ≥ 10 项', String(rep.skills.length));
ok(rep.skillsProven === rep.skills.length, '报告：能力全部被证明',
  String(rep.skillsProven) + '/' + String(rep.skills.length));
ok(!!rep.project && rep.project.total >= 4, '报告：结业项目 4 项');

var md = LX.Report.text(rep);
ok(md.indexOf('能力矩阵') >= 0, 'Markdown 含能力矩阵');
ok(md.indexOf('闭卷挑战') >= 0, 'Markdown 含闭卷挑战');
ok(md.indexOf('自测正确率') >= 0, 'Markdown 含自测正确率');


/* ------------------------------ 5. 反例：空工作区不该直接通关 ------------------------------ */

var emptyDay = LX.Days.get('d1');
var emptyEngine = LX.Sandbox.create('ai-lab');
var saved = cache['ai-lab'];
cache['ai-lab'] = emptyEngine;
var res0 = LX.Gate.evaluate('d1-g1');
ok(!res0.ok, 'd1-g1 在全新工作区里不应该直接通过');
cache['ai-lab'] = saved;

console.log('\n' + (fail ? 'FAIL' : 'PASS') + '：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
