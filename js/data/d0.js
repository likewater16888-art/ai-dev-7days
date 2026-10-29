/* =============================================================================
 * js/data/d0.js
 * -----------------------------------------------------------------------------
 * 预备课（#/start）：给"第一次打开终端"的人 10 分钟的扶手。
 *
 * 它不是一个「天」：没有关卡、不计入 21 关、不占用 7 天的进度。
 * 只教三件事：终端是什么、四条命令、怎么不把自己搞崩。
 * 命令全部只读（cd 只是换目录，最后会 cd 回主目录）。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Start = {
    title: '开课前 10 分钟',
    minutes: 10,
    goal: '弄懂终端长什么样、命令怎么读，然后带着不慌的心态进 Day 1。',
    intro: [
      '如果你从没打开过终端，这一页就是给你的。',
      '',
      '**不用装任何东西**：右边那个黑色面板就是一台假装的 Linux 机器，文件和命令都是沙盒模拟的，' +
      '删错了也没关系，点终端右上角 `⟳` 就恢复出厂。',
      '',
      '三个先把心放下来的事实：',
      '',
      '- 命令 = **程序名 + 参数**，中间用空格隔开。看不懂的词先当成"零件"，`逐字拆解`里每个零件都有解释。',
      '- 终端的脾气是**不猜**：路径写错就报错，不会像图形界面那样帮你找。这不是你笨，是它就这样。',
      '- 每个命令都能**先看后果再敲回车**：把光标停在回车前，读一遍，再按。'
    ].join('\n'),
    lessons: [
      {
        title: '终端长什么样：提示符、你、当前目录',
        body: [
          '打开终端，你看到的第一行大概是这样：',
          '',
          '```',
          'student@ai-box:~$',
          '```',
          '',
          '拆开读：`student` 是**用户名**，`ai-box` 是**机器名**，`~` 是**你现在所在的目录**（主目录），`$` 表示"轮到你输入了"。',
          '',
          '> 提示符是终端的仪表盘。**迷路的时候先看它**，它一直在告诉你"你在哪"。'
        ].join('\n'),
        steps: [
          {
            line: 'pwd',
            say: '第一个该学会的命令：我现在到底在哪个目录。',
            tokens: [
              { t: 'pwd', k: 'cmd', ref: 'pwd', m: 'print working directory 的缩写，打印当前目录的完整路径' }
            ],
            expect: '一行以 / 开头的绝对路径',
            watch: ['/home/student'],
            gotcha: ['如果输出不是你预期的目录，别急着往下敲——先 cd 回去']
          },
          {
            line: 'ls',
            say: '看看这个目录里有什么。第一次进一个项目，永远先 ls。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: 'list：列出目录内容，默认不显示隐藏文件' }
            ],
            expect: '几个文件/目录名，一行或几列排开',
            watch: ['data', 'models', 'logs'],
            gotcha: ['ls 只列名字，不告诉你内容——要看内容用 cat']
          },
          {
            line: 'help',
            say: '沙盒自带的命令清单。真机上对应 命令 --help。',
            tokens: [
              { t: 'help', k: 'cmd', ref: 'help', m: '本沙盒的帮助命令，列出这台"机器"支持的所有命令' }
            ],
            expect: '一大段命令名列表，扫一眼就行',
            watch: ['ls', 'cat', 'grep'],
            gotcha: ['help 不会告诉你参数怎么用，参数去词典里查']
          }
        ],
        clinic: [
          {
            err: 'bash: pwd: command not found',
            read: 'shell 说：这个程序我找不到。',
            fix: '九成是拼错了（pwd 不是 pdw）。少一个字母、多一个空格都会这样。'
          },
          {
            err: '提示符前多出一个 (ai7)，不是你认识的样子',
            read: '你进了某个 conda 环境，或者切了用户。',
            fix: '跑 conda deactivate 退出来；看当前用户用 whoami。'
          }
        ],
        cheat: [
          { cmd: 'pwd', mean: '我在哪' },
          { cmd: 'ls', mean: '这有什么' },
          { cmd: 'ls -la', mean: '连隐藏文件、权限、大小一起看' },
          { cmd: 'help', mean: '沙盒支持哪些命令' }
        ]
      },
      {
        title: '四条命令覆盖 80% 的日常',
        body: [
          '`pwd` / `ls` / `cd` / `cat` —— 这四条够你活过第一周。',
          '',
          '`cd` 特殊在它会**改变你的位置**。位置一变，相对路径的含义就全变了：' +
          '在 `~` 下 `cat requirements.txt` 能读到文件，进了 `~/work` 再敲同一句就报 `No such file`。'
        ].join('\n'),
        steps: [
          {
            line: 'ls -la ~',
            say: '看主目录的完整清单：权限、大小、隐藏文件一次看全。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '-la', k: 'flag', ref: '-la', m: '-l 长格式 + -a 全部（含 . 开头的隐藏文件）' },
              { t: '~', k: 'path', ref: '~', m: '主目录的简写，等价于 /home/student' }
            ],
            expect: '每行开头是 -rw-r--r-- 之类的权限串，最后是文件名',
            watch: ['requirements.txt', 'check_env.py'],
            gotcha: ['文件名以 . 开头的是隐藏文件，不加 -a 就看不到（.gitignore 就在这一类里）']
          },
          {
            line: 'cd ~/work',
            say: '进到工作目录。cd 后面必须跟目标，什么都不写等于回主目录。',
            tokens: [
              { t: 'cd', k: 'cmd', ref: 'cd', m: 'change directory：切换当前目录' },
              { t: '~/work', k: 'path', ref: '~', m: '主目录下的 work 目录；~ 代表 /home/student' }
            ],
            expect: '没有输出。Linux 的哲学是"没消息就是好消息"',
            gotcha: ['没有输出 ≠ 没执行；用 pwd 确认自己到哪了', '目录不存在会报 No such file or directory']
          },
          {
            line: 'pwd',
            say: '再确认一次位置。养成 cd 完就看一眼的习惯。',
            tokens: [
              { t: 'pwd', k: 'cmd', ref: 'pwd', m: '打印当前目录' }
            ],
            expect: '/home/student/work',
            watch: ['/home/student/work']
          },
          {
            line: 'cd ~',
            say: '回主目录收工。这一句很重要：Day 1 的路径都是相对主目录写的。',
            tokens: [
              { t: 'cd', k: 'cmd', ref: 'cd', m: '切换目录' },
              { t: '~', k: 'path', ref: '~', m: '单独一个 ~ 就是回主目录' }
            ],
            expect: '没有输出，提示符里的 ~ 又回来了'
          },
          {
            line: 'cat ~/requirements.txt',
            say: '把整个文件打到屏幕上。短配置文件最适合这么看。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: 'concatenate：把文件内容整段输出' },
              { t: '~/requirements.txt', k: 'path', ref: 'requirements.txt', m: '主目录下的依赖清单文件' }
            ],
            expect: '几行包名和版本，比如 torch==2.4.1',
            watch: ['torch==2.4.1'],
            gotcha: ['cat 一个目录会报 Is a directory，目录要用 ls']
          }
        ],
        clinic: [
          {
            err: 'cat: requirements.txt: No such file or directory',
            read: '当前目录下没有这个文件。',
            fix: '先 pwd 看你在哪，再 ls 看有没有；或者直接写绝对路径 ~/requirements.txt。'
          },
          {
            err: 'cat: data: Is a directory',
            read: '你把目录当文件了。',
            fix: '目录用 ls data，文件才用 cat。'
          }
        ],
        cheat: [
          { cmd: 'pwd', mean: '我在哪' },
          { cmd: 'ls -la', mean: '全部文件 + 权限 + 时间' },
          { cmd: 'cd ~/work', mean: '进 work；cd ~ 回家；cd .. 上一层' },
          { cmd: 'cat 文件名', mean: '短文件整段看' },
          { cmd: 'head -3 文件名', mean: '只看前三行（数据文件最爱）' }
        ]
      },
      {
        title: '三个救命习惯，让你不会把自己搞崩',
        body: [
          '新手最痛的三件事：敲错删东西、看不懂报错、忘了自己干过什么。对应三个习惯：',
          '',
          '1. **危险命令先看再敲**：`rm` 前面先 `ls` 一遍同样的路径，看清要删什么。',
          '2. **报错读第一行**：真正的信息几乎都在第一行，后面多是"建议"和堆栈。',
          '3. **用 history / 上箭头**：重复的命令不要重打，翻历史更快也更少错。'
        ].join('\n'),
        steps: [
          {
            line: 'clear',
            say: '屏幕太乱就清一下。它只清显示，不删任何东西。',
            tokens: [
              { t: 'clear', k: 'cmd', ref: 'clear', m: '清屏；快捷键 Ctrl+L 一样的效果' }
            ],
            expect: '屏幕立刻变干净，提示符回到左上角',
            gotcha: ['清屏不是"重置"，历史命令还在，上箭头照样翻得到']
          },
          {
            line: 'history',
            say: '看看你刚才敲过什么。找命令、复盘、贴给别人复现都用它。',
            tokens: [
              { t: 'history', k: 'cmd', ref: 'history', m: '列出命令历史，带行号' }
            ],
            expect: '带序号的命令列表，最新的在最后',
            watch: ['pwd', 'ls -la'],
            gotcha: ['历史里可能有密码/密钥，贴给别人前先看一眼']
          },
          {
            line: 'ls ~/work',
            say: '删东西前的标准动作：先看清目标目录。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '~/work', k: 'path', ref: '~', m: '要动手术的部位' }
            ],
            expect: 'work 目录里的内容（现在可能只有一个空目录）',
            gotcha: ['目标目录里如果只有你想删的东西，也别用 rm -rf，先 mv 到 /tmp 再确认']
          }
        ],
        clinic: [
          {
            err: '屏幕一直滚、命令像没反应',
            read: '可能进了分页器（man/less），或者正在跑长任务。',
            fix: 'man/less 里按 q 退出；长任务按 Ctrl+C 中断；Ctrl+Z 是挂起（不是结束）。'
          },
          {
            err: '手滑清了屏，想找上一条命令的输出',
            read: '输出只在这次会话里，清屏后就看不到了。',
            fix: '重要输出要重定向到文件：命令 > out.txt；或者用终端右上角的「复制」按钮先存下来。'
          }
        ],
        cheat: [
          { cmd: 'clear', mean: '清屏（Ctrl+L）' },
          { cmd: 'history', mean: '我敲过什么' },
          { cmd: '↑ / ↓', mean: '翻历史命令' },
          { cmd: 'Tab', mean: '补全路径（沙盒里也支持）' },
          { cmd: 'Ctrl+C', mean: '中断当前正在跑的命令' },
          { cmd: 'Ctrl+Shift+F', mean: '终端全屏 / 退出全屏' }
        ]
      }
    ]
  };
})(window);
