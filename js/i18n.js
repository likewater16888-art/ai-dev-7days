/* =============================================================================
 * js/i18n.js
 * -----------------------------------------------------------------------------
 * 界面中英文切换（UI 文案层）
 *
 *   LX.I18N.t('gate.pass')                  取当前语言的文案
 *   LX.I18N.t('quiz.head', { n: 8 })        带占位符的文案
 *   LX.I18N.setLang('en') / toggle()        切语言（存进 localStorage 设置）
 *   LX.I18N.onChange(fn)                    语言变了要重渲染的模块订阅这里
 *   LX.I18N.init()                          app boot 时调用：读设置 + 首次应用
 *
 * 三条约定：
 *   1. 这里只放**界面文案**（按钮、表头、提示语）。课程正文（讲解、逐字拆解、关卡说明、
 *      自测题、命令词典）的英文在 js/data/en/*.js，由下面的 applyContent() 按「位置」
 *      整篇替换；两边都不覆盖对方。
 *   2. 默认语言是 zh，且 zh 文案必须和改造前一字不差 —— 检查脚本依赖这些字符串。
 *   3. 无依赖：只用到 LX.util，脚本顺序见 index.html（util.js 之后）。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  /* ---------------------------------------------------------------------------
   * 词典。key 用「模块.字段」命名；带 {xxx} 的是占位符，由 t(key, vars) 替换。
   * ------------------------------------------------------------------------ */

  var STR = { zh: {}, en: {} };

  /* ============================== 中文 ============================== */

  STR.zh['brand.text'] = '应用开发 <b>7 天</b>';
  STR.zh['doc.title'] = 'AI 应用开发 7 天';
  STR.zh['doc.desc'] = '7 天从零跑通 AI 应用开发：21 个自动判分关卡 + 7 个闭卷挑战 + 56 道自测题 + 180 条命令词典，逐字拆解每条命令。全程浏览器沙盒，不用装任何东西。';

  /* ------------------------------ 顶栏 ------------------------------ */
  STR.zh['top.menu'] = '天列表';
  STR.zh['top.gates'] = '{done} / {total} 关';
  STR.zh['top.allPass'] = '7 天全部通关';
  STR.zh['top.daysPass'] = '{passed} / {total} 天通关';
  STR.zh['top.report'] = '结业报告';
  STR.zh['top.themeToLight'] = '切到浅色';
  STR.zh['top.themeToDark'] = '切到深色';
  STR.zh['top.theme'] = '切换主题';
  STR.zh['top.langToEn'] = '切换到英文界面 · Switch to English';
  STR.zh['top.langToZh'] = 'Switch to Chinese · 切换到中文界面';
  STR.zh['top.langBtn'] = 'EN';          /* 按钮上显示的字：点它能切到哪个语言 */
  STR.zh['top.guide'] = '使用说明';

  /* ------------------------------ 侧栏 ------------------------------ */
  STR.zh['nav.title'] = '7 天路线';
  STR.zh['nav.passMeta'] = '已通关 · {min} 分钟';
  STR.zh['nav.doingMeta'] = '{done}/{total} 关 · {min} 分钟';
  STR.zh['nav.start'] = '0 · 开课前 10 分钟';
  STR.zh['nav.dict'] = '📖 命令词典';
  STR.zh['nav.guide'] = '📘 使用说明';
  STR.zh['nav.resetAll'] = '清空全部进度';
  STR.zh['nav.resetNote'] = '进度存在本机浏览器里，不上传。';
  STR.zh['nav.resetConfirm'] = '清空全部进度？\n\n关卡状态、小节标记和沙盒工作区都会重置。此操作不可撤销。';

  /* ------------------------------ 终端面板 ------------------------------ */
  STR.zh['term.fab'] = '沙盒终端（快捷键 ~）';
  STR.zh['term.panel'] = '沙盒终端';
  STR.zh['term.scenario'] = '沙盒';
  STR.zh['term.sizesGroup'] = '高度档位';
  STR.zh['term.sizeS'] = '小窗';
  STR.zh['term.sizeM'] = '中窗';
  STR.zh['term.sizeL'] = '大窗';
  STR.zh['term.fontDown'] = '字号变小';
  STR.zh['term.fontUp'] = '字号变大';
  STR.zh['term.copy'] = '复制';
  STR.zh['term.copyAll'] = '复制全部输出';
  STR.zh['term.help'] = '可用命令';
  STR.zh['term.reset'] = '重置这个工作区';
  STR.zh['term.fullOn'] = '全屏（Ctrl+Shift+F）';
  STR.zh['term.fullOff'] = '退出全屏（Esc）';
  STR.zh['term.full'] = '全屏';
  STR.zh['term.exitFull'] = '退出全屏';
  STR.zh['term.close'] = '收起';
  STR.zh['term.gripCorner'] = '拖动改变宽高';
  STR.zh['term.grip'] = '拖动改变高度';
  STR.zh['term.inputAria'] = '命令输入';
  STR.zh['term.copied'] = '已复制';
  STR.zh['term.copyFail'] = '复制失败';
  STR.zh['term.welcomeTitle'] = '🖥️ AI 沙盒终端 · {label}';
  STR.zh['term.welcomeNote'] = '文件系统完全在你的浏览器内存里：随便 rm -rf，刷新页面或点 ⟳ 就能复原。不联网、不碰真实文件。';
  STR.zh['term.welcomeTry'] = '试试：ls -la　cat train.csv　conda env list　pip install -r requirements.txt　git status　help';

  /* ------------------------------ 报告弹层 ------------------------------ */
  STR.zh['report.title'] = '结业报告';
  STR.zh['report.close'] = '关闭';
  STR.zh['report.namePlaceholder'] = '你的名字（会写进报告）';
  STR.zh['report.copy'] = '复制 Markdown';
  STR.zh['report.download'] = '下载 .md';
  STR.zh['report.copied'] = 'Markdown 已复制，可以粘到笔记里';
  STR.zh['report.copyFail'] = '复制失败，可以点「下载 .md」';
  STR.zh['report.downloaded'] = '已下载 ai-dev-7days-report.md';

  /* --------------------------- 当天页面 / 小节 --------------------------- */
  STR.zh['app.termError'] = '终端出错：{msg}';
  STR.zh['app.noDays'] = '还没有课程数据：js/data/d1.js ~ d7.js 没有加载成功。';

  STR.zh['day.minutes'] = '约 {min} 分钟';
  STR.zh['day.gateStat'] = '关卡 {done}/{total}';
  STR.zh['day.gatesHead'] = '关卡验证';
  STR.zh['day.gatesNote'] = '只检查结果，不检查命令 —— 目标达成就算过。';
  STR.zh['day.challengeHead'] = '闭卷挑战';
  STR.zh['day.challengeNote'] = '不看书、不给提示，独立完成。不计入 21 关，但会写进结业报告。';
  STR.zh['day.prev'] = '← {label} · {title}';
  STR.zh['day.next'] = '{label} · {title} →';
  STR.zh['day.allPass'] = '🎉 {label} 全部通过';
  STR.zh['day.enter'] = '进入 {label} →';
  STR.zh['day.openReport'] = '打开结业报告 →';

  STR.zh['lesson.run'] = '▶ 运行';
  STR.zh['lesson.tokens'] = '逐字拆解';
  STR.zh['lesson.tokensNote'] = '{n} 个零件，每个都解释；点零件可查词典';
  STR.zh['lesson.expect'] = '你应该看到';
  STR.zh['lesson.clinic'] = '🩺 常见错误诊所';
  STR.zh['lesson.clinicNote'] = '报错先在这里找，别急着问人';
  STR.zh['lesson.clinicRead'] = '怎么读：{text}';
  STR.zh['lesson.clinicFix'] = '怎么修：{text}';
  STR.zh['lesson.cheat'] = '📋 本节小抄';
  STR.zh['lesson.cheatNote'] = '复习只看这张表就够了';
  STR.zh['lesson.done'] = '✓ 已读';
  STR.zh['lesson.markDone'] = '标记已读';
  STR.zh['lesson.tokenTitle'] = '点一下：去词典查「{term}」';
  STR.zh['lesson.dictBtn'] = '词典';

  STR.zh['token.cmd'] = '命令';
  STR.zh['token.flag'] = '参数';
  STR.zh['token.value'] = '取值';
  STR.zh['token.path'] = '路径';
  STR.zh['token.op'] = '符号';
  STR.zh['token.quote'] = '引号';
  STR.zh['token.comment'] = '注释';
  STR.zh['token.vari'] = '变量';
  STR.zh['token.env'] = '环境变量';

  /* ------------------------------ 关卡 ------------------------------ */
  STR.zh['gate.idle'] = '待验证';
  STR.zh['gate.pass'] = '✓ 已通过';
  STR.zh['gate.fail'] = '× 未通过';
  STR.zh['gate.notePass'] = '这一关已经过了';
  STR.zh['gate.noteMiss'] = '还有 {n} 项没满足';
  STR.zh['gate.check'] = '检查这一关';
  STR.zh['gate.submit'] = '提交挑战结果';
  STR.zh['gate.hintOpen'] = '🔓 我要提示（会被记录在报告里）';
  STR.zh['gate.stuck'] = '卡住了？';
  STR.zh['gate.answer'] = '🧯 实在做不出来：看参考答案（展开会被记录）';
  STR.zh['gate.toastFirst'] = '🎉 第一遍就通过：{title}';
  STR.zh['gate.toastPass'] = '✅ 通过：{title}';
  STR.zh['gate.toastFail'] = '还差一点，看每项下面的红字';
  STR.zh['gate.notFound'] = '关卡不存在';
  /* --------------------------- 关卡逐项状态（gate.js 用） --------------------------- */
  STR.zh['chk.noDir'] = '目录不存在';
  STR.zh['chk.dirOk'] = '目录存在';
  STR.zh['chk.dirBlocked'] = '同名文件占用了这个路径';
  STR.zh['chk.noFile'] = '文件不存在';
  STR.zh['chk.isDir'] = '这是目录，不是文件';
  STR.zh['chk.tooSmall'] = '只有 {size}，太短了';
  STR.zh['chk.empty'] = '文件是空的';
  STR.zh['chk.tooFewLines'] = '只有 {used} 行有效内容（要 ≥ {need}）';
  STR.zh['chk.missingText'] = '内容里没有「{text}」';
  STR.zh['chk.regexMiss'] = '内容不匹配 /{re}/';
  STR.zh['chk.fileOk'] = '文件存在（{size}）';
  STR.zh['chk.stillThere'] = '它还在';
  STR.zh['chk.gone'] = '已不存在';
  STR.zh['chk.canExec'] = '可执行';
  STR.zh['chk.noExec'] = '还没有可执行位（x）';
  STR.zh['chk.modeNow'] = '当前 {now}，需要 {want}';
  STR.zh['chk.noPath'] = '路径不存在';
  STR.zh['chk.notLinkDir'] = '这是目录，不是软链接';
  STR.zh['chk.notLinkFile'] = '这是普通文件，不是软链接';
  STR.zh['chk.linkWrong'] = '指向 {now}，需要指向 {want}';
  STR.zh['chk.envNone'] = '（空）';
  STR.zh['chk.envMissing'] = '没有这个环境，现有：{names}';
  STR.zh['chk.pyWrong'] = 'python 是 {now}，需要 {want}.x';
  STR.zh['chk.activeNow'] = '当前激活：{name}';
  STR.zh['chk.pkgNone'] = '（还没装东西）';
  STR.zh['chk.pkgMissing'] = '{env} 里没有 {name}，已装：{have}';
  STR.zh['chk.pkgWrong'] = '装的是 {name}=={ver}，需要 {want}';
  STR.zh['chk.noRepo'] = '这里（或指定路径）还没有 git 仓库';
  STR.zh['chk.fewCommits'] = '只有 {n} 次提交，需要 ≥ {need}';
  STR.zh['chk.msgMissing'] = '提交信息里没有「{msg}」';
  STR.zh['chk.remoteNow'] = 'remote 是 {remote}';
  STR.zh['chk.remoteNone'] = '（未设置）';
  STR.zh['chk.branchNow'] = '当前分支是 {now}，需要 {want}';
  STR.zh['chk.untracked'] = '未跟踪 {list}';
  STR.zh['chk.modified'] = '已修改 {list}';
  STR.zh['chk.deleted'] = '已删除 {list}';
  STR.zh['chk.dirty'] = '工作区还有未提交的改动：{bits}';
  STR.zh['chk.commitOk'] = '{n} 次提交 · 分支 {branch}';
  STR.zh['chk.downloaded'] = '已下载到 {path}';
  STR.zh['chk.noDownload'] = '没有下载记录';
  STR.zh['chk.running'] = '已在运行（端口 {port}）';
  STR.zh['chk.notStarted'] = '还没启动';
  STR.zh['chk.vram'] = '当前显存占用 {mb} MiB';
  STR.zh['chk.err'] = '检查出错：{msg}';
  STR.zh['chk.unknownType'] = '未知的检查类型：{t}';
  STR.zh['chk.sep'] = '；';
  STR.zh['chk.pkgOk'] = '{name}=={ver}（{env}）';

  /* 关卡描述：数据里没写 why 时的兜底说法 */
  STR.zh['lbl.dir'] = '{p} 是一个目录';
  STR.zh['lbl.file'] = '{p} 存在';
  STR.zh['lbl.fileContains'] = '{p} 存在且包含指定内容';
  STR.zh['lbl.absent'] = '{p} 不存在';
  STR.zh['lbl.exec'] = '{p} 可执行（有 x 权限）';
  STR.zh['lbl.mode'] = '{p} 权限是 {expect}';
  STR.zh['lbl.link'] = '{p} 是软链接';
  STR.zh['lbl.aiEnv'] = 'conda 环境 {name} 存在';
  STR.zh['lbl.aiEnvPy'] = 'conda 环境 {name}（python {py}）存在';
  STR.zh['lbl.aiActive'] = '当前激活环境是 {name}';
  STR.zh['lbl.aiPkg'] = '{env} 里有 {name}';
  STR.zh['lbl.aiPkgVer'] = '{env} 里有 {name}=={ver}';
  STR.zh['lbl.envNow'] = '当前环境';
  STR.zh['lbl.aiRepo'] = 'git 仓库满足要求（提交 / 分支 / 远端）';
  STR.zh['lbl.aiDownload'] = '模型已下载';
  STR.zh['lbl.aiSession'] = '{name} 已启动';
  STR.zh['lbl.aiGpu'] = '显存占用 ≥ {mb} MiB';
  STR.zh['lbl.custom'] = '自定义检查';



  /* ------------------------------ 结业项目 ------------------------------ */
  STR.zh['prj.title'] = '🏁 {title}';
  STR.zh['prj.note'] = '每一项都要你去跑命令证明';
  STR.zh['prj.stat'] = '已完成 {done} / {total} 项';
  STR.zh['prj.statDone'] = '　🎉 项目可以写进简历了';
  STR.zh['prj.check'] = '检查';
  STR.zh['prj.hint'] = '提示：{text}';

  /* ------------------------------ 自测题 ------------------------------ */
  STR.zh['quiz.head'] = '自测 · {n} 题';
  STR.zh['quiz.stat'] = '答对 {right}/{total}　（答错的题会进错题本，结业报告里能看到）';
  STR.zh['quiz.empty'] = '这一天还没有题';
  STR.zh['quiz.right'] = '✓ 答对';
  STR.zh['quiz.retry'] = '× 再试';
  STR.zh['quiz.idle'] = '未作答';
  STR.zh['quiz.correct'] = '✓ 对了：';
  STR.zh['quiz.wrong'] = '× 不对：';
  STR.zh['quiz.again'] = '再试一次';

  /* ------------------------------ 命令词典 ------------------------------ */
  STR.zh['dict.read'] = '读作 {read}';
  STR.zh['dict.eg'] = '例子';
  STR.zh['dict.empty'] = '没搜到「{q}」。换个关键词试试，或者点上面的分组翻一翻。';
  STR.zh['dict.count'] = '{n} 条';
  STR.zh['dict.searchPlaceholder'] = '搜命令 / 参数 / 符号 / 概念 / 报错，例如 grep、-L、>、显存';
  STR.zh['dict.searchAria'] = '搜索词典';
  STR.zh['dict.all'] = '全部';
  STR.zh['dict.allDesc'] = '整个词典';
  STR.zh['dict.drawer'] = '📖 命令词典';
  STR.zh['dict.drawerAria'] = '命令词典';
  STR.zh['dict.closeAria'] = '关闭词典';
  STR.zh['dict.title'] = '命令词典';
  STR.zh['dict.sub'] = '{n} 条：命令 / 参数 / 符号 / 概念 / AI 工具链 / 报错';
  STR.zh['dict.intro'] = '课程里出现的每一个词都能在这里查到。看不懂某条命令时，先来搜它的参数和符号——90% 的"看不懂"其实是参数和符号没被解释。';
  STR.zh['dict.noData'] = '词典数据没加载成功。';

  /* 词典分组（id 见 js/data/glossary.js 的 GROUPS） */
  STR.zh['group.all'] = '全部';
  STR.zh['group.all.desc'] = '整个词典';
  STR.zh['group.cmd'] = '命令';
  STR.zh['group.flag'] = '参数';
  STR.zh['group.op'] = '符号';
  STR.zh['group.concept'] = '概念';
  STR.zh['group.ai'] = 'AI 工具链';
  STR.zh['group.err'] = '报错';
  STR.zh['group.cmd.desc'] = '在终端里敲的第一个词，决定"做什么"';
  STR.zh['group.flag.desc'] = '跟在命令后面，用 - 或 -- 开头，微调"怎么做"';
  STR.zh['group.op.desc'] = '路径、管道、重定向这些语法零件，最容易看不懂';
  STR.zh['group.concept.desc'] = '屏幕上看不见，但不懂就会一直出错的东西';
  STR.zh['group.ai.desc'] = '环境、模型、GPU 相关的专用命令';
  STR.zh['group.err.desc'] = '看到这几句别慌，这里有读法和解法';

  /* 沙盒工作区名字（id 见 js/sandbox.js 的 SCENARIOS） */
  STR.zh['scenario.files'] = '文件与目录';
  STR.zh['scenario.text'] = '文本处理';
  STR.zh['scenario.perm'] = '权限与用户';
  STR.zh['scenario.shell'] = 'Shell 脚本';
  STR.zh['scenario.home'] = '默认工作区';
  STR.zh['scenario.ai-lab'] = 'AI 实验区（Day1-3）';
  STR.zh['scenario.ai-env'] = 'Python 环境（Day4）';
  STR.zh['scenario.ai-repo'] = 'Git 仓库（Day5）';
  STR.zh['scenario.ai-gpu'] = '运行与排障（Day6）';

  /* 能力等级（js/data/skills.js 的 level 字段） */
  STR.zh['skill.lv.基础'] = '基础';
  STR.zh['skill.lv.进阶'] = '进阶';
  STR.zh['skill.lv.工程'] = '工程';

  /* ------------------------------ 报告 ------------------------------ */
  STR.zh['rep.lv.deliver'] = '可交付 · 7 天毕业';
  STR.zh['rep.lv.grad'] = 'AI 应用开发 · 7 天毕业';
  STR.zh['rep.lv.senior'] = '能独立跑通 AI 项目';
  STR.zh['rep.lv.junior'] = '手上已经有真东西了';
  STR.zh['rep.lv.starter'] = '刚上路，继续推';
  STR.zh['rep.lv.new'] = '还没开始';
  STR.zh['rep.anon'] = '同学';
  STR.zh['rep.sub'] = '{name} · {time} · 通关 {done}/{total}';
  STR.zh['rep.stat.gate'] = '关卡';
  STR.zh['rep.stat.quiz'] = '自测';
  STR.zh['rep.stat.challenge'] = '闭卷';
  STR.zh['rep.stat.skill'] = '能力';
  STR.zh['rep.quizTitle'] = '自测正确率';
  STR.zh['rep.gatePass'] = '（已通过）';
  STR.zh['rep.gateFail'] = '（未通过）';
  STR.zh['rep.hinted'] = '（借助提示通过）';
  STR.zh['rep.skills'] = '能力矩阵';
  STR.zh['rep.skillsNote'] = '✅ 已证明（关卡全过 + 自测答对） · 🟡 部分 · ⬜ 还没证据';
  STR.zh['rep.skillNum'] = '关卡 {ok}/{total} · 自测 {right}/{qtotal}';
  STR.zh['rep.deliver'] = ' · 可交付';
  STR.zh['rep.wrong'] = '错题本（{n}）';
  STR.zh['rep.wrongNote'] = '回到对应那天重做一遍就会消失';
  STR.zh['rep.attempts'] = '验证 {n} 次 · 通过 {pass} · 未通过 {fail}';
  STR.zh['rep.next'] = '下一步：{day} · {title}';
  STR.zh['rep.allDone'] = '全部通关 🎉';

  /* ------------------------------ 预备课 ------------------------------ */
  STR.zh['start.title'] = '开课前 10 分钟';
  STR.zh['start.minutes'] = '约 {min} 分钟 · 不用装任何东西';
  STR.zh['start.noData'] = '数据没加载';
  STR.zh['start.noDataNote'] = '预备课数据（js/data/d0.js）没有加载成功。';
  STR.zh['start.go'] = '开始 Day 1 · 项目地基 →';

  /* ------------------------------ 使用说明 ------------------------------ */
  STR.zh['guide.title'] = '使用说明';
  STR.zh['guide.sub'] = '3 分钟读完，知道每一块是干什么的';
  STR.zh['guide.toc'] = '本页导航';
  STR.zh['guide.noData'] = '使用说明数据（js/data/guide.js）没有加载成功。';
  STR.zh['guide.langHint'] = '顶栏右侧的按钮可以随时切换中英文界面，选择会记在本机。';

  /* --------------------------- 报告 Markdown --------------------------- */
  STR.zh['md.title'] = '# AI 应用开发 7 天 · 学习报告';
  STR.zh['md.name'] = '- 姓名：{name}';
  STR.zh['md.time'] = '- 生成时间：{time}';
  STR.zh['md.gates'] = '- 通关关卡：{done} / {total}（{pct}%）';
  STR.zh['md.quiz'] = '- 自测正确率：{right} / {total}（{pct}%）';
  STR.zh['md.challenges'] = '- 闭卷挑战：{ok} / {total} 通过';
  STR.zh['md.attempts'] = '- 验证次数：{n} 次（通过 {pass} · 未通过 {fail}）';
  STR.zh['md.skills'] = '- 能力项：{proven} / {total} 已证明';
  STR.zh['md.project'] = '- 结业项目：{done} / {total}{deliver}';
  STR.zh['md.deliver'] = '（可交付）';
  STR.zh['md.level'] = '- 评价：{title}';
  STR.zh['md.day'] = '## {label} · {title}（{done}/{total}）';
  STR.zh['md.gatePass'] = '　（通过 {n} 次）';
  STR.zh['md.quizLine'] = '- 🧠 自测 {right}/{total}（{pct}%）';
  STR.zh['md.challenge'] = '- 🔒 闭卷挑战：{state}';
  STR.zh['md.chPass'] = '已通过';
  STR.zh['md.chFail'] = '未通过';
  STR.zh['md.hinted'] = '（借助提示）';
  STR.zh['md.skillsHead'] = '## 能力矩阵';
  STR.zh['md.skill'] = '- {mark} {name}（{level}）· 关卡 {ok}/{total} · 自测 {right}/{qtotal}';
  STR.zh['md.wrong'] = '## 错题本（{n} 题）';
  STR.zh['md.wrongItem'] = '- [{day}] {q}';
  STR.zh['md.wrongWhy'] = '  - 解析：{why}';
  STR.zh['md.next'] = '> 下一步：{day} · {title}';
  STR.zh['md.nextProject'] = '> 21 关全过。下一步：把结业项目剩下 {n} 项做完。';
  STR.zh['md.done'] = '> 全部关卡与项目都完成——可以把它写进简历，去投递了。';

  /* ============================== English ============================== */

  STR.en['brand.text'] = '<b>7-Day</b> AI App Dev';
  STR.en['doc.title'] = 'AI App Development in 7 Days';
  STR.en['doc.desc'] = 'Seven days from zero to a running AI app: 21 auto-checked gates, 7 closed-book challenges, 56 quiz items and a command dictionary that explains every token. Everything runs in a browser sandbox — nothing to install.';

  STR.en['top.menu'] = 'Days';
  STR.en['top.gates'] = '{done} / {total} gates';
  STR.en['top.allPass'] = 'All 7 days passed';
  STR.en['top.daysPass'] = '{passed} / {total} days passed';
  STR.en['top.report'] = 'Report';
  STR.en['top.themeToLight'] = 'Switch to light';
  STR.en['top.themeToDark'] = 'Switch to dark';
  STR.en['top.theme'] = 'Toggle theme';
  STR.en['top.langToEn'] = 'Switch to English · 切换到英文界面';
  STR.en['top.langToZh'] = 'Switch to Chinese · 切换到中文界面';
  STR.en['top.langBtn'] = '中';
  STR.en['top.guide'] = 'Guide';

  STR.en['nav.title'] = '7-day route';
  STR.en['nav.passMeta'] = 'Passed · {min} min';
  STR.en['nav.doingMeta'] = '{done}/{total} gates · {min} min';
  STR.en['nav.start'] = '0 · 10 min before class';
  STR.en['nav.dict'] = '📖 Command dictionary';
  STR.en['nav.guide'] = '📘 User guide';
  STR.en['nav.resetAll'] = 'Reset all progress';
  STR.en['nav.resetNote'] = 'Progress stays in this browser, never uploaded.';
  STR.en['nav.resetConfirm'] = 'Reset all progress?\n\nGate states, lesson marks and sandbox workspaces will be reset. This cannot be undone.';

  STR.en['term.fab'] = 'Sandbox terminal (~)';
  STR.en['term.panel'] = 'Sandbox terminal';
  STR.en['term.scenario'] = 'Sandbox';
  STR.en['term.sizesGroup'] = 'Panel height';
  STR.en['term.sizeS'] = 'Small';
  STR.en['term.sizeM'] = 'Medium';
  STR.en['term.sizeL'] = 'Large';
  STR.en['term.fontDown'] = 'Smaller font';
  STR.en['term.fontUp'] = 'Larger font';
  STR.en['term.copy'] = 'Copy';
  STR.en['term.copyAll'] = 'Copy all output';
  STR.en['term.help'] = 'Available commands';
  STR.en['term.reset'] = 'Reset this workspace';
  STR.en['term.fullOn'] = 'Full screen (Ctrl+Shift+F)';
  STR.en['term.fullOff'] = 'Exit full screen (Esc)';
  STR.en['term.full'] = 'Full screen';
  STR.en['term.exitFull'] = 'Exit full screen';
  STR.en['term.close'] = 'Collapse';
  STR.en['term.gripCorner'] = 'Drag to resize';
  STR.en['term.grip'] = 'Drag to change height';
  STR.en['term.inputAria'] = 'Command input';
  STR.en['term.copied'] = 'Copied';
  STR.en['term.copyFail'] = 'Copy failed';
  STR.en['term.welcomeTitle'] = '🖥️ AI sandbox terminal · {label}';
  STR.en['term.welcomeNote'] = 'The filesystem lives in your browser memory: rm -rf anything, then refresh or press ⟳ to restore it. No network, no real files.';
  STR.en['term.welcomeTry'] = 'Try: ls -la, cat train.csv, conda env list, pip install -r requirements.txt, git status, help';

  STR.en['report.title'] = 'Progress report';
  STR.en['report.close'] = 'Close';
  STR.en['report.namePlaceholder'] = 'Your name (written into the report)';
  STR.en['report.copy'] = 'Copy Markdown';
  STR.en['report.download'] = 'Download .md';
  STR.en['report.copied'] = 'Markdown copied — paste it into your notes';
  STR.en['report.copyFail'] = 'Copy failed — use "Download .md" instead';
  STR.en['report.downloaded'] = 'ai-dev-7days-report.md downloaded';

  STR.en['app.termError'] = 'Terminal error: {msg}';
  STR.en['app.noDays'] = 'No course data: js/data/d1.js ~ d7.js failed to load.';

  STR.en['day.minutes'] = 'about {min} min';
  STR.en['day.gateStat'] = 'Gates {done}/{total}';
  STR.en['day.gatesHead'] = 'Gate checks';
  STR.en['day.gatesNote'] = 'Only the result is checked, never the exact command — reach the goal and the gate passes.';
  STR.en['day.challengeHead'] = 'Closed-book challenge';
  STR.en['day.challengeNote'] = 'No notes, no hints, solo. Not one of the 21 gates, but it is written into your report.';
  STR.en['day.prev'] = '← {label} · {title}';
  STR.en['day.next'] = '{label} · {title} →';
  STR.en['day.allPass'] = '🎉 {label} fully passed';
  STR.en['day.enter'] = 'Open {label} →';
  STR.en['day.openReport'] = 'Open your report →';

  STR.en['lesson.run'] = '▶ Run';
  STR.en['lesson.tokens'] = 'Token by token';
  STR.en['lesson.tokensNote'] = '{n} tokens, each one explained; click a token to look it up';
  STR.en['lesson.expect'] = 'You should see';
  STR.en['lesson.clinic'] = '🩺 Common error clinic';
  STR.en['lesson.clinicNote'] = 'Look here before you ask anyone';
  STR.en['lesson.clinicRead'] = 'How to read it: {text}';
  STR.en['lesson.clinicFix'] = 'How to fix it: {text}';
  STR.en['lesson.cheat'] = '📋 Cheat sheet';
  STR.en['lesson.cheatNote'] = 'This table is all you need to review';
  STR.en['lesson.done'] = '✓ Read';
  STR.en['lesson.markDone'] = 'Mark as read';
  STR.en['lesson.tokenTitle'] = 'Click to look up "{term}"';
  STR.en['lesson.dictBtn'] = 'Dictionary';

  STR.en['token.cmd'] = 'command';
  STR.en['token.flag'] = 'option';
  STR.en['token.value'] = 'value';
  STR.en['token.path'] = 'path';
  STR.en['token.op'] = 'symbol';
  STR.en['token.quote'] = 'quotes';
  STR.en['token.comment'] = 'comment';
  STR.en['token.vari'] = 'variable';
  STR.en['token.env'] = 'env var';

  STR.en['gate.idle'] = 'Not checked';
  STR.en['gate.pass'] = '✓ Passed';
  STR.en['gate.fail'] = '× Not yet';
  STR.en['gate.notePass'] = 'This gate is already passed';
  STR.en['gate.noteMiss'] = '{n} item(s) still unmet';
  STR.en['gate.check'] = 'Check this gate';
  STR.en['gate.submit'] = 'Submit challenge';
  STR.en['gate.hintOpen'] = '🔓 Show a hint (recorded in your report)';
  STR.en['gate.stuck'] = 'Stuck?';
  STR.en['gate.answer'] = '🧯 Cannot solve it: show the answer (recorded)';
  STR.en['gate.toastFirst'] = '🎉 Passed on the first try: {title}';
  STR.en['gate.toastPass'] = '✅ Passed: {title}';
  STR.en['gate.toastFail'] = 'Almost — read the red text under each item';
  STR.en['gate.notFound'] = 'Gate not found';
  /* --------------------------- 关卡逐项状态（gate.js 用） --------------------------- */
  STR.en['chk.noDir'] = 'directory does not exist';
  STR.en['chk.dirOk'] = 'directory exists';
  STR.en['chk.dirBlocked'] = 'a file with the same name sits on this path';
  STR.en['chk.noFile'] = 'file does not exist';
  STR.en['chk.isDir'] = 'this is a directory, not a file';
  STR.en['chk.tooSmall'] = 'only {size} — too short';
  STR.en['chk.empty'] = 'the file is empty';
  STR.en['chk.tooFewLines'] = 'only {used} non-empty lines (need ≥ {need})';
  STR.en['chk.missingText'] = 'the file does not contain "{text}"';
  STR.en['chk.regexMiss'] = 'content does not match /{re}/';
  STR.en['chk.fileOk'] = 'file exists ({size})';
  STR.en['chk.stillThere'] = 'still there';
  STR.en['chk.gone'] = 'gone';
  STR.en['chk.canExec'] = 'executable';
  STR.en['chk.noExec'] = 'no execute bit (x) yet';
  STR.en['chk.modeNow'] = 'currently {now}, needs {want}';
  STR.en['chk.noPath'] = 'path does not exist';
  STR.en['chk.notLinkDir'] = 'this is a directory, not a symlink';
  STR.en['chk.notLinkFile'] = 'this is a regular file, not a symlink';
  STR.en['chk.linkWrong'] = 'points to {now}, needs to point to {want}';
  STR.en['chk.envNone'] = '(none)';
  STR.en['chk.envMissing'] = 'no such environment; you have: {names}';
  STR.en['chk.pyWrong'] = 'python is {now}, needs {want}.x';
  STR.en['chk.activeNow'] = 'active now: {name}';
  STR.en['chk.pkgNone'] = '(nothing installed yet)';
  STR.en['chk.pkgMissing'] = '{env} has no {name}; installed: {have}';
  STR.en['chk.pkgWrong'] = 'installed {name}=={ver}, needs {want}';
  STR.en['chk.noRepo'] = 'no git repository here (or at that path) yet';
  STR.en['chk.fewCommits'] = 'only {n} commits, need ≥ {need}';
  STR.en['chk.msgMissing'] = 'no commit message contains "{msg}"';
  STR.en['chk.remoteNow'] = 'remote is {remote}';
  STR.en['chk.remoteNone'] = '(not set)';
  STR.en['chk.branchNow'] = 'current branch is {now}, needs {want}';
  STR.en['chk.untracked'] = 'untracked {list}';
  STR.en['chk.modified'] = 'modified {list}';
  STR.en['chk.deleted'] = 'deleted {list}';
  STR.en['chk.dirty'] = 'the working tree still has uncommitted changes: {bits}';
  STR.en['chk.commitOk'] = '{n} commits · branch {branch}';
  STR.en['chk.downloaded'] = 'downloaded to {path}';
  STR.en['chk.noDownload'] = 'no download on record';
  STR.en['chk.running'] = 'running (port {port})';
  STR.en['chk.notStarted'] = 'not started yet';
  STR.en['chk.vram'] = 'current VRAM usage {mb} MiB';
  STR.en['chk.err'] = 'check failed: {msg}';
  STR.en['chk.unknownType'] = 'unknown check type: {t}';
  STR.en['chk.sep'] = '; ';
  STR.en['chk.pkgOk'] = '{name}=={ver} ({env})';

  /* 关卡描述：数据里没写 why 时的兜底说法 */
  STR.en['lbl.dir'] = '{p} is a directory';
  STR.en['lbl.file'] = '{p} exists';
  STR.en['lbl.fileContains'] = '{p} exists and contains the expected text';
  STR.en['lbl.absent'] = '{p} does not exist';
  STR.en['lbl.exec'] = '{p} is executable (has x)';
  STR.en['lbl.mode'] = '{p} permissions are {expect}';
  STR.en['lbl.link'] = '{p} is a symlink';
  STR.en['lbl.aiEnv'] = 'conda environment {name} exists';
  STR.en['lbl.aiEnvPy'] = 'conda environment {name} (python {py}) exists';
  STR.en['lbl.aiActive'] = 'the active environment is {name}';
  STR.en['lbl.aiPkg'] = '{env} has {name}';
  STR.en['lbl.aiPkgVer'] = '{env} has {name}=={ver}';
  STR.en['lbl.envNow'] = 'the current environment';
  STR.en['lbl.aiRepo'] = 'the git repository meets the requirements (commits / branch / remote)';
  STR.en['lbl.aiDownload'] = 'the model is downloaded';
  STR.en['lbl.aiSession'] = '{name} is running';
  STR.en['lbl.aiGpu'] = 'VRAM usage ≥ {mb} MiB';
  STR.en['lbl.custom'] = 'custom check';



  STR.en['prj.title'] = '🏁 {title}';
  STR.en['prj.note'] = 'Every item has to be proven with a real command';
  STR.en['prj.stat'] = 'Done {done} / {total} items';
  STR.en['prj.statDone'] = '　🎉 ready for your CV';
  STR.en['prj.check'] = 'Check';
  STR.en['prj.hint'] = 'Hint: {text}';

  STR.en['quiz.head'] = 'Quiz · {n} questions';
  STR.en['quiz.stat'] = 'Correct {right}/{total}　(wrong answers go into your mistake book and the report)';
  STR.en['quiz.empty'] = 'No questions for this day yet';
  STR.en['quiz.right'] = '✓ Correct';
  STR.en['quiz.retry'] = '× Try again';
  STR.en['quiz.idle'] = 'Unanswered';
  STR.en['quiz.correct'] = '✓ Correct: ';
  STR.en['quiz.wrong'] = '× Not quite: ';
  STR.en['quiz.again'] = 'Try again';

  STR.en['dict.read'] = 'read as {read}';
  STR.en['dict.eg'] = 'Example';
  STR.en['dict.empty'] = 'Nothing found for "{q}". Try another keyword, or browse the groups above.';
  STR.en['dict.count'] = '{n} entries';
  STR.en['dict.searchPlaceholder'] = 'Search commands / options / symbols / concepts / errors, e.g. grep, -L, >, VRAM';
  STR.en['dict.searchAria'] = 'Search the dictionary';
  STR.en['dict.all'] = 'All';
  STR.en['dict.allDesc'] = 'The whole dictionary';
  STR.en['dict.drawer'] = '📖 Command dictionary';
  STR.en['dict.drawerAria'] = 'Command dictionary';
  STR.en['dict.closeAria'] = 'Close the dictionary';
  STR.en['dict.title'] = 'Command dictionary';
  STR.en['dict.sub'] = '{n} entries: commands / options / symbols / concepts / AI toolchain / errors';
  STR.en['dict.intro'] = 'Every word used in this course is in here. When a command looks unreadable, search its options and symbols first — most "I do not get it" moments are an unexplained option or symbol.';
  STR.en['dict.noData'] = 'Dictionary data failed to load.';

  STR.en['group.all'] = 'All';
  STR.en['group.all.desc'] = 'The whole dictionary';
  STR.en['group.cmd'] = 'Commands';
  STR.en['group.flag'] = 'Options';
  STR.en['group.op'] = 'Symbols';
  STR.en['group.concept'] = 'Concepts';
  STR.en['group.ai'] = 'AI toolchain';
  STR.en['group.err'] = 'Errors';
  STR.en['group.cmd.desc'] = 'The first word you type; it decides what happens';
  STR.en['group.flag.desc'] = 'Follows a command, starts with - or --, fine-tunes how it happens';
  STR.en['group.op.desc'] = 'Paths, pipes and redirects — the syntax pieces that confuse people most';
  STR.en['group.concept.desc'] = 'Invisible on screen, but everything breaks until you know it';
  STR.en['group.ai.desc'] = 'Commands specific to environments, models and GPUs';
  STR.en['group.err.desc'] = 'Do not panic — here is how to read and fix them';

  STR.en['scenario.files'] = 'Files and directories';
  STR.en['scenario.text'] = 'Text processing';
  STR.en['scenario.perm'] = 'Permissions and users';
  STR.en['scenario.shell'] = 'Shell scripting';
  STR.en['scenario.home'] = 'Default workspace';
  STR.en['scenario.ai-lab'] = 'AI lab (Day 1-3)';
  STR.en['scenario.ai-env'] = 'Python env (Day 4)';
  STR.en['scenario.ai-repo'] = 'Git repo (Day 5)';
  STR.en['scenario.ai-gpu'] = 'Runtime and troubleshooting (Day 6)';

  STR.en['skill.lv.基础'] = 'Foundational';
  STR.en['skill.lv.进阶'] = 'Intermediate';
  STR.en['skill.lv.工程'] = 'Engineering';

  STR.en['rep.lv.deliver'] = 'Deliverable · 7-day graduate';
  STR.en['rep.lv.grad'] = 'AI app development · 7-day graduate';
  STR.en['rep.lv.senior'] = 'Can ship an AI project on your own';
  STR.en['rep.lv.junior'] = 'You already have real work to show';
  STR.en['rep.lv.starter'] = 'Just started — keep going';
  STR.en['rep.lv.new'] = 'Not started yet';
  STR.en['rep.anon'] = 'Student';
  STR.en['rep.sub'] = '{name} · {time} · {done}/{total} gates';
  STR.en['rep.stat.gate'] = 'Gates';
  STR.en['rep.stat.quiz'] = 'Quiz';
  STR.en['rep.stat.challenge'] = 'Closed-book';
  STR.en['rep.stat.skill'] = 'Skills';
  STR.en['rep.quizTitle'] = 'Quiz accuracy';
  STR.en['rep.gatePass'] = ' (passed)';
  STR.en['rep.gateFail'] = ' (not passed)';
  STR.en['rep.hinted'] = ' (passed with a hint)';
  STR.en['rep.skills'] = 'Skill matrix';
  STR.en['rep.skillsNote'] = '✅ Proven (all gates + quiz correct) · 🟡 Partial · ⬜ No evidence yet';
  STR.en['rep.skillNum'] = 'gates {ok}/{total} · quiz {right}/{qtotal}';
  STR.en['rep.deliver'] = ' · deliverable';
  STR.en['rep.wrong'] = 'Mistake book ({n})';
  STR.en['rep.wrongNote'] = 'Redo that day and the entry disappears';
  STR.en['rep.attempts'] = '{n} checks · {pass} passed · {fail} failed';
  STR.en['rep.next'] = 'Next: {day} · {title}';
  STR.en['rep.allDone'] = 'Everything passed 🎉';

  STR.en['md.title'] = '# AI App Development in 7 Days · Learning report';
  STR.en['md.name'] = '- Name: {name}';
  STR.en['md.time'] = '- Generated: {time}';
  STR.en['md.gates'] = '- Gates passed: {done} / {total} ({pct}%)';
  STR.en['md.quiz'] = '- Quiz accuracy: {right} / {total} ({pct}%)';
  STR.en['md.challenges'] = '- Closed-book challenges: {ok} / {total} passed';
  STR.en['md.attempts'] = '- Gate checks: {n} ({pass} passed · {fail} failed)';
  STR.en['md.skills'] = '- Skills: {proven} / {total} proven';
  STR.en['md.project'] = '- Capstone project: {done} / {total}{deliver}';
  STR.en['md.deliver'] = ' (deliverable)';
  STR.en['md.level'] = '- Assessment: {title}';
  STR.en['md.day'] = '## {label} · {title} ({done}/{total})';
  STR.en['md.gatePass'] = '　(passed {n} times)';
  STR.en['md.quizLine'] = '- 🧠 Quiz {right}/{total} ({pct}%)';
  STR.en['md.challenge'] = '- 🔒 Closed-book challenge: {state}';
  STR.en['md.chPass'] = 'passed';
  STR.en['md.chFail'] = 'not passed';
  STR.en['md.hinted'] = ' (with a hint)';
  STR.en['md.skillsHead'] = '## Skill matrix';
  STR.en['md.skill'] = '- {mark} {name} ({level}) · gates {ok}/{total} · quiz {right}/{qtotal}';
  STR.en['md.wrong'] = '## Mistake book ({n})';
  STR.en['md.wrongItem'] = '- [{day}] {q}';
  STR.en['md.wrongWhy'] = '  - Explanation: {why}';
  STR.en['md.next'] = '> Next: {day} · {title}';
  STR.en['md.nextProject'] = '> All 21 gates passed. Next: finish the remaining {n} capstone items.';
  STR.en['md.done'] = '> Every gate and the capstone are done — put it on your CV and start applying.';

  STR.en['start.title'] = '10 minutes before class';
  STR.en['start.minutes'] = 'about {min} min · nothing to install';
  STR.en['start.noData'] = 'Data missing';
  STR.en['start.noDataNote'] = 'Start-page data (js/data/d0.js) failed to load.';
  STR.en['start.go'] = 'Start Day 1 · Project foundation →';

  STR.en['guide.title'] = 'User guide';
  STR.en['guide.sub'] = 'Three minutes, and you will know what every part is for';
  STR.en['guide.toc'] = 'On this page';
  STR.en['guide.noData'] = 'Guide data (js/data/guide.js) failed to load.';
  STR.en['guide.langHint'] = 'The button at the right of the top bar switches between Chinese and English at any time; the choice is stored on this machine.';

  /* ============================== 运行时 ============================== */

  var DEFAULT_LANG = 'zh';
  var LANG_KEY = 'lang';
  var lang = DEFAULT_LANG;
  var listeners = [];

  function normalize(next) { return next === 'en' ? 'en' : 'zh'; }

  function table(l) { return STR[l] || STR.zh; }

  function hasKey(key, l) { return table(l || lang)[key] != null; }

  /** 取文案；缺英文时退回中文，缺占位符时保留 {xxx} 原样 */
  function t(key, vars) {
    var s = table(lang)[key];
    if (s == null) s = STR.zh[key];
    if (s == null) s = STR.en[key];
    if (s == null) return key;
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
    });
  }

  /* ----------------- 课程正文的中文 → 英文（按「位置」换，不按字段） ----------------- */

  var CJK = /[\u4e00-\u9fff]/;
  var SRC = (typeof global.WeakMap === 'function') ? new global.WeakMap() : null;
  var SRC_FALLBACK = [];

  /**
   * 某个字段的中文原文。第一次见到的值存一份，之后切语言都用它当地基 ——
   * 这样中文数据文件永远不用改，来回切多少次都不会串。
   */
  function srcOf(obj, field) {
    var box = null;
    if (SRC) {
      box = SRC.get(obj);
      if (!box) { box = {}; SRC.set(obj, box); }
    } else {
      for (var i = 0; i < SRC_FALLBACK.length; i++) {
        if (SRC_FALLBACK[i].obj === obj) { box = SRC_FALLBACK[i].box; break; }
      }
      if (!box) { box = {}; SRC_FALLBACK.push({ obj: obj, box: box }); }
    }
    if (!Object.prototype.hasOwnProperty.call(box, field)) box[field] = obj[field];
    return box[field];
  }

  /**
   * 遍历课程数据里「给人看的每一句话」，给每个位置派一个稳定名字：
   *
   *   d1.title / d1.goal / d1.intro
   *   d1-l1.title / d1-l1.body
   *   d1-l1.s2.say / .expect / .watch0 / .gotcha0 / .tok1.m
   *   d1-l1.cl0.read / .fix / .err     d1-l1.ch0.cmd / .mean
   *   d1-g1.title / .brief / .hint0 / .why0
   *   d1-c1.*（闭卷挑战）/ d1-p1.* 与 prj-d7-1.*（结业项目）
   *   d0.*（预备课）sk.<id>.*（能力项）q.<题号>.*（自测）gl|<词>|*（词典）
   *
   * 命令本身（line / solution）不在里面：那些要能真的敲进终端，不能翻。
   *
   * @param {function(string,Object,(string|number))} fn 收到 (位置, 宿主对象, 字段)
   */
  function slots(fn) {
    function hit(key, holder, field) {
      if (!holder) return;
      /* 判断「这个位置该不该翻」看的是**中文原文**，不是当前值：
       * 已经切成英文后，当前值里没有汉字了，用当前值判断会把位置整个漏掉，
       * 切回中文时就没人负责复原。 */
      var orig = srcOf(holder, field);
      if (typeof orig !== 'string' || !CJK.test(orig)) return;
      fn(key, holder, field);
    }
    function arrOfStr(prefix, arr) {
      (arr || []).forEach(function (s, i) { hit(prefix + i, arr, i); });
    }
    function checks(prefix, arr) {
      (arr || []).forEach(function (c, i) { hit(prefix + '.why' + i, c, 'why'); });
    }
    function lesson(l, prefix) {
      hit(prefix + '.title', l, 'title');
      hit(prefix + '.body', l, 'body');
      (l.steps || []).forEach(function (s, i) {
        var p = prefix + '.s' + i;
        hit(p + '.say', s, 'say');
        hit(p + '.expect', s, 'expect');
        arrOfStr(p + '.watch', s.watch);
        arrOfStr(p + '.gotcha', s.gotcha);
        (s.tokens || []).forEach(function (tk, j) {
          hit(p + '.tok' + j + '.m', tk, 'm');
          hit(p + '.tok' + j + '.t', tk, 't');
        });
      });
      (l.clinic || []).forEach(function (c, i) {
        var p = prefix + '.cl' + i;
        hit(p + '.err', c, 'err');
        hit(p + '.read', c, 'read');
        hit(p + '.fix', c, 'fix');
      });
      (l.cheat || []).forEach(function (c, i) {
        var p = prefix + '.ch' + i;
        hit(p + '.cmd', c, 'cmd');
        hit(p + '.mean', c, 'mean');
      });
    }

    (global.LX.Days && global.LX.Days.all ? global.LX.Days.all() : []).forEach(function (day) {
      hit(day.id + '.title', day, 'title');
      hit(day.id + '.goal', day, 'goal');
      hit(day.id + '.intro', day, 'intro');
      (day.lessons || []).forEach(function (l) { lesson(l, l.id); });

      (day.gates || []).forEach(function (g) {
        hit(g.id + '.title', g, 'title');
        hit(g.id + '.brief', g, 'brief');
        arrOfStr(g.id + '.hint', g.hints);
        checks(g.id, g.checks);
      });

      if (day.challenge) {
        var c = day.challenge;
        hit(c.id + '.title', c, 'title');
        hit(c.id + '.brief', c, 'brief');
        arrOfStr(c.id + '.hint', c.hints);
        checks(c.id, c.checks);
      }

      if (day.project) {
        var pj = day.project;
        hit(pj.id + '.title', pj, 'title');
        hit(pj.id + '.brief', pj, 'brief');
        (pj.items || []).forEach(function (it) {
          hit(it.id + '.text', it, 'text');
          hit(it.id + '.hint', it, 'hint');
          checks(it.id, it.checks);
        });
      }
    });

    /* 预备课：还没经过 Days.add 规整，小节没有 id，用序号定位 */
    var st = global.LX.Start;
    if (st) {
      hit('d0.title', st, 'title');
      hit('d0.goal', st, 'goal');
      hit('d0.intro', st, 'intro');
      (st.lessons || []).forEach(function (l, i) { lesson(l, 'd0-l' + (i + 1)); });
    }

    ((global.LX.Skills && global.LX.Skills.items) || []).forEach(function (s) {
      hit('sk.' + s.id + '.name', s, 'name');
      hit('sk.' + s.id + '.why', s, 'why');
      hit('sk.' + s.id + '.jobs', s, 'jobs');
    });

    var qd = global.LX.QuizData || {};
    Object.keys(qd).forEach(function (k) {
      (qd[k] || []).forEach(function (q) {
        var p = 'q.' + q.id;
        hit(p + '.q', q, 'q');
        (q.a || []).forEach(function (x, i) { hit(p + '.a' + i, q.a, i); });
        hit(p + '.why', q, 'why');
      });
    });

    var gl = global.LX.Glossary;
    ((gl && gl.items) || []).forEach(function (it) {
      var p = 'gl|' + it.t + '|';
      hit(p + 'm', it, 'm');
      hit(p + 'warn', it, 'warn');
      hit(p + 'read', it, 'read');
      hit(p + 'eg', it, 'eg');
    });
  }

  /** 按当前语言把课程正文整体切一遍（幂等：随时可以再调） */
  function applyContent() {
    var useEn = (lang === 'en');
    var dict = global.LX.EN;
    slots(function (key, holder, field) {
      var zh = srcOf(holder, field);
      if (!useEn) { holder[field] = zh; return; }
      var en = (dict && dict.get) ? dict.get(key) : null;
      holder[field] = en || zh;
    });
  }

  /* ------------------------------- 静态 DOM ------------------------------- */

  var ATTR_MAP = [
    ['data-i18n-title', 'title'],
    ['data-i18n-aria', 'aria-label'],
    ['data-i18n-placeholder', 'placeholder']
  ];

  function applyStatic() {
    var doc = global.document;
    if (!doc || !util || !util.$$) return;

    util.$$('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    util.$$('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    ATTR_MAP.forEach(function (pair) {
      util.$$('[' + pair[0] + ']').forEach(function (el) {
        el.setAttribute(pair[1], t(el.getAttribute(pair[0])));
      });
    });

    if (doc.documentElement) {
      doc.documentElement.setAttribute('data-lang', lang);
      doc.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    }
    doc.title = t('doc.title');
  }

  /** 语言按钮：显示「点它之后会切到哪」，所以中文界面显示 EN，英文界面显示 中 */
  function applyLangBtn() {
    if (!util || !util.$) return;
    var btn = util.$('#btnLang');
    if (!btn) return;
    var key = (lang === 'zh') ? 'top.langToEn' : 'top.langToZh';
    btn.textContent = t('top.langBtn');
    btn.setAttribute('title', t(key));
    btn.setAttribute('aria-label', t(key));
    btn.setAttribute('data-lang', lang);
  }

  /* -------------------------------- 对外的脸 -------------------------------- */

  function emit() {
    listeners.slice().forEach(function (fn) {
      try { fn(lang); } catch (e) { if (global.console && console.error) console.error(e); }
    });
  }

  var API = {
    /* 取词 */
    t: t,
    has: function (key) { return hasKey(key); },
    /** 词典分组名：没有英文就退回数据文件里的中文 */
    groupName: function (id, fallback) {
      return hasKey('group.' + id) ? t('group.' + id) : fallback;
    },
    groupDesc: function (id, fallback) {
      return hasKey('group.' + id + '.desc') ? t('group.' + id + '.desc') : fallback;
    },
    /** 沙盒工作区名（js/sandbox.js 的 scenarioLabel 是中文） */
    scenario: function (id, fallback) {
      return hasKey('scenario.' + id) ? t('scenario.' + id) : fallback;
    },
    /** 能力等级（数据里是「基础 / 进阶 / 工程」） */
    skillLevel: function (level) {
      return hasKey('skill.lv.' + level) ? t('skill.lv.' + level) : level;
    },

    /* 语言状态 */
    lang: function () { return lang; },
    isEn: function () { return lang === 'en'; },

    /** 应用当前语言到 DOM + 课程数据（不触发重渲染） */
    apply: function () {
      applyContent();
      applyStatic();
      applyLangBtn();
    },

    /**
     * 课程正文的翻译状态：[{ key, zh, en }]（tools/check-en.js 用）
     * zh 永远是中文原文，en 缺省为 null = 漏翻。
     */
    contentSlots: function () {
      var out = [];
      slots(function (key, holder, field) {
        var dict = global.LX.EN;
        out.push({
          key: key,
          zh: srcOf(holder, field),
          en: (dict && dict.get) ? dict.get(key) : null
        });
      });
      return out;
    },

    /**
     * 切语言
     * @param {'zh'|'en'} next
     * @param {{persist?:boolean, notify?:boolean}} [opts]
     */
    setLang: function (next, opts) {
      var want = normalize(next);
      var changed = want !== lang;
      lang = want;
      if (!opts || opts.persist !== false) {
        if (LX.Progress && LX.Progress.saveSettings) {
          var patch = {};
          patch[LANG_KEY] = lang;
          LX.Progress.saveSettings(patch);
        }
      }
      API.apply();
      if (changed && (!opts || opts.notify !== false)) emit();
      return lang;
    },

    toggle: function () { return API.setLang(lang === 'zh' ? 'en' : 'zh'); },

    /** 语言变了要重渲染的模块订阅这里；返回取消订阅函数 */
    onChange: function (fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    /** app boot 时调用一次：读设置里的语言并首次应用（中文原文先入 __zh 快照） */
    init: function () {
      var saved = (LX.Progress && LX.Progress.settings) ? LX.Progress.settings()[LANG_KEY] : '';
      lang = normalize(saved || DEFAULT_LANG);
      API.apply();
      return lang;
    }
  };

  LX.I18N = API;
})(window);
