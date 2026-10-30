/* =============================================================================
 * js/data/en.js
 * -----------------------------------------------------------------------------
 * 英文内容词典：课程正文（讲解 / 逐字拆解 / 关卡 / 自测 / 词典）的英文版。
 *
 * 这里只放「登记与查询」的机制，正文在 js/data/en/*.js：
 *   js/data/en/d0.js … d7.js   每天一页（讲解、命令卡、关卡、挑战、项目）
 *   js/data/en/quiz.js         56 道自测题
 *   js/data/en/glossary.js     命令词典 200+ 条
 *
 * 表的样子是「位置 → 英文」，key 由 js/i18n.js 的 slots() 统一生成，
 * 换语言时它遍历课程数据，把每个中文字符串按位置换成英文（切回中文再换回来）：
 *
 *   'd1.title'          Day 1 的标题
 *   'd1-l1.body'        第 1 节的正文（Markdown）
 *   'd1-l1.s2.say'      第 1 节第 3 条命令的讲解
 *   'd1-l1.s2.tok0.m'   那条命令第 1 个零件的解释
 *   'd1-g1.why0'        关卡第 1 条检查项在查什么
 *   'd1-c1.hint0'       闭卷挑战第 1 条提示
 *   'q.q-d1-01.a1'      自测题第 2 个选项
 *   'gl|pwd|m'          词典里 pwd 的含义
 *
 * 漏翻的位置不会报错，会原样显示中文；tools/check-en.js 会把漏翻的、以及
 * 已经失效（数据改过、key 对不上）的条目都列出来，两边都必须为 0。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  var MAP = {};

  var EN = {
    /** 取一条译文；没登记 / 空串都算「没翻」 */
    get: function (key) {
      if (!Object.prototype.hasOwnProperty.call(MAP, key)) return null;
      var s = MAP[key];
      return (typeof s === 'string' && s) ? s : null;
    },

    has: function (key) {
      return !!EN.get(key);
    },

    /**
     * 登记一批译文：{ 位置: English }
     * js/data/en/*.js 在加载时调用它，顺序无关。
     * 同一个 key 登记两次时后者覆盖前者（方便按页拆文件）。
     */
    add: function (obj) {
      if (!obj) return EN;
      Object.keys(obj).forEach(function (k) {
        var v = obj[k];
        if (typeof v === 'string' && v) MAP[k] = v;
      });
      return EN;
    },

    /** 已登记多少条（检查脚本会用到） */
    size: function () { return Object.keys(MAP).length; },

    all: function () { return MAP; }
  };

  LX.EN = EN;
})(window);
