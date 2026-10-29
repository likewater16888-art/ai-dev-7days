/* =============================================================================
 * js/sandbox-ai.js
 * -----------------------------------------------------------------------------
 * 沙盒 v2 的「AI 工程命令包」：conda / pip / python / git / nvidia-smi / hf / jupyter
 *
 * 设计原则（和 sandbox.js 一致）：
 *   · 不碰 DOM，只做「一行命令 → 一段输出 + 状态变化」，因此可以在 node 里单测；
 *   · 不假装联网：所有下载都是**确定性的模拟**，输出格式刻意贴近真机，方便学员
 *     建立「看到这段文字就知道成功了」的肌肉记忆；
 *   · 有状态：conda 环境、pip 包、git 仓库、GPU 占用都记在 engine.ai 上，
 *     Gate 关卡通过 LX.Sandbox.inspect() 读这些状态做**终态判分**（多解都给分）。
 *
 * 依赖：js/sandbox.js 的扩展接口（define / addScenario / fs / def / inspect）
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var S = LX.Sandbox;
  if (!S || typeof S.define !== 'function') {
    // 老版 sandbox.js（没有扩展接口）时安静退出，不影响 Linux 基础功能
    if (global.console && console.warn) console.warn('[sandbox-ai] 需要 sandbox.js v2 的扩展接口，已跳过');
    return;
  }

  var F = S.fs;
  var D = S.def;
  var ME = S.me;
  var mode = F.mode;

  function ok(s) { return D.ok(s || ''); }
  function err(s, code) { return D.err(s, code); }

  /* ==========================================================================
   *  一、会话状态（每个 engine 一份，互不干扰）
   * ======================================================================== */

  var CONDA_ROOT = ME.home + '/miniconda3';

  function envPath(name) {
    return name === 'base' ? CONDA_ROOT : CONDA_ROOT + '/envs/' + name;
  }

  function ai(e) {
    if (!e.ai) {
      e.ai = {
        condaEnvs: { base: { py: '3.11.9', pkgs: {} } },
        activeEnv: 'base',
        pip: { base: {} },
        repos: {},
        gpu: { name: 'NVIDIA GeForce RTX 3060', totalMB: 8192, usedMB: 0, util: 0, procs: [] },
        downloads: [],
        sessions: {}
      };
    }
    var a = e.ai;
    if (!a.pip) a.pip = {};
    if (!a.pip[a.activeEnv]) a.pip[a.activeEnv] = {};
    return a;
  }

  function pyVersion(e) {
    var a = ai(e);
    return (a.condaEnvs[a.activeEnv] || {}).py || '3.11.9';
  }

  /* 小版本映射：conda 的 python=3.10 装出来是 3.10.x */
  var PYFULL = {
    '3.9': '3.9.19',
    '3.10': '3.10.14',
    '3.11': '3.11.9',
    '3.12': '3.12.5',
    '3.13': '3.13.0'
  };

  /* 教学用版本表：固定版本让输出可复现（真机上网装会得到差不多的版本） */
  var PKG = {
    torch: '2.4.1',
    torchvision: '0.19.1',
    transformers: '4.44.2',
    numpy: '2.1.0',
    pandas: '2.2.2',
    'scikit-learn': '1.5.1',
    gradio: '4.44.1',
    streamlit: '1.38.0',
    fastapi: '0.115.0',
    uvicorn: '0.30.6',
    'sentence-transformers': '3.1.1',
    'faiss-cpu': '1.8.0',
    accelerate: '0.34.2',
    pillow: '10.4.0',
    datasets: '3.0.1',
    ultralytics: '8.3.0',
    'opencv-python': '4.10.0.84',
    requests: '2.32.3',
    'huggingface-hub': '0.24.6'
  };

  function fakeDownload(spec) {
    var name = String(spec).split(/[=<>!~\[]/)[0].trim();
    var ver = PKG[name] || '1.0.0';
    var mb = 3 + (name.length * 7) % 800;
    if (name === 'torch') mb = 797;
    return {
      name: name,
      ver: ver,
      lines: [
        'Looking in indexes: https://pypi.tuna.tsinghua.edu.cn/simple',
        'Collecting ' + name,
        '  Downloading ' + name + '-' + ver + '-cp310-cp310-manylinux1_x86_64.whl (' +
          mb.toFixed(1) + ' MB)',
        '     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ' + mb.toFixed(1) + '/' + mb.toFixed(1) +
          ' MB 8.1 MB/s eta 0:00:00'
      ]
    };
  }

  /* ==========================================================================
   *  二、conda（环境状态机：create / activate / env list / install / export）
   * ======================================================================== */

  function envTable(e) {
    var a = ai(e);
    var rows = ['# conda environments:', '#', '# Name                  Directory'];
    Object.keys(a.condaEnvs).sort(function (x, y) {
      if (x === 'base') return -1;
      if (y === 'base') return 1;
      return x.localeCompare(y);
    }).forEach(function (name) {
      var mark = name === a.activeEnv ? '* ' : '  ';
      var pad = name + '                     '.slice(0, Math.max(2, 22 - name.length));
      rows.push(mark + pad + envPath(name));
    });
    return rows.join('\n') + '\n';
  }

  function condaCreate(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var p = D.parseArgs(args, 'nc');
    var name = p.flags.n || p.flags.name || null;
    var spec = (p.operands || []).filter(function (x) { return x.indexOf('python') === 0; })[0];
    if (!name) return err('CondaValueError: 缺少环境名。正确写法：conda create -n ai7 python=3.10 -y');
    if (a.condaEnvs[name]) {
      return err('CondaValueError: prefix already exists: ' + envPath(name) + '\n' +
        '（该环境已存在，改用 conda activate ' + name + '）');
    }
    var py = spec ? (String(spec).split('=')[1] || '3.11') : '3.11';
    var full = PYFULL[py] || (py.length === 3 ? py + '.9' : py);
    a.condaEnvs[name] = { py: full, pkgs: {} };
    a.pip[name] = a.pip[name] || {};
    return ok([
      'Collecting package metadata (current_repodata.json): ...working... done',
      'Solving environment: ...working... done',
      '',
      '## Package Plan ##',
      '',
      '  environment location: ' + envPath(name),
      '',
      '  added / updated specs:',
      '    - python=' + py,
      '',
      'The following NEW packages will be INSTALLED:',
      '',
      '    pip                pkgs/main/linux-64::pip-24.2-py' + py + '_0',
      '    python             pkgs/main/linux-64::python-' + full + '-h12debd9_0',
      '    setuptools         pkgs/main/linux-64::setuptools-72.1.0-py' + py + '_0',
      '    wheel              pkgs/main/linux-64::wheel-0.43.0-py' + py + '_0',
      '',
      'Preparing transaction: ...working... done',
      'Verifying transaction: ...working... done',
      'Executing transaction: ...working... done',
      '#',
      '# To activate this environment, use',
      '#',
      '#     $ conda activate ' + name,
      '#',
      '# To deactivate an active environment, use',
      '#',
      '#     $ conda deactivate',
      ''
    ].join('\n'));
  }

  function condaActivate(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var name = (args[0] || '').trim();
    if (!name) return err('CondaValueError: 请给环境名：conda activate ai7');
    if (!a.condaEnvs[name]) {
      return err('EnvironmentNameNotFound: Could not find conda environment: ' + name + '\n' +
        'You can list all discoverable environments with `conda info --envs`.');
    }
    a.activeEnv = name;
    e.env.CONDA_DEFAULT_ENV = name;
    e.env.CONDA_PREFIX = envPath(name);
    return ok('（已切换到环境 ' + name + '，python ' + pyVersion(e) + '）\n');
  }

  function condaInstall(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var pkgs = (args || []).filter(function (x) { return x.charAt(0) !== '-'; });
    if (!pkgs.length) return err('conda: error: 请给出包名，例如 conda install numpy -y');
    var env = a.activeEnv;
    var lines = [];
    if (env === 'base') lines.push('# 提醒：在 base 环境装东西不推荐，建议先 conda create -n ai7 python=3.10');
    lines.push('Collecting package metadata (repodata.json): ...working... done');
    lines.push('Solving environment: ...working... done');
    lines.push('');
    pkgs.forEach(function (spec) {
      var name = String(spec).split('=')[0];
      var ver = PKG[name] || '1.0.0';
      a.condaEnvs[env].pkgs[name] = ver;
      lines.push('The following packages will be downloaded:');
      lines.push('');
      lines.push('    ' + name + '-' + ver + ' | ' + (2 + name.length) + ' MB  pkgs/main');
      lines.push('');
    });
    lines.push('Preparing transaction: ...working... done');
    lines.push('Executing transaction: ...working... done');
    lines.push('');
    return ok(lines.join('\n'));
  }

  function condaList(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var env = a.activeEnv;
    var rows = ['# packages in environment at ' + envPath(env) + ':', '#',
      '# Name                    Version                   Build  Channel'];
    rows.push('python                    ' + pyVersion(e) + '              h12debd9_0    pkgs/main');
    Object.keys(a.condaEnvs[env].pkgs || {}).sort().forEach(function (n) {
      rows.push((n + '                          ').slice(0, 26) + a.condaEnvs[env].pkgs[n] +
        '                 pypi_0    pypi');
    });
    return ok(rows.join('\n') + '\n');
  }

  function condaExport(ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var env = a.activeEnv;
    var pips = Object.keys(a.pip[env] || {}).sort();
    var lines = ['name: ' + env, 'channels:', '  - defaults', '  - conda-forge', 'dependencies:'];
    lines.push('  - python=' + pyVersion(e));
    if (pips.length) {
      lines.push('  - pip:');
      pips.forEach(function (n) { lines.push('      - ' + n + '==' + a.pip[env][n]); });
    }
    lines.push('prefix: ' + envPath(env));
    lines.push('');
    return ok(lines.join('\n'));
  }

  function condaRemove(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var p = D.parseArgs(args, 'n');
    var name = p.flags.n || p.flags.name || (p.operands || [])[0];
    if (!name) return err('CondaValueError: 请给环境名：conda env remove -n ai7');
    if (!a.condaEnvs[name]) {
      return err('EnvironmentLocationNotFound: Not a conda environment: ' + envPath(name));
    }
    delete a.condaEnvs[name];
    delete a.pip[name];
    if (a.activeEnv === name) a.activeEnv = 'base';
    return ok('Remove all packages in environment ' + envPath(name) + ':\n\n' +
      'Preparing transaction: ...working... done\n' +
      'Verifying transaction: ...working... done\n' +
      'Executing transaction: ...working... done\n');
  }

  function condaCmd(args, ctx) {
    var sub = (args[0] || '').trim();
    var rest = args.slice(1);
    if (!sub || sub === '--help' || sub === '-h') {
      return ok('conda 常用子命令（沙盒实现子集）：\n' +
        '  conda create -n ai7 python=3.10 -y    建环境\n' +
        '  conda activate ai7 / conda deactivate  进出环境\n' +
        '  conda env list                        列出全部环境\n' +
        '  conda install numpy -y                装 conda 包\n' +
        '  conda list                            当前环境的包\n' +
        '  conda env export                      导出 environment.yml（配合 > 重定向）\n' +
        '  conda env remove -n ai7               删环境\n');
    }
    if (sub === '--version' || sub === '-V') return ok('conda 24.7.1\n');
    if (sub === 'create') return condaCreate(rest, ctx);
    if (sub === 'activate') return condaActivate(rest, ctx);
    if (sub === 'deactivate') { ai(ctx.engine).activeEnv = 'base'; return ok(''); }
    if (sub === 'list') return condaList(rest, ctx);
    if (sub === 'install') return condaInstall(rest, ctx);
    if (sub === 'remove') return condaRemove(rest, ctx);
    if (sub === 'info') {
      var cur = ai(ctx.engine);
      return ok('     active environment : ' + cur.activeEnv + '\n' +
        '    active env location : ' + envPath(cur.activeEnv) + '\n' +
        '            shell level : 2\n' +
        '       user config file : /home/student/.condarc\n' +
        '       base environment : ' + CONDA_ROOT + '  (writable)\n');
    }
    if (sub === 'env') {
      var sub2 = rest[0];
      if (sub2 === 'export') {
        var p = D.parseArgs(rest.slice(1), 'n');
        var a1 = ai(ctx.engine);
        if (p.flags.n && a1.condaEnvs[p.flags.n]) {
          var keep = a1.activeEnv;
          a1.activeEnv = p.flags.n;
          var out = condaExport(ctx);
          a1.activeEnv = keep;
          return out;
        }
        return condaExport(ctx);
      }
      if (sub2 === 'remove') return condaRemove(rest.slice(1), ctx);
      if (sub2 === 'update') return ok('（沙盒不模拟 env update，可直接用 conda env create -f environment.yml）\n');
      return ok(envTable(ctx.engine));
    }
    if (sub === 'init') return ok('no change     /home/student/miniconda3/condabin/conda\n' +
      'modified      /home/student/.bashrc\n\n==> For changes to take effect, close and re-open your current shell. <==\n');
    if (sub === 'update' || sub === 'upgrade') {
      return ok('Collecting package metadata: ...done\nAll requested packages already installed.\n');
    }
    return err('conda: 沙盒只实现 create/activate/deactivate/env/install/list/export/remove，收到：' + args.join(' '));
  }

  /* ==========================================================================
   *  三、pip（会真的去虚拟文件系统里读 requirements.txt）
   * ======================================================================== */

  function pipInstall(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var p = D.parseArgs(args, 'ric');
    var env = a.activeEnv;
    var specs = (p.operands || []).slice();
    var lines = [];

    lines.push('Looking in indexes: ' + (p.flags.i || 'https://pypi.tuna.tsinghua.edu.cn/simple'));

    if (p.flags.r) {
      var file = p.flags.r;
      var text = null;
      try { text = e.readFile(file); } catch (ex) { text = null; }
      if (text === null || text === undefined) {
        return err('ERROR: Could not open requirements file: [Errno 2] No such file or directory: \'' + file + '\'\n');
      }
      var fromFile = String(text).split('\n').map(function (s) {
        return s.replace(/#.*$/, '').trim();
      }).filter(Boolean);
      if (!fromFile.length) {
        return ok(lines.join('\n') + '\n（' + file + ' 是空的，没有任何包需要安装）\n');
      }
      specs = specs.concat(fromFile);
      lines.push('Processing ' + (file.indexOf('/') >= 0 ? file : './' + file));
    }

    if (!specs.length) {
      return err('ERROR: You must give at least one requirement to install (see "pip help install")\n');
    }

    var installed = [];
    specs.forEach(function (spec) {
      var d = fakeDownload(spec);
      var name = d.name;
      var pin = String(spec).indexOf('==') >= 0 ? String(spec).split('==')[1].trim() : d.ver;
      d.lines.slice(1).forEach(function (l) { lines.push(l); });
      a.pip[env] = a.pip[env] || {};
      if (a.pip[env][name] === pin) {
        lines.push('Requirement already satisfied: ' + name + '==' + pin + ' in ' +
          envPath(env) + '/lib/python' + pyVersion(e).slice(0, 4) + '/site-packages');
        return;
      }
      a.pip[env][name] = pin;
      installed.push(name + '-' + pin);
    });

    if (installed.length) {
      lines.push('Installing collected packages: ' + installed.join(', '));
      lines.push('Successfully installed ' + installed.join(' '));
    } else {
      lines.push('（依赖都已满足，没有需要安装的包）');
    }
    lines.push('');
    return ok(lines.join('\n'));
  }

  function pipList(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var env = a.activeEnv;
    var rows = ['Package      Version', '------------ -------', 'pip          24.2',
      'setuptools   72.1.0', 'wheel        0.43.0'];
    Object.keys(a.pip[env] || {}).sort().forEach(function (n) {
      rows.push((n + '            ').slice(0, 13) + a.pip[env][n]);
    });
    return ok(rows.join('\n') + '\n');
  }

  function pipFreeze(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var env = a.activeEnv;
    var out = Object.keys(a.pip[env] || {}).sort().map(function (n) {
      return n + '==' + a.pip[env][n];
    });
    if (!out.length) return ok('（当前环境没有 pip 包，先 pip install 一些）\n');
    return ok(out.join('\n') + '\n');
  }

  function pipShow(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var env = a.activeEnv;
    var name = (args[0] || '').trim();
    if (!name) return err('ERROR: Please provide a package name or names.\n');
    if (!(a.pip[env] || {})[name]) return err('WARNING: Package(s) not found: ' + name + '\n');
    return ok('Name: ' + name + '\nVersion: ' + a.pip[env][name] +
      '\nSummary: （沙盒模拟数据）\nHome-page: https://pypi.org/project/' + name + '/\n' +
      'Location: ' + envPath(env) + '/lib/python' + pyVersion(e).slice(0, 4) + '/site-packages\n' +
      'Requires: \nRequired-by: \n');
  }

  function pipCmd(args, ctx) {
    var sub = (args[0] || '').trim();
    var rest = args.slice(1);
    if (!sub || sub === '--help' || sub === '-h' || sub === 'help') {
      return ok('pip 常用子命令（沙盒实现子集）：\n' +
        '  pip install torch==2.4.1 -i https://pypi.tuna.tsinghua.edu.cn/simple\n' +
        '  pip install -r requirements.txt\n' +
        '  pip list / pip freeze > requirements.txt / pip show torch\n' +
        '  pip uninstall numpy -y\n');
    }
    if (sub === '--version' || sub === '-V') {
      var e0 = ctx.engine;
      return ok('pip 24.2 from ' + envPath(ai(e0).activeEnv) + '/lib/python' +
        pyVersion(e0).slice(0, 4) + '/site-packages/pip (python ' + pyVersion(e0) + ')\n');
    }
    if (sub === 'install') return pipInstall(rest, ctx);
    if (sub === 'list') return pipList(rest, ctx);
    if (sub === 'freeze') return pipFreeze(rest, ctx);
    if (sub === 'show') return pipShow(rest, ctx);
    if (sub === 'uninstall') {
      var a = ai(ctx.engine);
      var name = (rest || []).filter(function (x) { return x.charAt(0) !== '-'; })[0];
      if (!name || !(a.pip[a.activeEnv] || {})[name]) {
        return err('WARNING: Skipping ' + (name || '?') + ' as it is not installed.\n');
      }
      delete a.pip[a.activeEnv][name];
      return ok('Found existing installation: ' + name + '\nUninstalling ' + name + ':\n' +
        '  Successfully uninstalled ' + name + '\n');
    }
    if (sub === 'config') {
      return ok('（pip config 在沙盒里不落盘。真机可执行：\n' +
        '  pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple ）\n');
    }
    return err('pip: 沙盒只实现 install/list/freeze/show/uninstall/--version，收到：' + args.join(' '));
  }

  /* ==========================================================================
   *  四、python（教学级解释器：只解释 print(...) 与少量常用符号）
   *  —— 诚实说明：这不是 CPython，跑不了真实业务逻辑；它的价值是让「检查环境」
   *     这类脚本在沙盒里也能给出**可读输出**，方便你练命令、练读日志。
   * ======================================================================== */

  /** 按顶层分隔符切开（忽略括号与引号内的分隔符） */
  function splitTopSep(s, sep) {
    var out = [], depth = 0, quote = null, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (quote) {
        cur += ch;
        if (ch === quote && s.charAt(i - 1) !== '\\') quote = null;
        continue;
      }
      if (ch === '"' || ch === '\'') { quote = ch; cur += ch; continue; }
      if ('([{'.indexOf(ch) >= 0) depth++;
      if (')]}'.indexOf(ch) >= 0) depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map(function (x) { return x.trim(); });
  }

  function splitTop(s) { return splitTopSep(s, ','); }

  /** 常用符号表（沙盒里这些“库”是查表得到的，不真 import） */
  function pyField(name, e) {
    var a = ai(e);
    var torchVer = (a.pip[a.activeEnv] || {}).torch;
    switch (name) {
      case 'torch.__version__': return torchVer || '<未安装 torch>';
      case 'torch.cuda.is_available()': return 'False';
      case 'torch.cuda.device_count()': return '0';
      case 'torch.cuda.get_device_name(0)':
        return { error: 'RuntimeError: Found no NVIDIA driver on your system.' };
      case 'torch.backends.mps.is_available()': return 'False';
      case 'sys.version.split()[0]': return pyVersion(e);
      case 'sys.version': return pyVersion(e) + ' (main, Aug 14 2024, 09:31:02) [GCC 11.4.0]';
      case 'sys.executable': return envPath(a.activeEnv) + '/bin/python';
      case 'sys.platform': return 'linux';
      case 'platform.python_version()': return pyVersion(e);
      case 'platform.platform()': return 'Linux-5.15.153.1-microsoft-standard-WSL2-x86_64-with-glibc2.35';
      case 'platform.system()': return 'Linux';
      case 'socket.gethostname()': return 'wsl';
      case 'os.getcwd()': return e.cwd;
      case 'os.cpu_count()': return '8';
      default: return undefined;
    }
  }

  /** 求值一个表达式 → {value} | {error} | {unknown} */
  function pyEval(expr, vars, e) {
    var s = String(expr).trim();
    if (!s) return { value: '' };

    // 先查符号表（支持 sys.version.split()[0] 这类带下标/调用的写法）
    var direct = pyField(s, e);
    if (direct !== undefined) {
      return (direct && direct.error) ? { error: direct.error } : { value: direct };
    }

    if (/^[A-Za-z_][\w.]*(\(\))?$/.test(s)) {
      if (Object.prototype.hasOwnProperty.call(vars, s)) return { value: vars[s] };
      return { unknown: s };
    }

    var fm = s.match(/^f(['"])([\s\S]*)\1$/);
    if (fm) {
      var body = fm[2].replace(/\{([^{}]+)\}/g, function (_, inner) {
        var r = pyEval(inner, vars, e);
        if (r.error) return '<' + r.error + '>';
        if (r.unknown !== undefined) return '<' + r.unknown + '>';
        return String(r.value);
      });
      return { value: body };
    }

    var sm = s.match(/^(['"])([\s\S]*)\1$/);
    if (sm) return { value: sm[2].replace(/\\n/g, '\n').replace(/\\t/g, '\t') };

    if (/^-?\d+(\.\d+)?$/.test(s)) return { value: String(s) };

    var em = s.match(/^os\.environ\.get\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"])?\s*\)$/);
    if (em) {
      var got = e.env[em[1]];
      if (got !== undefined) return { value: got };
      return { value: em[2] === undefined ? 'None' : em[2] };
    }

    var plus = splitTopSep(s, '+');
    if (plus.length > 1) {
      var vals = [], bad = null;
      plus.forEach(function (seg) {
        var r = pyEval(seg, vars, e);
        if (r.error) bad = r.error;
        else if (r.unknown !== undefined) bad = r.unknown;
        else vals.push(String(r.value));
      });
      if (bad === null) return { value: vals.join('') };
      return { unknown: bad };
    }

    return { unknown: s };
  }

  /** 逐行“执行”一段 Python：只关心赋值与 print（其余语句忽略） */
  function runPy(code, ctx) {
    var e = ctx.engine;
    var vars = {};
    var out = [];
    String(code).split('\n').forEach(function (raw) {
      var line = raw.replace(/\r/g, '');
      if (!line.trim() || /^\s*#/.test(line)) return;
      if (/^\s*(import|from)\s/.test(line)) return;

      var assign = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+?)\s*$/);
      if (assign && !/^(if|for|while|with|def|class|return|elif|else)\b/.test(assign[1])) {
        var r0 = pyEval(assign[2], vars, e);
        vars[assign[1]] = (r0.value !== undefined)
          ? r0.value
          : '<' + (r0.error || r0.unknown) + '>';
        return;
      }

      var pm = line.match(/^\s*print\s*\(([\s\S]*)\)\s*$/);
      if (pm) {
        var argStr = pm[1].trim();
        if (!argStr) { out.push(''); return; }
        var pieces = [];
        splitTop(argStr).forEach(function (one) {
          if (/^(sep|end|file|flush)\s*=/.test(one)) return;
          var r = pyEval(one, vars, e);
          if (r.error) pieces.push('Traceback: ' + r.error);
          else if (r.unknown !== undefined) pieces.push('<' + r.unknown + '>');
          else pieces.push(String(r.value));
        });
        out.push(pieces.join(' '));
      }
    });
    return out.join('\n') + (out.length ? '\n' : '');
  }

  function pythonCmd(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var first = args[0] || '';

    if (first === '-V' || first === '--version') return ok('Python ' + pyVersion(e) + '\n');

    if (first === '-c') {
      var text = runPy(String(args[1] || ''), ctx);
      return ok(text || '（代码里没有可打印的 print(...)）\n');
    }

    if (first === '-m') {
      var mod = args[1] || '';
      if (mod.indexOf('http.server') === 0) {
        var port = args[2] || '8000';
        e.ai.sessions = e.ai.sessions || {};
        e.ai.sessions.http = { port: Number(port) };
        return ok('Serving HTTP on 0.0.0.0 port ' + port + ' (http://0.0.0.0:' + port + '/) ...\n' +
          '（沙盒不真的开端口，但已记录该会话）\n');
      }
      if (mod.indexOf('pip') === 0) return pipCmd(args.slice(2), ctx);
      return ok('（沙盒只认识 -m http.server / -m pip，收到 -m ' + mod + '）\n');
    }

    if (!first || first === '-h' || first === '--help') {
      return ok('用法：python -V | python -c "print(1)" | python 脚本.py\n' +
        '（沙盒是教学级解释器：只解释 print(...) 与少量符号，不跑真实业务逻辑）\n');
    }

    var content = null;
    try { content = e.readFile(first); } catch (ex) { content = null; }
    if (content === null || content === undefined) {
      return err('python: can\'t open file \'' + first + '\': [Errno 2] No such file or directory\n');
    }

    var body = String(content);
    if (/gradio/.test(body)) {
      var port2 = 7860;
      e.ai.sessions = e.ai.sessions || {};
      e.ai.sessions.gradio = { port: port2, startedAt: F.NOW };
      a.gpu.procs = [{ pid: 4242, name: 'python', memMB: 4823 }];
      a.gpu.usedMB = 4823;
      a.gpu.util = 87;
      return ok(['* Serving!',
        '* Running on local URL:  http://127.0.0.1:' + port2,
        '* To create a public link, set `share=True` in `launch()`.'
      ].join('\n') + '\n');
    }

    var printed = runPy(body, ctx);
    return ok(printed || '（脚本执行完毕，没有任何输出）\n');
  }

  /* ==========================================================================
   *  五、git（教学子集：init/add/commit/status/log/clone/branch/checkout/remote）
   *  真实 git 的对象库很复杂；沙盒只保留 Gate 判分真正需要的三件事：
   *    · 仓库边界（哪一层有 .git）
   *    · 暂存区 / 提交历史（index / commits）
   *    · 分支与 origin
   * ======================================================================== */

  /** 从 dir 往上找，返回最近的「含 .git 目录」的仓库根（绝对路径） */
  function repoAt(e, dir) {
    var cur = e.abs(dir || '.');
    if (cur.length > 1) cur = cur.replace(/\/$/, '');
    while (cur.length > 1) {
      var n = e.node(cur + '/.git');
      if (n && n.type === 'dir') return cur;
      cur = cur.replace(/\/[^\/]+$/, '') || '/';
    }
    return null;
  }

  function repoState(a, repo) {
    if (!a.repos[repo]) {
      a.repos[repo] = { branch: 'main', index: {}, snapshot: {}, commits: [], remote: '', seq: 0 };
    }
    return a.repos[repo];
  }

  function shortHash(seed, seq) {
    var h = 2166136261;
    var s = String(seed) + ':' + seq;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-7);
  }

  /** 仓库根下的条目（不含 .git；目录以 / 结尾） */
  function repoFiles(e, repo) {
    var node = e.node(repo);
    var out = [];
    if (!node || node.type !== 'dir') return out;
    Object.keys(node.children).sort().forEach(function (name) {
      if (name === '.git') return;
      var child = node.children[name];
      if (child.type === 'file') out.push(name);
      else if (child.type === 'dir') out.push(name + '/');
    });
    return out;
  }

  function readAt(e, repo, rel) {
    var content = null;
    try { content = e.readFile(repo + '/' + rel); } catch (ex) { content = null; }
    return content;
  }

  function gitInit(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var dir = e.abs(args[0] || '.');
    if (!e.node(dir)) return err('fatal: cannot init in \'' + dir + '\': No such file or directory');
    e.mkdirp(dir + '/.git');
    e.writeFile(dir + '/.git/HEAD', 'ref: refs/heads/main\n');
    var repo = repoState(a, dir);
    repo.branch = 'main';
    repo.index = {};
    repo.snapshot = {};
    repo.commits = [];
    return ok('Initialized empty Git repository in ' + dir + '/.git/\n' +
      'hint: Using \'main\' as the name for the initial branch.\n');
  }

  function gitStatus(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    var files = repoFiles(e, repo).filter(function (f) { return f.charAt(f.length - 1) !== '/'; });

    var untracked = [], modified = [], staged = [];
    files.forEach(function (f) {
      var content = readAt(e, repo, f);
      if (content === null) return;
      var inIndex = Object.prototype.hasOwnProperty.call(st.index, f);
      if (!inIndex) { untracked.push(f); return; }
      if (st.index[f] !== content) modified.push(f);
      else if (st.snapshot[f] !== content) staged.push(f);
    });

    var L = ['On branch ' + st.branch];
    if (!st.commits.length) L.push('\nNo commits yet\n');
    if (staged.length) {
      L.push('Changes to be committed:');
      L.push('  (use "git restore --staged <file>..." to unstage)');
      staged.forEach(function (f) { L.push('        new file:   ' + f); });
      L.push('');
    }
    if (modified.length) {
      L.push('Changes not staged for commit:');
      L.push('  (use "git add <file>..." to update what will be committed)');
      modified.forEach(function (f) { L.push('        modified:   ' + f); });
      L.push('');
    }
    if (untracked.length) {
      L.push('Untracked files:');
      L.push('  (use "git add <file>..." to include in what will be committed)');
      untracked.forEach(function (f) { L.push('        ' + f); });
      L.push('');
    }
    if (!staged.length && !modified.length && !untracked.length) {
      L.push('nothing to commit, working tree clean');
    } else if (!staged.length) {
      L.push('nothing added to commit but untracked files present (use "git add" to track)');
    }
    return ok(L.join('\n') + '\n');
  }

  function gitAdd(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    if (!args.length) return err('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?');
    var st = repoState(a, repo);
    var targets = [];
    args.forEach(function (arg) {
      if (arg === '.' || arg === '-A' || arg === '--all' || arg === '*') {
        targets = targets.concat(repoFiles(e, repo).filter(function (f) {
          return f.charAt(f.length - 1) !== '/';
        }));
      } else {
        targets.push(arg.replace(/^\.\//, ''));
      }
    });
    var added = 0;
    targets.forEach(function (f) {
      var content = readAt(e, repo, f);
      if (content === null) return;
      st.index[f] = content;
      added += 1;
    });
    if (!added) return err('fatal: pathspec \'' + args.join(' ') + '\' did not match any files');
    return ok('');
  }

  function gitCommit(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var p = D.parseArgs(args, 'm');
    var msg = p.flags.m;
    if (!msg || msg === true) {
      return err('error: 沙盒里的 commit 必须带 -m "说明"\n' +
        '（真机会打开编辑器让你写提交说明，第 5 天我们统一用 -m）');
    }
    var st = repoState(a, repo);
    var changed = [];
    Object.keys(st.index).forEach(function (f) {
      if (st.snapshot[f] !== st.index[f]) changed.push(f);
    });
    if (!changed.length) {
      return ok('On branch ' + st.branch + '\nnothing to commit, working tree clean\n');
    }
    st.seq += 1;
    var hash = shortHash(msg + changed.join(','), st.seq);
    st.commits.push({ hash: hash, msg: String(msg), files: changed.slice(), branch: st.branch, at: F.NOW });
    changed.forEach(function (f) { st.snapshot[f] = st.index[f]; });
    return ok('[' + st.branch + ' ' + hash + '] ' + msg + '\n' +
      ' ' + changed.length + ' file' + (changed.length > 1 ? 's' : '') + ' changed\n' +
      changed.map(function (f) { return ' create mode 100644 ' + f; }).join('\n') + '\n');
  }

  function gitLog(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    if (!st.commits.length) {
      return err('fatal: your current branch \'' + st.branch + '\' does not have any commits yet');
    }
    var n = 0;
    args.forEach(function (x, i) {
      if (x === '-n' || x === '--max-count') n = Number(args[i + 1]) || 0;
      else if (/^-\d+$/.test(x)) n = Number(x.slice(1));
    });
    var list = st.commits.slice().reverse();
    if (n) list = list.slice(0, n);
    return ok(list.map(function (c) { return c.hash + ' ' + c.msg; }).join('\n') + '\n');
  }

  var CLONE_FILES = {
    'README.md': '# tiny-cls\n\n一个用来练手的最小分类项目（沙盒模板）。\n',
    'requirements.txt': 'numpy==2.1.0\nscikit-learn==1.5.1\n',
    'train.py': 'import numpy as np\n\n\ndef main():\n    print("training tiny-cls ...")\n\n\nif __name__ == "__main__":\n    main()\n',
    '.gitignore': '__pycache__/\n*.pt\n.venv/\n'
  };

  function gitClone(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var url = (args[0] || '').trim();
    if (!url || url.charAt(0) === '-') return err('fatal: You must specify a repository to clone.');
    var name = (args[1] || url.split('/').pop().replace(/\.git$/, '') || 'repo').trim();
    var target = e.abs(name);
    var exist = e.node(target);
    if (exist && exist.type === 'dir' && Object.keys(exist.children).length) {
      return err('fatal: destination path \'' + name + '\' already exists and is not an empty directory.');
    }
    e.mkdirp(target);
    Object.keys(CLONE_FILES).forEach(function (f) { e.writeFile(target + '/' + f, CLONE_FILES[f]); });
    e.mkdirp(target + '/.git');
    var st = repoState(a, target);
    st.branch = 'main';
    st.remote = url;
    st.index = {};
    st.snapshot = {};
    Object.keys(CLONE_FILES).forEach(function (f) {
      st.index[f] = CLONE_FILES[f];
      st.snapshot[f] = CLONE_FILES[f];
    });
    st.commits = [{
      hash: shortHash(url, 1), msg: 'init: tiny-cls 模板',
      files: Object.keys(CLONE_FILES), branch: 'main', at: F.NOW
    }];
    st.seq = 1;
    return ok('Cloning into \'' + name + '\'...\n' +
      'remote: Enumerating objects: 24, done.\n' +
      'remote: Counting objects: 100% (24/24), done.\n' +
      'remote: Compressing objects: 100% (18/18), done.\n' +
      'Receiving objects: 100% (24/24), 4.62 KiB | 4.62 MiB/s, done.\n');
  }

  function gitRemote(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    var sub = args[0] || '';
    if (sub === 'add') {
      st.remote = args[2] || '';
      return ok('');
    }
    if (!st.remote) return ok('');
    return ok('origin  ' + st.remote + ' (fetch)\norigin  ' + st.remote + ' (push)\n');
  }

  function gitBranch(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    var all = args.indexOf('-a') >= 0 || args.indexOf('--all') >= 0;
    var name = args.filter(function (x) { return x.charAt(0) !== '-'; })[0];
    st.branches = st.branches || {};
    if (name) {
      st.branches[name] = 1;
      st.branch = name;
      return ok('');
    }
    var L = [st.branch];
    st.commits.forEach(function (c) {
      if (L.indexOf(c.branch) < 0) L.push(c.branch);
    });
    Object.keys(st.branches).forEach(function (b) {
      if (L.indexOf(b) < 0) L.push(b);
    });
    var out = L.map(function (b) { return (b === st.branch ? '* ' : '  ') + b; });
    if (all) out.push('  remotes/origin/main');
    return ok(out.join('\n') + '\n');
  }

  function gitCheckout(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    var create = args.indexOf('-b') >= 0 || args.indexOf('-c') >= 0 || args.indexOf('--create') >= 0;
    var name = args.filter(function (x) { return x.charAt(0) !== '-'; })[0];
    if (!name) return err('fatal: missing branch name');
    st.branches = st.branches || {};
    if (create) {
      if (st.branches[name] !== undefined) {
        return err('fatal: a branch named \'' + name + '\' already exists');
      }
      st.branches[name] = 1;
    }
    st.branch = name;
    return ok(create
      ? 'Switched to a new branch \'' + name + '\'\n'
      : 'Switched to branch \'' + name + '\'\n');
  }

  function gitPull(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    if (!repoState(a, repo).remote) return err('fatal: no remote configured');
    return ok('Already up to date.\n');
  }

  function gitPush(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var repo = repoAt(e, '.');
    if (!repo) return err('fatal: not a git repository (or any of the parent directories): .git');
    var st = repoState(a, repo);
    if (!st.remote) {
      return err('fatal: No configured push destination.\n' +
        'hint: 先 git remote add origin <你的仓库地址>');
    }
    st.pushed = (st.pushed || 0) + 1;
    return ok('Enumerating objects: 5, done.\n' +
      'Writing objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.\n' +
      'To ' + st.remote + '\n   ' +
      (st.commits.length ? st.commits[st.commits.length - 1].hash : '0000000') +
      '..HEAD  ' + st.branch + ' -> ' + st.branch + '\n' +
      '（沙盒只记录“推过了”。真实的 GitHub 校验在第 5 天用 commit API 做）\n');
  }

  function gitCmd(args, ctx) {
    var sub = (args[0] || '').trim();
    var rest = args.slice(1);
    if (!sub || sub === '--help' || sub === '-h' || sub === 'help') {
      return ok('git 常用子命令（沙盒实现子集）：\n' +
        '  git init / git status / git add . / git commit -m "说明"\n' +
        '  git log --oneline / git branch / git switch -c dev\n' +
        '  git clone <url> [目录] / git remote -v / git pull / git push\n');
    }
    if (sub === '--version' || sub === '-v') return ok('git version 2.45.2\n');
    if (sub === 'init') return gitInit(rest, ctx);
    if (sub === 'status') return gitStatus(rest, ctx);
    if (sub === 'add') return gitAdd(rest, ctx);
    if (sub === 'commit') return gitCommit(rest, ctx);
    if (sub === 'log') return gitLog(rest, ctx);
    if (sub === 'clone') return gitClone(rest, ctx);
    if (sub === 'remote') return gitRemote(rest, ctx);
    if (sub === 'branch') return gitBranch(rest, ctx);
    if (sub === 'checkout' || sub === 'switch') return gitCheckout(rest, ctx);
    if (sub === 'pull') return gitPull(rest, ctx);
    if (sub === 'push') return gitPush(rest, ctx);
    if (sub === 'diff') {
      return ok('（沙盒不渲染逐行 diff；用 git status 看哪些文件变了，第 5 天讲 diff 用法）\n');
    }
    if (sub === 'config') {
      var key = rest.filter(function (x) { return x.charAt(0) !== '-'; })[0];
      if (key === 'user.name') return ok('student\n');
      if (key === 'user.email') return ok('student@example.com\n');
      return ok('');
    }
    return err('git: 沙盒只实现 init/status/add/commit/log/clone/remote/branch/checkout/pull/push，收到：' +
      args.join(' '));
  }

  /* ==========================================================================
   *  六、nvidia-smi / hf / jupyter（观察类命令）
   * ======================================================================== */

  function pad(s, n) {
    s = String(s);
    return s + '                     '.slice(0, Math.max(0, n - s.length));
  }

  function nvidiaSmi(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var g = a.gpu;
    var used = g.usedMB || 0;
    var total = g.totalMB || 8192;
    var free = total - used;

    if (args.indexOf('-L') >= 0 || args.indexOf('--list-gpus') >= 0) {
      return ok('GPU 0: ' + g.name + ' (UUID: GPU-3f2a1b0c-77d1-4a55-9e0f-2b1c9a8d7e66)\n');
    }

    var q = null;
    args.forEach(function (x) {
      if (x.indexOf('--query-gpu=') === 0) q = x.split('=')[1];
    });
    if (q) {
      var map = {
        'name': g.name,
        'memory.total': total + ' MiB',
        'memory.used': used + ' MiB',
        'memory.free': free + ' MiB',
        'utilization.gpu': (g.util || 0) + ' %',
        'driver_version': '550.107.02',
        'temperature.gpu': '45'
      };
      return ok(q.split(',').map(function (f) {
        return map[f.trim()] === undefined ? '[N/A]' : map[f.trim()];
      }).join(', ') + '\n');
    }

    var L = [];
    L.push('Thu Oct 29 09:12:41 2026');
    L.push('+-----------------------------------------------------------------------------------------+');
    L.push('| NVIDIA-SMI 550.107.02             Driver Version: 550.107.02     CUDA Version: 12.4     |');
    L.push('|-----------------------------------------+------------------------+----------------------+');
    L.push('| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |');
    L.push('| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |');
    L.push('|                                         |                        |               MIG M. |');
    L.push('|=========================================+========================+======================|');
    L.push('|   0  ' + pad(g.name, 29) + ' Off |   00000000:01:00.0  On |                  N/A |');
    L.push('| 34%   45C    P2             59W / 170W |    ' +
      pad(used + 'MiB', 10) + ' /   ' + total + 'MiB |     ' + pad((g.util || 0) + '%', 5) +
      '    Default |');
    L.push('|                                         |                        |                  N/A |');
    L.push('+-----------------------------------------+------------------------+----------------------+');
    L.push('');
    L.push('+-----------------------------------------------------------------------------------------+');
    L.push('| Processes:                                                                              |');
    L.push('|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |');
    L.push('|        ID   ID                                                               Usage      |');
    L.push('|=========================================================================================|');
    if (g.procs && g.procs.length) {
      g.procs.forEach(function (p) {
        L.push('|    0   N/A  N/A      ' + pad(p.pid, 6) + '      C   ' + pad(p.name, 42) +
          pad(p.memMB + 'MiB', 12) + '|');
      });
    } else {
      L.push('|  No running processes found                                                             |');
    }
    L.push('+-----------------------------------------------------------------------------------------+');
    L.push('');
    L.push('# 教学样例：这块 8GB 显卡是模拟出来的。你的真机没有 NVIDIA GPU，');
    L.push('# 第 6 天会讲「有卡 / 无卡」两条路线，别被这块假显卡误导。');
    return ok(L.join('\n') + '\n');
  }

  function hfCmd(args, ctx) {
    var e = ctx.engine;
    var a = ai(e);
    var sub = (args[0] || '').trim();
    if (!sub || sub === '--help' || sub === '-h') {
      return ok('hf 常用用法（沙盒实现子集）：\n' +
        '  hf auth login --token hf_xxx     登录\n' +
        '  hf download Qwen/Qwen2.5-0.5B-Instruct --local-dir ~/models/qwen\n' +
        '  hf cache                         看缓存位置\n');
    }
    if (sub === '--version') return ok('huggingface_hub version: 0.24.6\n');
    if (sub === 'auth' || sub === 'login') {
      return ok('Token is valid (permission: read).\n' +
        'Your token has been saved to /home/student/.cache/huggingface/token\n');
    }
    if (sub === 'cache') {
      return ok('Hugging Face cache: ' + (e.env.HF_HOME || '/home/student/.cache/huggingface') + '\n');
    }
    if (sub === 'download' || sub === 'snapshot_download') {
      var operands = args.filter(function (x) { return x.charAt(0) !== '-'; });
      var repo = operands[1] || 'Qwen/Qwen2.5-0.5B-Instruct';
      var dir = null;
      args.forEach(function (x, i) {
        if (x === '--local-dir') dir = args[i + 1];
      });
      var base = dir || ((e.env.HF_HOME || '/home/student/.cache/huggingface') + '/hub/' +
        repo.replace('/', '--'));
      var target = e.abs(base);
      e.mkdirp(target);
      var name = repo.split('/').pop();
      e.writeFile(target + '/config.json',
        '{\n  "model_type": "qwen2",\n  "architectures": ["Qwen2ForCausalLM"]\n}\n');
      e.writeFile(target + '/model.safetensors', '（教学模拟权重文件，真实大小约 1.0 GB）\n');
      e.writeFile(target + '/tokenizer.json', '{"model": {"type": "BPE"}}\n');
      a.downloads.push({ repo: repo, dir: base });
      return ok([
        'Downloading (incomplete total...): 0.00B [00:00, ?B/s]',
        name + '/config.json ....................... 100%  654/654 B',
        name + '/model.safetensors .................. 100%  998M/998M',
        name + '/tokenizer.json ..................... 100%  1.72M/1.72M',
        '',
        'Download complete. Saved to ' + base,
        '（沙盒只模拟文件落盘，不真的下载权重）'
      ].join('\n') + '\n');
    }
    return err('hf: 沙盒只实现 auth/download/cache/--version，收到：' + args.join(' '));
  }

  function jupyterCmd(args, ctx) {
    var e = ctx.engine;
    var port = '8888';
    args.forEach(function (x, i) {
      if (x === '--port' || x === '-p') port = args[i + 1];
      if (x.indexOf('--port=') === 0) port = x.split('=')[1];
    });
    e.ai.sessions = e.ai.sessions || {};
    e.ai.sessions.jupyter = { port: Number(port) };
    return ok([
      '[I 2026-10-29 09:12:41 ServerApp] jupyter_server 2.14.2',
      '[I 2026-10-29 09:12:41 ServerApp] Jupyter Server is running at:',
      '[I 2026-10-29 09:12:41 ServerApp] http://127.0.0.1:' + port + '/lab?token=a1b2c3d4',
      '[I 2026-10-29 09:12:41 ServerApp] 在 Windows 浏览器打开这个地址即可（WSL 已做端口转发）',
      '（沙盒不真的起服务，但已记录该会话）'
    ].join('\n') + '\n');
  }

  /* ==========================================================================
   *  七、AI 场景（工作区）：给 Gate 关卡准备「可练手的现场」
   * ======================================================================== */

  function put(home, name, content, mode8) {
    home.children[name] = F.mkFile(content, mode8 ? { mode: mode8 } : {});
  }

  var TRAIN_CSV = [
    'id,text,label',
    '1,"good movie, great acting",1',
    '2,"bad movie, waste of time",0',
    '3,"not bad at all",1',
    '4,"terrible plot",0',
    '5,"loved it",1'
  ].join('\n') + '\n';

  var APP_PY = [
    'import gradio as gr',
    '',
    '',
    'def classify(text):',
    '    return "正面 0.93 / 负面 0.07"',
    '',
    '',
    'demo = gr.Interface(fn=classify, inputs="text", outputs="text",',
    '                    title="情感分类 demo")',
    'demo.launch(server_port=7860)',
    ''
  ].join('\n');

  var CHECK_ENV_PY = [
    'import sys',
    'import torch',
    '',
    'print("python:", sys.version.split()[0])',
    'print("torch:", torch.__version__)',
    'print("cuda:", torch.cuda.is_available())',
    ''
  ].join('\n');

  var REQ_TXT = 'torch==2.4.1\nnumpy==2.1.0\ngradio==4.44.1\n';

  var LOG_LINES = [
    '2026-10-29 09:00:01 INFO  loading model from ./models',
    '2026-10-29 09:00:03 INFO  model ready (0.5B, fp32)',
    '2026-10-29 09:00:04 INFO  gradio listening on 127.0.0.1:7860',
    '2026-10-29 09:01:12 WARN  cuda not available, fallback to cpu',
    '2026-10-29 09:02:30 ERROR request timeout after 30s'
  ].join('\n') + '\n';

  S.addScenario('ai-lab', {
    label: 'AI 实验区（Day1-3）',
    cwd: '/home/student',
    setup: function (home) {
      put(home, 'train.csv', TRAIN_CSV);
      put(home, 'app.py', APP_PY);
      put(home, 'check_env.py', CHECK_ENV_PY);
      put(home, 'requirements.txt', REQ_TXT);
      put(home, 'notes.txt', '第 1 天：把目录骨架搭起来\n- 数据 / 模型 / 日志 分开放\n');
      put(home, 'app.log', LOG_LINES);
      home.children.data = F.mkDir({
        'train.csv': F.mkFile(TRAIN_CSV),
        'labels.txt': F.mkFile('0\tnegative\n1\tpositive\n')
      });
      home.children.models = F.mkDir({});
      home.children.logs = F.mkDir({ 'app.log': F.mkFile(LOG_LINES) });
    }
  });

  S.addScenario('ai-env', {
    label: 'Python 环境（Day4）',
    cwd: '/home/student',
    setup: function (home) {
      put(home, 'requirements.txt', REQ_TXT);
      put(home, 'check_env.py', CHECK_ENV_PY);
      put(home, 'app.py', APP_PY);
      put(home, 'notes.txt', '第 4 天：一个项目一个 conda 环境\n');
    }
  });

  S.addScenario('ai-repo', {
    label: 'Git 仓库（Day5）',
    cwd: '/home/student',
    setup: function (home) {
      home.children['tiny-cls'] = F.mkDir({
        'README.md': F.mkFile(CLONE_FILES['README.md']),
        'requirements.txt': F.mkFile(CLONE_FILES['requirements.txt']),
        'train.py': F.mkFile(CLONE_FILES['train.py']),
        '.gitignore': F.mkFile(CLONE_FILES['.gitignore']),
        'model.py': F.mkFile('def build_model():\n    return {"layers": 2}\n'),
        '.git': F.mkDir({
          'HEAD': F.mkFile('ref: refs/heads/main\n'),
          'config': F.mkFile('[core]\n\trepositoryformatversion = 0\n')
        })
      });
      put(home, 'git-notes.md', '# 第 5 天：Git\n- 一次提交 = 一个可回滚的存档点\n- .gitignore 先写，别把权重文件推上去\n');
    }
  });

  S.addScenario('ai-gpu', {
    label: '运行与排障（Day6）',
    cwd: '/home/student',
    setup: function (home) {
      put(home, 'app.py', APP_PY);
      put(home, 'run.log', LOG_LINES);
      put(home, 'notes.txt', '第 6 天：跑起来 + 看得见 + 杀得掉\n');
      home.children.models = F.mkDir({ 'model.safetensors': F.mkFile('（占位权重 1.0 GB）\n') });
      home.children.scripts = F.mkDir({
        'start.sh': F.mkFile('#!/bin/bash\nnohup python app.py > run.log 2>&1 &\necho "pid=$!"\n', F.mode(755))
      });
    }
  });

  /* ==========================================================================
   *  八、实例初始化：把「场景里有 .git 目录」补成「有提交历史的仓库」
   * ======================================================================== */

  S.onInit(function (engine) {
    var a = ai(engine);

    if (engine.scenario === 'ai-repo') {
      var repo = '/home/student/tiny-cls';
      var st = repoState(a, repo);
      var tracked = ['README.md', 'requirements.txt', 'train.py', '.gitignore'];
      st.branch = 'main';
      st.remote = 'https://github.com/student-ai/tiny-cls.git';
      st.index = {};
      st.snapshot = {};
      tracked.forEach(function (f) {
        st.index[f] = CLONE_FILES[f];
        st.snapshot[f] = CLONE_FILES[f];
      });
      st.commits = [{
        hash: '7c1d9ab',
        msg: 'init: 项目骨架 + 依赖',
        files: tracked,
        branch: 'main',
        at: F.NOW
      }];
      st.seq = 1;
    }

    if (engine.scenario === 'ai-gpu') {
      a.gpu.procs = [];
      a.gpu.usedMB = 0;
      a.gpu.util = 0;
    }
  });

  /* ==========================================================================
   *  九、注册命令（help / Tab 补全 / which 会自动带上它们）
   * ======================================================================== */

  S.define('conda', condaCmd,
    'conda create -n ai7 python=3.10 -y | conda activate ai7 | conda env list',
    'Conda 环境管理（沙盒实现了完整的环境状态机）');
  S.define('pip', pipCmd,
    'pip install -r requirements.txt | pip freeze | pip list',
    'Python 包管理（会真的读取 requirements.txt）');
  S.define('python', pythonCmd,
    'python -V | python -c "print(1)" | python app.py',
    '教学级 Python（解释 print 与少量符号）');
  S.define('python3', pythonCmd,
    'python3 -V | python3 app.py',
    '同 python（Linux 上通常只叫 python3）');
  S.define('git', gitCmd,
    'git status | git add . | git commit -m "msg" | git log --oneline',
    'Git 教学子集（暂存区 / 提交 / 分支 / 远端）');
  S.define('nvidia-smi', nvidiaSmi,
    'nvidia-smi | nvidia-smi --query-gpu=name,memory.used --format=csv',
    '查看 GPU 状态（沙盒为教学样例，真机无卡）');
  S.define('hf', hfCmd,
    'hf download Qwen/Qwen2.5-0.5B-Instruct --local-dir ~/models/qwen',
    'Hugging Face 模型下载（模拟落盘）');
  S.define('jupyter', jupyterCmd,
    'jupyter lab --no-browser --port 8888',
    '启动 Jupyter（模拟会话）');

  /** 给 Gate / 关于页读的元信息 */
  S.aiPack = {
    version: '2.0',
    commands: ['conda', 'pip', 'python', 'python3', 'git', 'nvidia-smi', 'hf', 'jupyter'],
    scenarios: ['ai-lab', 'ai-env', 'ai-repo', 'ai-gpu']
  };

})(window);











