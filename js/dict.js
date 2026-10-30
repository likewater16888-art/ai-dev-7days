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

  /** 界面文案（js/i18n.js） */
  function t(key, vars) {
    return (LX.I18N && LX.I18N.t) ? LX.I18N.t(key, vars) : String(key);
  }

  function G() { return LX.Glossary; }

  /** 分组名 / 说明：词典数据里是中文，英文界面查 i18n，缺词时退回原文 */
  function groupLabel(g) {
    var key = g.id || 'all';
    if (LX.I18N && LX.I18N.groupName) return LX.I18N.groupName(key, g.name);
    return g.name;
  }

  function groupTip(g) {
    var key = g.id || 'all';
    if (LX.I18N && LX.I18N.groupDesc) return LX.I18N.groupDesc(key, g.desc || '');
    return g.desc || '';
  }

  function chip(group) {
    return util.el('span', {
      className: 'dict-chip g-' + group,
      text: (LX.I18N && LX.I18N.groupName) ? LX.I18N.groupName(group, G().groupName(group)) : G().groupName(group)
    });
  }

  /** 一条词条卡片 */
  function card(it) {
    var box = util.el('article', { className: 'dict-card' });

    var head = util.el('div', { className: 'dict-card-head' });
    head.appendChild(util.el('code', { className: 'dict-term', text: it.t }));
    if (it.read) head.appendChild(util.el('span', { className: 'dict-read', text: t('dict.read', { read: it.read }) }));
    head.appendChild(chip(it.g));
    if (it.d) head.appendChild(util.el('span', { className: 'dict-day', text: String(it.d).toUpperCase() }));
    box.appendChild(head);

    box.appendChild(util.el('p', { className: 'dict-mean', text: it.m }));

    if (it.eg) {
      var eg = util.el('div', { className: 'dict-eg' });
      eg.appendChild(util.el('span', { className: 'dict-lab', text: t('dict.eg') }));
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
        text: t('dict.empty', { q: q })
      }));
      state.count.textContent = t('dict.count', { n: 0 });
      return;
    }

    state.count.textContent = t('dict.count', { n: items.length });
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
        placeholder: t('dict.searchPlaceholder'),
        'aria-label': t('dict.searchAria')
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

    var all = [{ id: '', name: t('group.all'), desc: t('group.all.desc') }].concat(G().groups);
    all.forEach(function (g) {
      var n = g.id ? G().byGroup(g.id).length : G().count();
      var btn = util.el('button', {
        className: 'dict-tab',
        text: groupLabel(g) + ' ' + n,
        attrs: { type: 'button', title: groupTip(g) }
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
      attrs: { id: 'dictDrawer', 'aria-label': t('dict.drawerAria'), 'aria-hidden': 'true' }
    });

    var head = util.el('header', { className: 'dict-head' });
    head.appendChild(util.el('b', { text: t('dict.drawer') }));
    var close = util.el('button', { className: 'icon-btn', text: '✕', attrs: { 'aria-label': t('dict.closeAria') } });
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
      if (!G()) { root.innerHTML = '<p class="muted">' + util.escape(t('dict.noData')) + '</p>'; return; }
      root.innerHTML = '';

      var head = util.el('div', { className: 'page-head' });
      head.appendChild(util.el('h1', { text: t('dict.title') }));
      head.appendChild(util.el('span', {
        className: 'muted',
        text: t('dict.sub', { n: G().count() })
      }));
      root.appendChild(head);

      root.appendChild(util.el('p', {
        className: 'page-intro',
        text: t('dict.intro')
      }));

      var box = util.el('div', { className: 'dict-page' });
      root.appendChild(box);
      build(box);
    },

    /** 语言切换后重建抽屉（分组名、搜索框提示都要换） */
    refresh: function () {
      if (!drawer) return this;
      var q = drawerState ? drawerState.q : '';
      var group = drawerState ? drawerState.group : '';

      var head = util.$('.dict-head', drawer);
      if (head) {
        head.innerHTML = '';
        head.appendChild(util.el('b', { text: t('dict.drawer') }));
        var close = util.el('button', { className: 'icon-btn', text: '✕', attrs: { 'aria-label': t('dict.closeAria') } });
        close.addEventListener('click', function () { Dict.close(); });
        head.appendChild(close);
      }
      drawer.setAttribute('aria-label', t('dict.drawerAria'));

      var body = util.$('.dict-body', drawer);
      if (!body) return this;
      drawerState = build(body);
      drawerState.q = q;
      drawerState.group = group;
      if (drawerState.input) drawerState.input.value = q;
      paint(drawerState);
      return this;
    }
  };

  LX.Dict = Dict;
})(window);
