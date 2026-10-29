/* =============================================================================
 * js/data/d4.js
 * -----------------------------------------------------------------------------
 * Day 4 —— 一个项目一个环境
 *
 * conda 建环境 → 激活 → pip 按清单装 → 验证 → 导出两份可复现清单
 * 关卡：aiEnv(ai7, py 3.10) / aiActive+aiPkg(torch 2.4.1) / environment.yml + lock
 * 闭卷挑战：不激活地再建一个 ai8，且不破坏 ai7 的清单
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd4',
    label: 'Day 4',
    title: '一个项目一个环境',
    goal: '用 conda 建 ai7 环境、按 requirements.txt 装好 torch，并导出两份可复现清单。',
    scenario: 'ai-env',
    minutes: 55,

    intro: [
      '昨天体检的结论是：**base 里没有 torch**。今天来解决它——但**不是**直接 `pip install torch` 装进 base。',
      '',
      '一个项目一个 conda 环境，三条理由：',
      '',
      '1. A 项目要 `torch 2.4`、B 项目要 `torch 2.1`，装在一个环境里必然打架。',
      '2. 环境坏了，删掉重建，不影响全局。',
      '3. 环境能导出成文件（`environment.yml`），别人照着就能复现你的结果。',
      '',
      '> 今天结束的验收：`conda env list` 里有 ai7；ai7 里 torch 是 2.4.1；主目录有两份清单。'
    ].join('\n'),

    lessons: [
      {
        id: 'd4-l1',
        title: '先看现状，再建环境',
        body: [
          '建之前先确认两件事：**现在有哪些环境**、**base 的 Python 是几**。',
          '',
          '`conda create -n ai7 python=3.10 -y` 拆开读：`-n` 给名字，`python=3.10` 指定解释器，`-y` 表示别问我直接装。',
          '',
          '> 为什么是 3.10？不是因为它最好，而是因为它**和大量预编译轮子兼容**。指定版本本身就是工程决定：你要能说出理由。'
        ].join('\n'),
        steps: [
          {
            line: 'conda env list',
            say: '现在只有 base。看清现状再动手。',
            tokens: [
              { t: 'conda', k: 'cmd', ref: 'conda', m: '环境 + 包管理器' },
              { t: 'env list', k: 'value', ref: 'conda env list', m: '列出所有环境，* 标出当前激活的那个' }
            ],
            expect: '只有 base 一行，带 *',
            watch: ['base', '*'],
            gotcha: ['如果已经有一堆环境了，先想清楚该进哪个，别在 base 里装东西']
          },
          {
            line: 'python -V',
            say: '看 base 的 Python 版本。',
            tokens: [
              { t: 'python', k: 'cmd', ref: 'python', m: 'Python 解释器' },
              { t: '-V', k: 'flag', ref: '--version', m: 'version：打印版本（大写 V）' }
            ],
            expect: 'Python 3.11.9（base 的版本）',
            watch: ['3.11'],
            gotcha: ['-v 是小写 verbose，-V 才是版本，两者完全不是一回事']
          },
          {
            line: 'conda create -n ai7 python=3.10 -y',
            say: '建一个叫 ai7 的环境，Python 3.10。',
            tokens: [
              { t: 'conda', k: 'cmd', ref: 'conda', m: '环境管理器' },
              { t: 'create', k: 'value', ref: 'conda create', m: '子命令：新建环境' },
              { t: '-n', k: 'flag', ref: '-n', m: 'name：环境名，这里叫 ai7' },
              { t: 'python=3.10', k: 'value', ref: '=', m: '指定解释器版本；等号两边不能有空格' },
              { t: '-y', k: 'flag', ref: '-y', m: 'yes：所有确认自动回答 y' }
            ],
            expect: 'Collecting / Executing transaction，最后提示 To activate this environment',
            watch: ['conda activate ai7'],
            gotcha: ['建完不会自动进入环境——必须 conda activate 才生效']
          }
        ],
        clinic: [
          {
            err: 'CondaError: prefix already exists',
            read: 'ai7 已经建过了。',
            fix: '直接 conda activate ai7；想重建先 conda env remove -n ai7。'
          },
          {
            err: 'conda: command not found',
            read: 'conda 不在 PATH 里。',
            fix: '真机上 source ~/miniconda3/etc/profile.d/conda.sh；或重新初始化 conda。'
          }
        ],
        cheat: [
          { cmd: 'conda env list', mean: '有哪些环境' },
          { cmd: 'conda create -n 名字 python=3.10 -y', mean: '建环境' },
          { cmd: 'conda activate 名字', mean: '进入环境' },
          { cmd: 'conda deactivate', mean: '退出环境' }
        ]
      },
      {
        id: 'd4-l2',
        title: '激活：从 base 换到 ai7',
        body: [
          '`conda activate` 之后，**同一个 `python` 命令指向的解释器就变了**。这是最容易翻车的一步：' +
          '忘记激活，`pip install` 就会装进 base。',
          '',
          '验证方法只有一个，但非常可靠：`which python`。看它指向哪里，就知道你人在哪个环境。',
          '',
          '> `which python` 是最便宜的环境检查。安装任何东西前先敲一次，能省下半小时排障。'
        ].join('\n'),
        steps: [
          {
            line: 'conda activate ai7',
            say: '进入 ai7 环境。',
            tokens: [
              { t: 'conda', k: 'cmd', ref: 'conda', m: '环境管理器' },
              { t: 'activate', k: 'value', ref: 'conda activate', m: '子命令：切换到这个环境' },
              { t: 'ai7', k: 'value', ref: 'conda activate', m: '环境名（必须和建的时候一致）' }
            ],
            expect: '提示符前面多出 (ai7)',
            watch: ['(ai7)'],
            gotcha: ['没有 (ai7) 说明激活失败，后面所有 pip install 都会装错地方']
          },
          {
            line: 'python -V',
            say: '确认版本真的变了：3.10，不是 base 的 3.11。',
            tokens: [
              { t: 'python', k: 'cmd', ref: 'python', m: '解释器' },
              { t: '-V', k: 'flag', ref: '--version', m: '打印版本' }
            ],
            expect: 'Python 3.10.x',
            watch: ['3.10'],
            gotcha: ['还是 3.11 说明激活没成功']
          },
          {
            line: 'which python',
            say: '看 python 到底指向哪个路径——这才是"你真的在 ai7 里"的铁证。',
            tokens: [
              { t: 'which', k: 'cmd', ref: 'which', m: '找出这个命令用的是哪个可执行文件' },
              { t: 'python', k: 'value', ref: 'python', m: '要查的命令' }
            ],
            expect: '路径里带 envs/ai7（例如 …/envs/ai7/bin/python）',
            watch: ['ai7'],
            gotcha: ['指向 /usr/bin/python 说明你还在系统 Python 里']
          }
        ],
        clinic: [
          {
            err: '提示符没变，python -V 还是 3.11',
            read: '激活失败（环境名错，或 shell 没初始化 conda）。',
            fix: 'conda env list 看准确名字；真机上 source ~/.bashrc 后重试。'
          },
          {
            err: 'ModuleNotFoundError 出现在"明明装过"的包上',
            read: '你装到别的环境去了。',
            fix: 'which python 和 pip show 包名 一起看，确认装的位置和解释器是同一个环境。'
          }
        ],
        cheat: [
          { cmd: 'conda activate ai7', mean: '进环境' },
          { cmd: 'python -V', mean: '版本变了没' },
          { cmd: 'which python', mean: '我现在用的是哪个 python' },
          { cmd: 'echo $CONDA_DEFAULT_ENV', mean: '当前环境名' }
        ]
      },
      {
        id: 'd4-l3',
        title: '按清单安装，然后验证',
        body: [
          '`pip install -r requirements.txt` 的意思是"照单全收"：清单里写什么就装什么，版本也照它写的来。',
          '',
          '装完必须验证两件事：',
          '',
          '1. `pip list` —— 包里有没有 torch，版本对不对。',
          '2. `python -c "print(torch.__version__)"` —— **能不能 import**。装上了不等于能用（缺 CUDA 库、ABI 不匹配都会在这步炸）。',
          '',
          '> "装上了"和"能用"是两件事。老手永远要跑一次 import。'
        ].join('\n'),
        steps: [
          {
            line: 'pip install -r requirements.txt',
            say: '按清单安装依赖。',
            tokens: [
              { t: 'pip', k: 'cmd', ref: 'pip', m: 'Python 包管理器' },
              { t: 'install', k: 'value', ref: 'pip install', m: '子命令：安装' },
              { t: '-r', k: 'flag', ref: '-r requirements.txt', m: 'requirements：从清单文件读依赖' },
              { t: 'requirements.txt', k: 'path', ref: 'requirements.txt', m: '清单文件（一行一个包，带版本）' }
            ],
            expect: 'Collecting torch==2.4.1 … Successfully installed',
            watch: ['torch==2.4.1', 'Successfully installed'],
            gotcha: ['忘了 -r 就会把 "requirements.txt" 当成包名去装，报 No matching distribution']
          },
          {
            line: 'pip list',
            say: '看环境里装了哪些包、什么版本。',
            tokens: [
              { t: 'pip', k: 'cmd', ref: 'pip', m: '包管理器' },
              { t: 'list', k: 'value', ref: 'pip list', m: '子命令：列出已安装的包' }
            ],
            expect: '表格里能看到 torch 2.4.1',
            watch: ['torch 2.4.1'],
            gotcha: ['版本是 2.4.0 或 2.5.x，说明清单里写的是 >= 或没锁版本']
          },
          {
            line: 'python -c "print(torch.__version__)"',
            say: '真刀真枪 import 一次：能打印版本才算装好。',
            tokens: [
              { t: 'python', k: 'cmd', ref: 'python', m: '解释器' },
              { t: '-c', k: 'flag', ref: '-e', m: 'command：把后面这段字符串当代码执行' },
              { t: '"print(torch.__version__)"', k: 'quote', ref: '"', m: '一段 Python 代码；沙盒对 print + 简单取值是支持的' }
            ],
            expect: '2.4.1',
            watch: ['2.4.1'],
            gotcha: ['沙盒里的 python 是教学简化版，复杂表达式可能不支持；真机上这行一定成立']
          }
        ],
        clinic: [
          {
            err: 'No matching distribution found for torch==2.4.1',
            read: '源里没有这个版本（或 Python 版本不兼容）。',
            fix: '先 pip index versions torch 看有哪些版本；或换 --index-url 用官方源。'
          },
          {
            err: 'ERROR: Could not find a version that satisfies the requirement',
            read: '包名拼错，或者这个包不支持当前 Python。',
            fix: '核对 requirements.txt 的拼写；确认你在 ai7（which python）。'
          }
        ],
        cheat: [
          { cmd: 'pip install -r requirements.txt', mean: '按清单装' },
          { cmd: 'pip install torch==2.4.1', mean: '装指定版本' },
          { cmd: 'pip list', mean: '装了什么' },
          { cmd: 'pip show torch', mean: '某个包的详情' },
          { cmd: 'python -c "import torch"', mean: '能不能 import' }
        ]
      },
      {
        id: 'd4-l4',
        title: '把环境钉死：导出两份清单',
        body: [
          '环境配好了，但**"我这能用"不等于"别人也能用"**。要把环境写成文件。',
          '',
          '两份清单，各管一段：',
          '',
          '- `requirements.lock.txt`（`pip freeze` 导出）：**精确到版本的所有 Python 包**，给 pip 用。',
          '- `environment.yml`（`conda env export` 导出）：连 **Python 版本 + conda 装的包**一起，给 conda 用。',
          '',
          '> 名字里带 lock 的意思是"锁死"。给机器读的清单要精确，给人读的清单可以宽松。'
        ].join('\n'),
        steps: [
          {
            line: 'pip freeze > requirements.lock.txt',
            say: '导出所有包的精确版本，作为 lock 文件。',
            tokens: [
              { t: 'pip', k: 'cmd', ref: 'pip', m: '包管理器' },
              { t: 'freeze', k: 'value', ref: 'pip freeze', m: '把已安装包导出成 包名==版本 的清单' },
              { t: '>', k: 'op', ref: '>', m: '把输出写进文件' },
              { t: 'requirements.lock.txt', k: 'path', ref: 'requirements.txt', m: '锁版本清单（约定俗成的名字）' }
            ],
            expect: '没有输出；主目录多了一个 requirements.lock.txt',
            watch: ['torch==2.4.1'],
            gotcha: ['在 base 里执行会导出一堆无关的包——所以要先确认 which python']
          },
          {
            line: 'conda env export > environment.yml',
            say: '导出 conda 环境描述：Python 版本 + 依赖树。',
            tokens: [
              { t: 'conda', k: 'cmd', ref: 'conda', m: '环境管理器' },
              { t: 'env export', k: 'value', ref: 'conda env export', m: '导出当前环境为 yml' },
              { t: '>', k: 'op', ref: '>', m: '写进文件' },
              { t: 'environment.yml', k: 'path', ref: 'environment.yml', m: 'conda 环境描述文件' }
            ],
            expect: '没有输出；environment.yml 出现在主目录',
            watch: ['name: ai7'],
            gotcha: ['它导出的是"当前激活的环境"，没激活会导出 base']
          },
          {
            line: 'head -8 environment.yml',
            say: '看 yml 开头：名字、channels、dependencies。',
            tokens: [
              { t: 'head', k: 'cmd', ref: 'head', m: '看文件开头' },
              { t: '-8', k: 'flag', ref: '-3', m: '行数：这里看 8 行' },
              { t: 'environment.yml', k: 'path', ref: 'environment.yml', m: '刚导出的环境描述' }
            ],
            expect: 'name: ai7 / channels: / dependencies: 开头几行',
            watch: ['name: ai7', 'python=3.10'],
            gotcha: ['yml 缩进敏感，手改时只动 dependencies 里的项，别动层级']
          }
        ],
        clinic: [
          {
            err: 'environment.yml 里 name: base',
            read: '导出时不在 ai7 里。',
            fix: 'conda activate ai7 再导一次。'
          },
          {
            err: 'requirements.lock.txt 里包特别多，还有你没见过的',
            read: '正常：它导出的是全套依赖，包括依赖的依赖。',
            fix: '给机器读就该这样；给人看的清单用 requirements.txt（只写直接依赖）。'
          }
        ],
        cheat: [
          { cmd: 'pip freeze > requirements.lock.txt', mean: '锁版本清单' },
          { cmd: 'conda env export > environment.yml', mean: 'conda 环境描述' },
          { cmd: 'conda env create -f environment.yml', mean: '照 yml 重建环境' },
          { cmd: 'pip install -r requirements.lock.txt', mean: '照 lock 精确安装' }
        ]
      },
      {
        id: 'd4-l5',
        title: '自己动手：三条命令复核环境',
        body: [
          '全部只读，三条命令，用来回答"我现在到底在什么环境里、装了什么"：',
          '',
          '1. `conda env list` —— ai7 在不在，谁是当前。',
          '2. `pip show torch` —— torch 版本、装在哪。',
          '3. `ls -l ~/environment.yml ~/requirements.lock.txt` —— 两份清单在不在。'
        ].join('\n'),
        steps: [
          {
            line: 'conda env list',
            say: '环境清单：ai7 应该在，并且被 * 标出来。',
            tokens: [
              { t: 'conda', k: 'cmd', ref: 'conda', m: '环境管理器' },
              { t: 'env list', k: 'value', ref: 'conda env list', m: '列出所有环境' }
            ],
            expect: 'base 和 ai7，ai7 带 *',
            watch: ['ai7', '*']
          },
          {
            line: 'pip show torch',
            say: '看 torch 的详细信息：版本 + 安装位置。',
            tokens: [
              { t: 'pip', k: 'cmd', ref: 'pip', m: '包管理器' },
              { t: 'show', k: 'value', ref: 'pip show', m: '子命令：显示某个包的详情' },
              { t: 'torch', k: 'value', ref: 'torch', m: '要查看的包名' }
            ],
            expect: 'Name: torch / Version: 2.4.1 / Location: …/envs/ai7/…',
            watch: ['Version: 2.4.1'],
            gotcha: ['Location 不在 ai7 里，说明包装错环境了']
          },
          {
            line: 'ls -l ~/environment.yml ~/requirements.lock.txt',
            say: '两份清单：在不在、多大。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列文件' },
              { t: '-l', k: 'flag', ref: '-l', m: '长格式' },
              { t: '~/environment.yml', k: 'path', ref: 'environment.yml', m: 'conda 环境描述' },
              { t: '~/requirements.lock.txt', k: 'path', ref: 'requirements.txt', m: '锁版本清单' }
            ],
            expect: '两行，都有非零字节数',
            watch: ['environment.yml', 'requirements.lock.txt'],
            gotcha: ['某个文件 0 字节，说明导出时命令报错了，往上翻输出']
          }
        ],
        clinic: [
          {
            err: 'ls 报 No such file or directory（其中一个文件）',
            read: '那次导出没成功。',
            fix: '重新执行对应的导出命令，注意先确认在 ai7 里。'
          },
          {
            err: 'pip show torch 的 Location 在 /usr/lib',
            read: 'torch 装到了系统 Python。',
            fix: 'conda activate ai7 后重新 pip install -r requirements.txt。'
          }
        ],
        cheat: [
          { cmd: 'conda env list', mean: '环境 + 当前是谁' },
          { cmd: 'pip show 包名', mean: '版本 + 装在哪' },
          { cmd: 'ls -l 文件', mean: '文件在不在、多大' },
          { cmd: 'wc -l 文件', mean: '清单有多少行依赖' }
        ]
      }
    ],

    gates: [
      {
        id: 'd4-g1',
        title: 'ai7 环境建好',
        brief: 'conda 里有一个名为 `ai7`、python 3.10 的环境',
        hints: ['`conda create -n ai7 python=3.10 -y`', '建完 `conda env list` 确认'],
        checks: [
          { t: 'aiEnv', name: 'ai7', py: '3.10', why: 'conda 环境 ai7 存在（python 3.10.x）' }
        ]
      },
      {
        id: 'd4-g2',
        title: 'ai7 里装上了 torch',
        brief: '激活 `ai7`，用 `requirements.txt` 装好 `torch==2.4.1`',
        hints: ['先 `conda activate ai7`，`which python` 确认', '`pip install -r requirements.txt`'],
        checks: [
          { t: 'aiActive', name: 'ai7', why: '当前激活的环境是 ai7' },
          { t: 'aiPkg', name: 'torch', version: '2.4.1', why: 'ai7 里有 torch==2.4.1' }
        ]
      },
      {
        id: 'd4-g3',
        title: '环境可复现',
        brief: '导出 `environment.yml` 和 `requirements.lock.txt` 两份清单',
        hints: ['`conda env export > environment.yml`', '`pip freeze > requirements.lock.txt`'],
        checks: [
          {
            t: 'file',
            path: '~/environment.yml',
            contains: ['name: ai7', 'torch==2.4.1'],
            why: 'environment.yml 里有环境名和 torch 版本'
          },
          {
            t: 'file',
            path: '~/requirements.lock.txt',
            contains: 'torch==2.4.1',
            why: 'requirements.lock.txt 里锁定了 torch 版本'
          }
        ]
      }
    ],

    challenge: {
      id: 'd4-c1',
      title: '闭卷：再建一个环境，但不许弄坏 ai7',
      brief: '不许往上翻。建一个名为 `ai8`、Python 3.11 的环境，**不要激活它**；' +
        '同时保证 `~/environment.yml` 里仍然是 `name: ai7`。',
      hints: ['`conda create -n 名字 python=版本 -y`', '建完别 activate；用 conda env list 确认两个都在'],
      checks: [
        { t: 'aiEnv', name: 'ai8', py: '3.11', why: 'conda 环境 ai8 存在（python 3.11.x）' },
        { t: 'aiActive', name: 'ai7', why: '当前激活的仍然是 ai7（没有被切走）' },
        { t: 'file', path: '~/environment.yml', contains: 'name: ai7', why: 'environment.yml 还是 ai7 的' }
      ],
      solution: ['conda create -n ai8 python=3.11 -y']
    }
  });
})(window);
