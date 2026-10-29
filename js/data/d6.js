/* =============================================================================
 * js/data/d6.js
 * -----------------------------------------------------------------------------
 * Day 6 —— 跑起来 · 看得见 · 杀得掉
 *
 * 看卡 → 后台起服务并留显存证据 → 日志定位 → 写排障笔记 → 收工杀进程
 * 关卡：gradio 会话 + 显存 ≥1000MiB / gpu.txt 4823 / troubleshoot.md 三行
 * 闭卷挑战：不看书，重新起一次服务并留下显存证据
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd6',
    label: 'Day 6',
    title: '跑起来 · 看得见 · 杀得掉',
    goal: '把 AI 服务后台跑起来、用 nvidia-smi 证明模型真占了显存、从日志里定位超时、然后干净收工。',
    scenario: 'ai-gpu',
    minutes: 55,

    intro: [
      'AI 项目的"能跑"有三个层次：**进程在 → 显存占住了 → 请求能回来**。今天把三层都走一遍。',
      '',
      '真实事故里最常见的一句话是"我起了服务但很慢"，对应排查顺序：',
      '',
      '1. `nvidia-smi`：卡在不在，显存占了多少（0 MiB = 模型根本没上卡）。',
      '2. `ps aux | grep python`：进程真在跑吗，跑的是哪个脚本。',
      '3. 日志：卡在哪一步（`grep -n ERROR`）。',
      '',
      '> 今天还要学一件反直觉的事：**杀进程不等于释放显存**。'
    ].join('\n'),

    lessons: [
      {
        id: 'd6-l1',
        title: '先看卡：nvidia-smi 读法',
        body: [
          '`nvidia-smi` 输出信息很多，新手只需要盯四块：**型号、显存 used/total、GPU-Util、Processes**。',
          '',
          '三种常用形态：',
          '',
          '- `nvidia-smi`：完整面板（人看）。',
          '- `nvidia-smi -L`：只列出有几张卡（脚本里判断卡数量）。',
          '- `nvidia-smi --query-gpu=memory.used --format=csv`：**机器可读**，适合存证 / 监控。'
        ].join('\n'),
        steps: [
          {
            line: 'nvidia-smi',
            say: '完整面板：先看型号和显存。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 系统管理接口：看卡、显存、进程' }
            ],
            expect: '一张表格：GPU 型号、显存 used/total、利用率、进程列表',
            watch: ['MiB', 'Processes'],
            gotcha: ['沙盒是模拟的：数字是固定剧本，真机上会实时变']
          },
          {
            line: 'nvidia-smi -L',
            say: '只列卡：有几张、编号是什么。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
              { t: '-L', k: 'flag', ref: '-L', m: 'list：只列出 GPU 设备清单' }
            ],
            expect: 'GPU 0: …（一行一张卡）',
            watch: ['GPU 0'],
            gotcha: ['脚本里可以用 -L 的退出码判断"这台机器有没有卡"']
          },
          {
            line: 'nvidia-smi --query-gpu=memory.used --format=csv',
            say: '机器可读格式：只要"已用显存"这一个字段。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
              { t: '--query-gpu=memory.used', k: 'flag', ref: 'nvidia-smi', m: '只查询指定字段（memory.used = 已用显存）' },
              { t: '--format=csv', k: 'flag', ref: 'nvidia-smi', m: '输出成 CSV，方便重定向到文件、被监控系统解析' }
            ],
            expect: 'memory.used [MiB] 表头 + 一行数字',
            watch: ['MiB'],
            gotcha: ['字段名写错不会报错，只会少一列——先查准名字']
          }
        ],
        clinic: [
          {
            err: "NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver",
            read: '驱动没装好，或容器里没挂 GPU。',
            fix: '真机上装驱动 / 用 --gpus all 起容器；这种情况先找运维，不要乱装驱动。'
          },
          {
            err: 'nvidia-smi: command not found',
            read: '机器上没有 NVIDIA 驱动工具。',
            fix: '确认是不是 CPU 机器（那就别找卡了）；有卡但没工具，装驱动。'
          }
        ],
        cheat: [
          { cmd: 'nvidia-smi', mean: '完整面板' },
          { cmd: 'nvidia-smi -L', mean: '有几张卡' },
          { cmd: 'nvidia-smi --query-gpu=memory.used --format=csv', mean: '机器可读的显存' },
          { cmd: 'watch -n 1 nvidia-smi', mean: '每秒刷新看变化' }
        ]
      },
      {
        id: 'd6-l2',
        title: '后台起服务，并留下显存证据',
        body: [
          '`nohup python app.py > serve.log 2>&1 &` 这一行塞了四件事，逐个拆：',
          '',
          '- `nohup`：关掉终端也别杀我。',
          '- `> serve.log`：正常输出进日志。',
          '- `2>&1`：报错也进同一个日志（否则报错会丢）。',
          '- `&`：丢到后台，终端立刻还给你。',
          '',
          '起完立刻做两件事：`ps aux | grep python` 确认进程在，`nvidia-smi --query-gpu` 确认显存被占。' +
          '**进程在但显存是 0，说明模型根本没上卡**（常见于 cuda 不可用时自动回退 CPU）。'
        ].join('\n'),
        steps: [
          {
            line: 'mkdir -p ~/work',
            say: '先建证据目录。',
            tokens: [
              { t: 'mkdir', k: 'cmd', ref: 'mkdir', m: '建目录' },
              { t: '-p', k: 'flag', ref: '-p', m: '缺的父目录一起建，重复执行不报错' },
              { t: '~/work', k: 'path', ref: '~', m: '放显存快照、笔记的地方' }
            ],
            expect: '没有输出',
            gotcha: ['已经存在也不会报错——这就是 -p 的好处']
          },
          {
            line: 'nohup python app.py > serve.log 2>&1 &',
            say: '后台起服务，输出和报错都进 serve.log。',
            tokens: [
              { t: 'nohup', k: 'cmd', ref: 'nohup', m: 'no hang up：终端关了也继续跑' },
              { t: 'python', k: 'cmd', ref: 'python', m: '解释器' },
              { t: 'app.py', k: 'path', ref: 'python', m: '要跑的服务脚本' },
              { t: '> serve.log', k: 'op', ref: '>', m: '标准输出写进 serve.log' },
              { t: '2>&1', k: 'op', ref: '2>&1', m: '标准错误并进标准输出，一起写进日志' },
              { t: '&', k: 'op', ref: '&', m: '放后台执行，终端立刻可用' }
            ],
            expect: '打印作业号/进程号，然后立刻回到提示符',
            watch: ['[1]'],
            gotcha: ['忘了 & 会占住终端，服务不结束你就没法敲别的命令']
          },
          {
            line: 'ps aux | grep python',
            say: '确认进程真的在跑。',
            tokens: [
              { t: 'ps', k: 'cmd', ref: 'ps', m: '列出进程' },
              { t: 'aux', k: 'value', ref: 'ps', m: '所有用户的全部进程（BSD 风格参数，不加 -）' },
              { t: '|', k: 'op', ref: '|', m: '管道：把 ps 的输出交给 grep 过滤' },
              { t: 'grep', k: 'cmd', ref: 'grep', m: '按关键字过滤' },
              { t: 'python', k: 'value', ref: 'python', m: '要找的关键字' }
            ],
            expect: '至少一行 python app.py（外加 grep python 自己那行）',
            watch: ['app.py'],
            gotcha: ['grep 自己也会出现在结果里，别把那一行当成服务进程']
          },
          {
            line: 'nvidia-smi --query-gpu=memory.used --format=csv > ~/work/gpu.txt',
            say: '把此刻的显存占用存成证据。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
              { t: '--query-gpu=memory.used', k: 'flag', ref: 'nvidia-smi', m: '只查已用显存' },
              { t: '--format=csv', k: 'flag', ref: 'nvidia-smi', m: 'CSV 输出' },
              { t: '>', k: 'op', ref: '>', m: '重定向进文件' },
              { t: '~/work/gpu.txt', k: 'path', ref: '~/work', m: '显存快照文件' }
            ],
            expect: '没有输出；gpu.txt 里有两行（表头 + 数值）',
            watch: ['4823'],
            gotcha: ['存证要在服务跑起来之后做，否则存下来的是 0']
          },
          {
            line: 'cat ~/work/gpu.txt',
            say: '读回来确认数字。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/work/gpu.txt', k: 'path', ref: '~/work', m: '显存快照' }
            ],
            expect: 'memory.used [MiB] 然后 4823 MiB',
            watch: ['4823'],
            gotcha: ['如果是 0 MiB，说明模型没上卡（cuda 不可用 / 被 CPU 回退）']
          }
        ],
        clinic: [
          {
            err: '服务起了，但 nvidia-smi 显存是 0',
            read: '模型回退到 CPU 了（或用了别张卡）。',
            fix: '看日志有没有 "cuda not available"；真机上确认 CUDA_VISIBLE_DEVICES 和 torch.cuda.is_available()。'
          },
          {
            err: "nohup: ignoring input and appending output to 'nohup.out'",
            read: '你没写 > 日志，所以默认写 nohup.out。',
            fix: '这是提示不是错误；但为了日志可控，始终显式写 > xxx.log。'
          }
        ],
        cheat: [
          { cmd: 'nohup python app.py > serve.log 2>&1 &', mean: '后台起服务 + 全量日志' },
          { cmd: 'ps aux | grep python', mean: '进程在不在' },
          { cmd: 'nvidia-smi --query-gpu=memory.used --format=csv', mean: '显存多少' },
          { cmd: 'tail -f serve.log', mean: '实时看日志' }
        ]
      },
      {
        id: 'd6-l3',
        title: '日志：找到那条 ERROR',
        body: [
          '服务起得来但请求超时，答案一定在日志里。三个动作：`tail` 看最新、`grep -n` 定位、`grep -c` 数比例。',
          '',
          '> 判断"是不是全局问题"的关键：INFO 几条、ERROR 几条。3 条 INFO 里 1 条 ERROR，说明启动流程走完了，' +
          '问题出在**请求处理**；如果只有 1 条 INFO 就 ERROR，那是**启动就挂了**——两种病要吃不同的药。'
        ].join('\n'),
        steps: [
          {
            line: 'tail -n 5 run.log',
            say: '先看最新的 5 行。',
            tokens: [
              { t: 'tail', k: 'cmd', ref: 'tail', m: '看文件末尾' },
              { t: '-n', k: 'flag', ref: '-n', m: '行数开关' },
              { t: '5', k: 'value', ref: '-3', m: '具体行数' },
              { t: 'run.log', k: 'path', ref: '相对路径', m: '服务运行日志' }
            ],
            expect: '最后一行是 ERROR request timeout after 30s',
            watch: ['ERROR'],
            gotcha: ['tail 只给末尾，看不到启动过程——那要用 head 或整文件 grep']
          },
          {
            line: 'grep -n ERROR run.log',
            say: '带行号定位报错。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-n', k: 'flag', ref: '-n', m: '显示行号' },
              { t: 'ERROR', k: 'value', ref: '日志', m: '日志级别：错误' },
              { t: 'run.log', k: 'path', ref: '相对路径', m: '服务日志' }
            ],
            expect: '5:… ERROR request timeout after 30s',
            watch: ['5:']
          },
          {
            line: 'grep -c INFO run.log',
            say: '数正常日志条数，判断流程走到哪一步。',
            tokens: [
              { t: 'grep', k: 'cmd', ref: 'grep', m: '过滤文本' },
              { t: '-c', k: 'flag', ref: '-c', m: '只输出数量' },
              { t: 'INFO', k: 'value', ref: '日志', m: '日志级别：正常信息' },
              { t: 'run.log', k: 'path', ref: '相对路径', m: '服务日志' }
            ],
            expect: '3',
            watch: ['3'],
            gotcha: ['沙盒里 run.log 也是固定剧本，数字和真机不会一致']
          }
        ],
        clinic: [
          {
            err: 'grep 一条都没匹配到（输出为空）',
            read: '关键字大小写不对，或这个日志里根本没有 ERROR。',
            fix: 'grep -i error 忽略大小写；或 grep -rn ERROR . 全目录搜一遍。'
          },
          {
            err: '日志在滚，但 grep 抓不到新内容',
            read: '你在看旧文件 / 服务写的是另一个日志。',
            fix: 'tail -f 跟着看；确认 nohup 那行的 > 指向哪个文件。'
          }
        ],
        cheat: [
          { cmd: 'tail -n 5 日志', mean: '最新 5 行' },
          { cmd: 'grep -n ERROR 日志', mean: '报错在哪一行' },
          { cmd: 'grep -c INFO 日志', mean: '正常流程几步' },
          { cmd: 'grep -A2 ERROR 日志', mean: '把报错后两行也带出来' }
        ]
      },
      {
        id: 'd6-l4',
        title: '收工：写笔记 + 杀进程（并理解显存）',
        body: [
          '排障的最后一环是**收尾**：把结论写成三行笔记，然后把进程清掉，把卡让出来。',
          '',
          '⚠️ 一个必须知道的坑：**pkill 杀掉进程后，显存不一定立刻回来**。' +
          'NVIDIA 驱动释放显存有延迟；进程卡在不可中断状态时，`nvidia-smi` 里还能看到它。',
          '',
          '所以收工的标准流程是：`pkill` → 再看 `ps aux` / `nvidia-smi` 确认真的没了。'
        ].join('\n'),
        steps: [
          {
            line: 'printf "现象：gradio 起在 7860，显存 4823 MiB，但请求超时\\n原因：cuda 不可用，回退 CPU 后单条推理 > 30s\\n证据：run.log 第 5 行 ERROR request timeout after 30s\\n" > ~/work/troubleshoot.md',
            say: '三行排障笔记：现象 / 原因 / 证据。',
            tokens: [
              { t: 'printf', k: 'cmd', ref: 'printf', m: '格式化输出，会把 \\n 变成真换行' },
              { t: '"…\\n…"', k: 'quote', ref: '"', m: '整段文本，\\n 分隔三行' },
              { t: '>', k: 'op', ref: '>', m: '写入文件' },
              { t: '~/work/troubleshoot.md', k: 'path', ref: '~/work', m: '排障笔记' }
            ],
            expect: '没有输出；文件 3 行',
            gotcha: ['笔记里必须出现 ERROR 和 cuda：前者是证据，后者是原因']
          },
          {
            line: 'cat ~/work/troubleshoot.md',
            say: '读回来验收。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/work/troubleshoot.md', k: 'path', ref: '~/work', m: '排障笔记' }
            ],
            expect: '三行：现象 / 原因 / 证据',
            watch: ['ERROR', 'cuda']
          },
          {
            line: 'pkill -f app.py',
            say: '按命令行匹配杀掉服务进程。',
            tokens: [
              { t: 'pkill', k: 'cmd', ref: 'pkill', m: '按名字/命令行杀进程' },
              { t: '-f', k: 'flag', ref: '-f', m: 'full：匹配整条命令行（不只进程名）' },
              { t: 'app.py', k: 'value', ref: 'python', m: '要匹配的脚本名' }
            ],
            expect: '没有输出（杀掉成功是静默的）',
            gotcha: ['pkill -f python 会把你自己的其他 python 任务一起带走，务必写得精确']
          },
          {
            line: 'ps aux | grep python',
            say: '确认进程真的没了（grep 自己那一行还在是正常的）。',
            tokens: [
              { t: 'ps', k: 'cmd', ref: 'ps', m: '列出进程' },
              { t: 'aux', k: 'value', ref: 'ps', m: '全部进程' },
              { t: '|', k: 'op', ref: '|', m: '管道：把左边输出交给右边' },
              { t: 'grep', k: 'cmd', ref: 'grep', m: '按关键字过滤' },
              { t: 'python', k: 'value', ref: 'python', m: '关键字' }
            ],
            expect: '只剩 grep 自己（或者什么都没有）',
            gotcha: ['没有输出且退出码 1，是"没找到"的正常结果，不是命令坏了']
          }
        ],
        clinic: [
          {
            err: 'pkill 之后 ps 里还能看到 app.py',
            read: '可能是另一个同名进程，或进程处于不可中断状态。',
            fix: '用 pgrep -af app.py 看 PID 和完整命令；再 kill -9 PID。'
          },
          {
            err: 'nvidia-smi 显存一直不下降',
            read: '驱动延迟释放，或有僵尸进程占着。',
            fix: '等几秒再看；不行用 fuser -v /dev/nvidia* 找占用者，最后手段重启机器。'
          }
        ],
        cheat: [
          { cmd: 'printf "a\\nb\\n" > 笔记.md', mean: '写多行笔记' },
          { cmd: 'pkill -f 脚本名', mean: '按命令行杀进程' },
          { cmd: 'pgrep -af 脚本名', mean: '先看清楚再杀' },
          { cmd: 'kill -9 PID', mean: '强杀指定进程' }
        ]
      },
      {
        id: 'd6-l5',
        title: '自己动手：交班时要说的三句话',
        body: [
          '只读三连，模拟"把机器交给同事"：',
          '',
          '1. `nvidia-smi -L` —— 这台机器有几张卡？',
          '2. `ps aux | grep python` —— 还有我的进程在跑吗？',
          '3. `du -sh ~/work` —— 我留下了多少文件？',
          '',
          '> 交班时能说清这三点的人，同事会愿意再跟他合作。'
        ].join('\n'),
        steps: [
          {
            line: 'nvidia-smi -L',
            say: '几张卡、编号。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
              { t: '-L', k: 'flag', ref: '-L', m: '只列设备' }
            ],
            expect: 'GPU 0: …',
            watch: ['GPU 0']
          },
          {
            line: 'ps aux | grep python',
            say: '确认没有遗留进程。',
            tokens: [
              { t: 'ps', k: 'cmd', ref: 'ps', m: '列进程' },
              { t: 'aux', k: 'value', ref: 'ps', m: '全部进程' },
              { t: '|', k: 'op', ref: '|', m: '管道：把左边输出交给右边' },
              { t: 'grep', k: 'cmd', ref: 'grep', m: '按关键字过滤' },
              { t: 'python', k: 'value', ref: 'python', m: '关键字' }
            ],
            expect: '只剩 grep 自己',
            gotcha: ['看到别的 python 进程先别杀——可能是别人的任务']
          },
          {
            line: 'du -sh ~/work',
            say: '看自己留下多少东西。',
            tokens: [
              { t: 'du', k: 'cmd', ref: 'du', m: '统计占用空间' },
              { t: '-sh', k: 'flag', ref: '-s', m: '-s 只要总数 + -h 人类可读' },
              { t: '~/work', k: 'path', ref: '~/work', m: '你的工作目录' }
            ],
            expect: '一行：大小 + 路径',
            watch: ['K', 'M']
          }
        ],
        clinic: [
          {
            err: 'ps 里有一堆 python 进程，分不清哪个是我的',
            read: '只看名字看不出归属。',
            fix: 'ps aux 的 USER 列看属主；pgrep -af 看完整命令行；lsof -p PID 看它打开了什么。'
          },
          {
            err: 'du 统计出几十 G，我明明只写了几个文件',
            read: 'work 里放了模型或缓存。',
            fix: 'du -sh ~/work/* 逐个子目录看；模型别放 home，放 /data。'
          }
        ],
        cheat: [
          { cmd: 'nvidia-smi -L', mean: '几张卡' },
          { cmd: 'ps aux | grep 关键字', mean: '还有没有我的进程' },
          { cmd: 'du -sh 目录', mean: '我留下了多少' },
          { cmd: 'pgrep -af 脚本', mean: 'PID + 完整命令' }
        ]
      }
    ],

    gates: [
      {
        id: 'd6-g1',
        title: '服务真的起来了',
        brief: 'app.py 跑起来（gradio 会话存在）并且显存被占住',
        hints: ['`nohup python app.py > serve.log 2>&1 &`', '`nvidia-smi` 里要有进程占着显存'],
        checks: [
          { t: 'aiSession', name: 'gradio', why: 'gradio 服务已经在跑' },
          { t: 'aiGpu', minMB: 1000, why: '显存占用 ≥ 1000 MiB（说明模型真的载入了）' }
        ]
      },
      {
        id: 'd6-g2',
        title: '显存快照存证',
        brief: '把 `memory.used` 存进 `~/work/gpu.txt`',
        hints: ['`nvidia-smi --query-gpu=memory.used --format=csv > ~/work/gpu.txt`', '要在服务跑起来之后再存'],
        checks: [
          { t: 'file', path: '~/work/gpu.txt', contains: '4823', why: 'gpu.txt 里记下了服务运行时的显存占用' }
        ]
      },
      {
        id: 'd6-g3',
        title: '排障笔记',
        brief: '`~/work/troubleshoot.md`：现象 / 原因 / 证据三行，提到 ERROR 与 cuda',
        hints: ['`printf "a\\nb\\nc\\n" > ~/work/troubleshoot.md`', '原因要写 cuda 不可用导致回退 CPU'],
        checks: [
          {
            t: 'file',
            path: '~/work/troubleshoot.md',
            contains: ['ERROR', 'cuda'],
            lines: 3,
            why: 'troubleshoot.md 至少三行，且提到 ERROR 与 cuda'
          }
        ]
      }
    ],

    challenge: {
      id: 'd6-c1',
      title: '闭卷：重新起服务，并证明它占了卡',
      brief: '不许往上翻。把 `app.py` 在后台重新跑起来（日志写 `~/work/again.log`），' +
        '把显存快照写进 `~/work/gpu2.txt`，再写一行结论文本 `~/work/again-note.md`（包含 "7860"）。',
      hints: ['`nohup … > 日志 2>&1 &` 四个零件缺一不可', '起完再存显存，顺序不能反'],
      checks: [
        { t: 'aiSession', name: 'gradio', why: 'gradio 会话在跑' },
        { t: 'aiGpu', minMB: 1000, why: '显存 ≥ 1000 MiB' },
        { t: 'file', path: '~/work/gpu2.txt', contains: 'MiB', why: 'gpu2.txt 里是显存快照' },
        { t: 'file', path: '~/work/again-note.md', contains: '7860', why: 'again-note.md 里写了端口 7860' }
      ],
      solution: [
        'nohup python app.py > ~/work/again.log 2>&1 &',
        'nvidia-smi --query-gpu=memory.used --format=csv > ~/work/gpu2.txt',
        'echo "服务在 7860，显存已占住" > ~/work/again-note.md',
        'cat ~/work/gpu2.txt'
      ]
    }
  });
})(window);
