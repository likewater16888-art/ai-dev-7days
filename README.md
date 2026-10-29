# AI 应用开发 7 天 · 沙盒实训

> **在线访问：** https://likewater16888-art.github.io/ai-dev-7days/

> 纯静态、零安装的 7 天互动课程：**21 个自动判分关卡 + 7 个闭卷挑战 + 56 道自测题 + 180 条命令词典 + 一个跑在浏览器里的 AI 沙盒终端**。
> 双击 `index.html` 就能开始 —— 不用装 WSL、不用有显卡、也不用担心把机器搞坏。

## 1. 它解决什么问题

学 AI 应用开发的第一个卡点几乎从来不是模型，而是**环境**：conda 装崩了、pip 冲突了、显存不够、
服务起了但不知道有没有真在跑。于是很多人停在 `pip install` 那一步就再也没往下走。

这个站点把「环境」这件事做成可以随便试错的练习场：

- 命令是**真的在跑**（前端实现的沙盒内核：文件系统、管道、权限、git、conda/pip、nvidia-smi、hf、jupyter）；
- 但一切都发生在**浏览器内存里**，`rm -rf` 也不会伤到任何东西，刷新或点 `⟳` 就复原；
- 每一关都是**自动判分**的 —— 命令敲完它就亮，不用点「检查」，也不检查你用了哪条命令，只看结果；
- 看懂了才算过关：**逐字拆解**每个零件、**错误诊所**告诉你报错怎么读、**闭卷挑战**验证你能不能不看书做出来。

## 2. 你会练到的命令

沙盒一共内置 **99 个命令**（终端里敲 `help` 看全表，`man 命令` 看单个说明）。课程里高频出现的这些都能跑：

```bash
pwd  ls  cd  mkdir  touch  cp  mv  rm  cat  echo  printf  head  tail  wc  grep  find
chmod  ln  tree  sort  uniq  cut  tee  sed  awk  diff  tar  ps  kill  pkill  pgrep  nohup
env  export  source  bash  history
conda create/activate/install/env list/env export    pip install/list/freeze
python  python3        git init/status/add/commit/log/diff
nvidia-smi   hf download   jupyter lab
```

## 3. 快速开始

**方式一（最省事）**：直接双击 `index.html`。

**方式二（推荐，行为和线上一致）**：

```powershell
python -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

没有任何构建步骤、没有 npm、没有后端，也不发网络请求（模型、显存、日志全是本地模拟）。

## 4. 7 天路线

| 天 | 主题 | 你要交出的东西 | 工作区 | 时长 | 关卡 |
| --- | --- | --- | --- | --- | --- |
| 预备 | 开课前 10 分钟（`#/start`） | 会读提示符、会 `pwd`/`ls`/`cd`/`cat` | `ai-lab` | 10 min | — |
| Day 1 | 项目地基：先认路，再造房 | `~/work/exp1` 三层骨架 + README + 依赖清单 | `ai-lab` | 50 min | 3 |
| Day 2 | 把数据读明白 | 数据副本 + `data/health.md` + `data/labels.md` | `ai-lab` | 50 min | 3 |
| Day 3 | 跑起来，看懂输出 | `logs/env.md` + `logs/error.txt`（带行号）+ `logs/d3-note.md` | `ai-lab` | 55 min | 3 |
| Day 4 | 一个项目一个环境 | `ai7` 环境 + torch 2.4.1 + `environment.yml` + `requirements.lock.txt` | `ai-env` | 55 min | 3 |
| Day 5 | 用 Git 存档 | 两次提交 + 能看懂的 commit message + 干净工作区 | `ai-repo` | 50 min | 3 |
| Day 6 | 跑起来 · 看得见 · 杀得掉 | 后台 gradio + `~/work/gpu.txt`（4823 MiB）+ `~/work/troubleshoot.md` | `ai-gpu` | 55 min | 3 |
| Day 7 | 交付：模型、入口、一页说明 | `~/models/qwen/` + jupyter 入口 + 四行 `~/README.md` + **结业项目 4 项** | `ai-gpu` | 55 min | 3 |

每天的关卡标题（判分点）：

