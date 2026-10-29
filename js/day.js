/* =============================================================================
 * js/day.js
 * -----------------------------------------------------------------------------
 * 7 天课程的数据结构（只存数据，不含任何 DOM 逻辑）
 *
 * 一天长这样：
 *   LX.Days.add({
 *     id: 'd1',                // 唯一 id，进度里用它做键
 *     label: 'Day 1',          // 顶栏标签
 *     title: '项目地基',        // 当天标题
 *     goal: '一句话说明今天能做成什么',
 *     scenario: 'ai-lab',      // 当天用哪个沙盒工作区（js/sandbox-ai.js 里注册的）
 *     minutes: 40,
 *     lessons: [ { id, title, body, steps, clinic, cheat } ],
 *     gates:   [ { id, title, brief, checks, hints } ],
 *     challenge: { id, title, brief, checks, hints },   // 闭卷挑战（不计入 21 关）
 *     project: { id, title, brief, items }              // 结业项目（只有 d7 有）
 *   });
 *
 * lessons[i].body 用极简 Markdown（由 js/app.js 的 mdLite 渲染）：
 *   # 标题 / ## 小标题 / - 列表 / 1. 有序 / ```代码``` / `行内` / **加粗**
 *
 * lessons[i].steps 是「逐字拆解」的命令卡：
 *   { line: 'tree -L 2', say: '这条命令在干什么',
 *     tokens: [ { t: 'tree', k: 'cmd', m: '为什么这么写', ref: 'tree' } ],
 *     expect: '你应该看到什么', watch: ['data/'], gotcha: ['常见坑'] }
 *   老写法 cmds: ['pwd'] 仍然可用（自动转成没有拆解的 step）。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  var list = [];
  var byId = {};
  var gateIndex = {};

  function fail(msg) {
    if (global.console && console.warn) console.warn('[days] ' + msg);
    return null;
  }

  /** 把一条命令的 token 归一化（每个 token 必须有解释 m，检查脚本会强制） */
  function normTokens(tokens) {
    return (tokens || []).map(function (t) {
      return {
        t: t.t || '',
        k: t.k || 'cmd',
        m: t.m || '',
        ref: t.ref || ''
      };
    });
  }

  /** 把老写法 cmds 兼容成 steps */
  function normSteps(lesson) {
    var steps = (lesson.steps || []).map(function (s, j) {
      return {
        n: j + 1,
        line: s.line || '',
        say: s.say || '',
        tokens: normTokens(s.tokens),
        expect: s.expect || '',
        watch: s.watch || [],
        gotcha: s.gotcha || []
      };
    });
    if (steps.length) return steps;
    return (lesson.cmds || []).filter(Boolean).map(function (line, j) {
      return { n: j + 1, line: line, say: '', tokens: [], expect: '', watch: [], gotcha: [] };
    });
  }

  /** 规整一节课：steps / cmds / clinic / cheat（预备课 d0 也复用它） */
  function makeLesson(l, i, prefix) {
    var steps = normSteps(l);
    return {
      id: l.id || (prefix + '-l' + (i + 1)),
      title: l.title || ('第 ' + (i + 1) + ' 节'),
      body: l.body || '',
      steps: steps,
      /* cmds 保留：老代码 / 检查脚本还在用它 */
      cmds: steps.map(function (s) { return s.line; }),
      /* 常见错误诊所：{ err, read, fix } */
      clinic: (l.clinic || []).map(function (c) {
        return { err: c.err || '', read: c.read || '', fix: c.fix || '' };
      }),
      /* 速查小抄：{ cmd, mean } */
      cheat: (l.cheat || []).map(function (c) {
        return { cmd: c.cmd || '', mean: c.mean || '' };
      })
    };
  }

  /**
   * 注册一天。重复调用同一个 id 会覆盖（方便数据文件热改）。
   * @return {Object|null} 注册后的 day 对象
   */
  function add(day) {
    if (!day || !day.id) return fail('day 缺少 id');
    if (!day.gates || !day.gates.length) return fail(day.id + ' 没有 gates');

    var item = {
      id: day.id,
      label: day.label || day.id.toUpperCase(),
      title: day.title || '',
      goal: day.goal || '',
      scenario: day.scenario || 'ai-lab',
      minutes: day.minutes || 40,
      intro: day.intro || '',
      lessons: (day.lessons || []).map(function (l, i) { return makeLesson(l, i, day.id); }),
      gates: day.gates.map(function (g, i) {
        return {
          id: g.id || (day.id + '-g' + (i + 1)),
          day: day.id,
          title: g.title || ('关卡 ' + (i + 1)),
          brief: g.brief || '',
          scenario: g.scenario || day.scenario,
          hints: g.hints || [],
          checks: g.checks || []
        };
      }),
      /* 闭卷挑战：和关卡长一样，但默认不给提示，也不计入 21 关 */
      challenge: day.challenge ? {
        id: day.challenge.id || (day.id + '-c1'),
        day: day.id,
        title: day.challenge.title || (day.label + ' 闭卷挑战'),
        brief: day.challenge.brief || '',
        scenario: day.challenge.scenario || day.scenario,
        hints: day.challenge.hints || [],
        checks: day.challenge.checks || [],
        /* 参考答案：默认不给看，连续失败后才可以展开；检查脚本也用它证明"这一关能过" */
        solution: day.challenge.solution || []
      } : null,
      /* 结业项目：只有最后一天有，逐项自己跑命令证明 */
      project: day.project ? {
        id: day.project.id || (day.id + '-p1'),
        title: day.project.title || '结业项目',
        brief: day.project.brief || '',
        items: (day.project.items || []).map(function (it, i) {
          return {
            id: it.id || (day.id + '-p' + (i + 1)),
            text: it.text || '',
            checks: it.checks || [],
            hint: it.hint || ''
          };
        })
      } : null
    };

    if (byId[item.id]) {
      var oldIdx = list.indexOf(byId[item.id]);
      if (oldIdx >= 0) list.splice(oldIdx, 1);
      byId[item.id].gates.forEach(function (g) { delete gateIndex[g.id]; });
    }

    byId[item.id] = item;
    list.push(item);
    list.sort(function (a, b) { return a.id.localeCompare(b.id); });
    item.gates.forEach(function (g) { gateIndex[g.id] = g; });

    return item;
  }

  var Days = {
    /** 注册（或覆盖）一天 */
    add: add,

    /** 全部天，按 id 排序 */
    all: function () { return list.slice(); },

    /** 按 id 取一天 */
    get: function (id) { return byId[id] || null; },

    /** 规整一节课（预备课 #/start 这类非关卡页面复用） */
    normLesson: function (l, i, prefix) { return makeLesson(l, i, prefix || 'x'); },

    /** 第一天 */
    first: function () { return list[0] || null; },

    /** 全部关卡（扁平） */
    gates: function () {
      var out = [];
      list.forEach(function (d) { out = out.concat(d.gates); });
      return out;
    },

    /** 按 id 取关卡 */
    gate: function (gateId) { return gateIndex[gateId] || null; },

    /** 关卡属于哪一天 */
    dayOf: function (gateId) {
      var g = gateIndex[gateId];
      return g ? byId[g.day] : null;
    },

    /** 某天里的所有命令示例（给搜索 / 速查用） */
    commands: function (dayId) {
      var d = dayId ? byId[dayId] : null;
      var out = [];
      (d ? d.lessons : []).forEach(function (l) {
        out = out.concat(l.cmds || []);
      });
      return out;
    },

    /** 全部天里的命令（含逐字拆解里的 line） */
    allCommands: function () {
      var out = [];
      list.forEach(function (d) {
        d.lessons.forEach(function (l) { out = out.concat(l.cmds || []); });
      });
      return out;
    },

    /** 全部闭卷挑战 */
    challenges: function () {
      return list.map(function (d) { return d.challenge; }).filter(Boolean);
    },

    /** 结业项目（没有就 null） */
    project: function () {
      for (var i = 0; i < list.length; i++) if (list[i].project) return list[i].project;
      return null;
    },

    /** 课程总时长（分钟） */
    totalMinutes: function () {
      return list.reduce(function (n, d) { return n + (d.minutes || 0); }, 0);
    }
  };

  LX.Days = Days;
})(window);
