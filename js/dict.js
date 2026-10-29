/* =============================================================================
 * js/dict.js
 * -----------------------------------------------------------------------------
 * 命令词典界面：
 *   · 侧滑抽屉  —— 课程里点任意一个 token（命令/参数/符号）就打开它
 *   · 独立页面  —— #/dict 路由，可搜索、可按分组浏览
 *
 * 数据在 js/data/glossary.js（LX.Glossary）。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};
  var util = LX.util;

  var drawer = null;
  var drawerState = null;

  function G() { return LX.Glossary; }

  function chip(group) {
    return util.el('span', { className: 'dict-chip g-' + group, text: G().groupName(group) });
  }

  /** 一条词条卡片 */
  function card(it) {
    var box = util.el('article', { className: 'dict-card' });

    var head = util.el('div', { className: 'dict-card-head' });
    head.appendChild(util.el('code', { className: 'dict-term', text: it.t }));
    if (it.read) head.appendChild(util.el('span', { className: 'dict-read', text: '读作 ' + it.read }));
    head.appendChild(chip(it.g));
    if (it.d) head.appendChild(util.el('span', { className: 'dict-day', text: String(it.d).toUpperCase() }));
    box.appendChild(head);

    box.appendChild(util.el('p', { className: 'dict-mean', text: it.m }));

    if (it.eg) {
      var eg = util.el('div', { className: 'dict-eg' });
      eg.appendChild(util.el('span', { className: 'dict-lab', text: '例子' }));
      eg.appendChild(util.el('code', { text: it.eg }));
      box.appendChild(eg);
    }
    if (it.warn) box.appendChild(util.el('p', { className: 'dict-warn', text: '⚠ ' + it.warn }));

    return box;
  }

  function paint(state) {
    var q = String(state.q || '').trim();
    var items = q ? G().search(q) : (state.group ? G().byGroup(state.group) : G().items);

    util.$$('.dict-tab', state.tabs).forEach(function (btn) {
      var on = btn.getAttribute('data-group') === state.group;
      if (on) btn.classList.add('is-on'); else btn.classList.remove('is-on');
    });

    state.list.innerHTML = '';
    if (!items.length) {
      state.list.appendChild(util.el('p', {
        className: 'dict-empty muted',
        text: '没搜到「' + q + '」。换个关键词试试，或者点上面的分组翻一翻。'
      }));
      state.count.textContent = '0 条';
      return;
    }

    state.count.textContent = items.length + ' 条';
    var frag = document.createDocumentFragment();
    items.forEach(function (it) { frag.appendChild(card(it)); });
    state.list.appendChild(frag);
  }

  /** 把「搜索框 + 分组 tab + 列表」搭进 root，返回 state（供外部改查询） */
  function build(root) {
    root.innerHTML = '';
    var state = { q: '', group: '', root: root };

    var bar = util.el('div', { className: 'dict-bar' });
    var input = util.el('input', {
      className: 'text-input dict-search',
      attrs: {
        type: 'search',
        placeholder: '搜命令 / 参数 / 符号 / 概念 / 报错，例如 grep、-L、>、显存',
        'aria-label': '搜索词典'
      }
    });
    bar.appendChild(input);
    state.input = input;

    var count = util.el('span', { className: 'dict-count muted', text: '' });
    bar.appendChild(count);
    root.appendChild(bar);

    var tabs = util.el('div', { className: 'dict-tabs', attrs: { role: 'tablist' } });
    var list = util.el('div', { className: 'dict-list' });
    state.tabs = tabs;
    state.list = list;
    state.count = count;
    root.appendChild(tabs);
    root.appendChild(list);

    var all = [{ id: '', name: '全部', desc: '整个词典' }].concat(G().groups);
    all.forEach(function (g) {
      var n = g.id ? G().byGroup(g.id).length : G().count();
      var btn = util.el('button', {
        className: 'dict-tab',
        text: g.name + ' ' + n,
        attrs: { type: 'button', title: g.desc || '' }
      });
      btn.setAttribute('data-group', g.id);
      btn.addEventListener('click', function () {
        state.group = g.id;
        state.q = '';
        if (state.input) state.input.value = '';
        paint(state);
      });
      tabs.appendChild(btn);
    });

    input.addEventListener('input', function () {
      state.q = input.value;
      state.group = '';
      paint(state);
    });

    paint(state);
    return state;
  }
  /* ------------------------------ 抽屉 ------------------------------ */

  function mount() {
    if (drawer) return drawer;

    drawer = util.el('aside', {
      className: 'dict-drawer',
      attrs: { id: 'dictDrawer', 'aria-label': '命令词典', 'aria-hidden': 'true' }
    });

    var head = util.el('header', { className: 'dict-head' });
    head.appendChild(util.el('b', { text: '📖 命令词典' }));
    var close = util.el('button', { className: 'icon-btn', text: '✕', attrs: { 'aria-label': '关闭词典' } });
    close.addEventListener('click', function () { Dict.close(); });
    head.appendChild(close);
    drawer.appendChild(head);

    var body = util.el('div', { className: 'dict-body' });
    drawer.appendChild(body);
    drawerState = build(body);

    document.body.appendChild(drawer);
    return drawer;
  }

  var Dict = {
    items: function () { return G() ? G().items : []; },
    count: function () { return G() ? G().count() : 0; },

    isOpen: function () { return !!(drawer && drawer.classList.contains('is-open')); },

    /** 打开抽屉；传 term 就把搜索框填上（token 点击走这条路） */
    open: function (term) {
      mount();
      if (term != null) {
        drawerState.q = String(term);
        drawerState.group = '';
        if (drawerState.input) drawerState.input.value = String(term);
        paint(drawerState);
      }
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (drawerState.input) drawerState.input.focus();
      return this;
    },

    close: function () {
      if (!drawer) return this;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      return this;
    },

    toggle: function (term) {
      if (Dict.isOpen()) Dict.close();
      else Dict.open(term);
      return this;
    },

    /** #/dict 路由用：把词典整页渲染到容器里 */
    page: function (root) {
      if (!root) return;
      if (!G()) { root.innerHTML = '<p class="muted">词典数据没加载成功。</p>'; return; }
      root.innerHTML = '';

      var head = util.el('div', { className: 'page-head' });
      head.appendChild(util.el('h1', { text: '命令词典' }));
      head.appendChild(util.el('span', {
        className: 'muted',
        text: G().count() + ' 条：命令 / 参数 / 符号 / 概念 / AI 工具链 / 报错'
      }));
      root.appendChild(head);

      root.appendChild(util.el('p', {
        className: 'page-intro',
        text: '课程里出现的每一个词都能在这里查到。看不懂某条命令时，先来搜它的参数和符号——' +
          '90% 的"看不懂"其实是参数和符号没被解释。'
      }));

      var box = util.el('div', { className: 'dict-page' });
      root.appendChild(box);
      build(box);
    }
  };

  LX.Dict = Dict;
})(window);