| 天 | 关卡 1 | 关卡 2 | 关卡 3 |
| --- | --- | --- | --- |
| Day 1 | 工作区三层骨架 | 项目说明卡 | 依赖清单跟着项目走 |
| Day 2 | 数据副本就位 | 数据体检报告 | 标签字典一起带走 |
| Day 3 | 环境快照存证 | ERROR 的证据（带行号） | 排障结论三行 |
| Day 4 | ai7 环境建好 | ai7 里装上了 torch | 环境可复现 |
| Day 5 | 至少两次提交 | 提交信息能看懂 | 工作区干净 |
| Day 6 | 服务真的起来了 | 显存快照存证 | 排障笔记 |
| Day 7 | 模型落盘 | 演示入口打开了 | 交付说明 README |

> 7 天合计：**21 个关卡 + 7 个闭卷挑战 + 56 道自测题 + 104 条示例命令**，每条命令都能点 `▶ 运行` 送进终端，
> 每个零件（命令 / 参数 / 符号）都有当场解释，并可以点开查词典。

## 5. 一天是怎么组织的

每页从上到下是同一个结构：

1. **导语** —— 今天练什么、为什么值得练；
2. **5 个小节** —— 每节四块内容：
   - **讲解**：这一段为什么这么干（不是"照着敲"）；
   - **逐字拆解**：一行命令拆成「命令 / 参数 / 路径 / 符号」，每个零件一句人话解释，点零件还能查词典；
   - **🩺 常见错误诊所**：这一节最容易报的错 + 怎么读 + 怎么修；
   - **📋 本节小抄**：复习只看这张表；
3. **3 个关卡** —— 每关列出「检查项」，全部满足就自动变绿；
4. **🔒 闭卷挑战** —— 不看上面、独立完成一次迁移任务；提示默认折叠（展开会记录），参考答案也在折叠里；
5. **自测 8 题** —— 选一个答案立刻判对错并给解释，答错的题进错题本；
6. **上下天导航** —— 学完当天会浮出「进入 Day N+1 →」的横幅。

Day 7 底部还有一个 **🏁 结业项目（4 项）**，每项都用真实状态自动判分（不是自己打勾）。

页面顶部是总进度环 + 通关天数；左侧是 7 天路线（每关一个小圆点，绿了就是过了），最下面常驻
「0 · 开课前 10 分钟」和「📖 命令词典」两个入口。

## 6. 关卡是怎么判分的

`js/gate.js` 只对**沙盒的最终状态**做断言，不看你敲了什么。所以用 `cat >` 还是 `printf >`、
用 `cp` 还是 `cp -r`，只要结果对，一样算过。

支持 14 种检查类型（断言里的类型字段叫 `t`，可用值见 `LX.Gate.types`）：

| `t` | 判什么 | 关键字段 |
| --- | --- | --- |
| `dir` | 目录存在 | `path` |
| `file` | 文件存在，可要求正文包含某段文本 | `path`、`contains` |
| `absent` | 路径不存在（该删的删干净了） | `path` |
| `exec` | 文件有 x 权限 | `path` |
| `mode` | 权限位精确匹配（如 `755`） | `path`、`expect` |
| `link` | 是软链接 | `path` |
| `aiEnv` | conda 环境存在（可校验 python 版本前缀） | `name`、`py` |
| `aiActive` | 当前激活的是哪个环境 | `name` |
| `aiPkg` | 某个环境里装了某包（可校验版本） | `env`、`name`、`version` |
| `aiRepo` | git 仓库：提交数 / 提交信息关键词 / 分支 / 远端 / 工作区干净 | `path`、`commits`、`message`、`branch`、`remote`、`clean` |
| `aiDownload` | 有下载记录（`hf download`），可按仓库名或目标目录筛 | `repo`、`dir` |
| `aiSession` | 某服务在跑 | `name`（`gradio` / `jupyter`） |
| `aiGpu` | 显存占用 ≥ N MiB | `minMB` |
| `custom` | 自定义函数（返回 `true` 或 `{ok, got}`） | `fn` |

判定时机有两条：

- **自动**：`js/term.js` 每执行完一条命令就 `fireRun()`，`js/app.js` 的 `refreshGates()` 重算当前页所有关卡 —— 这是主要路径；
- **手动**：关卡卡上的「检查这一关」按钮，用于「我改的是文件内容、但没敲命令」的场景，同时把这次结果计入历史。

失败时每项下面会给出**具体原因**（缺哪个路径、文件里有几行、显存实际多少），提示区还有 2~3 条阶梯式提示。

