/* =============================================================================
 * js/data/quiz/d5.js —— Day 5 自测（8 题）
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d5 = [
    {
      id: 'q-d5-01',
      q: 'git status 主要告诉你什么？',
      a: ['代码有没有 bug', '当前分支、已修改/已暂存/未跟踪的文件', '谁是仓库作者', '代码行数'],
      right: 1,
      why: 'status 是地图：你在哪个分支、哪些改动已暂存、哪些还没被 Git 管。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-02',
      q: 'git add 和 git commit 的分工是？',
      a: ['add 上传到 GitHub，commit 打包', 'add 把改动放进暂存区，commit 给暂存区拍快照并写说明', '两者完全等价', 'add 只能加新文件'],
      right: 1,
      why: '工作区 →(add)→ 暂存区 →(commit)→ 历史。两步分开是为了让你能挑选"这次提交什么"。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-03',
      q: '下面哪条提交信息最好？',
      a: ['update', 'fix bug', 'exp: baseline 0.86（numpy 版逻辑回归）', '1'],
      right: 2,
      why: '好提交信息 = 类型 + 具体做了什么/结果多少。三个月后你还看得懂。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-04',
      q: '.gitignore 的作用是？',
      a: ['删除这些文件', '让 Git 永远忽略这些文件（不进版本控制）', '加密这些文件', '自动备份它们'],
      right: 1,
      why: '模型权重、数据、日志、密钥都该被忽略：体积大 / 会变 / 不能外泄。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-05',
      q: 'git remote -v 里的 origin 是什么？',
      a: ['必须叫这个名字的关键字', '默认的远端名字（约定俗成，可改）', '你的用户名', '当前分支名'],
      right: 1,
      why: 'origin 只是"默认远端"的约定名字；真正重要的是它指向的 URL。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-06',
      q: 'git status 显示 working tree clean 意味着？',
      a: ['仓库为空', '没有未提交的改动，工作区与最新提交一致', '所有文件都被忽略了', '远端已经同步'],
      right: 1,
      why: '干净 = 你看到的文件就是历史里的样子。是否推送到远端是另一回事。',
      skill: 'git-basics'
    },
    {
      id: 'q-d5-07',
      q: '下面哪一项**不应该**提交进 Git？',
      a: ['README.md', 'requirements.txt', '几 GB 的模型权重和 .log 日志', '源代码 app.py'],
      right: 2,
      why: '判据：能不能由代码 + 数据重新生成？能，就别提交（放 .gitignore）。',
      skill: 'deliver'
    },
    {
      id: 'q-d5-08',
      q: 'git log --oneline 的每一行包含什么？',
      a: ['完整 diff', '短哈希 + 提交信息', '文件名列表', '作者的邮箱'],
      right: 1,
      why: '一行 = 短哈希 + 提交信息，用来快速看历史；要细节用 git show 哈希。',
      skill: 'git-basics'
    }
  ];
})(window);
