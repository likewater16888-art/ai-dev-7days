/* =============================================================================
 * js/data/d2.js
 * -----------------------------------------------------------------------------
 * Day 2 —— 把数据读明白
 *
 * 看规模（head/wc）→ 按条件挑行（grep）→ 复制到实验目录 → 写数据体检报告
 * 关卡：数据副本 / 体检报告 / 标签字典
 * 闭卷挑战：独立统计 label=1 的数量并存证
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd2',
    label: 'Day 2',
    title: '把数据读明白',
    goal: '用 5 条命令把一份 CSV 说清楚：多少行、几类标签、各多少条，并留下书面证据。',
    scenario: 'ai-lab',
    minutes: 50,

    intro: [
      '模型再花哨，数据不对就是白跑。今天不训练，只做一件事：**把数据读明白，并且把结论写成别人能复核的文字**。',
      '',
      '为什么强调"写成文字"？因为 `grep -c` 的输出只活在这次终端会话里，关掉就没了。写进 `health.md`，' +
      '明天、下周、交给同事，都还能复核。',
      '',
      '> 今天结束的标准：别人只看 `~/work/exp1/data/health.md`，就知道这份数据有多大、正负样本各几条。'
    ].join('\n'),

    lessons: [
      {
        id: 'd2-l1',
        title: '数据长什么样：看头、数行、认标签',
        body: [
          '拿到一份 CSV，标准的三个问题：',
          '',
          '1. **结构**：第一行是表头吗？有几列？→ `head -3`',
          '2. **规模**：一共多少行？→ `wc -l`（注意：这个数**包含表头**）',
          '3. **标签**：label 有哪几种？→ `cat` 标签字典',
          '',
          '> `wc -l` 数出来 6 行 = 1 行表头 + 5 条样本。这个 +1/-1 的糊涂账，是新手写数据报告最常错的地方。'
        ].join('\n'),
        steps: [
          {
            line: 'head -3 train.csv',
            say: '看前三行：确认表头长什么样、样本是什么形态。',
            tokens: [
              { t: 'head', k: 'cmd', ref: 'head', m: '只看文件开头若干行' },
              { t: '-3', k: 'flag', ref: '-3', m: '数字参数：要 3 行' },
              { t: 'train.csv', k: 'path', ref: '相对路径', m: '相对当前目录（~）的路径' }
            ],
            expect: '三行：text,label 表头 + 两条样本',
            watch: ['text,label'],
            gotcha: ['样本里如果带逗号，CSV 的列会错位——这是数据本身的坑，不是 head 的问题']
          },
          {
            line: 'wc -l train.csv',
            say: '数行数。注意它包括表头。',
            tokens: [
              { t: 'wc', k: 'cmd', ref: 'wc', m: 'word count：数行/词/字节' },
              { t: '-l', k: 'flag', ref: '-l', m: 'lines：只数行数' },
              { t: 'train.csv', k: 'path', ref: '相对路径', m: '要数的文件' }
            ],
            expect: '第一列是数字（6 左右），后面是文件名',
            watch: ['6 train.csv'],
            gotcha: ['6 行 = 1 表头 + 5 样本；报告里写"5 条样本"而不是"6 条"']
          },
          {
            line: 'cat data/labels.txt',
            say: '看标签字典：0/1 分别代表什么。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '整段打印文件' },
              { t: 'data/labels.txt', k: 'path', ref: '相对路径', m: '数据目录里的标签说明' }
            ],
            expect: '两行：0 → negative，1 → positive',
            watch: ['positive', 'negative'],
            gotcha: ['不同项目 0/1 可能正好相反，别看代码猜，看字典']
          }
        ],
        clinic: [
          {
            err: 'wc -l 输出 0 train.csv',
            read: '文件是空的，或者你数错了文件。',
            fix: 'ls -l train.csv 看字节数；空文件说明复制/下载没完成。'
          },
          {
            err: 'head 出来的中文是乱码',
            read: '编码不是 UTF-8（常见 GBK）。',
            fix: '真机上用 iconv -f gbk -t utf-8 转换；沙盒里数据本身就是 UTF-8。'
          }
        ],
        cheat: [
          { cmd: 'head -3 文件', mean: '前三行' },
          { cmd: 'wc -l 文件', mean: '多少行（含表头）' },
          { cmd: 'tail -5 文件', mean: '最后五行' },
          { cmd: 'cat 文件', mean: '整段看（短文件）' }
        ]
      },
      {
        id: 'd2-l2',
        title: 'grep：把你要的那几行挑出来',
        body: [
          '`grep` 是终端里最像"数据库查询"的命令：给一个模式，它把命中的行留下。',
          '',
          '今天用到的两个开关：',
          '',
          '- `-c`：只输出**数量**（count），不输出内容。',
          '- `-n`：输出**行号** + 内容。定位报错时必用。',
          '',
          '`\',1$\'` 里的 `$` 是"行尾"锚点：只匹配以 `,1` 结尾的行，避免把 `,10` 之类也算进来。'
        ].join('\n'),
        steps: [
          {
            line: "grep ',1$' train.csv",
            say: '挑出所有标签为 1（正面）的样本。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '按模式过滤文本，留下命中的行' },
              { t: "',1$'", k: 'quote', ref: "'", m: '单引号：把 $ 原样交给 grep，不让 shell 展开成变量' },
              { t: '$', k: 'op', ref: '$', m: '正则里的"行尾"锚点（在单引号里才有效）' },
              { t: 'train.csv', k: 'path', ref: '相对路径', m: '被过滤的文件' }
            ],
            expect: '三条以 ,1 结尾的样本',
            watch: [',1'],
            gotcha: ['用双引号写 "$" 会被 shell 当变量吃掉，结果匹配不到任何东西']
          },
          {
            line: "grep -c ',0$' train.csv",
            say: '只数负面样本有几条。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-c', k: 'flag', ref: '-c', m: 'count：只输出命中行数' },
              { t: "',0$'", k: 'quote', ref: "'", m: '以 ,0 结尾的模式' },
              { t: 'train.csv', k: 'path', ref: '相对路径', m: '被统计的文件' }
            ],
            expect: '一个数字：2',
            watch: ['2'],
            gotcha: ['一行都没命中时 grep 退出码是 1，输出 0——脚本里要区分"没命中"和"命令失败"']
          }
        ],
        clinic: [
          {
            err: 'grep: train.csv: No such file or directory',
            read: '文件没找到。',
            fix: 'pwd 看位置；ls 看有没有；用相对路径前先确认自己在 ~。'
          },
          {
            err: 'grep 有输出，但数量比你想的多',
            read: '模式太宽松，比如用 ",1" 会命中 ",10"。',
            fix: '加行尾锚点：\',1$\'；或用 -w 按整词匹配。'
          }
        ],
        cheat: [
          { cmd: "grep ',1$' f.csv", mean: '挑出以 ,1 结尾的行' },
          { cmd: "grep -c ',0$' f.csv", mean: '数有多少条' },
          { cmd: 'grep -n ERROR app.log', mean: '带行号定位报错' },
          { cmd: 'grep -i 关键词 文件', mean: '忽略大小写' },
          { cmd: 'grep -v 关键词 文件', mean: '反向：排除命中的行' }
        ]
      },
      {
        id: 'd2-l3',
        title: '先复制到实验目录，再动手',
        body: [
          '原始数据是**只读材料**。你的实验必须用副本，理由很实在：',
          '',
          '- 你迟早会想"清洗一下"——一旦改了原件，就没法回头验证结论。',
          '- 副本在 `~/work/exp1/data/` 里，和你的笔记、日志在一起，交接时是一整套。',
          '',
          '`cp` 复制文件，`ls -l` 用来验收（-l 是长格式，能看到大小和权限）。'
        ].join('\n'),
        steps: [
          {
            line: 'cp train.csv ~/work/exp1/data/',
            say: '复制数据到实验目录。',
            tokens: [
              { t: 'cp', k: 'cmd', ref: 'cp', m: 'copy：复制文件' },
              { t: 'train.csv', k: 'path', ref: '相对路径', m: '源文件' },
              { t: '~/work/exp1/data/', k: 'path', ref: '~/work', m: '目标目录（Day 1 建的）' }
            ],
            expect: '没有输出 = 成功',
            gotcha: ['目标目录不存在时，会把它当成新文件名复制，结果得到一个叫 data 的文件']
          },
          {
            line: 'cp data/labels.txt ~/work/exp1/data/labels.md',
            say: '复制标签字典，并且改名成 .md——它本来就是给人读的说明。',
            tokens: [
              { t: 'cp', k: 'cmd', ref: 'cp', m: '复制（copy）：源文件不动，目标位置多一份' },
              { t: 'data/labels.txt', k: 'path', ref: '相对路径', m: '源文件' },
              { t: '~/work/exp1/data/labels.md', k: 'path', ref: '~/work', m: '目标是完整文件名 = 同时改名' }
            ],
            expect: '没有输出',
            gotcha: ['改名不会改内容，只是换个名字']
          },
          {
            line: 'ls -l ~/work/exp1/data',
            say: '验收：两份文件都在，顺便看大小和时间。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '-l', k: 'flag', ref: '-l', m: 'long：权限、属主、大小、时间、名字' },
              { t: '~/work/exp1/data', k: 'path', ref: '~/work', m: '实验数据目录' }
            ],
            expect: '两行：train.csv 和 labels.md，带字节数',
            watch: ['train.csv', 'labels.md'],
            gotcha: ['文件大小如果是 0，说明源文件就是空的，回去看 Day 1 的 data/']
          }
        ],
        clinic: [
          {
            err: 'cp: cannot create regular file: No such file or directory',
            read: '目标目录不存在。',
            fix: '先 mkdir -p ~/work/exp1/data；或者确认 Day 1 的目录还健在（tree ~/work）。'
          },
          {
            err: 'cp: are the same file',
            read: '源和目标是同一个文件（你可能已经 cd 进去了）。',
            fix: 'pwd 看位置，从 ~ 重新执行，或者改用绝对路径。'
          }
        ],
        cheat: [
          { cmd: 'cp 源 目标目录/', mean: '复制，保留原名' },
          { cmd: 'cp 源 新名字', mean: '复制并改名' },
          { cmd: 'cp -r 目录 目标', mean: '复制整个目录' },
          { cmd: 'ls -l 目录', mean: '验收：大小 + 权限' }
        ]
      },
      {
        id: 'd2-l4',
        title: '写一份数据体检：从"看到"到"存证"',
        body: [
          '现在把刚才的结论写下来。这一步看起来"没技术含量"，但它是**工程和玩玩的分界线**。',
          '',
          '两条命令的区别必须记牢：',
          '',
          '- `>` 覆盖写：文件里原来的东西全没了。',
          '- `>>` 追加写：接在末尾。',
          '',
          '先 `>` 写标题行，再用 `>>` 追加结论 —— 这就是真实数据报告的写法。'
        ].join('\n'),
        steps: [
          {
            line: 'echo "train.csv：6 行 = 1 表头 + 5 条样本" > ~/work/exp1/data/health.md',
            say: '第一行：数据规模。用 > 建立文件。',
            tokens: [
              { t: 'echo', k: 'cmd', ref: 'echo', m: '输出一段文本' },
              { t: '"…"', k: 'quote', ref: '"', m: '双引号把整句当一个参数' },
              { t: '>', k: 'op', ref: '>', m: '覆盖写入文件' },
              { t: '~/work/exp1/data/health.md', k: 'path', ref: '~/work', m: '体检报告文件（会自动创建）' }
            ],
            expect: '屏幕上没有输出',
            gotcha: ['这一句用了 >，再写一次会把整份报告清掉']
          },
          {
            line: 'echo "正面 3 条 / 负面 2 条" >> ~/work/exp1/data/health.md',
            say: '第二行：标签分布。必须用 >> 追加。',
            tokens: [
              { t: 'echo', k: 'cmd', ref: 'echo', m: '输出一段文本' },
              { t: '"…"', k: 'quote', ref: '"', m: '整句一个参数' },
              { t: '>>', k: 'op', ref: '>>', m: '追加重定向：写到文件末尾，不覆盖' },
              { t: '~/work/exp1/data/health.md', k: 'path', ref: '~/work', m: '同一个报告文件' }
            ],
            expect: '没有输出；此时文件应该是 2 行',
            gotcha: ['用了 > 的话，文件只剩这一行，第一行会消失']
          },
          {
            line: 'cat ~/work/exp1/data/health.md',
            say: '读回来验收。写文件之后永远 cat 一次，是工程习惯。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件内容' },
              { t: '~/work/exp1/data/health.md', k: 'path', ref: '~/work', m: '刚写的报告' }
            ],
            expect: '两行：规模 + 正负样本数',
            watch: ['5 条', '正面 3', '负面 2'],
            gotcha: ['如果只有一行，说明第二步用了 > 而不是 >>']
          }
        ],
        clinic: [
          {
            err: '报告只有一行',
            read: '第二次写入用了 >，把第一次的内容覆盖了。',
            fix: '重写一遍，第二行开始用 >>。'
          },
          {
            err: 'echo 之后命令卡住不动',
            read: '引号没闭合，shell 在等你把话说完。',
            fix: '按 Ctrl+C 取消，把引号补齐再来。'
          }
        ],
        cheat: [
          { cmd: 'echo "文本" > 文件', mean: '新建/覆盖一行' },
          { cmd: 'echo "文本" >> 文件', mean: '追加一行' },
          { cmd: 'cat 文件', mean: '读回来验收' },
          { cmd: 'wc -l 文件', mean: '确认写了几行' }
        ]
      },
      {
        id: 'd2-l5',
        title: '自己动手：独立体检一次',
        body: [
          '换你主导。三个只读动作，用来证明你真的会了：',
          '',
          '1. `ls -l ~/work/exp1/data` —— 副本齐了吗？',
          '2. `wc -l ~/work/exp1/data/train.csv` —— 行数对得上吗？',
          '3. `grep -c \',1$\' ~/work/exp1/data/train.csv` —— 正面样本几条？',
          '',
          '> 下面的闭卷挑战会要求你把结论写成文件，所以这一节先练手。'
        ].join('\n'),
        steps: [
          {
            line: 'ls -l ~/work/exp1/data',
            say: '先看副本齐不齐。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '-l', k: 'flag', ref: '-l', m: '长格式：大小 + 时间' },
              { t: '~/work/exp1/data', k: 'path', ref: '~/work', m: '实验数据目录' }
            ],
            expect: 'train.csv、labels.md、health.md',
            watch: ['health.md']
          },
          {
            line: 'wc -l ~/work/exp1/data/train.csv',
            say: '数副本的行数，和原件对比应该一致。',
            tokens: [
              { t: 'wc', k: 'cmd', ref: 'wc', m: '数行数' },
              { t: '-l', k: 'flag', ref: '-l', m: '只数行' },
              { t: '~/work/exp1/data/train.csv', k: 'path', ref: '~/work', m: '实验目录里的数据副本' }
            ],
            expect: '6（和原件一致说明复制完整）',
            watch: ['6']
          },
          {
            line: "grep -c ',1$' ~/work/exp1/data/train.csv",
            say: '数正面样本。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-c', k: 'flag', ref: '-c', m: '只输出数量' },
              { t: "',1$'", k: 'quote', ref: "'", m: '行尾锚点模式' },
              { t: '~/work/exp1/data/train.csv', k: 'path', ref: '~/work', m: '要统计的数据副本' }
            ],
            expect: '3',
            watch: ['3'],
            gotcha: ['这一条和 health.md 里写的"正面 3 条"必须一致，不一致说明有一处错了']
          }
        ],
        clinic: [
          {
            err: 'grep 结果和报告不一致',
            read: '要么报告写错了，要么统计的不是同一份文件。',
            fix: '固定用绝对路径统计，再更新报告；报告里的数字永远来自命令输出，不要凭记忆。'
          },
          {
            err: '副本行数和原件不同',
            read: '复制时源文件正在被写，或复制的是别的文件。',
            fix: '重新 cp 一次并立刻 wc -l 复核。'
          }
        ],
        cheat: [
          { cmd: 'ls -l 目录', mean: '看齐不齐' },
          { cmd: 'wc -l 文件', mean: '数行' },
          { cmd: "grep -c ',1$' 文件", mean: '数正面样本' },
          { cmd: 'diff 文件1 文件2', mean: '两份文件有没有差异' }
        ]
      },
    ],

    gates: [
      {
        id: 'd2-g1',
        title: '数据副本就位',
        brief: '把 `train.csv` 复制到 `~/work/exp1/data/`',
        hints: ['`cp 源 目录/` 目标写目录就保留原名', '复制完用 `ls -l` 看字节数，0 字节说明有问题'],
        checks: [
          { t: 'file', path: '~/work/exp1/data/train.csv', contains: 'good movie', why: '实验目录里有 train.csv（内容对）' }
        ]
      },
      {
        id: 'd2-g2',
        title: '数据体检报告',
        brief: '`~/work/exp1/data/health.md` 里写清规模与标签分布',
        hints: [
          '第一行用 `>` 建文件，后面用 `>>` 追加',
          '两行都要有：规模（5 条样本）+ 分布（正面 3 / 负面 2）'
        ],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/data/health.md',
            contains: ['5 条', '正面 3', '负面 2'],
            lines: 2,
            why: 'health.md 记录了样本数与正负样本数'
          }
        ]
      },
      {
        id: 'd2-g3',
        title: '标签字典一起带走',
        brief: '`data/labels.txt` 复制一份成 `~/work/exp1/data/labels.md`',
        hints: ['`cp 源 新路径/新名字` 可以在复制的同是改名', '改后缀不会改内容'],
        checks: [
          {
            t: 'file',
            path: '~/work/exp1/data/labels.md',
            contains: ['positive', 'negative'],
            why: 'labels.md 里有 0/1 对应的标签名'
          }
        ]
      }
    ],

    challenge: {
      id: 'd2-c1',
      title: '闭卷：独立统计并存证',
      brief: '不许往上翻。把 label=1 的条数写进 `~/work/exp1/data/label1.txt`，' +
        '再把 `data/labels.txt` 复制成 `~/work/exp1/data/labels-2.md`。',
      hints: ['`grep -c` 只输出数量', '重定向 > 可以把命令输出直接写进文件'],
      checks: [
        { t: 'file', path: '~/work/exp1/data/label1.txt', contains: '3', why: 'label1.txt 里记下了正面样本数 3' },
        { t: 'file', path: '~/work/exp1/data/labels-2.md', contains: 'positive', why: 'labels-2.md 复制成功' }
      ],
      solution: [
        "grep -c ',1$' train.csv > ~/work/exp1/data/label1.txt",
        'cp data/labels.txt ~/work/exp1/data/labels-2.md',
        'cat ~/work/exp1/data/label1.txt'
      ]
    }
  });
})(window);