**闭卷挑战不算在 21 关里**（它的 id 是 `dN-c1`，单独统计），因为它的定位不同：
关卡证明"东西做出来了"，闭卷挑战证明"不看教程也能做出来"。它的 3 条检查**故意包含课程里没做过的产出物**
（比如 Day 1 要求再造一个 `exp2`），所以光看课程不会自动通关；`tools/check-course.js` 会同时验证
「课程跑完时它不通过」和「参考答案能通过」这两件事。

## 7. 沙盒终端

右下角 `⌨` 或按 `~` 打开。四个工作区各自独立、各自缓存，切到别的天再切回来，之前做的文件还在：

| 工作区 | 中文名 | 用在哪 | 预置内容 |
| --- | --- | --- | --- |
| `ai-lab` | AI 实验区（Day1-3） | Day 1–3 | `~/train.csv`、`~/data/{train.csv,labels.txt}`、`requirements.txt`、`app.py`、`check_env.py`、`logs/app.log` |
| `ai-env` | Python 环境（Day4） | Day 4 | 已装 conda，`base` 里没有 torch |
| `ai-repo` | Git 仓库（Day5） | Day 5 | `~/tiny-cls`：1 次 init 提交 + 未跟踪的 `model.py` |
| `ai-gpu` | 运行与排障（Day6-7） | Day 6–7 | `~/app.py`（gradio）、`~/run.log`、模拟 8 GB RTX 3060 |

这些命令是真的在解析执行：`conda create/activate/install`、`pip install/list/freeze`、`git init/status/add/commit/log`、
`nvidia-smi`、`hf download`、`jupyter lab`、`nohup`/`pkill`、管道与重定向 —— 连 `grep` 无匹配返回 1、
`git status` 显示未跟踪文件这些细节也对得上真机。

**为什么要有它**：真实环境里 `rm -rf` 是不可撤销的，`pip install` 会改全局状态，新手不敢试。这里全部发生在内存里，
`⟳` 一键重置当前工作区，刷新页面等于全部复原。

### 面板也能调：拖动 / 全屏 / 字号 / 复制

新手最常抱怨的是"终端太小，看不全输出"。所以面板本身是可调的：

| 操作 | 做法 |
| --- | --- |
| 改高度 | 拖动面板**顶部横条**（鼠标或手指都行） |
| 改宽高 | 拖动**左上角**的角标 |
| 三档快捷高度 | 标题栏的 `▁` `▄` `█` |
| 全屏 / 退出 | 标题栏 `⛶`、双击标题栏、或 `Ctrl+Shift+F` |
| 字号 | 标题栏 `A−` / `A+`（11–20px） |
| 存证 | 标题栏「复制」= 把整屏输出复制成纯文本（贴给 AI 排障最有用） |

尺寸、字号、是否全屏都会记在 `ai7_settings_v1` 的 `term` 字段里，刷新后还在。
`Esc` 的优先级也考虑了这个：**先退出全屏**，再收起终端（在输入框里按 `Esc` 同样只退全屏）。

### 键盘与快捷键

| 位置 | 键 | 作用 |
| --- | --- | --- |
| 全局 | `~` / `` ` `` | 开 / 关终端（自动切到当天的工作区） |
| 全局 | `Esc` | 关报告弹层 → 收起侧栏 → 收起终端（依次关最上层；焦点在终端输入框时不收起终端） |
| 终端 | `↑` `↓` | 翻历史命令 |
| 终端 | `Tab` | 补全命令与路径 |
| 终端 | `Ctrl+L` | 清屏 |
| 终端 | `Ctrl+C` | 取消当前输入 |

## 8. 命令词典与「逐字拆解」

初学者真正卡住的地方，往往不是"命令做什么"，而是**参数和符号是什么**。所以有两层设计：

1. **课内拆解**：每条命令下面都有「逐字拆解」，把一行拆成 3–6 个零件，逐个解释，并给一个「你应该看到」和「常见坑」；
2. **全站词典**：`js/data/glossary.js` 里 **180+ 条**词条，分 6 组：

| 分组 | 内容 | 例子 |
| --- | --- | --- |
| 命令 | `ls` `grep` `du` `nohup` `git commit` … | 一句话含义 + 例子 + 哪天用到 |
| 参数 | `-l` `-p` `-L` `-rf` `--oneline` … | 同一个字母在不同命令里的不同含义 |
| 符号 | `~` `>` `>>` `|` `2>&1` `$?` … | 最容易"看天书"的部分 |
| 概念 | 绝对路径 / 退出码 / 标准错误 / 可复现 / 显存 … | 看不见但必须懂 |
| AI 工具链 | `conda` `pip` `hf download` `nvidia-smi` `jupyter` … | 子命令与参数拆解 |
| 报错 | `command not found`、`No such file`、`CUDA out of memory` … | 怎么读 + 怎么修 |

三种打开方式：点课程里的任意 token、点小抄里的命令、或者左侧「📖 命令词典」（`#/dict`，可搜索 + 按分组浏览）。

