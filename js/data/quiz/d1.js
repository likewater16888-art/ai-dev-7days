/* =============================================================================
 * js/data/quiz/d1.js —— Day 1 自测（8 题）
 * 每条：{ id, q, a[4], right(0-3), why, skill }
 * skill 对应 js/data/skills.js 里的能力项
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d1 = [
    {
      id: 'q-d1-01',
      q: 'pwd 输出 /home/student，这说明了什么？',
      a: ['你现在在系统根目录 /', '你当前的绝对路径是 /home/student', '你的主目录是空的', '你还没有创建任何目录'],
      right: 1,
      why: 'pwd = print working directory，打印的是"当前所在目录的绝对路径"。',
      skill: 'fs-nav'
    },
    {
      id: 'q-d1-02',
      q: '要一次建出 ~/work/exp1/data，且目录已存在时不报错，应该用哪条？',
      a: ['mkdir ~/work/exp1/data', 'mkdir -p ~/work/exp1/data', 'touch ~/work/exp1/data', 'cp ~/work/exp1/data'],
      right: 1,
      why: '-p 是 parents：父目录不存在会一起建，已存在也静默通过，所以可以重复执行。',
      skill: 'fs-nav'
    },
    {
      id: 'q-d1-03',
      q: 'echo "A" > note.md 然后 echo "B" > note.md，note.md 里是什么？',
      a: ['两行：A 和 B', '只有 B', '只有 A', '报错，文件已存在'],
      right: 1,
      why: '> 是覆盖写；要追加必须用 >>。这是"我的笔记只剩一行"事故的头号原因。',
      skill: 'safe-write'
    },
    {
      id: 'q-d1-04',
      q: 'cp requirements.txt ~/work/exp1/ 执行成功后，原件去哪了？',
      a: ['被移动到 exp1 目录', '还在原位，exp1 里多了一份副本', '被删除了', '被改名成 exp1'],
      right: 1,
      why: 'cp 是复制，mv 才是移动。复制=两个地方都有。',
      skill: 'safe-write'
    },
    {
      id: 'q-d1-05',
      q: 'tree -L 2 里的 -L 是什么意思？',
      a: ['列出隐藏文件', '限制往下看的层数', '按大小排序', '显示行号'],
      right: 1,
      why: '-L 是 level/limit：限制递归深度，防止在超大目录里刷屏。',
      skill: 'fs-nav'
    },
    {
      id: 'q-d1-06',
      q: 'cat data/ 会怎样（data 是一个目录）？',
      a: ['打印目录里所有文件内容', '报 Is a directory', '什么也不输出', '自动改成 ls'],
      right: 1,
      why: 'cat 只能读文件；目录要用 ls。这个报错是在提醒你"你把它当文件用了"。',
      skill: 'fs-nav'
    },
    {
      id: 'q-d1-07',
      q: '你在 ~ 下执行 cat data/train.csv 能读到文件。cd ~/work 之后同一句会怎样？',
      a: ['还能读到，cat 会记住上次路径', '报 No such file or directory，因为相对路径变了', '自动去 ~ 找', '读到 ~/work/data/train.csv'],
      right: 1,
      why: '相对路径以"当前目录"为基准。位置一变，同一句话指向的地方就变了——这是新手最常见的"文件不见了"。',
      skill: 'fs-nav'
    },
    {
      id: 'q-d1-08',
      q: '为什么要把实验放在 ~/work/exp1，而不是直接在项目根目录里改？',
      a: ['因为根目录不能写', '为了原始材料只读、实验可丢弃可复现', '因为 exp1 这个名字有特殊含义', '为了省磁盘空间'],
      right: 1,
      why: '原始材料只读 + 实验独立，才能做到"删掉重跑"和"交接时一整套"。',
      skill: 'deliver'
    }
  ];
})(window);
