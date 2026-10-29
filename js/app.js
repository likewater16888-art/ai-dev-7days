/* =============================================================================
 * js/app.js
 * -----------------------------------------------------------------------------
 * 界面层：把「课程数据（day.js）+ 沙盒终端（term.js）+ 关卡验证（gate.js）+
 * 进度（progress.js）」粘成一个 7 天学习应用。
 *
 * 路由：#/d1 … #/d7（刷新后回到同一天）
 * 交互：
 *   · 小节里的命令条「▶ 运行」→ 直接在沙盒终端执行
 *   · 每执行一条命令自动重新判分（Term.onRun），不需要手动点检查
 *   · 手动「检查」按钮会把失败也计入报告（自动判分只记录通过）
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  var dom = {};
  var currentDay = null;
  var currentPage = 'day';        /* day | start | dict */
  var currentScenario = 'ai-lab'; /* 当前页面命令该落在哪个沙盒工作区 */
  var toastTimer = null;

  /* -------------------------------- 小工具 -------------------------------- */

  function $(sel) { return util.$(sel); }

  function toast(text) {
    if (!dom.toast) return;
    dom.toast.textContent = text;
    dom.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove('is-on'); }, 2200);
  }

  /* ------------------------------- 极简 Markdown ------------------------------- */

  function mdInline(text) {
    return util.escape(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  /**
   * 支持：# 标题 / ## 小标题 / - 列表 / 1. 有序 / ```代码块``` / `行内` / **加粗** / > 引用
   * 故意不做完整 Markdown —— 课程内容是自写的，够用且没有依赖。
   */
  function mdLite(src) {
    var lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
    var out = [];
    var list = null;
    var code = null;

    function closeList() {
      if (list) { out.push('</' + list + '>'); list = null; }
    }

    function openList(kind) {
      if (list === kind) return;
      closeList();
      out.push('<' + kind + '>');
      list = kind;
    }

    lines.forEach(function (line) {
      /* 代码围栏 ``` */
      if (/^\s*`{3}/.test(line)) {
        if (code) {
          out.push('<pre><code>' + util.escape(code.join('\n')) + '</code></pre>');
          code = null;
        } else {
          closeList();
          code = [];
        }
        return;
      }
      if (code) { code.push(line); return; }

      if (!line.trim()) { closeList(); return; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { closeList(); out.push('<hr>'); return; }

      var m = line.match(/^(#{1,4})\s+(.*)$/);
      if (m) {
        closeList();
        var lvl = Math.min(4, m[1].length + 1); // 页面里已经有 h1，所以降一级
        out.push('<h' + lvl + '>' + mdInline(m[2]) + '</h' + lvl + '>');
        return;
      }

      m = line.match(/^>\s?(.*)$/);
      if (m) { closeList(); out.push('<blockquote>' + mdInline(m[1]) + '</blockquote>'); return; }

      m = line.match(/^\s*[-*+]\s+(.*)$/);
      if (m) { openList('ul'); out.push('<li>' + mdInline(m[1]) + '</li>'); return; }

      m = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (m) { openList('ol'); out.push('<li>' + mdInline(m[1]) + '</li>'); return; }

      closeList();
      out.push('<p>' + mdInline(line) + '</p>');
    });

    if (code) out.push('<pre><code>' + util.escape(code.join('\n')) + '</code></pre>');
    closeList();
    return out.join('\n');
  }

  /* ------------------------------- 侧边栏 / 顶栏 ------------------------------- */

  function toggleSidenav() {
    if (dom.sidenav) dom.sidenav.classList.toggle('is-open');
  }

  function closeSidenav() {
    if (dom.sidenav) dom.sidenav.classList.remove('is-open');
  }

  /** 天编号：d3 → 3（数据里的 id 不是这个格式时退回序号） */
  function dayNum(day, index) {
    var m = String(day.id).match(/(\d+)/);
    return m ? m[1] : String(index + 1);
  }

  function renderSidebar() {
    if (!dom.dayList) return;
    dom.dayList.innerHTML = '';

    LX.Days.all().forEach(function (day, i) {
      var stat = LX.Progress.dayStat(day.id);
      var active = currentDay && currentDay.id === day.id;

      var item = util.el('a', {
        className: 'day-item' + (active ? ' is-active' : '') + (stat.passed ? ' is-pass' : ''),
        attrs: { href: '#/' + day.id }
      });
      item.appendChild(util.el('span', { className: 'day-num', text: dayNum(day, i) }));

      var text = util.el('span', { className: 'day-text' });
      text.appendChild(util.el('span', { className: 'day-title', text: day.title }));
      text.appendChild(util.el('span', {
        className: 'day-meta',
        text: stat.passed
          ? '已通关 · ' + day.minutes + ' 分钟'
          : stat.done + '/' + stat.total + ' 关 · ' + day.minutes + ' 分钟'
      }));
      item.appendChild(text);

      var dots = util.el('span', { className: 'day-dots' });
      day.gates.forEach(function (g) {
        dots.appendChild(util.el('i', {
          className: LX.Progress.isGatePassed(g.id) ? 'ok' : '',
          attrs: { title: g.title }
        }));
      });
      item.appendChild(dots);

      item.addEventListener('click', closeSidenav);
      dom.dayList.appendChild(item);
    });

    /* 常驻入口：预备课 + 词典（放在 dayList 外面，不干扰"7 天"的结构） */
    if (dom.sideExtra) {
      dom.sideExtra.innerHTML = '';

      var start = util.el('a', {
        className: 'side-link' + (currentPage === 'start' ? ' is-active' : ''),
        text: '0 · 开课前 10 分钟',
        attrs: { href: '#/start' }
      });
      start.addEventListener('click', closeSidenav);
      dom.sideExtra.appendChild(start);

      var dict = util.el('a', {
        className: 'side-link' + (currentPage === 'dict' ? ' is-active' : ''),
        text: '📖 命令词典 ' + (LX.Dict ? LX.Dict.count() : ''),
        attrs: { href: '#/dict' }
      });
      dict.addEventListener('click', closeSidenav);
      dom.sideExtra.appendChild(dict);
    }
  }

  function renderChrome() {
    var o = LX.Progress.overall();
    var days = LX.Days.all();

    if (dom.ring) dom.ring.style.setProperty('--p', String(o.pct));
    if (dom.ringText) dom.ringText.textContent = o.pct + '%';
    if (dom.topStat) dom.topStat.textContent = o.done + ' / ' + o.total + ' 关';
    if (dom.topDay) {
      dom.topDay.textContent = o.passed
        ? '7 天全部通关'
        : LX.Progress.daysPassed() + ' / ' + days.length + ' 天通关';
    }
    if (dom.btnTheme) dom.btnTheme.title = LX.Progress.settings().theme === 'light' ? '切到深色' : '切到浅色';

    document.title = (currentDay ? currentDay.label + ' · ' + currentDay.title + ' | ' : '') +
      'AI 应用开发 7 天';
  }

  /* -------------------------------- 主题 -------------------------------- */

  function applyTheme(theme) {
    var next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    LX.Progress.saveSettings({ theme: next });
    renderChrome();
  }

  function toggleTheme() {
    applyTheme(LX.Progress.settings().theme === 'light' ? 'dark' : 'light');
  }

  /* -------------------------------- 小节卡片 -------------------------------- */

  /** 命令条：点「▶ 运行」直接在沙盒终端里执行（落在当前页面对应的工作区里） */
  function runCmd(cmd) {
    try {
      LX.Term.exec(cmd, currentScenario);
    } catch (err) {
      toast('终端出错：' + ((err && err.message) || err));
      return;
    }
    refreshGates();
  }

  /* ------------------------ 逐字拆解：命令卡 ------------------------ */

  var TOKEN_KIND = {
    cmd: '命令', flag: '参数', value: '取值', path: '路径', op: '符号',
    quote: '引号', comment: '注释', vari: '变量', env: '环境变量'
  };

  function openDict(term) {
    if (LX.Dict) LX.Dict.open(term);
  }

  /** 单个 token：点一下去词典 */
  function tokenRow(tok) {
    var row = util.el('div', { className: 'step-tok' });

    var code = util.el('code', { className: 'tok', text: tok.t });
    code.setAttribute('title', '点一下：去词典查「' + tok.t + '」');
    code.addEventListener('click', function () { openDict(tok.ref || tok.t); });
    row.appendChild(code);

    row.appendChild(util.el('span', {
      className: 'tok-kind k-' + tok.k,
      text: TOKEN_KIND[tok.k] || tok.k
    }));
    row.appendChild(util.el('span', { className: 'tok-mean', text: tok.m }));

    var more = util.el('button', { className: 'tok-more', text: '词典', attrs: { type: 'button' } });
    more.addEventListener('click', function () { openDict(tok.ref || tok.t); });
    row.appendChild(more);

    return row;
  }

  /** 一条命令的完整卡片：干什么 → 逐字拆解 → 你应该看到 → 常见坑 */
  function stepCard(step) {
    var box = util.el('div', { className: 'step-card' });

    var head = util.el('div', { className: 'step-head' });
    head.appendChild(util.el('span', { className: 'step-no', text: String(step.n) }));
    head.appendChild(util.el('code', { className: 'step-line', text: step.line }));
    var run = util.el('button', { className: 'cmd-run', text: '▶ 运行' });
    run.addEventListener('click', function () { runCmd(step.line); });
    head.appendChild(run);
    box.appendChild(head);

    if (step.say) box.appendChild(util.el('p', { className: 'step-say', text: step.say }));

    if (step.tokens.length) {
      var wrap = util.el('details', { className: 'step-tokens', attrs: { open: 'open' } });
      var sum = util.el('summary');
      sum.appendChild(util.el('b', { text: '逐字拆解' }));
      sum.appendChild(util.el('span', {
        className: 'muted',
        text: step.tokens.length + ' 个零件，每个都解释；点零件可查词典'
      }));
      wrap.appendChild(sum);
      step.tokens.forEach(function (t) { wrap.appendChild(tokenRow(t)); });
      box.appendChild(wrap);
    }

    if (step.expect) {
      var expect = util.el('div', { className: 'step-expect' });
      expect.appendChild(util.el('b', { text: '你应该看到' }));
      expect.appendChild(util.el('span', { text: step.expect }));
      if (step.watch.length) {
        var chips = util.el('span', { className: 'step-watch' });
        step.watch.forEach(function (w) {
          chips.appendChild(util.el('i', { className: 'watch-chip', text: w }));
        });
        expect.appendChild(chips);
      }
      box.appendChild(expect);
    }

    if (step.gotcha.length) {
      var ul = util.el('ul', { className: 'step-gotcha' });
      step.gotcha.forEach(function (g) {
        ul.appendChild(util.el('li', { text: '⚠ ' + g }));
      });
      box.appendChild(ul);
    }

    return box;
  }

  /** 常见错误诊所 */
  function clinicBlock(items) {
    if (!items.length) return null;
    var box = util.el('details', { className: 'clinic' });
    var sum = util.el('summary');
    sum.appendChild(util.el('b', { text: '🩺 常见错误诊所' }));
    sum.appendChild(util.el('span', { className: 'muted', text: '报错先在这里找，别急着问人' }));
    box.appendChild(sum);

    items.forEach(function (c) {
      var row = util.el('div', { className: 'clinic-item' });
      row.appendChild(util.el('code', { className: 'clinic-err', text: c.err }));
      if (c.read) row.appendChild(util.el('p', { className: 'clinic-read', text: '怎么读：' + c.read }));
      if (c.fix) row.appendChild(util.el('p', { className: 'clinic-fix', text: '怎么修：' + c.fix }));
      box.appendChild(row);
    });
    return box;
  }

  /** 本节小抄 */
  function cheatBlock(items) {
    if (!items.length) return null;
    var box = util.el('details', { className: 'cheat' });
    var sum = util.el('summary');
    sum.appendChild(util.el('b', { text: '📋 本节小抄' }));
    sum.appendChild(util.el('span', { className: 'muted', text: '复习只看这张表就够了' }));
    box.appendChild(sum);

    var list = util.el('div', { className: 'cheat-list' });
    items.forEach(function (c) {
      var row = util.el('div', { className: 'cheat-row' });
      var code = util.el('code', { text: c.cmd });
      code.addEventListener('click', function () { openDict(c.cmd); });
      row.appendChild(code);
      row.appendChild(util.el('span', { text: c.mean }));
      list.appendChild(row);
    });
    box.appendChild(list);
    return box;
  }

  function lessonCard(lesson, index) {
    var card = util.el('article', { className: 'lesson' });

    var head = util.el('div', { className: 'lesson-head' });
    head.appendChild(util.el('span', { className: 'lesson-idx', text: String(index + 1) }));
    head.appendChild(util.el('h3', { text: lesson.title }));

    var done = LX.Progress.isLessonDone(lesson.id);
    var doneBtn = util.el('button', {
      className: 'lesson-done-btn' + (done ? ' is-on' : ''),
      text: done ? '✓ 已读' : '标记已读'
    });
    doneBtn.addEventListener('click', function () {
      var on = LX.Progress.toggleLesson(lesson.id);
      doneBtn.className = 'lesson-done-btn' + (on ? ' is-on' : '');
      doneBtn.textContent = on ? '✓ 已读' : '标记已读';
    });
    head.appendChild(doneBtn);
    card.appendChild(head);

    card.appendChild(util.el('div', { className: 'lesson-body', html: mdLite(lesson.body) }));

    var steps = lesson.steps || [];
    if (steps.length) {
      var box = util.el('div', { className: 'steps' });
      steps.forEach(function (step) { box.appendChild(stepCard(step)); });
      card.appendChild(box);
    }

    var clinic = clinicBlock(lesson.clinic || []);
    if (clinic) card.appendChild(clinic);

    var cheat = cheatBlock(lesson.cheat || []);
    if (cheat) card.appendChild(cheat);

    return card;
  }

  /* -------------------------------- 当天页面 -------------------------------- */

  function renderDay(day) {
    if (!dom.content) return;
    dom.content.innerHTML = '';

    var page = util.el('div', { className: 'page' });

    /* 头部：Day N · 时长 · 关卡进度 */
    var head = util.el('header', { className: 'day-head' });
    var kicker = util.el('div', { className: 'day-kicker' });
    kicker.appendChild(util.el('span', { text: day.label }));
    kicker.appendChild(util.el('span', { className: 'pill', text: '约 ' + day.minutes + ' 分钟' }));

    var stat = LX.Progress.dayStat(day.id);
    kicker.appendChild(util.el('span', {
      className: 'pill' + (stat.passed ? ' is-ok' : ''),
      text: '关卡 ' + stat.done + '/' + stat.total
    }));
    head.appendChild(kicker);
    head.appendChild(util.el('h1', { text: day.title }));
    if (day.goal) head.appendChild(util.el('p', { className: 'day-goal', text: day.goal }));
    page.appendChild(head);

    /* 当天导语 */
    if (day.intro) {
      page.appendChild(util.el('div', { className: 'lesson-body', html: mdLite(day.intro) }));
    }

    /* 小节 */
    (day.lessons || []).forEach(function (lesson, i) {
      page.appendChild(lessonCard(lesson, i));
    });

    /* 关卡 */
    var gates = util.el('section', { className: 'gates' });
    var ghead = util.el('div', { className: 'gates-head' });
    ghead.appendChild(util.el('h2', { text: '关卡验证' }));
    ghead.appendChild(util.el('span', {
      className: 'muted',
      text: '只检查结果，不检查命令 —— 目标达成就算过。'
    }));
    gates.appendChild(ghead);

    var banner = util.el('div', { className: 'done-banner', attrs: { id: 'doneBox' } });
    banner.style.display = 'none';
    gates.appendChild(banner);

    day.gates.forEach(function (gate) { gates.appendChild(gateCard(gate)); });
    page.appendChild(gates);

    /* 闭卷挑战：不计入 21 关，单独验证「能不能不看书自己做」 */
    if (day.challenge) {
      var csec = util.el('section', { className: 'gates challenge-sec' });
      var chead = util.el('div', { className: 'gates-head' });
      chead.appendChild(util.el('h2', { text: '闭卷挑战' }));
      chead.appendChild(util.el('span', {
        className: 'muted',
        text: '不看书、不给提示，独立完成。不计入 21 关，但会写进结业报告。'
      }));
      csec.appendChild(chead);
      csec.appendChild(gateCard(day.challenge, { challenge: true }));
      page.appendChild(csec);
    }

    /* 自测题：理解程度验证（答错进错题本） */
    if (LX.Quiz && LX.Quiz.renderDay) {
      var qsec = util.el('section', { className: 'quiz-sec', attrs: { id: 'quizSec' } });
      page.appendChild(qsec);
      LX.Quiz.renderDay(day.id, qsec);
    }

    /* 结业项目：最后一天才有 */
    if (day.project) page.appendChild(projectCard(day.project));

    /* 上下天 */
    var all = LX.Days.all();
    var idx = all.indexOf(day);
    var nav = util.el('nav', { className: 'day-nav' });
    if (idx > 0) {
      nav.appendChild(util.el('a', {
        className: 'ghost-btn',
        text: '← ' + all[idx - 1].label + ' · ' + all[idx - 1].title,
        attrs: { href: '#/' + all[idx - 1].id }
      }));
    }
    if (idx < all.length - 1) {
      nav.appendChild(util.el('a', {
        className: 'ghost-btn is-next',
        text: all[idx + 1].label + ' · ' + all[idx + 1].title + ' →',
        attrs: { href: '#/' + all[idx + 1].id }
      }));
    }
    if (nav.childNodes.length) page.appendChild(nav);

    dom.content.appendChild(page);
    updateBanner();
  }

  /**
   * 用最新结果刷新一张关卡卡片。
   * res 为 null 时现场判分（每次渲染都反映「此刻」的工作区状态）。
   * 判分通过但进度里还没记 → 顺手记一笔（自动判分只记通过，避免刷失败次数）。
   */
  function paintGate(card, gate, res) {
    var r = res || LX.Gate.evaluate(gate);
    if (r.ok && !LX.Progress.isGatePassed(gate.id)) LX.Progress.recordGate(r);

    /* 保留 is-challenge：卡片重绘时不能把"这是闭卷挑战"的标记洗掉 */
    var isChallenge = card.classList.contains('is-challenge');
    card.className = 'gate' + (isChallenge ? ' is-challenge' : '') + ' ' + (r.ok ? 'is-pass' : 'is-fail');

    var state = card.querySelector('.gate-state');
    if (state) {
      state.className = 'gate-state ' + (r.ok ? 'is-pass' : 'is-fail');
      state.textContent = r.ok ? '✓ 已通过' : '× 未通过';
    }

    var list = card.querySelector('.gate-checks');
    if (list) {
      list.innerHTML = '';
      r.results.forEach(function (item) {
        var li = util.el('li');
        li.appendChild(util.el('span', {
          className: 'check-mark ' + (item.ok ? 'ok' : 'no'),
          text: item.ok ? '✓' : '×'
        }));
        var text = util.el('span', { className: 'check-text' + (item.ok ? '' : ' is-bad') });
        text.appendChild(document.createTextNode(item.why));
        if (item.got) text.appendChild(util.el('span', { className: 'check-got', text: item.got }));
        li.appendChild(text);
        list.appendChild(li);
      });
    }

    var note = card.querySelector('.gate-note');
    if (note) {
      var miss = r.results.filter(function (x) { return !x.ok; }).length;
      note.textContent = r.ok ? '这一关已经过了' : '还有 ' + miss + ' 项没满足';
    }

    var hint = card.querySelector('.gate-hint');
    if (hint) hint.style.display = r.ok ? 'none' : '';
  }

  function gateCard(gate, opts) {
    var o = opts || {};
    var card = util.el('article', { className: 'gate' + (o.challenge ? ' is-challenge' : ''), attrs: { 'data-gate': gate.id } });

    var head = util.el('div', { className: 'gate-head' });
    head.appendChild(util.el('h3', { text: (o.challenge ? '🔒 ' : '') + gate.title }));
    head.appendChild(util.el('span', { className: 'gate-state is-idle', text: '待验证' }));
    card.appendChild(head);

    if (gate.brief) card.appendChild(util.el('p', { className: 'gate-brief', text: gate.brief }));

    card.appendChild(util.el('ul', { className: 'gate-checks' }));

    var actions = util.el('div', { className: 'gate-actions' });
    var btn = util.el('button', {
      className: 'gate-check-btn',
      text: o.challenge ? '提交挑战结果' : '检查这一关'
    });
    btn.addEventListener('click', function () {
      var res = LX.Gate.evaluate(gate);
      var rec = LX.Progress.recordGate(res); // 手动检查：成功失败都记
      paintGate(card, gate, res);
      updateBanner();
      renderSidebar();
      renderChrome();
      if (res.ok) toast(rec && rec.first ? '🎉 第一遍就通过：' + gate.title : '✅ 通过：' + gate.title);
      else toast('还差一点，看每项下面的红字');
    });
    actions.appendChild(btn);
    actions.appendChild(util.el('span', { className: 'gate-note muted', text: '' }));
    card.appendChild(actions);

    var hints = (gate.hints || []).filter(Boolean);
    if (hints.length && o.challenge) {
      /* 闭卷挑战：提示默认折叠，点了就记一笔（报告里会显示「借助提示」） */
      var box = util.el('details', { className: 'gate-hint is-locked' });
      var sum = util.el('summary', { text: '🔓 我要提示（会被记录在报告里）' });
      box.appendChild(sum);
      var ul = util.el('ul');
      hints.forEach(function (h) { ul.appendChild(util.el('li', { text: h })); });
      box.appendChild(ul);
      box.addEventListener('toggle', function () {
        if (box.hasAttribute('open')) LX.Progress.markHint(gate.id);
      });
      card.appendChild(box);
    } else if (hints.length) {
      var hint = util.el('div', { className: 'gate-hint' });
      hint.appendChild(util.el('b', { text: '卡住了？' }));
      var list = util.el('ul');
      hints.forEach(function (h) { list.appendChild(util.el('li', { text: h })); });
      hint.appendChild(list);
      card.appendChild(hint);
    }

    /* 闭卷挑战：参考答案默认折叠，展开会记录（别自欺欺人） */
    if (o.challenge && (gate.solution || []).length) {
      var ans = util.el('details', { className: 'gate-answer' });
      ans.appendChild(util.el('summary', { text: '🧯 实在做不出来：看参考答案（展开会被记录）' }));
      var ol = util.el('ol');
      gate.solution.forEach(function (line) { ol.appendChild(util.el('li', { text: line })); });
      ans.appendChild(ol);
      ans.addEventListener('toggle', function () {
        if (ans.hasAttribute('open')) LX.Progress.markHint(gate.id);
      });
      card.appendChild(ans);
    }

    paintGate(card, gate, null);
    return card;
  }

  /** 结业项目：每一项都用真实命令证明，而不是自己打勾 */
  function projectCard(project) {
    var sec = util.el('section', { className: 'gates project-sec' });
    var head = util.el('div', { className: 'gates-head' });
    head.appendChild(util.el('h2', { text: '🏁 ' + project.title }));
    head.appendChild(util.el('span', { className: 'muted', text: '每一项都要你去跑命令证明' }));
    sec.appendChild(head);
    if (project.brief) sec.appendChild(util.el('p', { className: 'gate-brief', text: project.brief }));

    var stat = util.el('p', { className: 'prj-stat muted', text: '' });
    sec.appendChild(stat);

    function refreshStat() {
      var done = project.items.filter(function (it) { return LX.Progress.quizStat(it.id).ok; }).length;
      stat.textContent = '已完成 ' + done + ' / ' + project.items.length + ' 项' +
        (done === project.items.length ? '　🎉 项目可以写进简历了' : '');
    }

    project.items.forEach(function (it, i) {
      var row = util.el('article', { className: 'prj-item', attrs: { 'data-prj': it.id } });
      var top = util.el('div', { className: 'prj-head' });
      top.appendChild(util.el('span', { className: 'prj-no', text: String(i + 1) }));
      top.appendChild(util.el('p', { className: 'prj-text', text: it.text }));
      var btn = util.el('button', { className: 'gate-check-btn', text: '检查' });
      top.appendChild(btn);
      row.appendChild(top);

      var ul = util.el('ul', { className: 'gate-checks' });
      row.appendChild(ul);
      if (it.hint) row.appendChild(util.el('p', { className: 'prj-hint muted', text: '提示：' + it.hint }));

      function paint(res) {
        var r = res || LX.Gate.evaluate({
          id: it.id,
          scenario: (currentDay && currentDay.scenario) || 'ai-lab',
          checks: it.checks
        });
        var done = LX.Progress.quizStat(it.id).ok;
        if (r.ok && !done) LX.Progress.recordQuiz(it.id, true);
        else if (res) LX.Progress.recordQuiz(it.id, !!r.ok);

        row.className = 'prj-item ' + (r.ok ? 'is-pass' : 'is-fail');
        ul.innerHTML = '';
        r.results.forEach(function (c) {
          var li = util.el('li');
          li.appendChild(util.el('span', {
            className: 'check-mark ' + (c.ok ? 'ok' : 'no'),
            text: c.ok ? '✓' : '×'
          }));
          var text = util.el('span', { className: 'check-text' + (c.ok ? '' : ' is-bad') });
          text.appendChild(document.createTextNode(c.why));
          if (c.got) text.appendChild(util.el('span', { className: 'check-got', text: c.got }));
          li.appendChild(text);
          ul.appendChild(li);
        });
        refreshStat();
      }

      btn.addEventListener('click', function () { paint(null); renderChrome(); });
      paint(null);
      sec.appendChild(row);
    });

    refreshStat();
    return sec;
  }

  function refreshGates() {
    if (!currentDay || !dom.content) return;
    var map = {};
    currentDay.gates.forEach(function (g) { map[g.id] = g; });
    if (currentDay.challenge) map[currentDay.challenge.id] = currentDay.challenge;

    util.$$('.gate', dom.content).forEach(function (card) {
      var gate = map[card.getAttribute('data-gate')];
      if (gate) paintGate(card, gate, null);
    });

    updateBanner();
    renderSidebar();
    renderChrome();
  }

  /** 「今天全通关」横幅 */
  function updateBanner() {
    var box = dom.content ? dom.content.querySelector('#doneBox') : null;
    if (!box || !currentDay) return;

    var stat = LX.Progress.dayStat(currentDay.id);
    box.innerHTML = '';
    if (!stat.passed) { box.style.display = 'none'; return; }

    box.style.display = '';
    box.appendChild(util.el('span', { text: '🎉 ' + currentDay.label + ' 全部通过' }));

    var all = LX.Days.all();
    var next = all[all.indexOf(currentDay) + 1];
    if (next) {
      box.appendChild(util.el('a', { text: '进入 ' + next.label + ' →', attrs: { href: '#/' + next.id } }));
    } else {
      box.appendChild(util.el('a', {
        text: '打开结业报告 →',
        attrs: { href: '#', id: 'bannerReport' }
      }));
      var link = box.querySelector('#bannerReport');
      if (link) {
        link.addEventListener('click', function (ev) { ev.preventDefault(); openReport(); });
      }
    }
  }

  /* -------------------------------- 报告弹层 -------------------------------- */

  function openReport() {
    if (!dom.reportModal) return;
    if (dom.reportName) dom.reportName.value = LX.Progress.settings().name || '';
    LX.Report.render(dom.reportBody);
    dom.reportModal.classList.add('is-open');
    closeSidenav();
  }

  function closeReport() {
    if (dom.reportModal) dom.reportModal.classList.remove('is-open');
  }

  function saveName() {
    if (!dom.reportName) return '';
    var name = String(dom.reportName.value || '').trim().slice(0, 24);
    LX.Progress.saveSettings({ name: name });
    return name;
  }



  /* -------------------------------- 预备课页 -------------------------------- */

  function renderStart() {
    if (!dom.content) return;
    dom.content.innerHTML = '';

    var data = LX.Start || null;
    var page = util.el('div', { className: 'page' });

    var head = util.el('div', { className: 'page-head' });
    head.appendChild(util.el('h1', { text: data ? data.title : '开课前 10 分钟' }));
    head.appendChild(util.el('span', {
      className: 'muted',
      text: data ? '约 ' + (data.minutes || 10) + ' 分钟 · 不用装任何东西' : '数据没加载'
    }));
    page.appendChild(head);

    if (!data) {
      page.appendChild(util.el('p', { className: 'muted', text: '预备课数据（js/data/d0.js）没有加载成功。' }));
      dom.content.appendChild(page);
      return;
    }

    if (data.goal) page.appendChild(util.el('p', { className: 'page-intro', text: data.goal }));
    if (data.intro) page.appendChild(util.el('div', { className: 'lesson-body', html: mdLite(data.intro) }));

    (data.lessons || []).forEach(function (l, i) {
      page.appendChild(lessonCard(LX.Days.normLesson(l, i, 'd0'), i));
    });

    var nav = util.el('nav', { className: 'day-nav' });
    nav.appendChild(util.el('a', {
      className: 'ghost-btn is-next',
      text: '开始 Day 1 · 项目地基 →',
      attrs: { href: '#/d1' }
    }));
    page.appendChild(nav);

    dom.content.appendChild(page);
  }

  /* -------------------------------- 路由 -------------------------------- */

  function route() {
    var hash = String(location.hash || '').replace(/^#\/?/, '');

    /* 词典：#/dict（不切工作区、不覆盖 lastDay） */
    if (hash === 'dict') {
      currentPage = 'dict';
      currentDay = null;
      if (LX.Dict) LX.Dict.page(dom.content);
      renderSidebar();
      renderChrome();
      closeSidenav();
      window.scrollTo(0, 0);
      return;
    }

    /* 预备课：#/start（工作区固定用 ai-lab，只读不写） */
    if (hash === 'start' || hash === 'd0') {
      currentPage = 'start';
      currentDay = null;
      currentScenario = 'ai-lab';
      if (LX.Term && LX.Term.useScenario) LX.Term.useScenario(currentScenario);
      renderStart();
      renderSidebar();
      renderChrome();
      closeSidenav();
      window.scrollTo(0, 0);
      return;
    }

    var day = (hash && LX.Days.get(hash)) || LX.Days.get(LX.Progress.getLastDay()) || LX.Days.first();
    if (!day) {
      currentPage = 'day';
      dom.content.innerHTML = '<p class="muted">还没有课程数据：js/data/d1.js ~ d7.js 没有加载成功。</p>';
      return;
    }

    currentPage = 'day';
    currentDay = day;
    currentScenario = day.scenario;
    LX.Progress.setLastDay(day.id);
    renderDay(day);
    if (LX.Term && LX.Term.useScenario) LX.Term.useScenario(day.scenario);
    renderSidebar();
    renderChrome();
    closeSidenav();
    window.scrollTo(0, 0);
  }

  /* -------------------------------- 事件绑定 -------------------------------- */

  function bind() {
    if (dom.btnTheme) dom.btnTheme.addEventListener('click', toggleTheme);
    if (dom.btnReport) dom.btnReport.addEventListener('click', openReport);
    if (dom.btnMenu) dom.btnMenu.addEventListener('click', toggleSidenav);
    if (dom.fab) {
      dom.fab.addEventListener('click', function () {
        if (LX.Term.isOpen()) LX.Term.close();
        else LX.Term.open(currentDay ? currentDay.scenario : null);
      });
    }

    if (dom.reportClose) dom.reportClose.addEventListener('click', closeReport);
    if (dom.reportModal) {
      dom.reportModal.addEventListener('click', function (ev) {
        if (ev.target === dom.reportModal) closeReport();
      });
    }

    if (dom.reportName) {
      dom.reportName.addEventListener('change', function () {
        saveName();
        LX.Report.render(dom.reportBody);
      });
    }

    if (dom.reportCopy) {
      dom.reportCopy.addEventListener('click', function () {
        saveName();
        util.copy(LX.Report.text()).then(function () {
          toast('Markdown 已复制，可以粘到笔记里');
        }, function () {
          toast('复制失败，可以点「下载 .md」');
        });
      });
    }

    if (dom.reportDownload) {
      dom.reportDownload.addEventListener('click', function () {
        saveName();
        LX.Report.download();
        toast('已下载 ai-dev-7days-report.md');
      });
    }


    if (dom.btnResetAll) {
      dom.btnResetAll.addEventListener('click', function () {
        var ok = window.confirm('清空全部进度？\n\n关卡状态、小节标记和沙盒工作区都会重置。此操作不可撤销。');
        if (!ok) return;
        var keep = currentDay ? currentDay.id : 'd1';
        LX.Progress.resetAll();
        // 沙盒引擎在内存里：进度清空后重载页面 = 干净的 0 天
        setTimeout(function () {
          location.hash = '#/' + keep;
          location.reload();
        }, 50);
      });
    }

    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', route);

    /* 进度变化 → 顶栏 + 侧栏（内容区由具体操作自己刷新，避免打断输入） */
    LX.Progress.onChange(function () {
      renderChrome();
      renderSidebar();
    });

    /* 每执行一条命令 → 自动重新判分（这就是「不用点检查」的来源） */
    if (LX.Term && LX.Term.onRun) LX.Term.onRun(function () { refreshGates(); });
  }

  function onKey(ev) {
    var tag = (ev.target && ev.target.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (ev.key === 'Escape') {
      if (dom.reportModal && dom.reportModal.classList.contains('is-open')) { closeReport(); return; }
      if (dom.sidenav && dom.sidenav.classList.contains('is-open')) { closeSidenav(); return; }
      if (LX.Dict && LX.Dict.isOpen && LX.Dict.isOpen()) { LX.Dict.close(); return; }
      /* 全屏优先退出全屏：输入框里按 Esc 也是这个语义，所以放在 typing 判断之前 */
      if (LX.Term && LX.Term.isFull && LX.Term.isFull()) { LX.Term.setFull(false); return; }
      if (LX.Term && LX.Term.isOpen() && !typing) { LX.Term.close(); return; }
      return;
    }

    /* Ctrl+Shift+F：终端全屏开关（浏览器里不冲突，也不会误触） */
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && (ev.key === 'F' || ev.key === 'f')) {
      ev.preventDefault();
      if (!LX.Term.isOpen()) LX.Term.open(currentDay ? currentDay.scenario : null);
      LX.Term.setFull();
      return;
    }

    if (typing) return;

    if (ev.key === '~' || ev.key === '`') {
      ev.preventDefault();
      if (LX.Term.isOpen()) LX.Term.close();
      else LX.Term.open(currentDay ? currentDay.scenario : null);
    }
  }

  /* -------------------------------- 启动 -------------------------------- */

  function cacheDom() {
    dom.content = $('#content');
    dom.dayList = $('#dayList');
    dom.sideExtra = $('#sideExtra');
    dom.sidenav = $('#sidenav');
    dom.ring = $('#ring');
    dom.ringText = $('#ringText');
    dom.topStat = $('#topStat');
    dom.topDay = $('#topDay');
    dom.btnMenu = $('#btnMenu');
    dom.btnReport = $('#btnReport');
    dom.btnTheme = $('#btnTheme');
    dom.btnResetAll = $('#btnResetAll');
    dom.fab = $('#termFab');
    dom.toast = $('#toast');
    dom.reportModal = $('#reportModal');
    dom.reportBody = $('#reportBody');
    dom.reportName = $('#reportName');
    dom.reportClose = $('#reportClose');
    dom.reportCopy = $('#reportCopy');
    dom.reportDownload = $('#reportDownload');
  }

  function boot() {
    cacheDom();
    applyTheme(LX.Progress.settings().theme);

    if (LX.Term && LX.Term.init) {
      LX.Term.init();
      // 终端先切到当天的沙盒工作区，第一次打开就是对的场景
      var first = LX.Days.get(LX.Progress.getLastDay()) || LX.Days.first();
      if (first) LX.Term.reset(first.scenario);
    }

    bind();
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);