**所有课程命令名都能在词典里查到** —— 这条规则写进了自检脚本：新加命令时如果忘了解释，`check-course.js` 会直接报错。

## 9. 自测 · 闭卷挑战 · 能力矩阵

这三样是"我真会了吗"的验证层：

- **自测 56 题**（每天 8 题）：答对立刻变绿并给解释；答错进**错题本**，同一题再答对就移出。
  题目不是背命令，而是问"这行为什么报错""输出 6 行说明几条样本"这类判断题；
- **闭卷挑战 7 个**：迁移任务（再造一个实验目录 / 统计并存证 / 保留提示记录），提示与参考答案都默认折叠；
- **能力矩阵 11 项**：`js/data/skills.js` 把「关卡 + 自测题」映射成岗位能力（目录导航 / 数据体检 / 环境可复现 /
  版本管理 / GPU 观测 / 交付文档 …），每项三态：✅ 已证明（关卡全过 + 自测答对）、🟡 部分、⬜ 没证据；
- **结业项目 4 项**（Day 7）：模型落盘 / 入口可点 / 说明完整 / 有运行证据，全部自动判分。

这些都会进结业报告（见下），所以报告不只是一句"学完 7 天"，而是**能被追问的成绩单**。

## 10. 进度与结业报告

- 进度全部存在 `localStorage`：`ai7_progress_v1`（每关通过/未通过次数与最后一次时间、已读小节、自测答题记录、提示使用、最后访问的一天）、`ai7_settings_v1`（主题、姓名、终端尺寸）；
- **不上传任何数据**，也没有账号系统；
- 顶部「结业报告」汇总成一份 Markdown：姓名 + 生成时间 + 四格数字（关卡 / 自测 / 闭卷 / 能力）+ 验证次数
  + 每关 ✅/⬜ 与通过次数 + 每天的自测正确率 + 闭卷挑战状态 + **能力矩阵** + 结业项目清单 + **错题本** + 下一步建议
  + 按通过比例给的头衔（`可交付 · 7 天毕业` / `7 天毕业` / `能独立跑通` / `有真东西` / `刚上路`），
  可一键「复制 Markdown」或「下载 .md」；
- 侧栏底部「清空全部进度」清掉 `ai7_progress_v1`，沙盒工作区不受影响（那是内存里的）。

## 11. 目录结构

```text
day7-fast-open the door/
├─ index.html               # 唯一页面：骨架 + 脚本加载顺序
├─ css/
│  ├─ theme.css             # 设计变量（深 / 浅两套）
│  └─ app.css               # 布局与组件样式（含终端面板 / 命令卡 / 词典 / 自测）
├─ js/
│  ├─ util.js               # DOM / 存储 / 格式化小工具
│  ├─ sandbox.js            # 沙盒内核：虚拟文件系统 + 命令解析 + 管道重定向
│  ├─ sandbox-ai.js         # AI 命令包：conda / pip / python / git / nvidia-smi / hf / jupyter + 4 个场景
│  ├─ day.js                # 课程数据注册表：add / all / get / normLesson（含 steps 归一化）
│  ├─ gate.js               # 关卡判分引擎：14 种断言 + 失败原因
│  ├─ progress.js           # 进度与设置（关卡 / 小节 / 自测 / 提示 / 终端尺寸）
│  ├─ report.js             # 结业报告（四格数字 + 能力矩阵 + 错题本 + Markdown）
│  ├─ term.js               # 终端面板：输入、历史、补全、拖动/全屏/字号、onRun 钩子
│  ├─ dict.js               # 命令词典界面：侧滑抽屉 + #/dict 独立页
│  ├─ quiz.js               # 自测题引擎：判分、解释、错题本
│  ├─ app.js                # 界面：路由、渲染、命令卡、关卡、挑战、项目、快捷键
│  └─ data/
│     ├─ d0.js              # 预备课（#/start，不计关卡）
│     ├─ d1.js … d7.js      # 每天的内容：导语 / 5 小节（讲解+拆解+诊所+小抄）/ 3 关 / 闭卷挑战
│     ├─ d7.js              # 另外还带「结业项目」4 项
│     ├─ glossary.js        # 命令词典数据（180+ 条，6 组）
│     ├─ skills.js          # 能力矩阵（11 项，映射关卡 + 自测题）
│     └─ quiz/
│        └─ d1.js … d7.js   # 每天 8 道自测题（含解释与能力标签）
├─ tools/                    # 自检脚本（Node 直接跑，无依赖）
│  ├─ check-course.js        # 结构 / 内容深度 / 全流程通关 / 挑战可解性 / 项目 / 报告
│  └─ check-ui.js            # 迷你 DOM 下的界面冒烟测试（路由 / 运行 / 词典 / 自测 / 报告 / 重置）
├─ deploy.ps1               # 一键发布到 GitHub Pages
├─ publish.config.json      # 发布契约（仓库名 / 包含哪些文件 / 校验地址）
└─ PUBLISH.md               # 发布执行说明
```

