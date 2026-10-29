/* =============================================================================
 * js/progress.js（v2 · ai-dev-7days）
 * -----------------------------------------------------------------------------
 * 学习进度（localStorage 持久化）
 *
 * v2 与 v1（Linux 版）的差别：
 *   · 进度的单位从「知识点」变成「关卡（Gate）」——只有验证通过才算学会
 *   · 记录每次验证的时间与尝试次数，结业报告要用
 *   · localStorage 键改成 ai7_*，两套课程装在同一浏览器也不会互相覆盖
 *
 * 数据结构：
 *   {
 *     gates:   { gateId: { ok:true, passes:2, fails:1, at:1690000000000 } },
 *     lessons: { lessonId: true },
 *     lastDay: 'd3'
 *   }
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  var KEY_PROGRESS = 'ai7_progress_v1';
  var KEY_SETTINGS = 'ai7_settings_v1';

  /** 空白进度（每次返回新对象，避免 PROGRESS_DEFAULT 的嵌套对象被就地改写） */
  function blank() {
    return { gates: {}, lessons: {}, quiz: {}, hints: {}, lastDay: 'd1' };
  }

  /** 设置：主题 + 报告里用的名字 + 终端面板尺寸（可选，只存本地） */
  var SETTINGS_DEFAULT = {
    theme: 'dark',
    name: '',
    /* w/h = 面板像素尺寸（0 表示用 CSS 默认值）；fs = 终端字号；full = 是否全屏 */
    term: { w: 0, h: 0, fs: 0, full: false }
  };

  function merge(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  var state = merge(blank(), util.storage.get(KEY_PROGRESS, {}));
  if (!state.gates) state.gates = {};
  if (!state.lessons) state.lessons = {};
  if (!state.quiz) state.quiz = {};
  if (!state.hints) state.hints = {};
  var settings = merge(SETTINGS_DEFAULT, util.storage.get(KEY_SETTINGS, {}));
  if (!settings.term) settings.term = merge(SETTINGS_DEFAULT.term, {});

  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { /* 单个订阅出错不影响其它 */ }
    });
  }

  function save() { util.storage.set(KEY_PROGRESS, state); }

  var Progress = {
    /** 订阅变化（侧边栏 / 进度环 / 关卡状态） */
    onChange: function (fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    /* ------------------------------ 关卡状态 ------------------------------ */

    gateStat: function (gateId) {
      return state.gates[gateId] || { ok: false, passes: 0, fails: 0, at: 0 };
    },

    isGatePassed: function (gateId) {
      return !!Progress.gateStat(gateId).ok;
    },

    /**
     * 记录一次验证结果（Gate.evaluate 的返回值）
     * @return {{ok:boolean, passes:number, fails:number, first:boolean}}
     */
    recordGate: function (result) {
      if (!result || !result.id) return null;
      var rec = Progress.gateStat(result.id);
      var first = false;
      if (result.ok) {
        first = !state.gates[result.id];
        rec.ok = true;
        rec.passes = (rec.passes || 0) + 1;
        rec.at = result.at || Date.now();
      } else {
        rec.fails = (rec.fails || 0) + 1;
      }
      state.gates[result.id] = rec;
      save();
      emit();
      return { ok: !!result.ok, passes: rec.passes, fails: rec.fails, first: first };
    },

    /* ------------------------------ 小节状态 ------------------------------ */

    isLessonDone: function (lessonId) {
      return !!state.lessons[lessonId];
    },

    toggleLesson: function (lessonId) {
      if (state.lessons[lessonId]) delete state.lessons[lessonId];
      else state.lessons[lessonId] = true;
      save();
      emit();
      return Progress.isLessonDone(lessonId);
    },

    /* ------------------------------- 自测题 ------------------------------- */

    /**
     * 记录一次答题。ok=false 也写进去（错题本靠它），但只统计"最后一次是否对"
     * @param {string} qid  题目 id（如 q-d1-03）
     * @param {boolean} ok  这次答对了吗
     */
    recordQuiz: function (qid, ok) {
      var rec = state.quiz[qid] || { ok: false, tries: 0, right: 0 };
      rec.tries += 1;
      if (ok) rec.right += 1;
      rec.ok = !!ok;
      rec.at = Date.now();
      state.quiz[qid] = rec;
      save();
      emit();
      return rec;
    },

    quizStat: function (qid) {
      var rec = state.quiz[qid];
      return rec ? { ok: !!rec.ok, tries: rec.tries || 0, right: rec.right || 0, at: rec.at || 0 }
        : { ok: false, tries: 0, right: 0, at: 0 };
    },

    /** 某天的答题汇总：{total, answered, right, pct} */
    quizSummary: function (dayId) {
      var quiz = (LX.Quiz && LX.Quiz.of) ? LX.Quiz.of(dayId) : [];
      var answered = 0, right = 0;
      quiz.forEach(function (q) {
        var s = Progress.quizStat(q.id);
        if (s.tries > 0) answered += 1;
        if (s.ok) right += 1;
      });
      return {
        total: quiz.length,
        answered: answered,
        right: right,
        pct: util.pct(right, quiz.length),
        done: quiz.length > 0 && right === quiz.length
      };
    },

    /** 全站答题汇总 */
    quizOverall: function () {
      var total = 0, answered = 0, right = 0;
      LX.Days.all().forEach(function (d) {
        var s = Progress.quizSummary(d.id);
        total += s.total; answered += s.answered; right += s.right;
      });
      return { total: total, answered: answered, right: right, pct: util.pct(right, total) };
    },

    /** 错题 id 列表（答错过且最后一次仍未答对） */
    wrongIds: function () {
      var out = [];
      Object.keys(state.quiz).forEach(function (id) {
        if (!state.quiz[id].ok) out.push(id);
      });
      return out;
    },

    /* ------------------------------ 提示使用 ------------------------------ */

    /** 点了「我要提示」就记一笔，报告里会标注「借助提示通过」 */
    markHint: function (id) {
      state.hints[id] = (state.hints[id] || 0) + 1;
      save();
      emit();
      return state.hints[id];
    },

    hintCount: function (id) { return state.hints[id] || 0; },

    hintsUsed: function () {
      return Object.keys(state.hints).filter(function (k) { return state.hints[k] > 0; });
    },

    /* ------------------------------- 统计 ------------------------------- */

    /** 某一天的关卡完成情况 */
    dayStat: function (dayId) {
      var day = LX.Days.get(dayId);
      if (!day) return { done: 0, total: 0, pct: 0, passed: false };
      var done = day.gates.filter(function (g) { return Progress.isGatePassed(g.id); }).length;
      return {
        done: done,
        total: day.gates.length,
        pct: util.pct(done, day.gates.length),
        passed: done === day.gates.length
      };
    },

    /** 全站完成情况（按关卡算） */
    overall: function () {
      var gates = LX.Days.gates();
      var done = gates.filter(function (g) { return Progress.isGatePassed(g.id); }).length;
      return {
        done: done,
        total: gates.length,
        pct: util.pct(done, gates.length),
        passed: gates.length > 0 && done === gates.length
      };
    },

    /** 通关的天数 */
    daysPassed: function () {
      return LX.Days.all().filter(function (d) { return Progress.dayStat(d.id).passed; }).length;
    },

    /** 尝试次数总和（报告里体现「练了多少次」） */
    attempts: function () {
      var passes = 0, fails = 0;
      Object.keys(state.gates).forEach(function (id) {
        passes += state.gates[id].passes || 0;
        fails += state.gates[id].fails || 0;
      });
      return { passes: passes, fails: fails, total: passes + fails };
    },

    /* --------------------------- 视图状态记忆 --------------------------- */

    getLastDay: function () { return state.lastDay || 'd1'; },

    setLastDay: function (dayId) {
      state.lastDay = dayId;
      save();
    },

    hasVisited: function () { return !!util.storage.get(KEY_PROGRESS, null); },

    /* ------------------------------ 设置 ------------------------------- */

    settings: function () { return settings; },

    saveSettings: function (patch) {
      settings = merge(settings, patch || {});
      util.storage.set(KEY_SETTINGS, settings);
      return settings;
    },

    /* ------------------------------ 重置 ------------------------------- */

    resetAll: function () {
      state = blank();
      util.storage.remove(KEY_PROGRESS);
      emit();
    }
  };

  LX.Progress = Progress;
})(window);
