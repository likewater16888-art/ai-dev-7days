/* =============================================================================
 * js/gate.js
 * -----------------------------------------------------------------------------
 * Gate（关卡）验证引擎：只在「看结果」，不比对用户敲了什么命令。
 *
 * 判分方式：拿到当天工作区的引擎 → 逐条跑 checks → 全过才算通关。
 * 由于检查的是**终态**（文件是否存在、内容是否包含、conda 环境里装了什么、
 * 仓库提交历史……），同一道关有多种解法都能过，符合真实开发的体验。
 *
 * 内置断言类型（checks[i].t）：
 *   dir        目录存在                     { path }
 *   file       文件存在（可校验内容）        { path, contains?, regex?, minBytes?, lines? }
 *   absent     路径不存在                    { path }
 *   exec       文件有可执行位                { path }
 *   mode       权限数值                      { path, expect: '755' | 493 }
 *   link       软链接（可指定目标）          { path, target? }
 *   aiEnv      conda 环境存在（可校验 py）   { name, py? }
 *   aiActive   当前激活的环境                { name }
 *   aiPkg      环境里装了某个包装了什么版本   { env?, name, version? }
 *   aiRepo     git 仓库状态                  { path?, commits?, message?, remote?, branch?, clean? }
 *   aiDownload 模型已下载                    { repo?, dir? }
 *   aiSession  后台/服务会话                 { name }
 *   aiGpu      显存占用                      { minMB }
 *   custom     自定义函数                    { fn(engine) → true|string }
 *
 * 每条 check 都可以写 why 作为「没通过时给用户看的说明」。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  /** 界面文案（js/i18n.js）；没加载 i18n 时退回中文原文 */
  function t(key, vars) {
    return (LX.I18N && LX.I18N.t) ? LX.I18N.t(key, vars) : String(key);
  }

  /* ------------------------------ 基础工具 ------------------------------ */

  function engineOf(scenario) {
    if (LX.Term && typeof LX.Term.engineFor === 'function') return LX.Term.engineFor(scenario);
    return LX.Sandbox.create(scenario);
  }

  function nodeAt(e, p) {
    try { return e.node(p); } catch (err) { return null; }
  }

  function textAt(e, p) {
    try { return e.readFile(p); } catch (err) { return null; }
  }

  /** 人类可读的路径：/home/student/a → ~/a */
  function prettyPath(e, p) {
    var home = (LX.Sandbox.me || {}).home || '/home/student';
    var abs = p;
    try { abs = e.abs(p); } catch (err) { /* keep raw */ }
    if (abs === home) return '~';
    if (abs.indexOf(home + '/') === 0) return '~' + abs.slice(home.length);
    return abs;
  }

  function humanSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  /** 递归列出仓库工作区的文件（相对路径），跳过 .git */
  function workFiles(e, repoAbs, prefix, out) {
    out = out || [];
    prefix = prefix || '';
    var names = [];
    try { names = e.listNames(repoAbs, true); } catch (err) { names = []; }
    names.forEach(function (name) {
      if (name === '.git') return;
      var abs = repoAbs + '/' + name;
      var node = nodeAt(e, abs);
      if (!node) return;
      if (node.type === 'dir') workFiles(e, abs, prefix + name + '/', out);
      else out.push(prefix + name);
    });
    return out;
  }

  /** 仓库状态：{ st, untracked, modified, clean } */
  function repoStatus(e, repoAbs) {
    var a = e.ai || {};
    var st = (a.repos || {})[repoAbs];
    if (!st) return null;
    var work = workFiles(e, repoAbs, '');
    var untracked = work.filter(function (f) {
      return !Object.prototype.hasOwnProperty.call(st.index || {}, f);
    });
    var modified = Object.keys(st.index || {}).filter(function (f) {
      var now = textAt(e, repoAbs + '/' + f);
      return now === null || now !== (st.snapshot || {})[f];
    });
    var deleted = Object.keys(st.index || {}).filter(function (f) {
      return textAt(e, repoAbs + '/' + f) === null;
    });
    return {
      st: st,
      untracked: untracked,
      modified: modified.filter(function (f) { return deleted.indexOf(f) < 0; }),
      deleted: deleted,
      clean: !untracked.length && !modified.length && !deleted.length
    };
  }

  /* ------------------------------ 断言实现 ------------------------------ */

  function okOf(ok, got) { return { ok: !!ok, got: got || '' }; }

  var CHECKS = {
    dir: function (c, e) {
      var n = nodeAt(e, c.path);
      if (!n) return okOf(false, t('chk.noDir'));
      return okOf(n.type === 'dir', n.type === 'dir' ? t('chk.dirOk') : t('chk.dirBlocked'));
    },

    file: function (c, e) {
      var n = nodeAt(e, c.path);
      if (!n) return okOf(false, t('chk.noFile'));
      if (n.type === 'dir') return okOf(false, t('chk.isDir'));
      var txt = n.type === 'link' ? (textAt(e, c.path) || '') : (n.content || '');

      if (c.minBytes && txt.length < c.minBytes) {
        return okOf(false, t('chk.tooSmall', { size: humanSize(txt.length) }));
      }
      if (c.notEmpty && !txt.trim()) return okOf(false, t('chk.empty'));
      if (c.lines) {
        var used = txt.split('\n').filter(function (x) { return x.trim(); }).length;
        if (used < c.lines) return okOf(false, t('chk.tooFewLines', { used: used, need: c.lines }));
      }
      if (c.contains) {
        var list = Array.isArray(c.contains) ? c.contains : [c.contains];
        for (var i = 0; i < list.length; i++) {
          if (txt.indexOf(list[i]) < 0) return okOf(false, t('chk.missingText', { text: list[i] }));
        }
      }
      if (c.regex) {
        var re;
        try { re = new RegExp(c.regex, c.flags || 'm'); } catch (err) { re = null; }
        if (re && !re.test(txt)) return okOf(false, t('chk.regexMiss', { re: c.regex }));
      }
      return okOf(true, t('chk.fileOk', { size: humanSize(txt.length) }));
    },

    absent: function (c, e) {
      var n = nodeAt(e, c.path);
      return okOf(!n, n ? t('chk.stillThere') : t('chk.gone'));
    },

    exec: function (c, e) {
      var n = nodeAt(e, c.path);
      if (!n || n.type === 'dir') return okOf(false, t('chk.noFile'));
      return okOf((n.mode & 73) !== 0, (n.mode & 73) !== 0 ? t('chk.canExec') : t('chk.noExec'));
    },

    mode: function (c, e) {
      var n = nodeAt(e, c.path);
      if (!n) return okOf(false, t('chk.noFile'));
      var want = typeof c.expect === 'string' ? parseInt(c.expect, 8) : c.expect;
      var masked = n.mode & 511;
      return okOf(masked === want, t('chk.modeNow', {
        now: masked.toString(8),
        want: want.toString(8)
      }));
    },

    link: function (c, e) {
      var n = nodeAt(e, c.path);
      if (!n) return okOf(false, t('chk.noPath'));
      if (n.type !== 'link') {
        return okOf(false, n.type === 'dir' ? t('chk.notLinkDir') : t('chk.notLinkFile'));
      }
      if (c.target && String(n.target).indexOf(c.target) < 0) {
        return okOf(false, t('chk.linkWrong', { now: n.target, want: c.target }));
      }
      return okOf(true, '→ ' + n.target);
    }
  };



  /* --------------------------- AI 相关断言 --------------------------- */

  CHECKS.aiEnv = function (c, e) {
    var envs = (e.ai || {}).condaEnvs || {};
    var env = envs[c.name];
    if (!env) {
      var names = Object.keys(envs).join(' / ') || t('chk.envNone');
      return okOf(false, t('chk.envMissing', { names: names }));
    }
    if (c.py && String(env.py).indexOf(String(c.py)) !== 0) {
      return okOf(false, t('chk.pyWrong', { now: env.py, want: c.py }));
    }
    return okOf(true, 'python ' + env.py);
  };

  CHECKS.aiActive = function (c, e) {
    var now = (e.ai || {}).activeEnv;
    return okOf(now === c.name, t('chk.activeNow', { name: now }));
  };

  CHECKS.aiPkg = function (c, e) {
    var a = e.ai || {};
    var env = c.env || a.activeEnv;
    var pkgs = ((a.pip || {})[env]) || {};
    var ver = pkgs[c.name];
    if (!ver) {
      var have = Object.keys(pkgs).sort().join(', ') || t('chk.pkgNone');
      return okOf(false, t('chk.pkgMissing', { env: env, name: c.name, have: have }));
    }
    if (c.version && ver !== c.version) {
      return okOf(false, t('chk.pkgWrong', { name: c.name, ver: ver, want: c.version }));
    }
    return okOf(true, t('chk.pkgOk', { name: c.name, ver: ver, env: env }));
  };

  CHECKS.aiRepo = function (c, e) {
    var repos = (e.ai || {}).repos || {};
    var key = c.path ? e.abs(c.path) : Object.keys(repos)[0];
    var st = key ? repos[key] : null;
    if (!st) return okOf(false, t('chk.noRepo'));

    if (c.commits && (st.commits || []).length < c.commits) {
      return okOf(false, t('chk.fewCommits', {
        n: (st.commits || []).length,
        need: c.commits
      }));
    }
    if (c.message) {
      var hit = (st.commits || []).some(function (cm) {
        return String(cm.msg || '').toLowerCase().indexOf(String(c.message).toLowerCase()) >= 0;
      });
      if (!hit) return okOf(false, t('chk.msgMissing', { msg: c.message }));
    }
    if (c.remote && String(st.remote || '').indexOf(c.remote) < 0) {
      return okOf(false, t('chk.remoteNow', { remote: st.remote || t('chk.remoteNone') }));
    }
    if (c.branch && st.branch !== c.branch) {
      return okOf(false, t('chk.branchNow', { now: st.branch, want: c.branch }));
    }
    if (c.clean) {
      var s = repoStatus(e, key);
      if (s && !s.clean) {
        var bits = [];
        if (s.untracked.length) bits.push(t('chk.untracked', { list: s.untracked.join(',') }));
        if (s.modified.length) bits.push(t('chk.modified', { list: s.modified.join(',') }));
        if (s.deleted.length) bits.push(t('chk.deleted', { list: s.deleted.join(',') }));
        return okOf(false, t('chk.dirty', { bits: bits.join(t('chk.sep')) }));
      }
    }
    return okOf(true, t('chk.commitOk', {
      n: (st.commits || []).length,
      branch: st.branch
    }));
  };

  CHECKS.aiDownload = function (c, e) {
    var list = (e.ai || {}).downloads || [];
    var hit = list.filter(function (d) {
      if (c.repo && d.repo !== c.repo) return false;
      if (c.dir && String(d.dir).indexOf(c.dir) < 0) return false;
      return true;
    })[0];
    return okOf(!!hit, hit
      ? t('chk.downloaded', { path: prettyPath(e, hit.dir) })
      : t('chk.noDownload'));
  };

  CHECKS.aiSession = function (c, e) {
    var s = ((e.ai || {}).sessions || {})[c.name];
    return okOf(!!s, s ? t('chk.running', { port: (s.port || '?') }) : t('chk.notStarted'));
  };

  CHECKS.aiGpu = function (c, e) {
    var g = (e.ai || {}).gpu || {};
    var used = g.usedMB || 0;
    return okOf(used >= (c.minMB || 1), t('chk.vram', { mb: used }));
  };

  CHECKS.custom = function (c, e) {
    var r;
    try { r = c.fn(e, c); } catch (err) { return okOf(false, t('chk.err', { msg: (err && err.message) })); }
    if (r && typeof r === 'object') return okOf(r.ok, r.got || '');
    return okOf(!!r, r === true ? '' : String(r == null ? '' : r));
  };

  /* ------------------------------ 对外接口 ------------------------------ */

  /** 一条检查自然语言描述（没写 why 时按类型拼一句） */
  function labelOf(c, e) {
    if (c.why) return c.why;
    var p = c.path ? prettyPath(e, c.path) : '';
    switch (c.t) {
      case 'dir': return t('lbl.dir', { p: p });
      case 'file': return t(c.contains ? 'lbl.fileContains' : 'lbl.file', { p: p });
      case 'absent': return t('lbl.absent', { p: p });
      case 'exec': return t('lbl.exec', { p: p });
      case 'mode': return t('lbl.mode', { p: p, expect: c.expect });
      case 'link': return t('lbl.link', { p: p });
      case 'aiEnv': return c.py
        ? t('lbl.aiEnvPy', { name: c.name, py: c.py })
        : t('lbl.aiEnv', { name: c.name });
      case 'aiActive': return t('lbl.aiActive', { name: c.name });
      case 'aiPkg': return c.version
        ? t('lbl.aiPkgVer', { env: c.env || t('lbl.envNow'), name: c.name, ver: c.version })
        : t('lbl.aiPkg', { env: c.env || t('lbl.envNow'), name: c.name });
      case 'aiRepo': return t('lbl.aiRepo');
      case 'aiDownload': return t('lbl.aiDownload');
      case 'aiSession': return t('lbl.aiSession', { name: c.name });
      case 'aiGpu': return t('lbl.aiGpu', { mb: (c.minMB || 1) });
      default: return t('lbl.custom');
    }
  }

  var Gate = {
    /** 支持的断言类型 */
    types: Object.keys(CHECKS),

    /**
     * 单条断言
     * @return {{ok:boolean, got:string}}
     */
    check: function (c, engine) {
      var fn = CHECKS[c && c.t];
      if (!fn) return { ok: false, got: t('chk.unknownType', { t: (c && c.t) }) };
      return fn(c, engine);
    },

    /**
     * 跑一道关
     * @param {Object|string} gate 关卡对象或 id
     * @return {{id, ok, results, scenario, at}}
     */
    evaluate: function (gate) {
      var g = typeof gate === 'string' ? LX.Days.gate(gate) : gate;
      if (!g) return { id: String(gate), ok: false, results: [], error: t('gate.notFound') };

      var engine = engineOf(g.scenario);
      var results = (g.checks || []).map(function (c) {
        var r = Gate.check(c, engine);
        return {
          ok: r.ok,
          why: labelOf(c, engine),
          got: r.got,
          type: c.t
        };
      });

      return {
        id: g.id,
        ok: results.length > 0 && results.every(function (r) { return r.ok; }),
        results: results,
        scenario: g.scenario,
        at: Date.now()
      };
    },

    /** 跑一天里的所有关卡 */
    evaluateDay: function (dayId) {
      var day = LX.Days.get(dayId);
      if (!day) return [];
      return day.gates.map(function (g) { return Gate.evaluate(g); });
    },

    /** 终态快照（写进报告用，纯数据） */
    snapshot: function (scenario) {
      try { return LX.Sandbox.inspect(engineOf(scenario)); } catch (err) { return null; }
    }
  };

  LX.Gate = Gate;
})(window);