脚本加载顺序有依赖：
`util → sandbox → sandbox-ai → day → gate → progress → report → term → data/d1…d7 → data/d0 → data/glossary → data/skills → data/quiz/d1…d7 → dict → quiz → app`。

## 12. 改课程 / 加一天

一天就是一个 `LX.Days.add({...})` 对象，放在 `js/data/dN.js` 里：

```js
LX.Days.add({
  id: 'd8',
  label: 'Day 8',
  title: '上线',
  goal: '一句话说明今天能做成什么',
  scenario: 'ai-gpu',        // 必须是 sandbox-ai.js 里注册过的工作区
  minutes: 45,
  intro: '导语文案（支持 **粗体**、`行内代码`、```bash 代码块```）',
  lessons: [
    {
      title: '小节标题',
      body: '讲解（为什么这么干）',
      steps: [
        {
          line: 'nvidia-smi --query-gpu=memory.used --format=csv',
          say: '看一眼显存用了多少',
          tokens: [
            { t: 'nvidia-smi', k: 'cmd', ref: 'nvidia-smi', m: 'NVIDIA 管理工具' },
            { t: '--query-gpu=memory.used', k: 'flag', ref: 'nvidia-smi', m: '只查已用显存' },
            { t: '--format=csv', k: 'flag', ref: 'nvidia-smi', m: '输出成 CSV，方便存证' }
          ],
          expect: '表头 + 一行数字',
          watch: ['MiB'],
          gotcha: ['先起服务再查，否则是 0']
        }
      ],
      clinic: [{ err: 'nvidia-smi: command not found', read: '没装驱动工具', fix: '确认是不是 CPU 机器' }],
      cheat: [{ cmd: 'nvidia-smi -L', mean: '有几张卡' }]
    }
  ],
  gates: [
    {
      id: 'd8-g1',
      title: '产出物就位',
      brief: '一句话说清这关要什么',
      checks: [
        { t: 'file', path: '~/work/plan.md', contains: '回滚', why: 'plan.md 里写了回滚方案' },
        { t: 'aiGpu', minMB: 1000, why: '显存被占住' }
      ],
      hints: ['先看 ls ~/work', '用 printf 写文件']
    }
  ],
  /* 可选：闭卷挑战（不计入 21 关，solution 用于自检证明"可解"） */
  challenge: {
    id: 'd8-c1',
    title: '闭卷：独立写一份上线计划',
    brief: '不看上面，写出 plan.md（含回滚）并保证显存被占',
    hints: ['printf 写多行'],
    checks: [{ t: 'file', path: '~/work/plan.md', contains: '回滚', why: '有回滚方案' }],
    solution: ['printf "回滚：kill 进程并重启上一版\\n" > ~/work/plan.md']
  }
});
```

四条约定（自检脚本会强制）：

1. **`id` 全局唯一**，关卡用 `dN-gM`、挑战用 `dN-c1`、项目用 `prj-*`；
2. 每节 **至少 2 条错误诊所 + 3 行小抄**，每条命令 **≤ 7 条**；
3. 每个 token 必须有解释 `m`，且 `ref`（如果写了）能在词典里查到；命令名本身也要在词典里；
4. 小节里的命令必须**在沙盒里真的能跑通**；新增数据文件记得在 `index.html` 里补 `<script>`（顺序见上）。

改完跑一遍自检（见下），它会按小节顺序把命令全部执行一遍，再逐关判分。

