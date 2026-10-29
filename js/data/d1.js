/* =============================================================================
 * js/data/d1.js
 * -----------------------------------------------------------------------------
 * Day 1 —— 项目地基：先认路，再造房
 *
 * 认路（pwd/ls/tree）→ 认项目结构（三类文件）→ 建实验目录 → 搬依赖与说明
 * 关卡：exp1 三层骨架 / README 标题 / requirements.txt 跟着项目走
 * 闭卷挑战：不看上面，独立再造一个 exp2
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd1',
    label: 'Day 1',
    title: '项目地基：先认路，再造房',
    goal: '在沙盒里认出「数据 / 配置 / 代码」三类文件，并搭出你自己的实验目录 exp1。',
    scenario: 'ai-lab',
    minutes: 50,

    intro: [
      '今天不训练模型，只干一件事：**把你手上的项目看清楚，然后给它搭个能住人的地基**。',
      '',
      '新手最容易犯的错，不是不会写代码，而是**不知道自己现在在哪**：路径写错、文件找不到、命令跑在了错误的目录里。' +
      '所以第一天全部是「认路」和「摆家具」。',
      '',
      '> 今天结束时的验收标准：`~/work/exp1` 这个目录，任何人打开都能立刻看懂——哪里放数据、哪里放日志、' +
      '怎么装依赖、这个实验在干什么。'
    ].join('\n'),

    lessons: [
      {
        id: 'd1-l1',
        title: '先看清现场：你在哪、有什么、长什么样',
        body: [
          '进任何一台机器、任何一个项目，前三条命令永远是 `pwd` → `ls` → `tree`。',
          '',
          '顺序有理由：先确认**位置**（pwd），再看**这一层有什么**（ls），最后看**整体结构**（tree）。' +
          '跳过第一步，后面所有相对路径都可能指向错误的地方。'
        ].join('\n'),
        steps: [
          {
            line: 'pwd',
            say: '确认自己站在哪。后面所有相对路径都以这里为基准。',
            tokens: [
              { t: 'pwd', k: 'cmd', ref: 'pwd', m: 'print working directory：打印当前目录的绝对路径' }
            ],
            expect: '/home/student',
            watch: ['/home/student'],
            gotcha: ['如果你看到的不是 /home/student，先 cd ~ 回主目录再继续']
          },
          {
            line: 'ls',
            say: '看这一层有什么。默认不显示隐藏文件（. 开头的）。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: 'list：列出目录内容' }
            ],
            expect: '几项：data、models、logs、requirements.txt、check_env.py、app.py',
            watch: ['requirements.txt', 'check_env.py'],
            gotcha: ['ls 的输出顺序不保证，别记顺序，记名字']
          },
          {
            line: 'tree -L 2',
            say: '看两层结构。树状视图是"这个项目长什么样"最快的方式。',
            tokens: [
              { t: 'tree', k: 'cmd', ref: 'tree', m: '树状列出目录层级' },
              { t: '-L', k: 'flag', ref: '-L', m: 'limit level：只往下看几层' },
              { t: '2', k: 'value', ref: '-3', m: '层数。2 = 当前层 + 一层子目录' }
            ],
            expect: '一个树状图：根目录下挂着 data/、models/、logs/ 等',
            watch: ['data/', 'models/', 'logs/'],
            gotcha: ['真机上可能没装 tree，会报 command not found；沙盒里一定有']
          }
        ],
        clinic: [
          {
            err: 'tree: command not found',
            read: '这台机器没装 tree。',
            fix: '用 ls -R 代替；或者 sudo apt install tree -y（真机）。这不是你写错了。'
          },
          {
            err: 'pwd 输出 /root',
            read: '你成了 root 用户，工作目录也变了。',
            fix: 'cd ~ 回到自己的主目录；别在 /root 下做实验。'
          }
        ],
        cheat: [
          { cmd: 'pwd', mean: '我在哪（绝对路径）' },
          { cmd: 'ls', mean: '这层有什么' },
          { cmd: 'ls -la', mean: '加隐藏文件 + 权限 + 大小' },
          { cmd: 'tree -L 2', mean: '两层树状结构' },
          { cmd: 'cd ~', mean: '回主目录，迷路时的万能解' }
        ]
      },
      {
        id: 'd1-l2',
        title: '一个 AI 项目只有三类东西',
        body: [
          '把 `tree` 的结果再看一遍，然后记住这个分类——**任何** AI 项目都能套进去：',
          '',
          '- **数据**（`data/`）：输入。样本、标签、词表。**只读**，永远不要在原始数据上直接改。',
          '- **配置**（`requirements.txt`、`check_env.py`）：决定"用什么环境跑"。出问题一半在这里。',
          '- **代码**（`app.py`、`train.py`）：逻辑。它最干净，也最不该背锅。',
          '',
          '> 排障顺序就是按这个分类走的：先看数据有没有、再看环境对不对、最后才怀疑代码。'
        ].join('\n'),
        steps: [
          {
            line: 'cat requirements.txt',
            say: '看依赖清单：这个项目需要哪些包、什么版本。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '把文件内容整段打印出来' },
              { t: 'requirements.txt', k: 'path', ref: 'requirements.txt', m: 'pip 的依赖清单，一行一个包（通常带版本）' }
            ],
            expect: '两行左右，例如 torch==2.4.1 / gradio==4.44.0',
            watch: ['torch==2.4.1'],
            gotcha: ['== 是锁死版本，>= 是"至少"；项目里尽量用 ==，否则半年后装出来的不是一个东西']
          },
          {
            line: 'head -3 data/train.csv',
            say: '看数据的前三行：表头 + 两条样本。判断数据"长什么样"最快的办法。',
            tokens: [
              { t: 'head', k: 'cmd', ref: 'head', m: '只看文件开头若干行' },
              { t: '-3', k: 'flag', ref: '-3', m: '数字参数：只要 3 行' },
              { t: 'data/train.csv', k: 'path', ref: '相对路径', m: '相对当前目录的路径；改成 ~/data/train.csv 就是绝对路径' }
            ],
            expect: '第一行表头（text,label），后面两条带标签的样本',
            watch: ['text,label', ',1', ',0'],
            gotcha: ['CSV 里有逗号、引号、中文时 head 看起来会乱——这只是显示，不代表文件坏了']
          },
          {
            line: 'cat check_env.py',
            say: '看环境自检脚本。它就是"这个项目对环境的全部要求"的可执行版本。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '整段打印文件' },
              { t: 'check_env.py', k: 'path', ref: 'python', m: '一个 Python 脚本，检查 python 版本和 cuda 是否可用' }
            ],
            expect: '几行 Python：打印 python 版本、torch 版本、cuda 是否可用',
            watch: ['import', 'cuda'],
            gotcha: ['先读脚本再运行是工程习惯；不读就 bash 陌生脚本，是事故来源']
          }
        ],
        clinic: [
          {
            err: "head: cannot open 'data/train.csv' for reading: No such file",
            read: '当前目录下没有 data/train.csv。',
            fix: '先 ls 看有没有 data 目录；确认自己在 ~（pwd），不行就用 ~/data/train.csv。'
          },
          {
            err: 'cat: requirements.txt: Permission denied',
            read: '文件在，但你没读权限。',
            fix: 'ls -l 看权限位；真机上 chmod 644 requirements.txt 或找管理员。'
          }
        ],
        cheat: [
          { cmd: 'cat 文件', mean: '短文件整段看' },
          { cmd: 'head -3 文件', mean: '前三行（数据体检）' },
          { cmd: 'wc -l 文件', mean: '一共多少行' },
          { cmd: 'file 文件', mean: '真实类型（不看后缀）' },
          { cmd: 'grep 关键词 文件', mean: '只留命中的行' }
        ]
      },
      {
        id: 'd1-l3',
        title: '建自己的实验目录：一次建两层',
        body: [
          '为什么不直接用项目根目录做实验？因为它会变成垃圾场：你的笔记、旧模型、临时日志会和原始代码混在一起，' +
          '下次你自己都分不清哪个是最新的。',
          '',
          '规矩：**项目根目录放"原始材料"，`~/work/expN` 放"我的实验"**。' +
          '`mkdir -p` 的 `-p` 是 parents——父目录不存在会一起建，且目录已存在也不报错（可重复执行）。'
        ].join('\n'),
        steps: [
          {
            line: 'mkdir -p ~/work/exp1/data',
            say: '建数据目录。~ 下还没有 work，靠 -p 一次性建出来。',
            tokens: [
              { t: 'mkdir', k: 'cmd', ref: 'mkdir', m: 'make directory：建目录' },
              { t: '-p', k: 'flag', ref: '-p', m: 'parents：缺的父目录一起建；已存在也不报错' },
              { t: '~/work/exp1/data', k: 'path', ref: '~', m: '要建的目标路径，三层一次到位' }
            ],
            expect: '没有输出 = 成功',
            gotcha: ['不加 -p 时会报 No such file or directory（因为 ~/work 还不存在）']
          },
          {
            line: 'mkdir -p ~/work/exp1/logs',
            say: '建日志目录。数据和日志分开，是因为它们的生命周期不一样。',
            tokens: [
              { t: 'mkdir', k: 'cmd', ref: 'mkdir', m: '建目录' },
              { t: '-p', k: 'flag', ref: '-p', m: '缺的父目录一起建' },
              { t: '~/work/exp1/logs', k: 'path', ref: '~/work', m: '日志专门放这里，方便整个删掉重跑' }
            ],
            expect: '没有输出 = 成功'
          },
          {
            line: 'tree -L 3 ~/work',
            say: '验收：三层树状图，exp1 下应该已经有 data 和 logs。',
            tokens: [
              { t: 'tree', k: 'cmd', ref: 'tree', m: '树状列目录' },
              { t: '-L', k: 'flag', ref: '-L', m: '限制层数' },
              { t: '3', k: 'value', ref: '-3', m: '看三层：work → exp1 → data/logs' },
              { t: '~/work', k: 'path', ref: '~/work', m: '从 work 开始画树' }
            ],
            expect: 'work/ 下面有 exp1/，exp1/ 下面有 data/ 和 logs/',
            watch: ['exp1', 'data', 'logs'],
            gotcha: ['如果只看到 work 没有 exp1，说明前两条命令里有一条报错了，往上翻输出']
          }
        ],
        clinic: [
          {
            err: 'mkdir: cannot create directory ‘/home/student/work/exp1’: No such file or directory',
            read: '父目录 work 不存在，而你忘了 -p。',
            fix: '加上 -p 重来：mkdir -p ~/work/exp1/data'
          },
          {
            err: 'mkdir: cannot create directory ‘exp1’: File exists',
            read: '目录已经存在了（常见于重复执行）。',
            fix: '不报错也可以：加 -p 就静默通过；想确认用 ls -d ~/work/exp1'
          }
        ],
        cheat: [
          { cmd: 'mkdir 名字', mean: '建一层目录' },
          { cmd: 'mkdir -p a/b/c', mean: '多层一次建，可重复执行' },
          { cmd: 'ls -d 目录', mean: '只看目录本身存不存在' },
          { cmd: 'tree -L 3 ~/work', mean: '验收目录结构' }
        ]
      },
      {
        id: 'd1-l4',
        title: '把依赖和说明搬进工作区',
        body: [
          '实验目录不能只有空文件夹。一个"别人能接手"的实验，至少要三样东西：**能跑的环境清单、一份说明、数据副本**。',
          '',
          '今天先搬前两样。注意 `cp` 是**复制**（原件还在），`>` 是**覆盖写入**——`>>` 才是追加。' +
          '写笔记时这两个符号用错，是最常见的"我的笔记怎么只剩一行"事故。'
        ].join('\n'),
        steps: [
          {
            line: 'cp requirements.txt ~/work/exp1/',
            say: '把依赖清单复制一份到实验目录（不是移动，原件还在）。',
            tokens: [
              { t: 'cp', k: 'cmd', ref: 'cp', m: 'copy：复制；目标写成目录名就保留原名' },
              { t: 'requirements.txt', k: 'path', ref: 'requirements.txt', m: '源文件（相对当前目录）' },
              { t: '~/work/exp1/', k: 'path', ref: '~/work', m: '目标目录，末尾的 / 只是强调"这是目录"' }
            ],
            expect: '没有输出。成功后 exp1 里就有 requirements.txt',
            gotcha: ['目标目录不存在会变成"复制成一个叫 exp1 的文件"，先确保目录在']
          },
          {
            line: 'echo "# 情感分类 · 实验 1" > ~/work/exp1/README.md',
            say: '写项目说明的第一行：这是什么实验。',
            tokens: [
              { t: 'echo', k: 'cmd', ref: 'echo', m: '把引号里的内容输出' },
              { t: 'quote', k: 'quote', ref: '"', m: '双引号：整体当一个参数，空格不会把内容拆开' },
              { t: '>', k: 'op', ref: '>', m: '重定向：把输出写进文件；文件已存在会整段覆盖' },
              { t: '~/work/exp1/README.md', k: 'path', ref: '~/work', m: '目标文件，不存在会自动创建' }
            ],
            expect: '没有输出（> 把内容送进文件了，所以屏幕上什么都没有）',
            gotcha: ['用 > 再写一次会把这一行冲掉；要接着写用 >>']
          },
          {
            line: 'cat ~/work/exp1/README.md',
            say: '验收：读回来看看写进去没有。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '整段打印文件内容' },
              { t: '~/work/exp1/README.md', k: 'path', ref: '~/work', m: '刚写的那份说明' }
            ],
            expect: '# 情感分类 · 实验 1',
            watch: ['# 情感分类'],
            gotcha: ['如果显示的是空，说明你用的是 > 但内容写到了别的路径']
          }
        ],
        clinic: [
          {
            err: 'cp: target \'/home/student/work/exp1/\' is not a directory',
            read: '目标写成了目录，但它其实不存在。',
            fix: '先 mkdir -p ~/work/exp1 再 cp；或者把目标写成完整文件名。'
          },
          {
            err: 'echo 写完之后 cat 是空的 / 只剩最后一行',
            read: '用了 > 而不是 >>，每次都在覆盖。',
            fix: '追加用 >>；真写坏了就重新 echo 一遍整段。'
          }
        ],
        cheat: [
          { cmd: 'cp 源 目录/', mean: '复制一份过去' },
          { cmd: 'mv 源 目标', mean: '移动 / 改名（原件不在了）' },
          { cmd: 'echo "文本" > 文件', mean: '覆盖写入' },
          { cmd: 'echo "文本" >> 文件', mean: '追加一行' },
          { cmd: 'cat 文件', mean: '读回来验收' }
        ]
      },
      {
        id: 'd1-l5',
        title: '自己动手：给 exp1 做一次「入职体检」',
        body: [
          '上面几步都是跟着做。这一节换你主导：**不看上面的命令**，自己把 exp1 的现状说清楚。',
          '',
          '三件事，全部只读、不会破坏任何东西：',
          '',
          '1. 用 `ls -la` 看 exp1 的完整清单（权限 + 大小 + 时间）。',
          '2. 用 `du -sh` 看它现在占多少空间。',
          '3. 用 `find` 确认你已经把 `requirements.txt` 搬进来了。'
        ].join('\n'),
        steps: [
          {
            line: 'ls -la ~/work/exp1',
            say: '完整清单：谁在里面、多大、什么时候改的。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '-la', k: 'flag', ref: '-la', m: '-l 长格式 + -a 含隐藏文件' },
              { t: '~/work/exp1', k: 'path', ref: '~/work', m: '要看的目标目录' }
            ],
            expect: '四行左右：data/、logs/、requirements.txt、README.md',
            watch: ['README.md', 'requirements.txt'],
            gotcha: ['目录那几行开头是 d 而不是 -，d 就是 directory']
          },
          {
            line: 'du -sh ~/work/exp1',
            say: '看这个实验现在多大。-s 只给总数，-h 用人能读的单位。',
            tokens: [
              { t: 'du', k: 'cmd', ref: 'du', m: 'disk usage：统计占用空间' },
              { t: '-sh', k: 'flag', ref: '-s', m: '-s 只要总数 + -h 人类可读（K/M/G）' },
              { t: '~/work/exp1', k: 'path', ref: '~/work', m: '要统计的目录' }
            ],
            expect: '一行：大小 + 路径，例如 4.0K /home/student/work/exp1',
            watch: ['K', 'M'],
            gotcha: ['du 统计的是磁盘占用，和文件"内容大小"可能略有差异，正常']
          },
          {
            line: 'find ~/work -name requirements.txt',
            say: '按名字找文件。比 ls 强的地方是它会自己进子目录。',
            tokens: [
              { t: 'find', k: 'cmd', ref: 'find', m: '在目录树里按条件找文件' },
              { t: '~/work', k: 'path', ref: '~/work', m: '从哪个目录开始找' },
              { t: '-name', k: 'flag', ref: '-n', m: '按文件名匹配（支持通配符）' },
              { t: 'requirements.txt', k: 'value', ref: 'requirements.txt', m: '要找的名字' }
            ],
            expect: '/home/student/work/exp1/requirements.txt',
            watch: ['exp1/requirements.txt'],
            gotcha: ['find 一行没输出 = 没找到（不是命令失败）；要模糊找用 "*.txt"']
          }
        ],
        clinic: [
          {
            err: 'find: ‘~/work’: No such file or directory',
            read: 'find 不展开 ~（在引号里尤其不会）。',
            fix: '写绝对路径 /home/student/work，或者让 shell 展开：find $HOME/work -name ...'
          },
          {
            err: 'du: cannot access: Permission denied',
            read: '有子目录你进不去。',
            fix: '加 sudo 只用于查系统目录；自己的实验目录出现这个，说明属主被改过，chown 回来。'
          }
        ],
        cheat: [
          { cmd: 'ls -la 目录', mean: '完整清单' },
          { cmd: 'du -sh 目录', mean: '这个目录多大' },
          { cmd: 'df -h', mean: '磁盘还剩多少' },
          { cmd: 'find . -name "*.csv"', mean: '按名字找文件' },
          { cmd: 'find . -name "*.log" | xargs rm', mean: '找到并批量删（危险，先看一遍）' }
        ]
      },
    ],

    gates: [
      {
        id: 'd1-g1',
        title: '工作区三层骨架',
        brief: '`~/work/exp1` 下面要有 `data/` 和 `logs/` 两个子目录',
        hints: [
          '`mkdir -p` 能一次建出多层目录，已存在也不会报错',
          '建完用 `tree -L 3 ~/work` 自己先看一眼'
        ],
        checks: [
          { t: 'dir', path: '~/work/exp1', why: '实验目录 ~/work/exp1 存在' },
          { t: 'dir', path: '~/work/exp1/data', why: '数据子目录 ~/work/exp1/data 存在' },
          { t: 'dir', path: '~/work/exp1/logs', why: '日志子目录 ~/work/exp1/logs 存在' }
        ]
      },
      {
        id: 'd1-g2',
        title: '项目说明卡',
        brief: '`~/work/exp1/README.md` 第一行要有「# 情感分类」这几个字',
        hints: [
          '`echo "文本" > 文件` 会覆盖写入；文件不存在会自动创建',
          '写完用 `cat` 读回来确认'
        ],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/README.md',
            contains: '# 情感分类',
            minBytes: 6,
            why: 'README.md 里有「# 情感分类」标题'
          }
        ]
      },
      {
        id: 'd1-g3',
        title: '依赖清单跟着项目走',
        brief: '把根目录的 `requirements.txt` 复制一份到实验目录',
        hints: [
          '`cp 源文件 目标目录/` —— 目标写成目录名，就保留原文件名',
          '复制不是移动：原件应该还在主目录'
        ],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/requirements.txt',
            contains: 'torch',
            why: '实验目录里有 requirements.txt（且里面有 torch）'
          }
        ]
      }
    ],

    challenge: {
      id: 'd1-c1',
      title: '闭卷：再造一个 exp2',
      brief: '不许往上翻。独立建出 `~/work/exp2`（含 `data/` 和 `logs/`），写一份 `README.md` 第一行为 `# 实验 2`，' +
        '并把依赖清单复制进去。做不出来就回上面重看第 3、4 节。',
      hints: [
        '三条命令就够：mkdir -p / echo > / cp',
        '路径都写在 ~/work/exp2 下面'
      ],
      checks: [
        { t: 'dir', path: '~/work/exp2', why: 'exp2 目录存在' },
        { t: 'dir', path: '~/work/exp2/data', why: 'exp2 下有 data/' },
        { t: 'dir', path: '~/work/exp2/logs', why: 'exp2 下有 logs/' },
        { t: 'file', path: '~/work/exp2/README.md', contains: '# 实验 2', why: 'README.md 第一行写对了' },
        { t: 'file', path: '~/work/exp2/requirements.txt', contains: 'torch', why: '依赖清单也复制进去了' }
      ],
      solution: [
        'mkdir -p ~/work/exp2/data',
        'mkdir -p ~/work/exp2/logs',
        'echo "# 实验 2" > ~/work/exp2/README.md',
        'cp requirements.txt ~/work/exp2/'
      ]
    }
  });
})(window);
