/* =============================================================================
 * js/quiz.js
 * -----------------------------------------------------------------------------
 * 当天自测题：每题只有一个正确答案 + 一句解释。
 *
 *   LX.Quiz.of(dayId)        某天的题（数据在 js/data/quiz/dN.js）
 *   LX.Quiz.renderDay(id, el) 渲染到页面里
 *   LX.Quiz.wrong()          错题本：[{ dayId, q, stat }]
 *   LX.Quiz.stat(dayId)      正确率
 *
 * 答题结果写进 Progress.quiz（recordQuiz），刷新页面还在。
 * 数据格式：
 *   LX.QuizData.d1 = [ { id, q, a:[4 个选项], right:0, why:'为什么', skill:'skill-id' } ]
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  /** 界面文案（js/i18n.js） */
  function t(key, vars) {
    return (LX.I18N && LX.I18N.t) ? LX.I18N.t(key, vars) : String(key);
  }

  function store() { return LX.QuizData || {}; }

  function dayIds() {
    var out = [];
    if (LX.Days) LX.Days.all().forEach(function (d) { out.push(d.id); });
    Object.keys(store()).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); });
    return out;
  }

  function find(id) {
    var s = store();
    var keys = Object.keys(s);
    for (var i = 0; i < keys.length; i++) {
      var list = s[keys[i]] || [];
      for (var j = 0; j < list.length; j++) {
        if (list[j].id === id) return { dayId: keys[i], q: list[j] };
      }
    }
    return null;
  }

  var Quiz = {
    /** 某天的题 */
    of: function (dayId) {
      var list = store()[dayId];
      return (list || []).slice();
    },

    /** 全部题 */
    all: function () {
      var out = [];
      dayIds().forEach(function (id) { out = out.concat(Quiz.of(id)); });
      return out;
    },

    get: function (id) { return find(id); },

    /** 某天正确率（用 Progress 里的记录） */
    stat: function (dayId) {
      return LX.Progress.quizSummary(dayId);
    },

    /** 错题本：最后一次还没答对的题 */
    wrong: function () {
      var out = [];
      LX.Progress.wrongIds().forEach(function (id) {
        var hit = find(id);
        if (hit) out.push({ dayId: hit.dayId, q: hit.q, stat: LX.Progress.quizStat(id) });
      });
      return out;
    },

    /** 渲染到容器 */
    renderDay: function (dayId, root) {
      if (!root) return;
      var list = Quiz.of(dayId);
      root.innerHTML = '';

      var head = util.el('div', { className: 'gates-head' });
      head.appendChild(util.el('h2', { text: t('quiz.head', { n: list.length }) }));
      var stat = Quiz.stat(dayId);
      head.appendChild(util.el('span', {
        className: 'muted quiz-stat',
        text: list.length
          ? t('quiz.stat', { right: stat.right, total: stat.total })
          : t('quiz.empty')
      }));
      root.appendChild(head);

      if (!list.length) return;

      var box = util.el('div', { className: 'quiz-list' });
      list.forEach(function (q, i) { box.appendChild(questionCard(q, i)); });
      root.appendChild(box);
    }
  };

  /* ------------------------------ 一道题 ------------------------------ */

  function questionCard(q, index) {
    var card = util.el('article', { className: 'quiz-card', attrs: { 'data-quiz': q.id } });
    var stat = LX.Progress.quizStat(q.id);

    var head = util.el('div', { className: 'quiz-head' });
    head.appendChild(util.el('span', { className: 'quiz-no', text: String(index + 1) }));
    head.appendChild(util.el('p', { className: 'quiz-q', text: q.q }));
    head.appendChild(util.el('span', {
      className: 'quiz-state ' + (stat.ok ? 'is-pass' : (stat.tries ? 'is-fail' : '')),
      text: stat.ok ? t('quiz.right') : (stat.tries ? t('quiz.retry') : t('quiz.idle'))
    }));
    card.appendChild(head);

    var opts = util.el('div', { className: 'quiz-opts' });
    var why = util.el('div', { className: 'quiz-why' });
    why.style.display = 'none';

    (q.a || []).forEach(function (text, i) {
      var btn = util.el('button', { className: 'quiz-opt', attrs: { type: 'button' } });
      btn.appendChild(util.el('span', { className: 'quiz-key', text: 'ABCD'[i] || String(i + 1) }));
      btn.appendChild(util.el('span', { className: 'quiz-text', text: text }));

      btn.addEventListener('click', function () {
        var ok = i === q.right;
        LX.Progress.recordQuiz(q.id, ok);

        util.$$('.quiz-opt', opts).forEach(function (b, bi) {
          b.classList.remove('is-right', 'is-wrong');
          b.disabled = true;
          if (bi === q.right) b.classList.add('is-right');
        });
        if (!ok) btn.classList.add('is-wrong');

        why.style.display = '';
        why.className = 'quiz-why ' + (ok ? 'is-ok' : 'is-bad');
        why.innerHTML = '';
        why.appendChild(util.el('b', { text: ok ? t('quiz.correct') : t('quiz.wrong') }));
        why.appendChild(document.createTextNode(q.why || ''));
        if (!ok) {
          var retry = util.el('button', { className: 'quiz-retry', text: t('quiz.again') });
          retry.addEventListener('click', function () {
            var next = questionCard(q, index);
            if (card.parentNode) card.parentNode.replaceChild(next, card);
          });
          why.appendChild(retry);
        }

        var st = card.querySelector('.quiz-state');
        if (st) {
          st.className = 'quiz-state ' + (ok ? 'is-pass' : 'is-fail');
          st.textContent = ok ? t('quiz.right') : t('quiz.retry');
        }
      });

      opts.appendChild(btn);
    });

    card.appendChild(opts);
    card.appendChild(why);
    return card;
  }

  LX.Quiz = Quiz;
})(window);
