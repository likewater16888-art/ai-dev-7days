/* =============================================================================
 * js/data/d5.js
 * -----------------------------------------------------------------------------
 * Day 5 —— 用 Git 存档
 *
 * 进仓库看状态 → 写实验记录（看懂 .gitignore）→ add/commit 闭环 → 远端与说明
 * 关卡：≥2 次提交 + origin / 提交信息含 exp / 工作区干净
 * 闭卷挑战：再补一次带 exp2 的提交，并保持工作区干净
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd5',
    label: 'Day 5',
    title: '用 Git 存档',
    goal: '在一个真实仓库里走完 status → add → commit → log 的闭环，并让提交信息能被人看懂。',
    scenario: 'ai-repo',
    minutes: 50,

    intro: [
      'Git 不是"备份工具"，它是**你思考过程的存档**。今天只做最小闭环，但每一步都要理解。',
      '',
      '一个心智模型：',
      '',
      '- **工作区**（你正在改的文件） → `git add` → **暂存区**（准备提交的快照） → `git commit` → **历史**（不可改的存档点）。',
      '',
      '`git status` 就是你在这三者之间看路的地图：它会告诉你哪些文件被改了、哪些已经暂存、哪些根本没被 Git 管。',
      '',
      '> 今天结束的验收：`git log --oneline` 里有一条你自己写的、能看懂的提交；`git status` 是干净的。'
    ].join('\n'),

    lessons: [
      {
        id: 'd5-l1',
        title: '进仓库先看状态',
        body: [
          '进仓库的第一条命令永远是 `git status`，不是 `git add`。',
          '',
          '`cd tiny-cls` 之后注意：**你的位置变了**，后面所有相对路径都相对这个目录。' +
          '这也是新手最容易"文件明明在却找不到"的原因。'
        ].join('\n'),
        steps: [
          {
            line: 'cd tiny-cls',
            say: '进入仓库目录。',
            tokens: [
              { t: 'cd', k: 'cmd', ref: 'cd', m: '切换当前目录' },
              { t: 'tiny-cls', k: 'path', ref: '相对路径', m: '相对当前目录（~）的一个仓库目录' }
            ],
            expect: '没有输出；提示符里的路径会变（可以用 pwd 确认）',
            gotcha: ['之后所有路径都相对 tiny-cls，别再用 ~/data/... 那套']
          },
          {
            line: 'git status',
            say: '看清三件事：在哪个分支、有没有改动、有没有未跟踪文件。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制工具' },
              { t: 'status', k: 'value', ref: 'git status', m: '子命令：报告工作区状态' }
            ],
            expect: 'On branch main + 一段说明（干净或列出改动）',
            watch: ['On branch main', 'working tree clean'],
            gotcha: ['看到 fatal: not a git repository，说明你不在仓库里（路径错了）']
          },
          {
            line: 'git log --oneline',
            say: '看历史：一行一次提交，最上面是最近一次。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'log', k: 'value', ref: 'git log', m: '子命令：查看提交历史' },
              { t: '--oneline', k: 'flag', ref: '--oneline', m: '每个提交只占一行（哈希前 7 位 + 提交信息）' }
            ],
            expect: '至少一条提交（初始化那条）',
            watch: ['init', 'commit'],
            gotcha: ['历史是只读的：不要试图"改掉"旧提交，正确做法是再提交一次']
          }
        ],
        clinic: [
          {
            err: 'fatal: not a git repository (or any of the parent directories): .git',
            read: '当前目录和它的上级都没有 .git。',
            fix: 'cd 到仓库根目录；新项目用 git init（但别在家里随手 init 一个大仓库）。'
          },
          {
            err: 'git log 卡在全屏里出不来',
            read: 'git 用了分页器（less）。',
            fix: '按 q 退出；想一次看完用 git log --oneline -5。'
          }
        ],
        cheat: [
          { cmd: 'git status', mean: '现在什么状态' },
          { cmd: 'git log --oneline', mean: '历史一行一条' },
          { cmd: 'git branch', mean: '在哪个分支' },
          { cmd: 'git diff', mean: '具体改了哪几行' }
        ]
      },
      {
        id: 'd5-l2',
        title: '写实验记录，顺便看懂 .gitignore',
        body: [
          '今天要提交的内容是一份实验记录 `exp1.md`。写之前先看 `.gitignore`——它决定**哪些文件永远不会被提交**。',
          '',
          '典型被忽略的东西：模型权重、数据、日志、虚拟环境目录、密钥。理由：体积大 / 会变 / 不能外泄。',
          '',
          '> 判断标准很简单：**能不能由代码 + 数据重新生成**？能，就别提交。'
        ].join('\n'),
        steps: [
          {
            line: 'cat .gitignore',
            say: '看清哪些东西被排除在版本控制之外。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '.gitignore', k: 'path', ref: '隐藏文件', m: '以 . 开头的隐藏文件：忽略规则清单' }
            ],
            expect: '几行规则，例如 *.log、models/、__pycache__/',
            watch: ['*.log', 'models/'],
            gotcha: ['ls 默认看不到它，要用 ls -a —— 新手常以为"这个文件不存在"']
          },
          {
            line: 'echo "exp1: baseline 0.86，numpy 版逻辑回归" > exp1.md',
            say: '写一条实验记录：这次实验做了什么、结果多少。',
            tokens: [
              { t: 'echo', k: 'cmd', ref: 'echo', m: '输出文本' },
              { t: '"…"', k: 'quote', ref: '"', m: '整句一个参数' },
              { t: '>', k: 'op', ref: '>', m: '写进文件（覆盖）' },
              { t: 'exp1.md', k: 'path', ref: '相对路径', m: '相对 tiny-cls 的新文件' }
            ],
            expect: '没有输出；txt 里多了一个 exp1.md',
            gotcha: ['文件名别用中文和空格，跨平台容易出问题']
          },
          {
            line: 'git status',
            say: '再看状态：exp1.md 应该出现在 Untracked files 里。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'status', k: 'value', ref: 'git status', m: '看状态' }
            ],
            expect: 'Untracked files: exp1.md（红色）',
            watch: ['Untracked', 'exp1.md'],
            gotcha: ['未跟踪 ≠ 已修改：Git 还没开始管这个文件']
          }
        ],
        clinic: [
          {
            err: 'git status 里看不到刚写的文件',
            read: '文件被 .gitignore 忽略了，或者你写到了别的目录。',
            fix: 'git check-ignore -v 文件名 查是哪条规则忽略的；pwd + ls 确认文件位置。'
          },
          {
            err: '写进文件的中文变乱码',
            read: '编码不是 UTF-8。',
            fix: '真机上确认 locale；echo 用 UTF-8 终端写，不要在 GBK 终端里写中文。'
          }
        ],
        cheat: [
          { cmd: 'cat .gitignore', mean: '哪些文件被忽略' },
          { cmd: 'ls -a', mean: '看隐藏文件' },
          { cmd: 'git status', mean: '现在什么状态' },
          { cmd: 'git check-ignore -v 文件', mean: '谁把它忽略了' }
        ]
      },
      {
        id: 'd5-l3',
        title: 'add → commit：最小闭环',
        body: [
          '两次动作，缺一不可：',
          '',
          '- `git add .`：把当前目录的所有改动放进**暂存区**（"我要提交这些"）。',
          '- `git commit -m "说明"`：给暂存区拍一张**不可改的快照**，附上一句人能看懂的话。',
          '',
          '提交信息的写法（今天只用最简单的）：`类型: 一句话`，例如 `exp: baseline 0.86`。' +
          '别写 `update`、`fix bug`、`1` —— 三个月后你自己也看不懂。'
        ].join('\n'),
        steps: [
          {
            line: 'git add .',
            say: '把改动放进暂存区。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'add', k: 'value', ref: 'git add', m: '子命令：把改动加入暂存区' },
              { t: '.', k: 'op', ref: '.', m: '当前目录及其下所有改动（也可以指定具体文件）' }
            ],
            expect: '没有输出（成功是静默的）',
            gotcha: ['. 会把你没注意到的临时文件也加进去——所以先 git status 看一眼']
          },
          {
            line: 'git commit -m "exp: baseline 0.86"',
            say: '拍快照，并写一句说明。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'commit', k: 'value', ref: 'git commit', m: '子命令：提交暂存区内容' },
              { t: '-m', k: 'flag', ref: '-m', m: 'message：提交信息，后面跟字符串' },
              { t: '"exp: baseline 0.86"', k: 'quote', ref: '"', m: '提交信息：类型 exp + 结果 0.86' }
            ],
            expect: '[main 1a2b3c4] exp: baseline 0.86  + 1 file changed',
            watch: ['exp: baseline 0.86'],
            gotcha: ['忘了 -m 会打开编辑器让你写——不熟就按 Esc 再输 :q! 退出']
          },
          {
            line: 'git log --oneline',
            say: '确认历史里多了这一条。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'log', k: 'value', ref: 'git log', m: '看历史' },
              { t: '--oneline', k: 'flag', ref: '--oneline', m: '一行一条' }
            ],
            expect: '最上面是你刚写的 exp: baseline 0.86',
            watch: ['exp: baseline 0.86'],
            gotcha: ['哈希（1a2b3c4）是唯一编号，别改它']
          },
          {
            line: 'git status',
            say: '确认工作区干净：所有改动都进历史了。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'status', k: 'value', ref: 'git status', m: '看状态' }
            ],
            expect: 'nothing to commit, working tree clean',
            watch: ['working tree clean'],
            gotcha: ['还有 Untracked 文件，说明被 .gitignore 排除了，或你漏了 add']
          }
        ],
        clinic: [
          {
            err: 'nothing to commit, working tree clean（但你确信改了东西）',
            read: '改动可能在别的目录，或被 .gitignore 忽略。',
            fix: 'pwd 确认位置；git status --ignored 看被忽略的文件。'
          },
          {
            err: 'fatal: unable to auto-detect email address',
            read: 'Git 不知道你是谁。',
            fix: '真机上配一次：git config --global user.email "you@example.com" 和 user.name。'
          }
        ],
        cheat: [
          { cmd: 'git add .', mean: '全部加进暂存区' },
          { cmd: 'git add 文件', mean: '只加一个文件' },
          { cmd: 'git commit -m "说明"', mean: '提交并写说明' },
          { cmd: 'git log --oneline', mean: '确认历史' }
        ]
      },
      {
        id: 'd5-l4',
        title: '远端与说明：这个仓库要交给谁',
        body: [
          '本地提交只是"自己存档"。交付还要两样东西：**远端地址**（推到哪里）和 **README**（别人怎么用）。',
          '',
          '`git remote -v` 里的 `origin` 只是**约定俗成的名字**（默认远端叫 origin），不是关键字。' +
          '`-v` 是 verbose，会打印 fetch / push 两个地址。'
        ].join('\n'),
        steps: [
          {
            line: 'git remote -v',
            say: '看远端配置：仓库会推到哪。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'remote', k: 'value', ref: 'git remote', m: '子命令：管理远端仓库' },
              { t: '-v', k: 'flag', ref: '-v', m: 'verbose：打印 fetch / push 地址' }
            ],
            expect: 'origin  https://github.com/…(fetch) 和 (push)',
            watch: ['origin', 'github.com'],
            gotcha: ['没有 origin 说明仓库还没配远端：git remote add origin 地址']
          },
          {
            line: 'cat README.md',
            say: '读仓库说明：这个项目是什么、怎么跑。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: 'README.md', k: 'path', ref: 'README.md', m: 'README 是给别人看的第一入口' }
            ],
            expect: '项目名、用途、运行方式',
            watch: ['tiny-cls'],
            gotcha: ['README 写了"运行 python app.py"却不说端口，别人会卡住——用别人的视角写']
          }
        ],
        clinic: [
          {
            err: 'src refspec main does not match any',
            read: '你还没有任何提交，或分支名不一致。',
            fix: '先 git add . 再 git commit；用 git branch 看当前分支名。'
          },
          {
            err: 'Permission denied (publickey)',
            read: 'SSH 密钥没配好。',
            fix: '改用 HTTPS 地址，或把公钥加到 GitHub；临时可用 Personal Access Token。'
          }
        ],
        cheat: [
          { cmd: 'git remote -v', mean: '远端地址' },
          { cmd: 'git remote add origin 地址', mean: '添加远端' },
          { cmd: 'cat README.md', mean: '项目说明' },
          { cmd: 'git push -u origin main', mean: '推第一次' }
        ]
      },
      {
        id: 'd5-l5',
        title: '自己动手：用三句话讲清仓库现状',
        body: [
          '只读三连，练"看状态"：',
          '',
          '1. `git log --oneline` —— 有几条提交，最新那条说的是什么？',
          '2. `cat exp1.md` —— 你的实验记录写了什么？',
          '3. `git status` —— 现在干净吗？',
          '',
          '> 面试被问"你上次提交改了什么"，能立刻答出来的人，通常就是真在用 Git 的人。'
        ].join('\n'),
        steps: [
          {
            line: 'git log --oneline',
            say: '历史速览。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'log', k: 'value', ref: 'git log', m: '看历史' },
              { t: '--oneline', k: 'flag', ref: '--oneline', m: '一行一条' }
            ],
            expect: '两条：exp: baseline 0.86 和初始化那次',
            watch: ['exp:']
          },
          {
            line: 'cat exp1.md',
            say: '读回你的实验记录。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: 'exp1.md', k: 'path', ref: '相对路径', m: '你写的实验记录' }
            ],
            expect: 'exp1: baseline 0.86，numpy 版逻辑回归',
            watch: ['0.86']
          },
          {
            line: 'git status',
            say: '最后确认一次状态。',
            tokens: [
              { t: 'git', k: 'cmd', ref: 'git', m: '版本控制' },
              { t: 'status', k: 'value', ref: 'git status', m: '看状态' }
            ],
            expect: 'working tree clean',
            watch: ['clean']
          }
        ],
        clinic: [
          {
            err: 'git status 显示 modified: 某个你没动过的文件',
            read: '可能是编辑器/工具自动改了行尾或格式。',
            fix: 'git diff 看具体行；真不需要就 git checkout -- 文件 还原。'
          },
          {
            err: '提交后发现漏了文件',
            read: '很正常，追加一次提交即可。',
            fix: 'git add 漏掉的文件，再 git commit -m "exp: 补上 xx"。'
          }
        ],
        cheat: [
          { cmd: 'git log --oneline', mean: '历史' },
          { cmd: 'git status', mean: '状态' },
          { cmd: 'git diff', mean: '改了哪几行' },
          { cmd: 'git checkout -- 文件', mean: '放弃这个文件的改动' }
        ]
      }
    ],

    gates: [
      {
        id: 'd5-g1',
        title: '至少两次提交',
        brief: '`~/tiny-cls` 里提交数 ≥ 2（原来的 init + 你今天的一次）',
        hints: ['改文件 → `git add .` → `git commit -m "..."`', '`git log --oneline` 数一下有几行'],
        checks: [
          { t: 'aiRepo', path: '~/tiny-cls', commits: 2, why: 'tiny-cls 里已有 ≥ 2 次提交' },
          { t: 'aiRepo', path: '~/tiny-cls', remote: 'github.com', why: '仓库配置了 origin 远端' }
        ]
      },
      {
        id: 'd5-g2',
        title: '提交信息能看懂',
        brief: '有一条提交信息里包含 `exp`（说明你写的是实验记录，而不是 update）',
        hints: ['提交信息写成 `exp: baseline 0.86` 这种', '已经提交错了？再补一次正确的提交也行'],
        checks: [
          { t: 'aiRepo', path: '~/tiny-cls', message: 'exp', why: '有一次提交信息里带 exp' }
        ]
      },
      {
        id: 'd5-g3',
        title: '工作区干净',
        brief: '`git status` 显示 nothing to commit / working tree clean',
        hints: ['所有改动都要 add + commit', '有临时文件就加进 .gitignore，而不是硬提交'],
        checks: [
          { t: 'aiRepo', path: '~/tiny-cls', clean: true, why: 'tiny-cls 没有未提交的改动' }
        ]
      }
    ],

    challenge: {
      id: 'd5-c1',
      title: '闭卷：再存一次档',
      brief: '不许往上翻。在仓库里新建 `note.md`（内容随意，但要有一行字），' +
        '提交一次，提交信息里必须包含 `exp2`，并且提交完 `git status` 是干净的。',
      hints: ['顺序：写文件 → git add . → git commit -m "..."', '提交完用 git status 确认干净'],
      checks: [
        { t: 'aiRepo', path: '~/tiny-cls', commits: 3, why: '现在共有 ≥ 3 次提交' },
        { t: 'aiRepo', path: '~/tiny-cls', message: 'exp2', why: '提交信息里带 exp2' },
        { t: 'aiRepo', path: '~/tiny-cls', clean: true, why: '提交后工作区干净' }
      ],
      solution: [
        'echo "exp2: 第二轮 baseline 0.88" > note.md',
        'git add .',
        'git commit -m "exp2: second round 0.88"',
        'git status'
      ]
    }
  });
})(window);
