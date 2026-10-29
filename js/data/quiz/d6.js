/* =============================================================================
 * js/data/quiz/d6.js —— Day 6 自测（8 题）
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d6 = [
    {
      id: 'q-d6-01',
      q: '服务进程在跑，但 nvidia-smi 显存是 0 MiB，最可能是？',
      a: ['显卡坏了', '模型没用上卡（cuda 不可用，回退 CPU）', '显存太小', 'nvidia-smi 版本旧'],
      right: 1,
      why: '进程在 ≠ 用了 GPU。0 MiB 说明权重没上卡，日志里常能看到 cuda not available。',
      skill: 'gpu-observe'
    },
    {
      id: 'q-d6-02',
      q: 'nohup python app.py > serve.log 2>&1 & 里 2>&1 的作用是？',
      a: ['运行两次', '把标准错误并进标准输出，一起写进日志', '把日志复制一份', '让进程优先级更高'],
      right: 1,
      why: '不写 2>&1，报错会跑到终端而不是日志，服务崩了你会"什么也没看见"。',
      skill: 'ops-cleanup'
    },
    {
      id: 'q-d6-03',
      q: 'ps aux | grep python 的结果里为什么常出现一行 grep python？',
      a: ['说明服务起了两份', 'grep 自己的进程也被 ps 列出来了', 'python 有两个版本', 'ps 的 bug'],
      right: 1,
      why: 'grep 进程的命令行里含 "python"，所以它自己也命中。判断服务是否在跑要排除这一行。',
      skill: 'ops-cleanup'
    },
    {
      id: 'q-d6-04',
      q: 'pkill 杀掉服务后，nvidia-smi 显示显存没降，最合理的解释？',
      a: ['显存永远不会释放', '驱动释放有延迟，或进程处于不可中断状态', 'nvidia-smi 缓存了旧数据', '必须重装驱动'],
      right: 1,
      why: '杀进程不等于立刻释放显存。要再确认一次；实在不释放才考虑重启。',
      skill: 'gpu-observe'
    },
    {
      id: 'q-d6-05',
      q: 'nvidia-smi --query-gpu=memory.used --format=csv 最适合做什么？',
      a: ['给人看的面板', '机器可读的显存数值，便于存证/监控', '重启 GPU', '查看驱动版本'],
      right: 1,
      why: '--query-gpu 只给字段值，--format=csv 便于重定向到文件或被监控系统解析。',
      skill: 'gpu-observe'
    },
    {
      id: 'q-d6-06',
      q: 'tail -f run.log 的 -f 是什么意思？',
      a: ['强制覆盖', '持续跟随文件新增内容', '只看第一行', '按时间过滤'],
      right: 1,
      why: '-f = follow：日志还在写的时候最有用，Ctrl+C 退出。',
      skill: 'perm-log'
    },
    {
      id: 'q-d6-07',
      q: '为什么显存快照要在服务跑起来之后存？',
      a: ['因为文件会覆盖', '服务起来后显存才被占用，先存只会得到 0', '因为要等驱动加载', '因为 nvidia-smi 需要预热'],
      right: 1,
      why: '存证的意义是"证明服务占了卡"。顺序反了，证据就没有证明力。',
      skill: 'troubleshoot'
    },
    {
      id: 'q-d6-08',
      q: 'pkill -f python 有什么风险？',
      a: ['没有风险', '会把同一台机器上所有 python 进程（包括别人的任务）一起杀掉', '只会杀第一个', '需要 sudo 才能用'],
      right: 1,
      why: '-f 匹配整条命令行，范围太大。要精确到脚本名：pkill -f app.py。',
      skill: 'ops-cleanup'
    }
  ];
})(window);
