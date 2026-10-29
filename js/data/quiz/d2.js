/* =============================================================================
 * js/data/quiz/d2.js —— Day 2 自测（8 题）
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d2 = [
    {
      id: 'q-d2-01',
      q: 'wc -l train.csv 输出 "6 train.csv"，这份数据有几条样本？',
      a: ['6 条', '5 条（6 行 = 1 表头 + 5 条）', '7 条', '无法判断'],
      right: 1,
      why: 'wc -l 数的是行数，包含表头。写报告时要说"5 条样本"，这个 +1/-1 是数据报告最常见的错。',
      skill: 'data-inspect'
    },
    {
      id: 'q-d2-02',
      q: 'grep -c 的作用是什么？',
      a: ['显示匹配行的行号', '只输出匹配到的行数', '忽略大小写', '反向匹配'],
      right: 1,
      why: '-c = count，只要数量不要内容；-n 才是行号。',
      skill: 'data-inspect'
    },
    {
      id: 'q-d2-03',
      q: "模式 ',1$' 里的 $ 表示什么？",
      a: ['匹配文件结尾', '匹配行尾（所以不会把 ,10 算进来）', '变量替换', '代表当前目录'],
      right: 1,
      why: '$ 是正则的行尾锚点。不加它，",1" 会把 ",10"、",11" 也匹配进来。',
      skill: 'data-inspect'
    },
    {
      id: 'q-d2-04',
      q: 'grep 一行都没匹配到时会怎样？',
      a: ['退出码 1，输出为空；这不是命令坏了', '命令报错退出并打印堆栈', '自动返回 0', '会把文件清空'],
      right: 0,
      why: '"没找到"和"命令失败"都返回非 0，所以脚本里要区分：grep 的 1 通常代表无匹配。',
      skill: 'perm-log'
    },
    {
      id: 'q-d2-05',
      q: '想把 data/labels.txt 复制到实验目录并改名成 labels.md，正确的是？',
      a: ['cp data/labels.txt ~/work/exp1/data/', 'cp data/labels.txt ~/work/exp1/data/labels.md', 'mv data/labels.txt labels.md', 'cp -r data/labels.txt labels.md'],
      right: 1,
      why: '目标写成完整文件名 = 复制并改名；写成目录/ 则保留原名。',
      skill: 'safe-write'
    },
    {
      id: 'q-d2-06',
      q: '为什么数据体检结论要写进 health.md，而不是留在终端里？',
      a: ['文件比屏幕好看', '终端输出关掉就没了，文件能复核、能交接', '因为关卡要求写文件', '写文件更快'],
      right: 1,
      why: '工程判断要可以复核。文件是证据，终端输出只是过程。',
      skill: 'deliver'
    },
    {
      id: 'q-d2-07',
      q: 'health.md 里必须写清的两类信息是什么？',
      a: ['文件名和创建时间', '数据规模（几条样本）和标签分布（正负各几条）', '用什么命令生成的', '作者的姓名'],
      right: 1,
      why: '规模 + 分布，是别人判断"这份数据能不能用"的最小信息集。',
      skill: 'data-inspect'
    },
    {
      id: 'q-d2-08',
      q: 'head -3 data/train.csv 的输出里第一行通常是什么？',
      a: ['第一条样本', '表头（列名）', '文件路径', '总行数'],
      right: 1,
      why: 'CSV 第一行一般是列名（text,label）。看数据先看表头，才知道每列是什么。',
      skill: 'data-inspect'
    }
  ];
})(window);
