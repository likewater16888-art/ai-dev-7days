/* =============================================================================
 * js/data/d7.js
 * -----------------------------------------------------------------------------
 * Day 7 —— 交付：模型、入口、一页说明
 *
 * 模型落盘（hf download）→ 起一个能点开的入口（jupyter）→ 一页 README → 复盘
 * 关卡：模型 + config.json / jupyter 会话 / README 四行
 * 闭卷挑战：不看上面，重新走一遍交付自检
 * 结业项目：4 项，全部用真实命令证明
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Days.add({
    id: 'd7',
    label: 'Day 7',
    title: '交付：模型、入口、一页说明',
    goal: '把模型放到该放的位置、留一个能点开的入口、写一页别人照着就能跑的说明，完成交付。',
    scenario: 'ai-gpu',
    minutes: 55,

    intro: [
      '最后一天不做新东西，只做**交付**。交付的标准不是"我电脑上能跑"，而是：',
      '',
      '> **换一个人、换一台机器，照着 README 做完，能得到同样的结果。**',
      '',
      '交付物只有三样：',
      '',
      '1. **模型/数据**放在约定位置（不进 Git）。',
      '2. **入口**：一条能点开的地址（Jupyter / 端口）。',
      '3. **一页说明**：怎么装、怎么跑、模型哪来的。',
      '',
      '> 这三样齐了，你的 7 天就是一个可以写进简历、可以给人演示的项目。'
    ].join('\n'),

    lessons: [
      {
        id: 'd7-l1',
        title: '模型放对位置（而不是塞进 Git）',
        body: [
          '模型权重动辄几百 MB 到几十 GB，**永远不进 Git**。放 `~/models/<模型名>` 或 `/data`，然后在 README 里写清怎么下载。',
          '',
          '`hf download` 的三个关键点：仓库名（`组织/模型`）、`--local-dir` 指定落地目录、下载完检查关键文件（`config.json`）。',
          '',
          '> 判据：`du -sh` 看到几百 MB，`ls` 看到 config.json + 权重文件——这才叫"落盘了"。'
        ].join('\n'),
        steps: [
          {
            line: 'ls ~/models',
            say: '先看现有模型目录里有什么。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '~/models', k: 'path', ref: '~', m: '模型统一放这里（别放 home 根目录）' }
            ],
            expect: '空的，或只有旧模型目录',
            gotcha: ['目录不存在会报 No such file；沙盒里已建好']
          },
          {
            line: 'hf download Qwen/Qwen2.5-0.5B-Instruct --local-dir ~/models/qwen',
            say: '把模型下到指定目录。',
            tokens: [
              { t: 'hf', k: 'cmd', ref: 'hf', m: 'Hugging Face 命令行工具' },
              { t: 'download', k: 'value', ref: 'hf', m: '子命令：下载模型/数据集' },
              { t: 'Qwen/Qwen2.5-0.5B-Instruct', k: 'value', ref: 'hf', m: '仓库名：组织/模型名（大小写敏感）' },
              { t: '--local-dir', k: 'flag', ref: 'hf', m: '指定下载到哪个目录' },
              { t: '~/models/qwen', k: 'path', ref: '~', m: '落地目录（不存在会创建）' }
            ],
            expect: '下载进度 + 完成提示，最后文件落在 ~/models/qwen',
            watch: ['config.json', '100%'],
            gotcha: ['仓库名写错是最常见失败；模型名里的点、横杠都要一字不差']
          },
          {
            line: 'ls ~/models/qwen',
            say: '检查关键文件：config.json 在不在。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '~/models/qwen', k: 'path', ref: '~', m: '模型落地目录' }
            ],
            expect: 'config.json + 权重文件（safetensors/bin）',
            watch: ['config.json'],
            gotcha: ['只有 README.md 没有 config.json = 下的是空壳，没下权重']
          },
          {
            line: 'du -sh ~/models',
            say: '看模型占多少空间——判断"是不是真的下完了"。',
            tokens: [
              { t: 'du', k: 'cmd', ref: 'du', m: '统计占用空间' },
              { t: '-sh', k: 'flag', ref: '-s', m: '-s 总数 + -h 可读单位' },
              { t: '~/models', k: 'path', ref: '~', m: '模型目录' }
            ],
            expect: '几百 MB 或更大（0.5B 模型大致 1G 上下）',
            watch: ['M', 'G'],
            gotcha: ['几十 K 说明基本没下到东西']
          }
        ],
        clinic: [
          {
            err: 'Repository Not Found for url: …',
            read: '仓库名拼错，或需要登录/授权。',
            fix: '核对 组织/模型名 大小写；gated 模型要先 hf auth login 并同意许可。'
          },
          {
            err: 'OSError: [Errno 28] No space left on device',
            read: '磁盘满了。',
            fix: 'df -h 看哪个盘满了；清 ~/.cache/huggingface 或改 --local-dir 到 /data。'
          }
        ],
        cheat: [
          { cmd: 'ls ~/models', mean: '现有模型' },
          { cmd: 'hf download 组织/模型 --local-dir 目录', mean: '下载到指定目录' },
          { cmd: 'ls 目录', mean: '看 config.json 在不在' },
          { cmd: 'du -sh 目录', mean: '占多少空间' }
        ]
      },
      {
        id: 'd7-l2',
        title: '留一个能点开的入口',
        body: [
          '演示给别人的时候，最尴尬的是"它在我机器上能跑"。所以要留一个**别人能点开**的入口。',
          '',
          '`jupyter lab --no-browser --port 8888` 的两个参数值得记住：',
          '',
          '- `--no-browser`：服务器上没有浏览器，别试图打开它（会报错或卡住）。',
          '- `--port 8888`：显式指定端口，方便写进 README，也方便转发。',
          '',
          '> 端口是承诺：写进 README 的端口，就要保证真的用它。'
        ].join('\n'),
        steps: [
          {
            line: 'jupyter lab --no-browser --port 8888',
            say: '起一个 Jupyter 会话，不自动开浏览器。',
            tokens: [
              { t: 'jupyter', k: 'cmd', ref: 'jupyter', m: 'Jupyter 命令行；lab 是它的新版界面' },
              { t: 'lab', k: 'value', ref: 'jupyter', m: '子命令：启动 JupyterLab' },
              { t: '--no-browser', k: 'flag', ref: 'jupyter', m: '不自动打开浏览器（服务器环境必备）' },
              { t: '--port', k: 'flag', ref: 'jupyter', m: '指定监听端口' },
              { t: '8888', k: 'value', ref: '端口', m: '端口号，README 里要写一致' }
            ],
            expect: '一串 http://127.0.0.1:8888/lab?token=… 的地址',
            watch: ['8888', 'token'],
            gotcha: ['不带 --no-browser 在服务器上会报 "no browser found" 然后退出']
          }
        ],
        clinic: [
          {
            err: 'Address already in use',
            read: '8888 端口被占了（可能你之前起过一个）。',
            fix: '换端口 --port 8889，或 pkill -f jupyter 关掉旧的。'
          },
          {
            err: 'jupyter: command not found',
            read: '当前环境没装 jupyter。',
            fix: 'pip install jupyterlab（在正确的 conda 环境里）；确认 which python 是 ai7。'
          }
        ],
        cheat: [
          { cmd: 'jupyter lab --no-browser --port 8888', mean: '起 Lab' },
          { cmd: 'curl 127.0.0.1:8888', mean: '验证端口通不通' },
          { cmd: 'pkill -f jupyter', mean: '关掉旧会话' },
          { cmd: 'ss -ltnp', mean: '看谁占了端口' }
        ]
      },
      {
        id: 'd7-l3',
        title: '一页 README 就是交付',
        body: [
          'README 只有四个问题要回答，缺一不可：',
          '',
          '1. **这是什么**（项目 + 一句话用途）',
          '2. **怎么跑**（命令 + 端口）',
          '3. **模型哪来的**（仓库名 + 放在哪）',
          '4. **环境怎么装**（conda / pip 清单文件名）',
          '',
          '> 写 README 时把自己当成"明天失忆的自己"：只有这四行信息，能不能重新跑起来？'
        ].join('\n'),
        steps: [
          {
            line: 'printf "项目：情感分类 demo（7 天版）\\n运行：python app.py（端口 7860）\\n模型：Qwen/Qwen2.5-0.5B-Instruct 放 ~/models/qwen\\n环境：conda activate ai7（见 environment.yml）\\n" > ~/README.md',
            say: '四行 README，一次写完。',
            tokens: [
              { t: 'printf', k: 'cmd', ref: 'printf', m: '写多行文本（\\n 生效）' },
              { t: '"…\\n…"', k: 'quote', ref: '"', m: '四行内容，用 \\n 分隔' },
              { t: '>', k: 'op', ref: '>', m: '覆盖写入' },
              { t: '~/README.md', k: 'path', ref: 'README.md', m: '交付说明：主目录最显眼的位置' }
            ],
            expect: '没有输出；README.md 有 4 行',
            gotcha: ['写 README 别只写"运行 python app.py"，端口不写别人连不上']
          },
          {
            line: 'cat ~/README.md',
            say: '读回来验收：四行都在，信息完整。',
            tokens: [
              { t: 'cat', k: 'cmd', ref: 'cat', m: '打印文件' },
              { t: '~/README.md', k: 'path', ref: 'README.md', m: '交付说明' }
            ],
            expect: '四行：项目 / 运行 / 模型 / 环境',
            watch: ['python app.py', 'Qwen'],
            gotcha: ['行数不够会过不了关卡（line 检查至少 4 行）']
          }
        ],
        clinic: [
          {
            err: 'README 只有一行（所有内容挤在一起）',
            read: '\\n 没被解释。',
            fix: '用 printf 而不是 echo；或者分四次 echo ... >> 追加。'
          },
          {
            err: 'README 写了端口但和实际不一致',
            read: '复制粘贴旧项目的说明。',
            fix: '端口、模型名、环境名三处必须和实际一致——交付前逐项核对。'
          }
        ],
        cheat: [
          { cmd: 'printf "a\\nb\\n" > README.md', mean: '写多行 README' },
          { cmd: 'cat README.md', mean: '读回来' },
          { cmd: 'wc -l README.md', mean: '确认行数' }
        ]
      },
      {
        id: 'd7-l4',
        title: '7 天复盘：你现在会什么',
        body: [
          '`history` 是你这 7 天的成绩单。翻一遍，把命令按"能力"归类，你会发现自己已经不是第一天那个人了：',
          '',
          '- 定位与浏览：`pwd` `ls` `tree` `find`',
          '- 数据处理：`head` `wc` `grep`',
          '- 环境与依赖：`conda` `pip` `which`',
          '- 版本与交付：`git` `hf` `jupyter`',
          '- 运行与排障：`nohup` `ps` `pkill` `nvidia-smi` `tail`',
          '',
          '> 面试时被问"你平时怎么排查 GPU 服务问题"，答案就是这一列命令 + 现象/原因/证据的写法。'
        ].join('\n'),
        steps: [
          {
            line: 'history',
            say: '翻一遍自己的操作历史。',
            tokens: [
              { t: 'history', k: 'cmd', ref: 'history', m: '列出命令历史' }
            ],
            expect: '一长串你敲过的命令（沙盒里记录本次会话）',
            watch: ['grep', 'conda', 'nvidia-smi'],
            gotcha: ['沙盒每次重置会清历史；真机上历史会一直累积']
          },
          {
            line: 'wc -l ~/README.md',
            say: '顺便确认交付说明的完整度（至少 4 行）。',
            tokens: [
              { t: 'wc', k: 'cmd', ref: 'wc', m: '数行数' },
              { t: '-l', k: 'flag', ref: '-l', m: '只数行' },
              { t: '~/README.md', k: 'path', ref: 'README.md', m: '交付说明' }
            ],
            expect: '4 ~/README.md（或更多）',
            watch: ['README.md'],
            gotcha: ['3 行说明少了"环境怎么装"这一条']
          }
        ],
        clinic: [
          {
            err: 'history 是空的',
            read: '沙盒刚重置，或这次会话还没敲命令。',
            fix: '正常现象；真机上历史存在 ~/.bash_history。'
          },
          {
            err: '想找历史里某条命令但记不住',
            read: '翻太慢。',
            fix: 'history | grep 关键字；或 Ctrl+R 反向搜索（真机）。'
          }
        ],
        cheat: [
          { cmd: 'history', mean: '我敲过什么' },
          { cmd: 'history | grep 关键字', mean: '找某条命令' },
          { cmd: 'wc -l README.md', mean: '说明写了几行' }
        ]
      },
      {
        id: 'd7-l5',
        title: '自己动手：交付前最后一眼',
        body: [
          '交付前只读三连，看完就可以把链接发出去：',
          '',
          '1. `ls ~/models/qwen` —— 模型文件（config.json）在不在？',
          '2. `nvidia-smi -L` —— 卡还在吗（服务真的能用 GPU）？',
          '3. `du -sh ~/models` —— 交付物体积合理吗？',
          '',
          '> 下面「结业项目」里 4 项会自动判分，全部通过就可以写进简历了。'
        ].join('\n'),
        steps: [
          {
            line: 'ls ~/models/qwen',
            say: '模型关键文件确认。',
            tokens: [
              { t: 'ls', k: 'cmd', ref: 'ls', m: '列目录' },
              { t: '~/models/qwen', k: 'path', ref: '~', m: '模型落地目录' }
            ],
            expect: 'config.json + 权重文件',
            watch: ['config.json']
          },
          {
            line: 'nvidia-smi -L',
            say: '卡还在不在。',
            tokens: [
              { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
              { t: '-L', k: 'flag', ref: '-L', m: '只列设备' }
            ],
            expect: 'GPU 0: …',
            watch: ['GPU 0']
          },
          {
            line: 'du -sh ~/models',
            say: '交付物体积。',
            tokens: [
              { t: 'du', k: 'cmd', ref: 'du', m: '统计空间' },
              { t: '-sh', k: 'flag', ref: '-s', m: '总数 + 可读单位' },
              { t: '~/models', k: 'path', ref: '~', m: '模型目录' }
            ],
            expect: '几百 MB 到 1G 上下',
            watch: ['M', 'G']
          }
        ],
        clinic: [
          {
            err: 'ls 里没有 config.json',
            read: '下载没完成，或下的是别的仓库。',
            fix: '重新 hf download，注意仓库名；用 du -sh 检查体积。'
          },
          {
            err: '服务在跑但别人连不上',
            read: '监听了 127.0.0.1（只允许本机），或端口没转发。',
            fix: '服务端用 0.0.0.0 监听；README 里写清端口 + 转发方式。'
          }
        ],
        cheat: [
          { cmd: 'ls ~/models/qwen', mean: '模型文件在不在' },
          { cmd: 'nvidia-smi -L', mean: '卡在不在' },
          { cmd: 'du -sh ~/models', mean: '模型多大' },
          { cmd: 'curl 127.0.0.1:端口', mean: '服务通不通' }
        ]
      }
    ],

    gates: [
      {
        id: 'd7-g1',
        title: '模型落盘',
        brief: '用 `hf download` 把 Qwen2.5-0.5B-Instruct 下到 `~/models/qwen`',
        hints: ['`hf download 组织/模型 --local-dir 目录`', '下完 `ls` 看 config.json 在不在'],
        checks: [
          {
            t: 'aiDownload',
            repo: 'Qwen/Qwen2.5-0.5B-Instruct',
            dir: 'models/qwen',
            why: '模型已下载到 ~/models/qwen'
          },
          {
            t: 'file',
            path: '~/models/qwen/config.json',
            contains: 'qwen2',
            why: '模型目录里有 config.json（配置文件落盘了）'
          }
        ]
      },
      {
        id: 'd7-g2',
        title: '演示入口打开了',
        brief: '起一个 Jupyter 会话（端口不限）',
        hints: ['`jupyter lab --no-browser --port 8888`', '服务器环境必须加 --no-browser'],
        checks: [
          { t: 'aiSession', name: 'jupyter', why: 'Jupyter 会话已启动' }
        ]
      },
      {
        id: 'd7-g3',
        title: '交付说明 README',
        brief: '`~/README.md` 至少 4 行，写清怎么跑、模型是哪来的',
        hints: ['`printf "a\\nb\\nc\\nd\\n" > ~/README.md`', '四行：项目 / 运行 / 模型 / 环境'],
        checks: [
          {
            t: 'file',
            path: '~/README.md',
            contains: ['python app.py', 'Qwen'],
            lines: 4,
            why: 'README.md 至少 4 行，且写了运行方式与模型来源'
          }
        ]
      }
    ],

    challenge: {
      id: 'd7-c1',
      title: '闭卷：交付自检一条龙',
      brief: '不许往上翻。做三件事：把 Qwen 模型下到 `~/models/qwen2`；把显存快照写到 `~/work/gpu-final.txt`；' +
        '在 `~/DELIVERY.md` 写至少 2 行，其中要出现 `7860` 和 `Qwen`。',
      hints: ['`hf download 组织/模型 --local-dir 目录`', '`printf` 写多行；显存快照用 --query-gpu'],
      checks: [
        { t: 'aiDownload', repo: 'Qwen/Qwen2.5-0.5B-Instruct', dir: 'models/qwen2', why: '模型下到了 ~/models/qwen2' },
        { t: 'file', path: '~/work/gpu-final.txt', contains: 'MiB', why: 'gpu-final.txt 里是显存快照' },
        { t: 'file', path: '~/DELIVERY.md', contains: ['7860', 'Qwen'], lines: 2, why: 'DELIVERY.md 至少两行且写了端口和模型' }
      ],
      solution: [
        'hf download Qwen/Qwen2.5-0.5B-Instruct --local-dir ~/models/qwen2',
        'nvidia-smi --query-gpu=memory.used --format=csv > ~/work/gpu-final.txt',
        'printf "服务端口：7860\\n模型：Qwen/Qwen2.5-0.5B-Instruct\\n" > ~/DELIVERY.md'
      ]
    },

    /* 结业项目：4 项，全部用真实状态证明（进度记在 Progress.quiz 里，键名 prj-*） */
    project: {
      id: 'd7-p1',
      title: '结业项目：可交付的情感分类 demo',
      brief: '这不是"再学一点"，而是**把你 7 天做的东西拼成一个能交付的包**。每项都要用真实状态证明，' +
        '全部亮起来之后，结业报告里会出现「可交付」标记。',
      items: [
        {
          id: 'prj-d7-1',
          text: '模型落盘：Qwen2.5-0.5B-Instruct 在 ~/models/qwen，且 config.json 存在',
          checks: [
            { t: 'aiDownload', repo: 'Qwen/Qwen2.5-0.5B-Instruct', dir: 'models/qwen', why: '模型已下载到 ~/models/qwen' },
            { t: 'file', path: '~/models/qwen/config.json', contains: 'qwen2', why: 'config.json 落盘' }
          ],
          hint: 'hf download Qwen/Qwen2.5-0.5B-Instruct --local-dir ~/models/qwen'
        },
        {
          id: 'prj-d7-2',
          text: '演示入口：Jupyter 会话在跑（别人能点开）',
          checks: [
            { t: 'aiSession', name: 'jupyter', why: 'Jupyter 会话已启动' }
          ],
          hint: 'jupyter lab --no-browser --port 8888'
        },
        {
          id: 'prj-d7-3',
          text: '一页说明：~/README.md 至少 4 行，含运行方式与模型来源',
          checks: [
            { t: 'file', path: '~/README.md', contains: ['python app.py', 'Qwen'], lines: 4, why: 'README 信息完整' }
          ],
          hint: '四行：项目 / 运行（含端口）/ 模型 / 环境'
        },
        {
          id: 'prj-d7-4',
          text: '运行证据：~/work/gpu.txt 里有服务运行时的显存占用',
          checks: [
            { t: 'file', path: '~/work/gpu.txt', contains: '4823', why: 'gpu.txt 是服务跑起来时的显存快照' }
          ],
          hint: '先 nohup 起服务，再 nvidia-smi --query-gpu 存证（Day 6 做过）'
        }
      ]
    }
  });
})(window);