## 13. 自检脚本

两个脚本都只用 Node 内置模块，不用装依赖、不用开浏览器：

```powershell
node tools/check-course.js   # 课程内容 + 判分逻辑 + 深度门槛
node tools/check-ui.js       # 界面层冒烟测试
```

`check-course.js` 做五件事：

1. **结构校验**：7 天 / 21 关 / id 唯一 / `scenario` 已注册 / 每条 gate 的检查类型合法且带 `why`；
2. **内容深度**（硬门槛）：每节 ≥1 条命令卡、≤7 条命令、≥2 条诊所、≥3 行小抄；每个 token 有解释且 `ref` 可查；
   命令名都能在词典里查到；每天 ≥8 道自测题且每题有解释与能力标签；词典 ≥120 条、能力项全覆盖；
3. **全流程模拟**：按小节顺序执行所有示例命令（同一工作区复用一个引擎），然后逐关 `LX.Gate.evaluate()`；
4. **闭卷挑战可解性**：课程跑完时挑战必须**不通过**，执行 `solution` 后必须**通过**（既防"白送"也防"做不到"）；
5. **结业项目 + 报告**：跑完 7 天后项目 4 项全满足；把真实结果写进进度后，报告能算出 21/21、自测全对、
   能力全部 proven，Markdown 里包含能力矩阵 / 闭卷挑战 / 自测正确率。

正常输出结尾是：

```text
结构：7 天 / 21 关 / 104 条示例命令
深度：104 条命令卡 / 314 个 token / 56 道题 / 182 条词典 / 11 项能力

PASS：313 通过 / 0 失败
```

`check-ui.js` 用一套迷你 DOM 顶替浏览器，按 `index.html` 里的顺序加载全部脚本，然后断言 74 项：
首屏 5 小节 + 3 张关卡卡 + 1 张闭卷挑战卡、点 `▶ 运行` 真的把命令送进了当天的工作区、跑完一天的示例命令后三关自动变绿、
切天时终端跟着换工作区、`~` / `Esc` / 主题切换、命令卡与 token 渲染、点 token 打开词典抽屉、`#/dict` 搜索收窄、
自测答对计入进度 / 答错进错题本、终端 `setSize` / 全屏 / Esc 先退全屏 / 字号持久化、`#/start` 预备课、
报告四宫格 + 能力矩阵、`⟳` 与「清空全部进度」的效果。正常输出结尾是：

```text
SMOKE PASS：74 通过 / 0 失败
```

两个脚本都用退出码表示结果（0 = 全通过），可以直接挂到 CI 上。

## 14. 已知限制（写课程时请避开）

- **`python` 是教学级解释器**：只认 `print(...)` 和 `torch.__version__` / `cuda.is_available()` 这类常见符号，不执行真实业务逻辑；`import torch; print(...)` 这种链式写法不会按预期工作，课程里统一拆成两条命令；
- **GPU 是模拟的**：固定 8192 MiB 的 RTX 3060，`pkill` 之后 `nvidia-smi` 的显存数字不会回落（课程据此只判「有快照」和「有启动记录」，不判「杀干净后为 0」）；
- **`grep` 无匹配返回 1**，和真机一致，所以自检脚本允许 grep 类命令退出码为 1；
- 没有网络：`pip install` 只从本地包索引里装 `requirements.txt` 里列的包，`hf download` 是假的下载；
- 不支持的 shell 特性：`$(...)` 命令替换、`&&` 之外的复杂控制流、数组、`for` 循环等。

## 15. 发布

```powershell
.\deploy.ps1                 # 建仓库 / 推送 / 开 Pages / 验证 200
.\deploy.ps1 -DryRun         # 只看会做什么
```

如果提示 **「在此系统上禁止运行脚本」**（Windows 默认执行策略是 Restricted），这样跑：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy.ps1
```

日常小改也可以不用脚本（地址永远不变，Pages 会自动重建）：

```powershell
git add -A; git commit -m "update: xxx"; git push
```

仓库名、包含/排除规则、验证地址都在 `publish.config.json`；完整流程与排障见 `PUBLISH.md`。
纯静态站点，`_*` 开头的调试文件与 `*.out` 不会进仓库（见 `.gitignore`）。

## 16. 隐私

站点不加载任何第三方脚本、不发任何请求、没有埋点。姓名和进度只写在本机浏览器的 `localStorage` 里，
换浏览器 / 清缓存就等于重置。

