/* =============================================================================
 * js/data/quiz/d3.js —— Day 3 自测（8 题）
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d3 = [
    {
      id: 'q-d3-01',
      q: '执行 python check_env.py > env.md 后屏幕上什么都没有，为什么？',
      a: ['脚本没执行', '标准输出被重定向进 env.md 了', '脚本报错了', 'python 不支持重定向'],
      right: 1,
      why: '> 把 stdout 改道到文件，所以屏幕上没有输出。这不代表没跑。',
      skill: 'perm-log'
    },
    {
      id: 'q-d3-02',
      q: '重定向后 env.md 是空的，最可能的原因？',
      a: ['文件权限不够', '程序把内容写到了 stderr，而 > 只接 stdout', 'python 没装', '路径写错了'],
      right: 1,
      why: '> 只接标准输出。报错走 stderr，要 `> out.txt 2>&1` 才一起收。',
      skill: 'perm-log'
    },
    {
      id: 'q-d3-03',
      q: 'grep -n ERROR app.log 输出的 "5:...ERROR..." 里的 5 是什么？',
      a: ['错误码 5', '这条日志在文件里的第 5 行', '匹配到 5 次', '进程号'],
      right: 1,
      why: '-n 打行号。带行号的证据在沟通和复核时最有用。',
      skill: 'perm-log'
    },
    {
      id: 'q-d3-04',
      q: 'tail -n 5 app.log 看到什么？',
      a: ['前 5 行', '最后 5 行', '第 5 行', '第 5 行之后的所有内容'],
      right: 1,
      why: 'tail 看末尾；head 看开头。报错通常出现在最后。',
      skill: 'perm-log'
    },
    {
      id: 'q-d3-05',
      q: '为什么写三行笔记推荐 printf 而不是 echo？',
      a: ['printf 更短', 'printf 会解释 \\n 成换行，echo 在部分 shell 里不会', 'echo 不能写文件', 'printf 会自动加时间'],
      right: 1,
      why: 'printf 支持格式化（\\n 转义），跨 shell 一致；这也是三行结论能一次写成的原因。',
      skill: 'troubleshoot'
    },
    {
      id: 'q-d3-06',
      q: '一份合格排障结论必须包含哪三部分？',
      a: ['时间、地点、人物', '现象、原因、证据', '命令、参数、输出', '版本、环境、路径'],
      right: 1,
      why: '现象（用户看到什么）/ 原因（为什么）/ 证据（哪一行能证明），缺一不可。',
      skill: 'troubleshoot'
    },
    {
      id: 'q-d3-07',
      q: 'error.txt 是空文件，说明了什么？',
      a: ['grep 命令写错了', 'ERROR 不在这个文件里，或筛选条件不对', '文件被删了', '权限不足'],
      right: 1,
      why: 'grep 没命中也会创建空文件（因为 > 先创建）。空文件比没有文件更容易误导人。',
      skill: 'perm-log'
    },
    {
      id: 'q-d3-08',
      q: '日志里有 3 条 INFO 和 1 条 ERROR，最合理的判断是？',
      a: ['启动就失败了', '启动流程走完了，问题出在请求处理阶段', '日志文件坏了', '需要重装环境'],
      right: 1,
      why: '启动阶段的 INFO 都齐了才出现 ERROR，说明服务起来了、处理请求时超时——排查方向完全不同。',
      skill: 'troubleshoot'
    }
  ];
})(window);
