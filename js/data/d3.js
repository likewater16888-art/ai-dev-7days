/* =============================================================================
 * js/data/d3.js
 * -----------------------------------------------------------------------------
 * Day 3 —— 跑起来，看懂输出
 *
 * 环境自检留证 → 读懂应用代码 → 日志里定位 ERROR → 写三行排障结论
 * 关卡：env.md 快照 / error.txt 带行号 / d3-note.md 三行结论
 * 闭卷挑战：独立统计 INFO 条数 + 挑出 WARN 存证
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd3',
    label: 'Day 3',
    title: '跑起来，看懂输出',
    goal: '把程序跑起来、把输出留住、从日志里定位一条真实 ERROR，并写成别人能复核的三行结论。',
    scenario: 'ai-lab',
    minutes: 55,

    intro: [
      '前两天是"看得懂"，今天是"跑得动"。',
      '',
      '真实工作里，90% 的时间不是写代码，而是：**跑起来 → 看输出 → 定位问题 → 说清结论**。' +
      '今天把这条链路走一遍，并且每一步都留下文件证据。',
      '',
      '> 关键心态：报错不是失败，是**系统在告诉你它怎么了**。你要做的是把这句话翻译成人话。'
    ].join('\n'),

    lessons: [
      {
        id: 'd3-l1',
        title: '先给环境做个体检，并把结果存下来',
        body: [
          '`check_env.py` 就是"这个项目的健康检查表"。先读它，再跑它——**顺序不能反**。',
          '',
          '跑完最重要的一步是把输出**重定向到文件**：终端输出关掉就没了，文件才是证据。',
          '',
          '> `命令 > 文件` 是"把 stdout 写进文件"。屏幕上会看不到输出——这不是没跑，而是输出进了文件。'
        ].join('\n'),
        steps: [
          {
            line: 'cat check_env.py',
            say: '先读脚本：它检查什么、会不会偷偷改东西。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件内容' },
              { t: 'check_env.py', k: 'path', ref: 'python', m: '环境自检脚本（先读再跑）' }
            ],
            expect: 'print 语句：python 版本、torch 版本/是否可导入、cuda 是否可用',
            watch: ['python:', 'cuda:'],
            gotcha: ['不读就运行陌生脚本，是安全事故的经典开场']
          },
          {
            line: 'python check_env.py',
            say: '跑一次，眼睛先看到结果。',
            tokens: [
              { t: 'python', k: 'cmd', ref: 'python', m: '调用 Python 解释器执行脚本' },
              { t: 'check_env.py', k: 'path', ref: 'python', m: '要执行的文件' }
            ],
            expect: '两行：python: 3.11.x 和 cuda: False',
            watch: ['cuda: False'],
            gotcha: ['沙盒里 python 是"教学用"的，只支持 print 和少量语法；报语法错不代表你错']
          },
          {
            line: 'python check_env.py > ~/work/exp1/logs/env.md',
            say: '再跑一次，把输出写进日志文件——这一步才是"存证"。',
            tokens: [
              { t: 'python', k: 'cmd', ref: 'python', m: '执行脚本' },
              { t: 'check_env.py', k: 'path', ref: 'python', m: '环境自检脚本' },
              { t: '>', k: 'op', ref: '>', m: '把标准输出重定向进文件（屏幕不再显示）' },
              { t: '~/work/exp1/logs/env.md', k: 'path', ref: '~/work', m: '日志目录里的快照文件' }
            ],
            expect: '屏幕上什么都没有 —— 输出进了文件',
            gotcha: ['如果 logs 目录不存在会报 No such file or directory，先 mkdir -p']
          },
          {
            line: 'cat ~/work/exp1/logs/env.md',
            say: '读回来确认：文件里真的有那两行。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/work/exp1/logs/env.md', k: 'path', ref: '~/work', m: '刚写入的快照' }
            ],
            expect: 'python: 3.11 … 与 cuda: False',
            watch: ['python: 3.11', 'cuda: False'],
            gotcha: ['文件是空的，说明重定向写到了别处，或者脚本报错了（报错走 stderr，不进 > 的文件）']
          }
        ],
        clinic: [
          {
            err: 'bash: python: command not found',
            read: '没有 python 这个命令。',
            fix: '真机上用 python3；沙盒里 python 一定有，检查拼写。'
          },
          {
            err: '重定向后文件是空的',
            read: '程序把内容写到了 stderr（报错通道），而 > 只接 stdout。',
            fix: '用 `> out.txt 2>&1` 两个通道一起接；或者先看屏幕输出有没有报错。'
          }
        ],
        cheat: [
          { cmd: 'python 脚本.py', mean: '运行脚本' },
          { cmd: 'python 脚本.py > out.txt', mean: '把输出存文件' },
          { cmd: 'python 脚本.py > all.txt 2>&1', mean: '连报错一起存' },
          { cmd: 'cat out.txt', mean: '读回来验收' }
        ]
      },
      {
        id: 'd3-l2',
        title: '读懂那 9 行应用代码',
        body: [
          '把 `app.py` 从头读一遍。它只有三块：**函数定义**（classify）、**界面**（gr.Interface）、**启动**（launch）。',
          '',
          '读代码时只问三个问题：',
          '',
          '1. 输入是什么？（一个字符串）',
          '2. 输出是什么？（"正面 0.93 / 负面 0.07"）',
          '3. 它怎么对外提供服务？（`demo.launch(server_port=7860)` → 7860 端口）',
          '',
          '> 记住 7860 这个数字：等日志里出现 timeout 时，你就知道该去 curl 哪个地址了。'
        ].join('\n'),
        steps: [
          {
            line: 'cat app.py',
            say: '整体读一遍。不要逐字，先看结构。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: 'app.py', k: 'path', ref: 'python', m: '应用入口：定义函数、搭界面、启动服务' }
            ],
            expect: 'import gradio / def classify / gr.Interface / demo.launch(server_port=7860)',
            watch: ['gr.Interface', 'server_port=7860'],
            gotcha: ['返回的是写死的假答案——这是教学 demo，别拿它当模型效果']
          },
          {
            line: 'wc -l app.py',
            say: '数一下行数，顺便练"小文件可以整读"的判断。',
            tokens: [
              { t: 'wc', k: 'cmd', ref: 'wc', m: '数行数' },
              { t: '-l', k: 'flag', ref: '-l', m: '只数行' },
              { t: 'app.py', k: 'path', ref: 'python', m: '应用入口文件' }
            ],
            expect: '10 行左右 —— 这么短，值得逐行读懂',
            watch: ['app.py'],
            gotcha: ['几百行以上的文件别硬读，用 grep 定位关键行']
          }
        ],
        clinic: [
          {
            err: 'IndentationError / TabError',
            read: '缩进不一致（空格和 Tab 混用）。',
            fix: 'Python 只用空格，统一 4 个；真机上 cat -A 能看出 Tab。'
          },
          {
            err: 'ModuleNotFoundError: No module named \'gradio\'',
            read: '当前环境没装 gradio。',
            fix: '确认激活了正确环境（conda activate ai7），再 pip install -r requirements.txt。'
          }
        ],
        cheat: [
          { cmd: 'cat app.py', mean: '整体读' },
          { cmd: 'wc -l app.py', mean: '多长' },
          { cmd: 'grep -n port app.py', mean: '定位端口那行' },
          { cmd: 'grep -n def app.py', mean: '列出所有函数' }
        ]
      },
      {
        id: 'd3-l3',
        title: '在日志里定位那条 ERROR',
        body: [
          '日志只有 5 行，人眼一看就找到 ERROR。但日志到 5 万行的时候，人眼就废了——所以要练工具。',
          '',
          '三个动作：',
          '',
          '- `tail -n 5`：先看最新几条（报错永远在最后）。',
          '- `grep -c INFO`：数一数正常流量，判断"是不是只有这一个请求出问题"。',
          '- `grep -n ERROR`：带行号定位，把那一行单独存成证据文件。',
          '',
          '> 带行号很重要：跟同事说"第 5 行"比说"那条报错"专业得多，也少扯皮。'
        ].join('\n'),
        steps: [
          {
            line: 'tail -n 5 app.log',
            say: '看最后 5 行：最近发生了什么。',
            tokens: [
              { t: 'tail', k: 'cmd', ref: 'tail', m: '看文件末尾' },
              { t: '-n', k: 'flag', ref: '-n', m: '后面跟行数（-n 5 = 最后 5 行）' },
              { t: '5', k: 'value', ref: '-3', m: '行数：最后 5 行' },
              { t: 'app.log', k: 'path', ref: '相对路径', m: '应用日志文件' }
            ],
            expect: '五行日志，最后一行是 ERROR request timeout after 30s',
            watch: ['ERROR request timeout'],
            gotcha: ['日志时间戳是固定值；看顺序不看日期']
          },
          {
            line: 'grep -c INFO app.log',
            say: '数 INFO 行数：正常流程走了几步。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-c', k: 'flag', ref: '-c', m: '只输出命中行数' },
              { t: 'INFO', k: 'value', ref: '日志', m: '日志级别关键字：正常信息' },
              { t: 'app.log', k: 'path', ref: '相对路径', m: '日志文件' }
            ],
            expect: '3',
            watch: ['3'],
            gotcha: ['grep 区分大小写：info 匹配不到 INFO']
          },
          {
            line: 'grep -n ERROR app.log > ~/work/exp1/logs/error.txt',
            say: '带行号挑出 ERROR，并直接存成证据文件。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-n', k: 'flag', ref: '-n', m: 'number：输出行号 + 内容' },
              { t: 'ERROR', k: 'value', ref: '日志', m: '日志级别：错误' },
              { t: 'app.log', k: 'path', ref: '相对路径', m: '日志源文件' },
              { t: '>', k: 'op', ref: '>', m: '重定向进文件' },
              { t: '~/work/exp1/logs/error.txt', k: 'path', ref: '~/work', m: '证据文件' }
            ],
            expect: '屏幕上无输出；文件里应有带 "5:" 的一行',
            watch: ['5:'],
            gotcha: ['grep 没命中时 > 会创建空文件——空文件比没有文件更容易让人误会']
          },
          {
            line: 'cat ~/work/exp1/logs/error.txt',
            say: '验收证据文件。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/work/exp1/logs/error.txt', k: 'path', ref: '~/work', m: '证据文件' }
            ],
            expect: '5:2026-10-29 09:02:30 ERROR request timeout after 30s',
            watch: ['5:', 'ERROR'],
            gotcha: ['行号是"在日志里的第几行"，不是错误码']
          }
        ],
        clinic: [
          {
            err: 'grep 有行号但内容是空的 / 只有一个冒号',
            read: '文件格式不规整，或匹配到了空行。',
            fix: '先 grep -n ERROR app.log 直接看输出，再决定要不要存。'
          },
          {
            err: 'error.txt 是空文件',
            read: 'ERROR 不在这个文件里（或在别的日志里）。',
            fix: '用 grep -rn ERROR logs/ 全目录搜；确认看的是应用日志不是系统日志。'
          }
        ],
        cheat: [
          { cmd: 'tail -n 5 文件', mean: '最后 5 行' },
          { cmd: 'tail -f 文件', mean: '持续跟着看新日志' },
          { cmd: 'grep -n ERROR 文件', mean: '带行号定位' },
          { cmd: 'grep -c INFO 文件', mean: '数条数' },
          { cmd: 'grep -n ERROR 文件 > err.txt', mean: '挑出来存证' }
        ]
      },
      {
        id: 'd3-l4',
        title: '写下你自己的结论：现象 / 原因 / 证据',
        body: [
          '排障到最后，你必须能说出三句话：',
          '',
          '1. **现象**：用户/你看到了什么？（请求超时）',
          '2. **原因**：为什么会这样？（cuda 不可用，回退 CPU，单条推理超过 30s）',
          '3. **证据**：哪一行能证明？（app.log 第 5 行）',
          '',
          '用 `printf` 而不是 `echo`，因为 `printf` 会把 `\\n` 解释成换行，一次就能写出三行。' +
          '注意内容里要同时包含 `timeout` 和 `cuda`——这是这份笔记合格的最低标准。'
        ].join('\n'),
        steps: [
          {
            line: 'printf "现象：gradio 起在 7860，但请求超时\\n原因：cuda 不可用，回退 CPU 太慢\\n证据：app.log 第 5 行 ERROR request timeout\\n" > ~/work/exp1/logs/d3-note.md',
            say: '一次写出三行排障结论。',
            tokens: [
              { t: 'printf', k: 'cmd', ref: 'printf', m: '格式化输出，会解释 \\n 换行（echo 不一定）' },
              { t: '"…\\n…"', k: 'quote', ref: '"', m: '双引号里 \\n 交给 printf 解释成换行' },
              { t: '>', k: 'op', ref: '>', m: '覆盖写入文件' },
              { t: '~/work/exp1/logs/d3-note.md', k: 'path', ref: '~/work', m: '结论文件' }
            ],
            expect: '屏幕上无输出；文件应有 3 行',
            gotcha: ['用 echo 写 \\n 在部分 shell 里不会换行，结果是一整行']
          },
          {
            line: 'cat ~/work/exp1/logs/d3-note.md',
            say: '读回来，确认三行都在。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/work/exp1/logs/d3-note.md', k: 'path', ref: '~/work', m: '结论文件' }
            ],
            expect: '三行：现象 / 原因 / 证据',
            watch: ['timeout', 'cuda'],
            gotcha: ['如果只有一行，说明 \\n 没生效——换 printf，或分三次 echo ... >>']
          }
        ],
        clinic: [
          {
            err: '文件只有一行，所有内容挤在一起',
            read: '\\n 没被解释（用了 echo 或引号形式不对）。',
            fix: '用 printf "a\\nb\\nc\\n" > 文件；或分三次 echo ... >> 追加。'
          },
          {
            err: '结论写了原因但没写证据',
            read: '没有证据的原因只是猜测。',
            fix: '补一行"证据：文件名 第 N 行 原文"，让任何人能复核。'
          }
        ],
        cheat: [
          { cmd: 'printf "a\\nb\\n" > f', mean: '一次写多行' },
          { cmd: 'cat f', mean: '读回来' },
          { cmd: 'wc -l f', mean: '确认行数' }
        ]
      },
      {
        id: 'd3-l5',
        title: '自己动手：把日志读成一张表',
        body: [
          '这一节不产生新文件，只练"读"。三个动作：',
          '',
          '1. `wc -l app.log` —— 一共几行？',
          '2. `grep -n WARN app.log` —— 警告在哪一行？',
          '3. `ls -l ~/work/exp1/logs` —— 你的证据文件都在吗？',
          '',
          '> 下面的闭卷挑战会让你把 INFO 条数和 WARN 那行都存成文件。'
        ].join('\n'),
        steps: [
          {
            line: 'wc -l app.log',
            say: '日志总行数。',
            tokens: [
              { t: 'wc', k: 'cmd', ref: 'wc', m: '数行数' },
              { t: '-l', k: 'flag', ref: '-l', m: '只数行' },
              { t: 'app.log', k: 'path', ref: '相对路径', m: '日志文件' }
            ],
            expect: '5 app.log',
            watch: ['5']
          },
          {
            line: 'grep -n WARN app.log',
            say: '警告在第几行？警告往往是"还没爆但快爆了"。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-n', k: 'flag', ref: '-n', m: '显示行号' },
              { t: 'WARN', k: 'value', ref: '日志', m: '日志级别：警告' },
              { t: 'app.log', k: 'path', ref: '相对路径', m: '日志文件' }
            ],
            expect: '4:…WARN cuda not available, fallback to cpu',
            watch: ['cuda not available'],
            gotcha: ['WARN 往往就是 ERROR 的前因，别忽略']
          },
          {
            line: 'ls -l ~/work/exp1/logs',
            say: '盘点证据文件：env.md、error.txt、d3-note.md。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '-l', k: 'flag', ref: '-l', m: '长格式' },
              { t: '~/work/exp1/logs', k: 'path', ref: '~/work', m: '日志与证据目录' }
            ],
            expect: 'env.md、error.txt、d3-note.md 都在',
            watch: ['env.md', 'error.txt', 'd3-note.md']
          }
        ],
        clinic: [
          {
            err: 'ls 里少了某个文件',
            read: '对应那一节的命令没执行成功（可能目录不存在）。',
            fix: '回到那一节重跑；用 mkdir -p 保证 logs 目录存在。'
          },
          {
            err: '日志里同一秒出现一堆相同报错',
            read: '请求被打爆了（重试风暴）。',
            fix: '真机上看速率：sort 文件 | uniq -c | sort -rn 找出现最多的那条。'
          }
        ],
        cheat: [
          { cmd: 'wc -l 文件', mean: '总行数' },
          { cmd: 'grep -n WARN 文件', mean: '警告在哪' },
          { cmd: 'ls -l 目录', mean: '证据齐不齐' },
          { cmd: 'sort 文件 | uniq -c | sort -rn', mean: '哪条日志最多' }
        ]
      },
    ],

    gates: [
      {
        id: 'd3-g1',
        title: '环境快照存证',
        brief: '把 `python check_env.py` 的输出重定向到 `~/work/exp1/logs/env.md`',
        hints: ['`命令 > 文件` 把标准输出写进文件', '写完 `cat` 一次确认里面真有内容'],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/logs/env.md',
            contains: ['python: 3.11', 'cuda: False'],
            why: 'env.md 里记录了 python 版本与 cuda 状态'
          }
        ]
      },
      {
        id: 'd3-g2',
        title: 'ERROR 的证据（带行号）',
        brief: '用 `grep -n` 把 ERROR 那条筛出来，存到 `~/work/exp1/logs/error.txt`',
        hints: ['`grep -n 模式 文件` 输出「行号:内容」', '`>` 直接把 grep 的结果存成文件'],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/logs/error.txt',
            contains: ['5:', 'ERROR'],
            why: 'error.txt 里是带行号的 ERROR 行'
          }
        ]
      },
      {
        id: 'd3-g3',
        title: '排障结论三行',
        brief: '`~/work/exp1/logs/d3-note.md`：现象 / 原因 / 证据各一行',
        hints: ['`printf "a\\nb\\nc\\n" > 文件` 一次写三行', '三行里要出现 timeout 和 cuda'],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/logs/d3-note.md',
            contains: ['timeout', 'cuda'],
            lines: 3,
            why: 'd3-note.md 至少三行，且提到 timeout 与 cuda'
          }
        ]
      }
    ],

    challenge: {
      id: 'd3-c1',
      title: '闭卷：把日志读成数字',
      brief: '不许往上翻。把 INFO 的条数写进 `~/work/exp1/logs/info-count.txt`，' +
        '把那条 WARN（含 cuda 的那行）存进 `~/work/exp1/logs/warn.txt`。',
      hints: ['`grep -c` 只输出数字', '`grep -n WARN 文件 > 目标` 直接留下带行号的证据'],
      checks: [
        { t: 'file', path: '~/work/exp1/logs/info-count.txt', contains: '3', why: 'info-count.txt 里记下了 INFO 的条数 3' },
        { t: 'file', path: '~/work/exp1/logs/warn.txt', contains: 'cuda', why: 'warn.txt 里是那条 cuda 警告' }
      ],
      solution: [
        'grep -c INFO app.log > ~/work/exp1/logs/info-count.txt',
        'grep -n WARN app.log > ~/work/exp1/logs/warn.txt',
        'cat ~/work/exp1/logs/info-count.txt'
      ]
    }
  });
})(window);
