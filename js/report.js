/* =============================================================================
 * js/report.js
 * -----------------------------------------------------------------------------
 * 结业报告：把「7 天里真正跑通的东西」汇总成一页可保存的成绩单。
 *
 * 设计原则：报告里的每个 ✅ 都对应**真实终态验证**（关卡）+ **真实答题记录**（自测），
 * 不是自己点的按钮。所以它比"学完 7 天"这种口号更有含金量。
 *
 *   LX.Report.build()      纯数据
 *   LX.Report.text()       Markdown 文本（可复制 / 下载）
 *   LX.Report.render(el)   渲染成 DOM
 *   LX.Report.download()   下载 .md
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /** 称号：按通过关卡的比例给（项目 + 自测全绿再升一档） */
  function levelOf(pct, projectOk, quizPct) {
    if (pct >= 100 && projectOk && quizPct >= 90) return { key: 'grad', title: '可交付 · 7 天毕业' };
    if (pct >= 100) return { key: 'grad', title: 'AI 应用开发 · 7 天毕业' };
    if (pct >= 70) return { key: 'senior', title: '能独立跑通 AI 项目' };
    if (pct >= 40) return { key: 'junior', title: '手上已经有真东西了' };
    if (pct > 0) return { key: 'starter', title: '刚上路，继续推' };
    return { key: 'new', title: '还没开始' };
  }

  function quizOf() { return (LX.Quiz && LX.Quiz.all) ? LX.Quiz.all() : []; }

  var Report = {
    /** 汇总数据 */
    build: function () {
      var Progress = LX.Progress;
      var overall = Progress.overall();
      var attempts = Progress.attempts();
      var settings = Progress.settings();
      var quiz = Progress.quizOverall();

      var days = LX.Days.all().map(function (d) {
        var stat = Progress.dayStat(d.id);
        var q = Progress.quizSummary(d.id);
        var ch = d.challenge ? Progress.gateStat(d.challenge.id) : null;
        return {
          id: d.id,
          label: d.label,
          title: d.title,
          done: stat.done,
          total: stat.total,
          pct: stat.pct,
          passed: stat.passed,
          quiz: q,
          challenge: d.challenge ? {
            id: d.challenge.id,
            title: d.challenge.title,
            ok: !!(ch && ch.ok),
            hinted: Progress.hintCount(d.challenge.id) > 0
          } : null,
          gates: d.gates.map(function (g) {
            var s = Progress.gateStat(g.id);
            return {
              id: g.id,
              title: g.title,
              ok: !!s.ok,
              passes: s.passes || 0,
              fails: s.fails || 0,
              at: s.at || 0
            };
          })
        };
      });

      var next = null;
      for (var i = 0; i < days.length && !next; i++) {
        for (var j = 0; j < days[i].gates.length; j++) {
          if (!days[i].gates[j].ok) {
            next = { day: days[i].label, title: days[i].gates[j].title, id: days[i].gates[j].id };
            break;
          }
        }
      }

      /* 闭卷挑战 */
      var challenges = LX.Days.challenges().map(function (c) {
        var s = Progress.gateStat(c.id);
        return {
          id: c.id,
          day: c.day,
          title: c.title,
          ok: !!s.ok,
          passes: s.passes || 0,
          fails: s.fails || 0,
          hinted: Progress.hintCount(c.id) > 0
        };
      });

      /* 能力矩阵：关卡 + 自测题双证据 */
      var allQuiz = quizOf();
      var skills = ((LX.Skills && LX.Skills.items) || []).map(function (sk) {
        var gates = (sk.gates || []).map(function (gid) {
          var g = LX.Days.gate(gid);
          return { id: gid, title: g ? g.title : gid, ok: Progress.isGatePassed(gid) };
        });
        var gatesOk = gates.filter(function (g) { return g.ok; }).length;
        var qs = allQuiz.filter(function (q) { return q.skill === sk.id; });
        var right = qs.filter(function (q) { return Progress.quizStat(q.id).ok; }).length;

        var gatePart = gates.length ? (gatesOk === gates.length) : true;
        var state = (gatePart && right > 0) ? 'proven'
          : (gatesOk > 0 || right > 0) ? 'partial' : 'none';

        return {
          id: sk.id,
          name: sk.name,
          level: sk.level,
          why: sk.why,
          jobs: sk.jobs,
          gates: gates,
          gatesOk: gatesOk,
          quizTotal: qs.length,
          quizRight: right,
          state: state
        };
      });

      var proven = skills.filter(function (s) { return s.state === 'proven'; }).length;

      /* 结业项目 */
      var project = null;
      var p = LX.Days.project();
      if (p) {
        var items = p.items.map(function (it) {
          return { id: it.id, text: it.text, ok: Progress.quizStat(it.id).ok };
        });
        var doneItems = items.filter(function (x) { return x.ok; }).length;
        project = {
          id: p.id,
          title: p.title,
          brief: p.brief,
          items: items,
          done: doneItems,
          total: items.length,
          ok: items.length > 0 && doneItems === items.length
        };
      }

      /* 错题本 */
      var wrong = (LX.Quiz && LX.Quiz.wrong) ? LX.Quiz.wrong().map(function (w) {
        return { dayId: w.dayId, id: w.q.id, q: w.q.q, why: w.q.why, tries: w.stat.tries };
      }) : [];

      var level = levelOf(overall.pct, !!(project && project.ok), quiz.pct);

      return {
        name: settings.name || '同学',
        generatedAt: Date.now(),
        overall: overall,
        days: days,
        attempts: attempts,
        quiz: quiz,
        challenges: challenges,
        challengeOk: challenges.filter(function (c) { return c.ok; }).length,
        skills: skills,
        skillsProven: proven,
        project: project,
        wrong: wrong,
        level: level,
        minutes: LX.Days.totalMinutes(),
        next: next
      };
    },
    /** Markdown 文本 */
    text: function (data) {
      var d = data || Report.build();
      var L = [];
      L.push('# AI 应用开发 7 天 · 学习报告');
      L.push('');
      L.push('- 姓名：' + d.name);
      L.push('- 生成时间：' + fmtDate(d.generatedAt));
      L.push('- 通关关卡：' + d.overall.done + ' / ' + d.overall.total + '（' + d.overall.pct + '%）');
      L.push('- 自测正确率：' + d.quiz.right + ' / ' + d.quiz.total + '（' + d.quiz.pct + '%）');
      L.push('- 闭卷挑战：' + d.challengeOk + ' / ' + d.challenges.length + ' 通过');
      L.push('- 验证次数：' + d.attempts.total + ' 次（通过 ' + d.attempts.passes + ' · 未通过 ' + d.attempts.fails + '）');
      L.push('- 能力项：' + d.skillsProven + ' / ' + d.skills.length + ' 已证明');
      if (d.project) {
        L.push('- 结业项目：' + d.project.done + ' / ' + d.project.total + (d.project.ok ? '（可交付）' : ''));
      }
      L.push('- 评价：' + d.level.title);
      L.push('');

      d.days.forEach(function (day) {
        L.push('## ' + day.label + ' · ' + day.title + '（' + day.done + '/' + day.total + '）');
        day.gates.forEach(function (g) {
          L.push('- ' + (g.ok ? '✅' : '⬜') + ' ' + g.title +
            (g.ok ? '　（通过 ' + g.passes + ' 次）' : ''));
        });
        if (day.quiz.total) {
          L.push('- 🧠 自测 ' + day.quiz.right + '/' + day.quiz.total + '（' + day.quiz.pct + '%）');
        }
        if (day.challenge) {
          L.push('- 🔒 闭卷挑战：' + (day.challenge.ok ? '已通过' : '未通过') +
            (day.challenge.hinted ? '（借助提示）' : ''));
        }
        L.push('');
      });

      L.push('## 能力矩阵');
      d.skills.forEach(function (s) {
        var mark = s.state === 'proven' ? '✅' : (s.state === 'partial' ? '🟡' : '⬜');
        L.push('- ' + mark + ' ' + s.name + '（' + s.level + '）· 关卡 ' + s.gatesOk + '/' + s.gates.length +
          ' · 自测 ' + s.quizRight + '/' + s.quizTotal);
      });
      L.push('');

      if (d.project) {
        L.push('## ' + d.project.title);
        d.project.items.forEach(function (it) {
          L.push('- ' + (it.ok ? '✅' : '⬜') + ' ' + it.text);
        });
        L.push('');
      }

      if (d.wrong.length) {
        L.push('## 错题本（' + d.wrong.length + ' 题）');
        d.wrong.forEach(function (w) {
          L.push('- [' + String(w.dayId).toUpperCase() + '] ' + w.q);
          L.push('  - 解析：' + (w.why || ''));
        });
        L.push('');
      }

      if (d.next) {
        L.push('> 下一步：' + d.next.day + ' · ' + d.next.title);
      } else if (d.project && !d.project.ok) {
        L.push('> 21 关全过。下一步：把结业项目剩下 ' + (d.project.total - d.project.done) + ' 项做完。');
      } else {
        L.push('> 全部关卡与项目都完成——可以把它写进简历，去投递了。');
      }
      return L.join('\n') + '\n';
    },

    /** 下载 .md */
    download: function () {
      var text = Report.text();
      var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'ai-dev-7days-report.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return text;
    },
    /** 渲染成 DOM（返回汇总数据，方便调用方拿去做别的） */
    render: function (root) {
      if (!root) return null;
      var d = Report.build();
      root.innerHTML = '';

      var head = util.el('div', { className: 'rep-head' });
      head.appendChild(util.el('div', { className: 'rep-title', text: d.level.title }));
      head.appendChild(util.el('div', {
        className: 'rep-sub',
        text: d.name + ' · ' + fmtDate(d.generatedAt) + ' · 通关 ' + d.overall.done + '/' + d.overall.total
      }));
      root.appendChild(head);

      var bar = util.el('div', { className: 'rep-bar' });
      var fill = util.el('span');
      fill.style.width = d.overall.pct + '%';
      bar.appendChild(fill);
      root.appendChild(bar);

      /* 四个数字：关卡 / 自测 / 挑战 / 能力 */
      var stats = util.el('div', { className: 'rep-stats' });
      [
        { k: '关卡', v: d.overall.done + '/' + d.overall.total, cls: d.overall.passed ? 'is-ok' : '' },
        { k: '自测', v: d.quiz.right + '/' + d.quiz.total, cls: d.quiz.pct >= 80 ? 'is-ok' : '' },
        { k: '闭卷', v: d.challengeOk + '/' + d.challenges.length, cls: (d.challenges.length && d.challengeOk === d.challenges.length) ? 'is-ok' : '' },
        { k: '能力', v: d.skillsProven + '/' + d.skills.length, cls: d.skillsProven === d.skills.length ? 'is-ok' : '' }
      ].forEach(function (s) {
        var box = util.el('div', { className: 'rep-stat ' + s.cls });
        box.appendChild(util.el('b', { text: s.v }));
        box.appendChild(util.el('span', { text: s.k }));
        stats.appendChild(box);
      });
      root.appendChild(stats);

      /* 每天一行 */
      var table = util.el('div', { className: 'rep-days' });
      d.days.forEach(function (day) {
        var row = util.el('div', { className: 'rep-day' + (day.passed ? ' is-pass' : '') });
        var left = util.el('div', { className: 'rep-day-main' });
        left.appendChild(util.el('span', { className: 'rep-day-label', text: day.label }));
        left.appendChild(util.el('span', { className: 'rep-day-title', text: day.title }));
        row.appendChild(left);

        var dots = util.el('span', { className: 'rep-dots' });
        day.gates.forEach(function (g) {
          dots.appendChild(util.el('i', {
            className: g.ok ? 'ok' : 'no',
            attrs: { title: g.title + (g.ok ? '（已通过）' : '（未通过）') }
          }));
        });
        row.appendChild(dots);

        row.appendChild(util.el('span', {
          className: 'rep-day-quiz' + (day.quiz.pct >= 80 ? ' is-ok' : ''),
          text: '🧠 ' + day.quiz.right + '/' + day.quiz.total,
          attrs: { title: '自测正确率' }
        }));
        if (day.challenge) {
          row.appendChild(util.el('span', {
            className: 'rep-day-ch ' + (day.challenge.ok ? 'is-ok' : 'is-no'),
            text: day.challenge.ok ? '🔒✓' : '🔒',
            attrs: { title: day.challenge.title + (day.challenge.hinted ? '（借助提示通过）' : '') }
          }));
        }
        row.appendChild(util.el('span', {
          className: 'rep-day-score',
          text: day.done + '/' + day.total
        }));
        table.appendChild(row);
      });
      root.appendChild(table);

      /* 能力矩阵 */
      var skHead = util.el('div', { className: 'rep-sec-head' });
      skHead.appendChild(util.el('b', { text: '能力矩阵' }));
      skHead.appendChild(util.el('span', {
        className: 'muted',
        text: '✅ 已证明（关卡全过 + 自测答对） · 🟡 部分 · ⬜ 还没证据'
      }));
      root.appendChild(skHead);

      var skTable = util.el('div', { className: 'rep-skills' });
      d.skills.forEach(function (s) {
        var row = util.el('div', { className: 'rep-skill is-' + s.state });
        row.appendChild(util.el('span', {
          className: 'rep-skill-mark',
          text: s.state === 'proven' ? '✅' : (s.state === 'partial' ? '🟡' : '⬜')
        }));
        var body = util.el('div', { className: 'rep-skill-body' });
        var line = util.el('div', { className: 'rep-skill-top' });
        line.appendChild(util.el('b', { text: s.name }));
        line.appendChild(util.el('span', { className: 'rep-skill-level', text: s.level }));
        line.appendChild(util.el('span', {
          className: 'rep-skill-num muted',
          text: '关卡 ' + s.gatesOk + '/' + s.gates.length + ' · 自测 ' + s.quizRight + '/' + s.quizTotal
        }));
        body.appendChild(line);
        body.appendChild(util.el('div', { className: 'rep-skill-jobs muted', text: s.jobs }));
        row.appendChild(body);
        skTable.appendChild(row);
      });
      root.appendChild(skTable);

      /* 结业项目 */
      if (d.project) {
        var pjHead = util.el('div', { className: 'rep-sec-head' });
        pjHead.appendChild(util.el('b', { text: d.project.title }));
        pjHead.appendChild(util.el('span', {
          className: 'muted',
          text: d.project.done + ' / ' + d.project.total + (d.project.ok ? ' · 可交付' : '')
        }));
        root.appendChild(pjHead);

        var pj = util.el('div', { className: 'rep-prj' });
        d.project.items.forEach(function (it) {
          pj.appendChild(util.el('div', {
            className: 'rep-prj-item ' + (it.ok ? 'is-ok' : ''),
            text: (it.ok ? '✅ ' : '⬜ ') + it.text
          }));
        });
        root.appendChild(pj);
      }

      /* 错题本 */
      if (d.wrong.length) {
        var wHead = util.el('div', { className: 'rep-sec-head' });
        wHead.appendChild(util.el('b', { text: '错题本（' + d.wrong.length + '）' }));
        wHead.appendChild(util.el('span', { className: 'muted', text: '回到对应那天重做一遍就会消失' }));
        root.appendChild(wHead);

        var wl = util.el('div', { className: 'rep-wrong' });
        d.wrong.forEach(function (w) {
          var box = util.el('div', { className: 'rep-wrong-item' });
          box.appendChild(util.el('span', { className: 'rep-wrong-day', text: String(w.dayId).toUpperCase() }));
          box.appendChild(util.el('span', { className: 'rep-wrong-q', text: w.q }));
          if (w.why) box.appendChild(util.el('div', { className: 'rep-wrong-why muted', text: w.why }));
          wl.appendChild(box);
        });
        root.appendChild(wl);
      }

      var foot = util.el('div', { className: 'rep-foot' });
      foot.appendChild(util.el('span', {
        className: 'muted',
        text: '验证 ' + d.attempts.total + ' 次 · 通过 ' + d.attempts.passes + ' · 未通过 ' + d.attempts.fails
      }));
      if (d.next) {
        foot.appendChild(util.el('span', {
          className: 'rep-next',
          text: '下一步：' + d.next.day + ' · ' + d.next.title
        }));
      } else {
        foot.appendChild(util.el('span', { className: 'rep-next is-done', text: '全部通关 🎉' }));
      }
      root.appendChild(foot);

      return d;
    }
  };

  LX.Report = Report;
})(window);
