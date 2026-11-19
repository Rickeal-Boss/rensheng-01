/* Version 3.0 interface layer.
   - Story cards know whose story they are: identity storylines carry a coloured ribbon and an "exclusive" tag,
     New Year scenes are festive, news is a newspaper clipping, sad news is in black.
   - Options are lettered A/B/C; the event icon sits in a medallion.
   - The journal shows who you are right now as a chip under your name, and news lines look like clippings.
   - The start screen has a 3.0 badge and a "What's new" page; origins with their own storylines are marked. */
(function () {
  'use strict';
  var h = G.h, UI = G.UI, T = UI.T, tap = UI.tap;
  if (!h || !UI) return;
  // spies no longer sit an instinct quiz: their tests are settled by stats and gear (events/spy22.js)
  UI.spyGame = null; G.UI.spyGame = null;

  /* ---------------- who is this story about ---------------- */
  var IDN = {
    red: ['🎖️', '红二代|Political Dynasty', 'red'], spyfam: ['🕵️', '特工家庭|Spy Family', 'ink'], spy: ['🕶️', '特工|Agent', 'ink'],
    royal: ['👑', '王室|Royal', 'gold'], monarch: ['👑', '君主|Monarch', 'gold'], prison: ['⛓️', '狱中|Behind Bars', 'grey'],
    tycoon: ['💎', '富豪|Tycoon', 'gold'], general: ['⭐', '将军|General', 'green'], official: ['🏛️', '官员|Official', 'red'],
    star: ['🌟', '明星|Star', 'pink'], nanny: ['🧺', '保姆|Nanny', 'green'], soldier: ['🪖', '军人|Soldier', 'green'],
    police: ['🚓', '警察|Police', 'blue'], student: ['🎒', '学生|Student', 'blue'], elder: ['🍵', '晚年|Golden Years', 'brown'],
    child: ['🧸', '童年|Childhood', 'pink'], common: ['🏙️', '普通人|Everyday Life', 'brown']
  };
  G.IDN = IDN;
  var stack = [];
  var run0 = G.runEvent;
  G.runEvent = async function (id) {
    stack.push(id);
    try { return await run0.apply(this, arguments); } finally { stack.pop(); }
  };
  function curDef() { var id = stack[stack.length - 1]; return id ? G.EV[id] : null; }
  function cls(el, c) { if (el && c) c.split(' ').forEach(function (x) { if (x) el.classList.add(x); }); }

  var ev0 = UI.event;
  UI.event = function (o) {
    var d = curDef(), pr = ev0.apply(this, arguments);
    try {
      var all = document.querySelectorAll('.veil .modal'), m = all[all.length - 1];
      if (m && d) {
        var mh = m.querySelector('.mh'), tag = null;
        if (/^nyx?_/.test(d.id)) { cls(m, 'v3 ny'); tag = '🧧 ' + T('新年|New Year'); }
        else if (d.odb) { var og = G.ORIGIN[d.odb]; cls(m, 'v3 who tone-' + ({ fam: 'red', kid: 'pink', sch: 'blue', soc: 'green', adu: 'brown', turn: 'ink', late: 'gold' }[d.ocat] || 'brown')); tag = '🏠 ' + (og ? T(og.n) : '') + ' · ' + T((G.ODB_CAT || {})[d.ocat] || ''); }
        else if (d.who) {
          var id = G.idNow ? G.idNow() : null, w = [].concat(d.who), k = w.indexOf(id) >= 0 ? id : w[0], meta = IDN[k];
          if (meta) { cls(m, 'v3 who tone-' + meta[2]); tag = meta[0] + ' ' + T(meta[1]) + T('专属|'); }
        } else if (d.kind === 'news') cls(m, 'v3 newsp');
        else if (d.kind === 'sad') cls(m, 'v3 sadp');
        else cls(m, 'v3');
        var h3 = mh && mh.querySelector('h3'); if (tag && h3) h3.appendChild(h('span', { class: 'idtag' }, tag));
      } else if (m) cls(m, 'v3');
    } catch (e) { }
    return pr;
  };
  var res0 = UI.result;
  UI.result = function (o) {
    var pr = res0.apply(this, arguments);
    try { var all = document.querySelectorAll('.veil .modal'), m = all[all.length - 1]; if (m) cls(m, 'v3 res'); } catch (e) { }
    return pr;
  };

  /* ---------------- the journal ---------------- */
  function decorate() {
    try {
      if (!G.S || !G.S.p) return;
      // (no identity chip on the journal: it was redrawn on every refresh and flickered)
      var ps = document.querySelectorAll('.desk .diary p:not(.v3d)');
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i], t = p.textContent || ''; p.classList.add('v3d');
        if (t.indexOf('📰') === 0) p.classList.add('newsln');
        else if (/^(新年|跨年|New Year)/.test(t) || /^[^：:]{0,14}(年夜饭|团拜|拜年|跨年|压岁钱)/.test(t)) p.classList.add('nyln');
      }
    } catch (e) { }
  }
  G.on('change', decorate);
  // the journal re-renders itself from many places; catch every redraw
  var pend = false;
  try { new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; if (document.querySelector('.desk')) decorate(); }); }).observe(document.getElementById('app') || document.body, { childList: true, subtree: true }); } catch (e) { }
  G.on('log', function () { setTimeout(decorate, 0); });
  var main0 = UI.main;
  UI.main = function () { var r = main0.apply(this, arguments); decorate(); return r; };

  /* ---------------- the ending: a verdict from your own origin ---------------- */
  var endU = UI.ending;
  UI.ending = function (d) {
    var r = endU.apply(this, arguments);
    try {
      var ov = d && d.ov, rep = document.querySelector('.report');
      if (d && d.endN && rep && !document.querySelector('.galcard')) rep.parentNode.insertBefore(h('div', { class: 'card galcard' }, h('span', null, '🏆 ' + T('结局图鉴 {n}/{m}|Endings collected {n}/{m}', { n: d.endN, m: d.endTot })), d.endNew ? h('b', { class: 'newend' }, T('新结局！|New ending!')) : null), rep);
      if (ov && rep && !document.querySelector('.ovcard')) {
        var org = G.ORIGIN[ov.org];
        rep.parentNode.insertBefore(h('div', { class: 'card ovcard' },
          h('h5', null, T('出身评价 · {o}|Your Origin · {o}', { o: org ? org.n : '' })),
          h('div', { class: 'ovt' }, T(ov.t)), h('p', { class: 'ovd' }, T(ov.d)),
          h('small', { class: 'ovn' }, T('经历了{n}/{m}段出身专属剧情|Lived {n} of {m} origin chapters', { n: ov.n, m: ov.tot }))), rep.nextSibling);
      }
    } catch (e) { }
    return r;
  };

  /* ---------------- what's new ---------------- */
  var NEWS = [
    ['🕵️', '特工不再答题|Spies: no more quizzes', '特工的直觉答题全部取消，改为真正的任务：东方快车、大使馆舞会、雪山缆车、赌场、桥上交换……每次任务有不同的做法（硬闯、智取、社交、用装备），结果看你的能力和运气。新增自选代号、掩护身份、装备科（口红麻醉枪、滑翔伞雨伞、改装跑车等），装备会解锁新的任务方案。|The instinct quizzes are gone. Spies now run real missions — a night train, an embassy ball, a ski lift, a casino, a bridge exchange — each with several approaches (force, wits, charm, gadgets) settled by your abilities and luck. Pick your own codename and cover job; the gadget lab hands out kit that unlocks new options.'],
    ['🏆', '结局大扩充|Many more endings', '新增几十种结局（无名英雄、双面人生、桥上归来的人、百岁人瑞、东山再起、一个人的一生、连续创业者、环球旅行家……），平淡的人生会以你出身的专属评价作为结局；还有结局图鉴，记录你解锁过的所有结局。|Dozens of new endings, an origin verdict for quieter lives, and an ending gallery that records every ending you reach.'],
    ['🏠', '60种出身，60种人生|60 origins, 60 different lives', '每一种出身都有自己独立的事件库：专属的家庭矛盾、童年、求学、人情、立业、人生转折和晚年，前面的选择会改变后面的剧情；死后还有专属的“出身评价”。军人家庭的矛盾是驻地分离，富豪家是遗产信托，工薪家是下岗和房贷，孤儿有院长妈妈和开放日。这些事件只属于对应的出身，不会出现在别人的人生里。|Every origin has its own event library: its own family conflict, childhood, school, people, career, turning point and old age; earlier choices change later chapters, and an origin verdict closes the life. These events never appear in anyone else\'s life.'],
    ['🔁', '剧情不再重播|No more reruns', '身份剧情一生只发生一次；同一个标题十年内不会再出现；新年场景几年才有一次、每个只看一次；表白、约会、任务、考核这类弹窗都拉开了间隔。|Identity stories happen once in a life; the same headline won\'t return within ten years; New Year scenes come every few years and never repeat; admirers, dates, missions and exams are spaced out.'],
    ['👴', '家族不再穿帮|A consistent family', '有爷爷奶奶、爸爸妈妈出场的剧情，只在他们还活着的时候发生。红二代的爷爷只会去世一次，之后有告别、遗物和后续故事。|Stories with grandparents or parents only happen while they\'re alive. A political dynasty\'s grandfather dies once — followed by a farewell, his keepsakes and what comes after.'],
    ['👶', '孩子起名|Naming babies', '起名时能看到孩子的爸爸妈妈是谁；非婚生子女可以自由选择随父姓或随母姓，不会再出现两个姓叠在一起。|The naming card shows who the father and mother are; a child born outside marriage can take either parent\'s surname — never two stacked together.'],
    ['🏯', '中国没有王室|No royals in China', '王子、公主只来自真正有君主的国家。在中国遇到的“王室”追求者，现在都来自海外王室。|Princes and princesses come only from real monarchies; a royal suitor you meet in China is now a foreign royal.'],
    ['👥', '私生兄弟姐妹变少|Fewer surprise half-siblings', '豪门家庭不再几乎每局都有一个私生的兄弟姐妹。|Wealthy families no longer come with a secret half-sibling nearly every time.'],
    ['🎭', '一百多段身份专属剧情|100+ new identity stories', '红二代、特工家庭、特工、王室、君主、监狱、富豪、将军、官员、明星、保姆、军人、警察、学生、老人、孩子、普通人，每个身份都有自己的新故事，很多是连续剧。|Political dynasties, spy families, agents, royals, monarchs, prisoners, tycoons, generals, officials, stars, nannies, soldiers, police, students, elders, children and ordinary people — each has new stories, many of them serials.'],
    ['📰', '新闻不再打断你|News stops interrupting', '和你无关的时代新闻直接写进日记，以剪报的样式出现。|World news that doesn\'t affect you goes straight into the diary as a clipping.'],
    ['🎨', '全新界面与图标|New look and icon', '新的App图标；事件卡片带身份色带和专属标签，选项有A/B/C编号，新年和讣告有专门的样式；日记里显示你当前的身份。|A new app icon; story cards carry an identity ribbon and tag, options are lettered, New Year and farewells have their own look; the journal shows who you are now.']
  ];
  UI.whatsNew = function () {
    var body = h('div', { class: 'wnew' }, NEWS.map(function (n) { return h('div', { class: 'wn' }, h('div', { class: 'wi' }, n[0]), h('div', null, h('b', null, T(n[1])), h('p', null, T(n[2])))); }));
    var md = UI.modal({ title: T('3.2 大更新|Version 3.2'), icon: '🎉', kind: 'v3 wnm', body: body, foot: [h('button', { class: 'opt solid', onclick: tap(function () { md.close(); }) }, T('开始新的人生吧|Let\'s live'))], close: true });
    try { G.meta.seen3 = 1; G.saveMeta(); } catch (e) { }
  };

  /* ---------------- start screen ---------------- */
  var start0 = UI.start;
  UI.start = function () {
    var r = start0.apply(this, arguments);
    try {
      var t = document.querySelector('.start .title');
      if (t && !t.querySelector('.v3badge')) t.appendChild(h('button', { class: 'v3badge', onclick: tap(function () { UI.whatsNew(); }) }, T('3.0 大更新|3.0 UPDATE')));
      var btns = document.querySelector('.start .btns');
      if (btns && !btns.querySelector('.wnbtn')) btns.appendChild(h('button', { class: 'big wnbtn', onclick: tap(function () { UI.whatsNew(); }) }, '🎉 ' + T('这次更新了什么|What\'s new in 3.0')));
      var st = document.querySelector('.start'); if (st) st.classList.add('v3start');
      if (!(G.meta && G.meta.seen3) && (G.meta.stats.lives || 0) > 0) setTimeout(function () { if (document.querySelector('.start') && !document.querySelector('.veil')) UI.whatsNew(); }, 600);
    } catch (e) { }
    return r;
  };

  /* ---------------- origins with their own storylines ---------------- */
  var STORY = { red: 1, royal: 1, spyfam: 1, richest: 1, tycoon: 1, noble: 1, celebrity: 1, military: 1, police: 1, mafia: 1 };
  var wiz0 = UI.wizard;
  UI.wizard = function () {
    var r = wiz0.apply(this, arguments);
    var mark = function () {
      try {
        var cards = document.querySelectorAll('.wf .tal');
        var shown = (G.ORIGINS || []).filter(function (o) { return document.body.textContent.indexOf(T(o.n)) >= 0; });
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i], b = c.querySelector('b'); if (!b || c.querySelector('.stag')) continue;
          var o = shown.filter(function (x) { return T(x.n) === b.textContent; })[0];
          if (o && STORY[o.id]) b.appendChild(h('span', { class: 'stag' }, T('★ 专属剧情|★ Own storyline')));
        }
      } catch (e) { }
    };
    try { var obs = new MutationObserver(function () { mark(); }); var root = document.getElementById('app') || document.body; obs.observe(root, { childList: true, subtree: true }); setTimeout(function () { mark(); }, 50); UI._wizObs && UI._wizObs.disconnect(); UI._wizObs = obs; } catch (e) { }
    return r;
  };
  var main1 = UI.main;
  UI.main = function () { if (UI._wizObs) { UI._wizObs.disconnect(); UI._wizObs = null; } return main1.apply(this, arguments); };
})();
