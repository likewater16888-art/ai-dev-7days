/* =============================================================================
 * js/data/guide.js
 * -----------------------------------------------------------------------------
 * 「使用说明」页（#/guide）的数据：每个小节都有中英文两套文案。
 *
 *   LX.Guide = { sections: [ { id, icon, title: {zh, en}, body: {zh, en} } ] }
 *
 * body 是极简 Markdown（由 js/app.js 的 mdLite 渲染）：
 *   # 标题 / ## 小标题 / - 列表 / 1. 有序 / ```代码``` / `行内` / **加粗**
 *
 * 这里只写「怎么用这个课程」，不重复课程内容 —— 命令细节都在 js/data/dX.js 里。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  LX.Guide = {
    sections: [
      {
        id: 'what',
        icon: '🎯',
        title: { zh: '这是什么', en: 'What this is' },
        body: {
          zh: [
            '# 7 天，从「不敢敲命令」到「能跑通一个 AI 项目」',
            '',
            '这是一套**动手优先**的 AI 应用开发入门课。每天 40 分钟上下，一共 7 天：',
            '',
            '1. **21 个关卡**：每关都有一个具体终态目标（文件建好了、环境装上了、仓库提交了……），系统只检查结果，怎么敲是你的自由。',
            '2. **7 个闭卷挑战**：当天学完合上笔记自己做，不计入 21 关，但会写进结业报告。',
            '3. **56 道自测题**：每题一句解析，答错自动进错题本。',
            '4. **180 条命令词典**：课程里出现的每个命令、参数、符号都能查到。',
            '5. **1 个结业项目**：所有关卡过了之后，用真实命令逐项证明你能跑通。',
            '',
            '全程在**浏览器里的沙盒终端**运行：不用装任何东西，随便 `rm -rf`，刷新就复原。'
          ].join('\n'),
          en: [
            '# Seven days from "I am scared of the terminal" to "I shipped an AI project"',
            '',
            'A **hands-on first** introduction to AI app development. About 40 minutes a day, seven days:',
            '',
            '1. **21 gates**: each one has a concrete end state (file created, environment installed, commit pushed...). Only the result is checked; how you get there is up to you.',
            '2. **7 closed-book challenges**: close your notes and do them solo. They are not part of the 21 gates, but they do appear in your report.',
            '3. **56 quiz items**: one explanation each, and every wrong answer lands in your mistake book.',
            '4. **A 180-entry command dictionary**: every command, option and symbol used in the course.',
            '5. **One final project**: after all gates pass, prove the whole thing runs with real commands.',
            '',
            'Everything runs in a **sandbox terminal inside your browser**: nothing to install, `rm -rf` whatever you like, refresh to restore it.'
          ].join('\n')
        }
      },
      {
        id: 'layout',
        icon: '🧭',
        title: { zh: '界面怎么用', en: 'How the screen works' },
        body: {
          zh: [
            '## 左边是路线，中间是内容，右下角是终端',
            '',
            '- **顶栏**：圆环是总进度，`x / 21 关` 是关卡数；右侧三个按钮分别是结业报告、主题切换、中英文切换。',
            '- **左侧路线**：7 天按顺序排好，每行显示「已通关 / 几关 / 预计分钟」。点一行就进那一天。窄屏时左上角 ☰ 打开它。',
            '- **中间内容**：讲解 → 逐字拆解的命令卡 → 关卡检查 → 自测。往下滚就是当天的全部任务，不用找菜单。',
            '- **终端**：右下角 ⌨ 按钮打开，也随时按 `~` 键。它永远停在当天那个工作区，切天会自动换场景（换场景会清屏，属于正常现象）。',
            '- **侧栏底部**有「命令词典」和本页入口。',
            '',
            '第一天不知道从哪开始？点路线最上面的 **0 · 开课前 10 分钟**，10 分钟把环境跑通再进 Day 1。'
          ].join('\n'),
          en: [
            '## Route on the left, content in the middle, terminal bottom right',
            '',
            '- **Top bar**: the ring is overall progress, `x / 21 gates` is the gate count; the three buttons on the right open the report, toggle the theme and switch language.',
            '- **Left route**: the seven days in order, each row showing "passed / gates / estimated minutes". Click a row to open that day. On narrow screens the ☰ button at the top-left opens it.',
            '- **Main column**: prose, then command cards broken down token by token, then gate checks, then the quiz. Scroll down and you have the whole day — no menus to hunt for.',
            '- **Terminal**: open it with the ⌨ button in the corner, or press `~` at any time. It always sits in that day workspace; switching days switches the scenario (the screen clears — that is normal).',
            '- **The bottom of the sidebar** has the command dictionary and this page.',
            '',
            'Not sure where to start? Click **0 · 10 min before class** at the top of the route, spend ten minutes there, then open Day 1.'
          ].join('\n')
        }
      },
      {
        id: 'term',
        icon: '⌨️',
        title: { zh: '沙盒终端怎么用', en: 'Using the sandbox terminal' },
        body: {
          zh: [
            '## 一个真的能用的 Linux 假终端',
            '',
            '文件系统完全在你的浏览器内存里：`ls`、`cd`、`cat`、`grep`、`chmod`、`conda`、`pip`、`git`、`nvidia-smi` 都能用，但这些操作**不会碰到你的电脑**。',
            '',
            '- 敲完按 `Enter` 执行；`↑` `↓` 翻历史；`Tab` 补全命令和文件名。',
            '- 终端顶部有一排小按钮：`▁ ▄ █` 三档高度、`A− / A+` 字号、`复制`、`help`、`⟳` 重置工作区、`⛶` 全屏。',
            '- 右上角 `⟳` 只重置当前工作区；页面上的「清空全部进度」会把关卡状态一起清掉，别点错。',
            '- 命令**执行完会自动判分**：不用点任何按钮，关卡状态会自己变。',
            '- 输出太长时按 `Ctrl+L` 清屏（不会清掉文件系统）。',
            '',
            '`help` 里列了全部可用命令；课程里没讲到的命令也可以随便试，改坏了就 `⟳`。'
          ].join('\n'),
          en: [
            '## A fake Linux terminal that actually works',
            '',
            'The filesystem lives entirely in your browser memory: `ls`, `cd`, `cat`, `grep`, `chmod`, `conda`, `pip`, `git`, `nvidia-smi` all work, but **nothing touches your real computer**.',
            '',
            '- Press `Enter` to run; `↑` `↓` walk the history; `Tab` completes command and file names.',
            '- The bar above the output has `▁ ▄ █` height presets, `A− / A+` font size, `copy`, `help`, `⟳` reset workspace and `⛶` full screen.',
            '- The `⟳` button resets only the current workspace. The "reset all progress" link in the sidebar also wipes gate states — do not mix them up.',
            '- Gates are **re-checked after every command**: you never press "check".',
            '- Output too long? `Ctrl+L` clears the screen (it does not touch the filesystem).',
            '',
            'Type `help` for the full command list. Commands the course has not covered yet are fair game too: break something and press `⟳`.'
          ].join('\n')
        }
      },
      {
        id: 'gates',
        icon: '✅',
        title: { zh: '关卡是怎么判分的', en: 'How gates are scored' },
        body: {
          zh: [
            '## 只看结果，不看你敲了什么',
            '',
            '每个关卡下面有一个清单，每一行都是**对当前沙盒终态**的检查（文件在不在、内容对不对、环境装没装、提交有没有）。',
            '',
            '- 每行前面显示 ✅ 或 ⬜，旁边的小字是「现在看到的状态」。',
            '- 全部变绿 = 通关；不用提交，也不用截图。',
            '- 同一道关有多种解法，只要终态对就算过 —— 和真实开发一样。',
            '- 卡住时点「卡住了？」，提示会展开；**展开提示会记录在结业报告里**（诚实优先，但不强求）。',
            '- 闭卷挑战还多一个「看参考答案」，连续失败后才会出现，同样会被记录。',
            '',
            '判分逻辑在 `js/gate.js`，关卡定义在 `js/data/dX.js`。想加关就照着抄一个。'
          ].join('\n'),
          en: [
            '## Only the result counts',
            '',
            'Every gate has a checklist, and each row checks the **current end state** of the sandbox (file present, content correct, environment installed, commit made).',
            '',
            '- Each row shows ✅ or ⬜; the small text next to it is what the check currently sees.',
            '- All rows green = gate passed. Nothing to submit, no screenshots.',
            '- One gate can be solved many ways — any end state that satisfies the checks passes, exactly like real development.',
            '- Stuck? Click "Stuck?" to expand a hint. **Expanding a hint is recorded in your report** (honesty first, but it is not forbidden).',
            '- Closed-book challenges also offer a reference answer, unlocked after repeated failures — recorded too.',
            '',
            'The scoring engine is `js/gate.js`; gate definitions live in `js/data/dX.js`. Copy one to add your own.'
          ].join('\n')
        }
      },
      {
        id: 'quiz',
        icon: '🧠',
        title: { zh: '自测与错题本', en: 'Quiz and mistake book' },
        body: {
          zh: [
            '## 一天学完，5 分钟自测',
            '',
            '每天末尾有 8 道单选题，覆盖当天最容易混的点：',
            '',
            '- 点选项立刻判对错，并给一句解释（比「错了」有用）。',
            '- 答错的题进**错题本**，结业报告里能看到题干和解析。',
            '- 答错可以点「再试一次」重做那道题；重做对了，错题本里就消失。',
            '- 顶部显示「答对 x / y」，进度存在本机浏览器里，刷新不丢。',
            '',
            '自测和关卡是两条独立证据：关卡证明「你跑通了」，自测证明「你知道为什么」。两样都绿，报告里的能力项才算 ✅。'
          ].join('\n'),
          en: [
            '## Five minutes at the end of each day',
            '',
            'Every day ends with eight single-choice questions covering the parts people mix up:',
            '',
            '- Choosing an option answers it immediately and shows a one-line explanation (more useful than just "wrong").',
            '- Wrong answers go into the **mistake book**, and the report shows the question plus the explanation.',
            '- A wrong answer can be retried with "Try again"; get it right and it leaves the mistake book.',
            '- The header shows "correct x / y". Progress is stored in this browser, so refreshing does not lose it.',
            '',
            'Gates and the quiz are two separate kinds of evidence: a gate proves **it runs**, the quiz proves **you know why**. A skill only shows ✅ in the report when both are green.'
          ].join('\n')
        }
      },
      {
        id: 'dict',
        icon: '📖',
        title: { zh: '命令词典与逐字拆解', en: 'Dictionary and token breakdown' },
        body: {
          zh: [
            '## 看不懂某个词？先查，别硬猜',
            '',
            '- 命令卡里每个零件都能点：点 `tar`、`-xzvf`、`>`、`~/.bashrc` 都会打开词典抽屉，直接定位到那一条。',
            '- 侧栏的「📖 命令词典」（或 `#/dict`）是整本词典：可以搜索、按分组翻。',
            '- 每条词条给「读法 + 意思 + 例子 + 常见坑」；报错类词条多一句「怎么读 / 怎么修」。',
            '',
            '一个经验：90% 的「这条命令看不懂」其实是某个**参数**或**符号**没被解释。先查那个零件，比从头读一遍教程快得多。'
          ].join('\n'),
          en: [
            '## Cannot read a word? Look it up instead of guessing',
            '',
            '- Every token in a command card is clickable: click `tar`, `-xzvf`, `>` or `~/.bashrc` and the dictionary drawer opens on that entry.',
            '- The "📖 Command dictionary" link in the sidebar (or `#/dict`) is the whole dictionary: searchable, grouped by kind.',
            '- Each entry has how to read it, what it means, an example and common traps; error entries add how to read and how to fix.',
            '',
            'Rule of thumb: most "this command makes no sense" moments are one unexplained **option** or **symbol**. Look up that token first — it is faster than re-reading the tutorial.'
          ].join('\n')
        }
      },
      {
        id: 'report',
        icon: '🏁',
        title: { zh: '结业报告与结业项目', en: 'Report and final project' },
        body: {
          zh: [
            '## 顶栏「结业报告」里有什么',
            '',
            '- 称号 + 四个数字：关卡 / 自测 / 闭卷 / 能力。',
            '- 7 天逐天列出每一关的状态（绿点 = 通过），鼠标停在点上能看到关卡名。',
            '- 能力矩阵：11 项能力，每项都有「关卡 x/y · 自测 a/b」的硬证据。',
            '- 错题本、验证次数（验证 N 次 · 通过 / 未通过）、下一步该做哪一关。',
            '- 底部可以填名字，然后「复制 Markdown」或「下载 .md」—— 直接贴进简历或周报。',
            '',
            'Day 7 还有一个**结业项目**：所有关卡过了之后，用真实命令逐项证明（跑通服务、看到端口、显存占住……）。项目全绿，称号才会升到「可交付」。'
          ].join('\n'),
          en: [
            '## What the report contains',
            '',
            '- A title plus four numbers: gates / quiz / closed-book / skills.',
            '- All seven days listed gate by gate (green dot = passed); hover a dot to see the gate name.',
            '- A skill matrix: eleven skills, each with hard evidence in the form of "gates x/y · quiz a/b".',
            '- The mistake book, the number of checks (checks · passed / failed) and which gate to do next.',
            '- At the bottom you can type your name, then "Copy Markdown" or "Download .md" — paste it into a CV or a weekly update.',
            '',
            'Day 7 also has a **final project**: once every gate passes, prove each item with real commands (service running, port open, VRAM in use...). Only a fully green project lifts the title to "deliverable".'
          ].join('\n')
        }
      },
      {
        id: 'lang',
        icon: '🌐',
        title: { zh: '中英文界面切换', en: 'Switching between Chinese and English' },
        body: {
          zh: [
            '## 顶栏右侧的 `EN` 按钮',
            '',
            '点一下切到英文界面，按钮变成 `中`，再点切回来；选择会记在本机浏览器里，下次打开还是这个语言。',
            '',
            '**会跟着变的**：按钮、侧栏、关卡清单标题、自测题头、报告和 Markdown、命令词典的分组名、7 天的标题与目标、关卡与项目的一句话目标。',
            '',
            '**保持中文的**：讲解正文、逐字拆解、自测题干与选项、终端里的模拟输出。课程正文是中文写的，机器翻译会把「教人看懂命令」这件事做坏 —— 所以英文界面会在当天页顶部显示一条说明条，提醒你这部分仍是中文。',
            '',
            '想要完全中文体验，按回 `中` 即可，一切立即复原。'
          ].join('\n'),
          en: [
            '## The `EN` button at the right of the top bar',
            '',
            'Click it to switch to the English interface; the button becomes `中`, and clicking again switches back. The choice is stored in this browser and reused next time.',
            '',
            '**What changes**: buttons, the sidebar, gate checklist headings, quiz headers, the report and its Markdown, dictionary group names, the seven day titles and goals, and the one-line goal of each gate and project.',
            '',
            '**What stays Chinese**: lesson prose, token breakdowns, quiz questions and options, and the simulated terminal output. The course was written in Chinese, and machine translation would ruin the very thing it teaches — so the English interface shows a note at the top of each day page.',
            '',
            'Want a fully Chinese experience? Press `中` and everything switches back immediately.'
          ].join('\n')
        }
      },
      {
        id: 'keys',
        icon: '⌨',
        title: { zh: '快捷键', en: 'Keyboard shortcuts' },
        body: {
          zh: [
            '## 少用鼠标，多用键盘',
            '',
            '- `~` 或 `` ` ``：打开 / 收起沙盒终端（在输入框里打字时不会触发）。',
            '- `Ctrl+Shift+F`：终端全屏 / 退出全屏。',
            '- `Esc`：依次关掉最上面的一层 —— 报告弹层 → 手机侧栏 → 词典抽屉 → 终端全屏 → 终端。',
            '- 终端里：`Enter` 执行、`↑` `↓` 历史、`Tab` 补全、`Ctrl+L` 清屏、`Ctrl+C` 打断当前输入。',
            '- 页面左侧路线：手机上点 ☰ 打开，点任意一天就自动收起。'
          ].join('\n'),
          en: [
            '## Fewer mouse trips',
            '',
            '- `~` or `` ` ``: open or collapse the sandbox terminal (ignored while you are typing in a field).',
            '- `Ctrl+Shift+F`: full screen for the terminal, press again to leave it.',
            '- `Esc`: closes the topmost layer in order — report modal → mobile sidebar → dictionary drawer → terminal full screen → terminal.',
            '- Inside the terminal: `Enter` runs, `↑` `↓` history, `Tab` completion, `Ctrl+L` clear screen, `Ctrl+C` abort the current input.',
            '- On phones, open the route with ☰; picking a day closes it automatically.'
          ].join('\n')
        }
      },
      {
        id: 'faq',
        icon: '🩺',
        title: { zh: '常见问题', en: 'FAQ' },
        body: {
          zh: [
            '## 卡住的时候先看这几条',
            '',
            '**关卡一直不绿？** 看清单每行后面的小字，它写的是「现在看到的状态」——多数情况是文件名差一个字母、路径不对、或者改完没保存（沙盒里要用 `>` 或编辑器命令写文件，`cat` 只是看）。',
            '',
            '**终端里的东西没了？** 换天会换工作区，换工作区会清屏；按 `↑` 能翻回历史命令。想恢复某个工作区的初始文件，点终端上的 `⟳`。',
            '',
            '**进度想重来？** 侧栏底部「清空全部进度」会清掉关卡状态、已读标记和沙盒工作区；只想重来某个工作区就用 `⟳`。',
            '',
            '**换电脑 / 换浏览器？** 进度存在浏览器 localStorage 里，不会跟着走；结业报告可以「下载 .md」带走。',
            '',
            '**英文界面里为什么还有中文？** 这是刻意的，见上面「中英文界面切换」一节。'
          ].join('\n'),
          en: [
            '## When you get stuck, read these first',
            '',
            '**A gate never turns green?** Read the small text after each row — that is what the check currently sees. Usually a filename is one letter off, a path is wrong, or the change was never written (in the sandbox use `>` or an editor command; `cat` only reads).',
            '',
            '**The terminal content disappeared?** Switching days switches workspaces, and switching workspaces clears the screen; press `↑` to walk back through history. To restore a workspace initial files, press `⟳` in the terminal.',
            '',
            '**Want a clean slate?** "Reset all progress" at the bottom of the sidebar clears gate states, read marks and sandbox workspaces. To reset only one workspace, use `⟳`.',
            '',
            '**Changed computer or browser?** Progress lives in this browser localStorage and does not travel; download the report as `.md` to take it with you.',
            '',
            '**Why is there still Chinese in the English interface?** That is deliberate — see "Switching between Chinese and English" above.'
          ].join('\n')
        }
      }
    ]
  };
})(window);
