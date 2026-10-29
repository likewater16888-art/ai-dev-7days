/* =============================================================================
 * js/data/quiz/d4.js —— Day 4 自测（8 题）
 * ========================================================================== */
(function (global) {
  'use strict';
  var LX = global.LX = global.LX || {};
  LX.QuizData = LX.QuizData || {};

  LX.QuizData.d4 = [
    {
      id: 'q-d4-01',
      q: 'conda create -n ai7 python=3.10 -y 里 -n 的作用是？',
      a: ['不要询问确认', '指定环境名', '指定 Python 版本', '安装到系统目录'],
      right: 1,
      why: '-n = name（环境名）；-y = yes（自动确认）；python=3.10 才是版本。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-02',
      q: 'conda activate ai7 之后，which python 应该指向哪？',
      a: ['/usr/bin/python', '…/envs/ai7/bin/python', 'base 环境的 python', '哪个都行'],
      right: 1,
      why: '激活的本质就是把 ai7 的 bin 目录放到 PATH 前面。which python 是最便宜的环境检查。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-03',
      q: '忘记激活环境就 pip install torch，会发生什么？',
      a: ['会提示你先激活', '装进 base（或系统 Python），项目环境里仍然没有', '自动装到 ai7', '安装失败'],
      right: 1,
      why: 'pip 跟着当前 python 走。没激活 = 装错地方，这也是 ModuleNotFoundError 的头号原因。',
      skill: 'troubleshoot'
    },
    {
      id: 'q-d4-04',
      q: 'pip install -r requirements.txt 的含义是？',
      a: ['安装名为 requirements.txt 的包', '按清单文件安装所有依赖', '只检查不安装', '升级 pip 自己'],
      right: 1,
      why: '-r = requirements，后面跟清单文件路径。少了 -r 会把文件名当包名。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-05',
      q: 'environment.yml 和 requirements.lock.txt 的主要区别是？',
      a: ['完全一样，只是名字不同', '前者给 conda（含 Python 版本/非 Python 依赖），后者给 pip（精确包版本）', '前者给人看，后者给机器看', '后者更旧'],
      right: 1,
      why: '两份清单各管一段：conda 管解释器和系统级依赖，pip 管 PyPI 包的精确版本。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-06',
      q: 'pip list 里已经有 torch，为什么还要跑 python -c "print(torch.__version__)"？',
      a: ['为了看版本号更准', '"装上了"和"能 import"是两件事，后者才代表能用', '为了省磁盘', '为了让 pip 重启'],
      right: 1,
      why: '缺 CUDA 库、ABI 不匹配时 install 会成功但 import 会炸。验证必须跑一次 import。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-07',
      q: 'conda env export > environment.yml 导出的是哪个环境？',
      a: ['所有环境', '当前激活的那个', 'base', '最近创建的那个'],
      right: 1,
      why: '它导出"当前激活环境"。没激活就导出 base——所以先 conda activate ai7。',
      skill: 'env-repro'
    },
    {
      id: 'q-d4-08',
      q: '为什么不在 base 环境里直接装项目依赖？',
      a: ['base 不能装包', '不同项目版本需求会打架，且 base 坏了整套环境都受影响', 'base 里装包更慢', 'base 只支持 Python 2'],
      right: 1,
      why: '一个项目一个环境：版本隔离 + 坏了可删可重建 + 能导出复现。',
      skill: 'env-repro'
    }
  ];
})(window);
