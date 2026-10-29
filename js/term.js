/* =============================================================================
 * js/term.js
 * -----------------------------------------------------------------------------
 * 沙盒终端的界面层（方案 D 的"脸"）
 *
 *   · 把 js/sandbox.js 的 Engine 接到一个可输入的终端面板上
 *   · 支持：回车执行、↑/↓ 翻历史、Tab 补全、Ctrl+L 清屏、Ctrl+C 取消
 *   · 课程联动：小节里的「▶ 运行」由 js/app.js 调 LX.Term.exec(line) 送进来
 *
 * 与 sandbox.js 的分工：本文件只管 DOM，不解析任何命令。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  var refs = { panel: null, out: null, input: null, prompt: null, scenario: null, fab: null };

  var engine = null;
  var scenario = 'home';
  var historyIdx = -1;

  /* 每个工作区各自保留一个引擎：切到别的天再切回来，之前做的文件都还在 */
  var engines = {};

  /* 每条命令执行后的回调（js/app.js 用它自动重新判分，无需手动点「检查」） */
  var runHooks = [];

  function fireRun(info) {
    for (var i = 0; i < runHooks.length; i++) {
      try { runHooks[i](info); } catch (err) { /* 回调出错不影响终端 */ }
    }
  }

  /* -------------------------------- 小工具 -------------------------------- */

  function trimEnd(text) {
    return String(text == null ? '' : text).replace(/\n+$/, '');
  }

  function scrollToEnd() {
    if (refs.out) refs.out.scrollTop = refs.out.scrollHeight;
  }

  /** 取（必要时创建）某个工作区的引擎，缓存在 engines 里 */
  function engineFor(name) {
    var want = name || 'home';
    if (!engines[want]) engines[want] = LX.Sandbox.create(want);
    return engines[want];
  }

  function ensureEngine(nextScenario) {
    var want = nextScenario || scenario || 'home';
    if (!engine || want !== engine.scenario) {
      engine = engineFor(want);
      scenario = want;
      if (refs.scenario) refs.scenario.textContent = LX.Sandbox.label(want);
    }
    return engine;
  }

  function updatePrompt() {
    if (refs.prompt) refs.prompt.textContent = ensureEngine().prompt();
  }

  /* -------------------------------- 输出渲染 -------------------------------- */

  function block(className) {
    var el = util.el('div', { className: 't-block' + (className ? ' ' + className : '') });
    if (refs.out) refs.out.appendChild(el);
    return el;
  }

  /** 提示 / 公告行 */
  function printLine(text, cls) {
    block(cls).appendChild(util.el('div', { className: 't-note', text: text }));
    scrollToEnd();
  }

  /** 执行一条命令并渲染结果 */
  function execLine(line) {
    var text = String(line == null ? '' : line).trim();
    if (!text) return null;

    var e = ensureEngine();
    var promptText = e.prompt();
    var result = e.run(text);

    if (result.clear) {
      clearOutput();
      updatePrompt();
      return result;
    }

    var wrap = block();
    var cmdLine = util.el('div', { className: 't-cmd-line' });
    cmdLine.appendChild(util.el('span', { className: 't-prompt', text: promptText }));
    cmdLine.appendChild(util.el('span', { className: 't-cmd', text: text }));
    wrap.appendChild(cmdLine);

    if (result.out) wrap.appendChild(util.el('pre', { className: 't-stdout', text: trimEnd(result.out) }));
    if (result.err) wrap.appendChild(util.el('pre', { className: 't-stderr', text: trimEnd(result.err) }));

    scrollToEnd();
    updatePrompt();
    fireRun({ line: text, code: result.code, scenario: e.scenario });
    return result;
  }

  function clearOutput() {
    if (refs.out) refs.out.innerHTML = '';
  }

  function welcome() {
    var e = ensureEngine();
    clearOutput();
    var head = block('is-welcome');
    head.appendChild(util.el('div', {
      className: 't-banner-title',
      text: '🖥️ AI 沙盒终端 · ' + LX.Sandbox.label(e.scenario)
    }));
    head.appendChild(util.el('div', {
      className: 't-banner-text',
      text: '文件系统完全在你的浏览器内存里：随便 rm -rf，刷新页面或点 ⟳ 就能复原。不联网、不碰真实文件。'
    }));
    head.appendChild(util.el('div', {
      className: 't-banner-text',
      text: '试试：ls -la　cat train.csv　conda env list　pip install -r requirements.txt　git status　help'
    }));
    scrollToEnd();
  }
  /* ------------------------------- 交互逻辑 ------------------------------- */

  function submit() {
    if (!refs.input) return;
    var value = refs.input.value;
    refs.input.value = '';
    historyIdx = -1;
    execLine(value);
  }

  function historyStep(dir) {
    var list = ensureEngine().history;
    if (!list.length) return;
    if (historyIdx === -1) historyIdx = dir < 0 ? list.length - 1 : list.length;
    else historyIdx += dir;
    if (historyIdx < 0) historyIdx = 0;
    if (historyIdx >= list.length) { historyIdx = list.length; refs.input.value = ''; return; }
    refs.input.value = list[historyIdx];
    setTimeout(function () {
      try { refs.input.setSelectionRange(refs.input.value.length, refs.input.value.length); } catch (e) { /* ignore */ }
    }, 0);
  }

  function complete() {
    var value = refs.input.value;
    var candidates = ensureEngine().complete(value);
    if (!candidates.length) return;

    if (candidates.length === 1) {
      var parts = value.split(/\s+/);
      parts[parts.length - 1] = candidates[0];
      refs.input.value = parts.join(' ');
      return;
    }

    /* 多个候选：先补公共前缀，再把候选列出来 */
    var common = candidates[0];
    candidates.forEach(function (c) {
      var i = 0;
      while (i < common.length && i < c.length && common.charAt(i) === c.charAt(i)) i += 1;
      common = common.slice(0, i);
    });
    var parts2 = value.split(/\s+/);
    var last = parts2[parts2.length - 1] || '';
    if (common.length > last.length) {
      parts2[parts2.length - 1] = common;
      refs.input.value = parts2.join(' ');
    }
    printLine(candidates.join('   '), 'is-hint');
  }

  /* --------------------------- 面板：拖动 / 全屏 / 字号 --------------------------- */

  var MIN_W = 340;
  var MIN_H = 150;
  var FONT_BASE = 13;

  function termSettings() {
    return (LX.Progress && LX.Progress.settings) ? (LX.Progress.settings().term || {}) : {};
  }

  function saveTerm(patch) {
    if (!LX.Progress || !LX.Progress.saveSettings) return;
    var cur = termSettings();
    LX.Progress.saveSettings({
      term: {
        w: patch.w != null ? patch.w : (cur.w || 0),
        h: patch.h != null ? patch.h : (cur.h || 0),
        fs: patch.fs != null ? patch.fs : (cur.fs || 0),
        full: patch.full != null ? !!patch.full : !!cur.full
      }
    });
  }

  function clampSize(w, h) {
    var maxW = Math.max(MIN_W, window.innerWidth - 20);
    var maxH = Math.max(MIN_H, window.innerHeight - 90);
    return {
      w: Math.round(Math.min(maxW, Math.max(MIN_W, w))),
      h: Math.round(Math.min(maxH, Math.max(MIN_H, h)))
    };
  }

  /** w/h 传 0 或不传 = 回到 CSS 默认尺寸 */
  function applySize(w, h) {
    if (!refs.panel) return;
    if (w && h) {
      var c = clampSize(w, h);
      refs.panel.style.width = c.w + 'px';
      refs.panel.style.height = c.h + 'px';
    } else {
      refs.panel.style.width = '';
      refs.panel.style.height = '';
    }
  }

  function applyFont(fs) {
    if (!refs.panel || !fs) return;
    refs.panel.style.setProperty('--term-fs', fs + 'px');
  }

  function paintFullBtn(on) {
    var btn = util.$('#termFull');
    if (!btn) return;
    if (on) btn.classList.add('is-on'); else btn.classList.remove('is-on');
    btn.setAttribute('title', on ? '退出全屏（Esc）' : '全屏（Ctrl+Shift+F）');
    btn.setAttribute('aria-label', on ? '退出全屏' : '全屏');
  }

  /** 全屏开关；不传参 = 切换 */
  function setFull(on) {
    if (!refs.panel) return false;
    var want = (on == null) ? !refs.panel.classList.contains('is-full') : !!on;
    if (want) refs.panel.classList.add('is-full');
    else refs.panel.classList.remove('is-full');
    paintFullBtn(want);
    saveTerm({ full: want });
    if (want && refs.input) refs.input.focus();
    return want;
  }

  function bumpFont(delta) {
    var cur = termSettings().fs || FONT_BASE;
    var fs = Math.min(20, Math.max(11, cur + delta));
    applyFont(fs);
    saveTerm({ fs: fs });
    return fs;
  }

  /** 三档高度快捷（手机上比拖拽顺手）：s=小 m=中 l=大 */
  function presetHeight(kind) {
    if (!refs.panel) return;
    var vh = { s: 240, m: Math.round(window.innerHeight * 0.58), l: Math.round(window.innerHeight * 0.86) };
    var w = Math.round(refs.panel.getBoundingClientRect().width) || 760;
    var h = vh[kind] || 320;
    applySize(w, h);
    var c = clampSize(w, h);
    saveTerm({ w: c.w, h: c.h });
  }

  /**
   * 拖拽把手：mode='h' 只改高度（顶部横条），mode='d' 同时改宽高（左上角）
   * 用 pointer 事件，鼠标 + 触屏都能用。
   */
  function wireDrag(el, mode) {
    if (!el || !refs.panel) return;
    var start = null;

    el.addEventListener('pointerdown', function (ev) {
      if (refs.panel.classList.contains('is-full')) return;
      ev.preventDefault();
      var rect = refs.panel.getBoundingClientRect();
      start = { x: ev.clientX, y: ev.clientY, w: rect.width, h: rect.height };
      if (el.setPointerCapture) {
        try { el.setPointerCapture(ev.pointerId); } catch (e) { /* 老浏览器忽略 */ }
      }
      document.body.classList.add('is-panel-resizing');
    });

    el.addEventListener('pointermove', function (ev) {
      if (!start) return;
      var h = start.h + (start.y - ev.clientY);   /* 面板贴底：往上拖 = 变高 */
      var w = (mode === 'd') ? start.w + (start.x - ev.clientX) : start.w;
      applySize(w, h);                            /* 左上角：往左拖 = 变宽 */
    });

    function finish() {
      if (!start) return;
      start = null;
      document.body.classList.remove('is-panel-resizing');
      var r = refs.panel.getBoundingClientRect();
      if (r.width && r.height) {
        var c = clampSize(r.width, r.height);
        saveTerm({ w: c.w, h: c.h });
      }
    }

    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
    el.addEventListener('lostpointercapture', finish);
  }

  function wirePanelUi() {
    var t = termSettings();
    if (t.w && t.h) applySize(t.w, t.h);
    if (t.fs) applyFont(t.fs);
    if (t.full) setFull(true);

    wireDrag(util.$('#termGrip'), 'h');
    wireDrag(util.$('#termGripCorner'), 'd');

    var full = util.$('#termFull');
    if (full) full.addEventListener('click', function () { setFull(); });

    var fontUp = util.$('#termFontUp');
    if (fontUp) fontUp.addEventListener('click', function () { bumpFont(1); });
    var fontDown = util.$('#termFontDown');
    if (fontDown) fontDown.addEventListener('click', function () { bumpFont(-1); });

    util.$$('[data-term-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        presetHeight(btn.getAttribute('data-term-size'));
        if (refs.input) refs.input.focus();
      });
    });

    var copyBtn = util.$('#termCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = Term.copyOutput();
        if (text && LX.util.copy) {
          LX.util.copy(text).then(function () {
            copyBtn.textContent = '已复制';
            setTimeout(function () { copyBtn.textContent = '复制'; }, 1200);
          }, function () { copyBtn.textContent = '复制失败'; });
        }
      });
    }

    /* 双击标题栏 = 全屏/退出（按钮上双击不算） */
    var head = refs.panel ? refs.panel.querySelector('.term-head') : null;
    if (head) {
      head.addEventListener('dblclick', function (ev) {
        if (ev.target && ev.target.closest && ev.target.closest('button')) return;
        setFull();
      });
    }

    /* 窗口尺寸变化时，别让面板超出可见区域 */
    window.addEventListener('resize', function () {
      if (!refs.panel || refs.panel.classList.contains('is-full')) return;
      var r = refs.panel.getBoundingClientRect();
      if (r.width && r.height) applySize(r.width, r.height);
    });
  }

  /* ------------------------------- 公共接口 ------------------------------- */

  var Term = {
    init: function (options) {
      var opts = options || {};
      refs.panel = opts.panel || util.$('#termPanel');
      refs.out = opts.out || util.$('#termOut');
      refs.input = opts.input || util.$('#termInput');
      refs.prompt = opts.prompt || util.$('#termPrompt');
      refs.scenario = opts.scenario || util.$('#termScenario');
      refs.fab = opts.fab || util.$('#termFab');

      if (refs.input) {
        refs.input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            historyStep(-1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            historyStep(1);
          } else if (e.key === 'Tab') {
            e.preventDefault();
            complete();
          } else if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
            e.preventDefault();
            clearOutput();
          } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            printLine((refs.input.value || '') + '^C', 'is-hint');
            refs.input.value = '';
          }
        });
      }

      if (refs.out) {
        refs.out.addEventListener('click', function () {
          if (refs.input) refs.input.focus();
        });
      }

      var closeBtn = util.$('#termClose');
      if (closeBtn) closeBtn.addEventListener('click', function () { Term.close(); });

      var resetBtn = util.$('#termReset');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          Term.reset(scenario);
          if (refs.input) refs.input.focus();
        });
      }

      var helpBtn = util.$('#termHelp');
      if (helpBtn) {
        helpBtn.addEventListener('click', function () {
          execLine('help');
          if (refs.input) refs.input.focus();
        });
      }

      updatePrompt();
      wirePanelUi();
      return this;
    },

    /** 打开终端（可同时切换工作区） */
    open: function (nextScenario) {
      if (refs.panel) refs.panel.classList.add('is-open');
      ensureEngine(nextScenario);
      if (!refs.out || !refs.out.childNodes.length) welcome();
      updatePrompt();
      if (refs.input) refs.input.focus();
      return this;
    },

    close: function () {
      if (refs.panel) refs.panel.classList.remove('is-open');
    },

    toggle: function () {
      if (Term.isOpen()) Term.close();
      else Term.open();
    },

    isOpen: function () {
      return !!(refs.panel && refs.panel.classList.contains('is-open'));
    },

    /* ---------------------- 面板尺寸 / 全屏 / 字号 ---------------------- */

    /** 手动设置尺寸（像素）；传 0/0 恢复默认 */
    setSize: function (w, h) {
      applySize(w, h);
      if (w && h) {
        var c = clampSize(w, h);
        saveTerm({ w: c.w, h: c.h });
      }
      return this;
    },

    /** 开关全屏（不传参 = 切换） */
    setFull: function (on) {
      return setFull(on);
    },

    isFull: function () {
      return !!(refs.panel && refs.panel.classList.contains('is-full'));
    },

    /** 字号 +/-（delta 为 +1 / -1），返回新字号 */
    bumpFont: function (delta) {
      return bumpFont(delta || 1);
    },

    /** 把整屏输出取成纯文本（复制按钮 / 贴给 AI 用） */
    copyOutput: function () {
      if (!refs.out) return '';
      return String(refs.out.innerText || refs.out.textContent || '');
    },

    /** 外部直接执行一条命令（可指定工作区，保证命令落在当天那个沙盒里） */
    exec: function (line, nextScenario) {
      Term.open(nextScenario);
      return execLine(line);
    },

    /** 只切换工作区，不改终端的开关状态（路由切天时调用） */
    useScenario: function (nextScenario) {
      var want = nextScenario || scenario;
      if (want !== scenario) {
        ensureEngine(want);
        welcome();   /* 换工作区 = 换一套文件系统，旧输出留着会误导 */
      }
      return Term;
    },

    /** 重置为指定工作区（丢掉缓存里的那个引擎，从场景初始状态重来） */
    reset: function (nextScenario) {
      scenario = nextScenario || scenario;
      engines[scenario] = LX.Sandbox.create(scenario);
      engine = engines[scenario];
      welcome();
      updatePrompt();
      fireRun({ line: null, reset: true, code: 0, scenario: scenario });
      return this;
    },

    /** 命令执行后的回调（app.js 用它自动重新判分） */
    onRun: function (fn) {
      if (typeof fn === 'function') runHooks.push(fn);
      return Term;
    },

    /** 取某个工作区的引擎（Gate 判分用；不存在时创建） */
    engineFor: function (name) {
      return engineFor(name);
    },

    /** 当前引擎（调试 / 测试用） */
    engine: function () { return engine; }
  };

  LX.Term = Term;
})(window);
