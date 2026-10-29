/* =============================================================================
 * js/data/skills.js
 * -----------------------------------------------------------------------------
 * 能力矩阵：把「关卡 + 自测题」翻译成岗位能力。
 *
 *   gates 这个能力由哪些关卡的**真实终态**证明
 *   quiz  这个能力由哪些自测题证明（题里写了 skill 字段，自动归属）
 *   jobs  这个能力在招聘要求里大概长什么样（写给人看的）
 *
 * 报告里每个能力的状态：
 *   proven  该能力的关卡全过，且相关自测题至少答对一题
 *   partial 只有部分证据
 *   none    还没有证据
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  var ITEMS = [
    {
      id: 'fs-nav',
      name: '目录导航与路径',
      level: '基础',
      why: '说得出"我现在在哪"，能用相对/绝对路径准确指到文件',
      gates: ['d1-g1'],
      jobs: '所有技术岗的第一道门槛：找得到数据、日志、配置'
    },
    {
      id: 'safe-write',
      name: '文件写入与复制',
      level: '基础',
      why: '知道 > 与 >> 的区别、cp 与 mv 的区别，不会覆盖掉自己的笔记',
      gates: ['d1-g3', 'd2-g1'],
      jobs: '数据副本管理、实验产物归档'
    },
    {
      id: 'data-inspect',
      name: '数据体检',
      level: '基础',
      why: '能用 head/wc/grep 说清一份数据的规模与标签分布，并写成文件',
      gates: ['d2-g2', 'd2-g3'],
      jobs: '数据工程 / 算法工程的日常：先看懂数据再谈模型'
    },
    {
      id: 'perm-log',
      name: '权限与日志定位',
      level: '进阶',
      why: '能用 grep -n 带行号定位报错，理解 stdout/stderr 与重定向',
      gates: ['d3-g1', 'd3-g2'],
      jobs: '线上问题定位、日志取证'
    },
    {
      id: 'troubleshoot',
      name: '排障方法论',
      level: '进阶',
      why: '能写出「现象 / 原因 / 证据」三行结论，让人能复核',
      gates: ['d3-g3', 'd6-g3'],
      jobs: '故障复盘、值班响应、技术沟通'
    },
    {
      id: 'env-repro',
      name: '环境隔离与可复现',
      level: '进阶',
      why: '一个项目一个 conda 环境，能导出 environment.yml + lock 让别人复现',
      gates: ['d4-g1', 'd4-g2', 'd4-g3'],
      jobs: 'AI 工程岗硬要求：环境能重建、结果能复现'
    },
    {
      id: 'git-basics',
      name: '版本管理',
      level: '进阶',
      why: '能走完 status → add → commit → log 闭环，提交信息可读，工作区干净',
      gates: ['d5-g1', 'd5-g2', 'd5-g3'],
      jobs: '团队协作的基本盘；面试常问"你怎么管理实验版本"'
    },
    {
      id: 'gpu-observe',
      name: 'GPU 与显存观测',
      level: '进阶',
      why: '读得懂 nvidia-smi，会只查指定字段并存证，能判断模型是否真上了卡',
      gates: ['d6-g1', 'd6-g2'],
      jobs: '模型部署 / 推理服务的入门能力'
    },
    {
      id: 'ops-cleanup',
      name: '进程与收尾',
      level: '进阶',
      why: '会后台起服务、会精确杀进程，知道"杀进程 ≠ 立刻释放显存"',
      gates: ['d6-g1'],
      jobs: '共享 GPU 机器的基本素养：用完把卡让出来'
    },
    {
      id: 'deliver',
      name: '交付与文档',
      level: '工程',
      why: '能给出一页 README：怎么装、怎么跑、模型哪来，端口写得清楚',
      gates: ['d1-g2', 'd7-g1', 'd7-g2', 'd7-g3'],
      jobs: '能独立交付一个小型 AI 应用，是"能上岗"的分水岭'
    },
    {
      id: 'ownership',
      name: '项目闭环能力',
      level: '工程',
      why: '结业项目的 4 项能全部自动通过：模型落盘、入口可点、说明完整、有运行证据',
      gates: [],
      jobs: '简历里能写"独立完成并交付一个可运行的情感分类 demo"'
    }
  ];

  var INDEX = {};
  ITEMS.forEach(function (s) { INDEX[s.id] = s; });

  LX.Skills = {
    items: ITEMS,
    count: function () { return ITEMS.length; },
    get: function (id) { return INDEX[id] || null; },
    byLevel: function (level) {
      return ITEMS.filter(function (s) { return s.level === level; });
    },
    /** 某一天覆盖了哪些能力（按关卡 + 自测题归属算） */
    ofDay: function (dayId) {
      var out = [];
      ITEMS.forEach(function (s) {
        var byGate = s.gates.some(function (gid) { return gid.indexOf(dayId + '-') === 0; });
        var quiz = (LX.Quiz ? LX.Quiz.of(dayId) : []).some(function (q) { return q.skill === s.id; });
        if (byGate || quiz) out.push(s.id);
      });
      return out;
    }
  };
})(window);
