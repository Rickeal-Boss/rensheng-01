/* Version 3.0 — "no reruns".
   - A story never contradicts the family tree: anything that has Grandpa (or Grandma, or your parents) in it only
     happens while they are alive. Grandpa's last wishes happen once, and he really is gone afterwards.
   - Story events don't come back year after year: repeatable events have a lifetime cap, the same headline never
     shows twice within ten years, and the chatty system pop-ups (admirers, dates, missions, cases, promotion exams)
     are spaced out.
   - Plain world news goes into the diary instead of interrupting you with a pop-up.
   - Fewer surprise half-siblings: a powerful family has one now and then, not in nearly every life. */
(function () {
  'use strict';
  var N = G.N;
  function S() { return G.S; }
  function P() { return G.S && G.S.p; }
  G.VERSION = '3.2.0';

  /* ---------------- who is still alive ---------------- */
  G.gpa = function (g, side) {
    return N.all(function (n) { return n.alive && n.rel === 'grand' && (!g || n.g === g) && (!side || (n.side || 'p') === side); })[0] || null;
  };
  G.anyPar = function () { return N.rel('father', 'mother').some(function (n) { return n.alive; }); };

  /* ---------------- reading an event's own words ---------------- */
  var MEM = /去世|遗|墓|忌日|生前|葬|走了|不在了|想起|回忆|照片|当年|追悼|怀念|梦见|纪念|过世|离世|已故|在世时/;
  function zhOf(x) { return typeof x === 'string' ? x.split('|')[0] : ''; }
  function needs(d) {
    if (d._nd !== undefined) return d._nd;
    var t = zhOf(d.title) + ' ' + zhOf(d.t), r = null;
    if (d.noGate || MEM.test(t)) { d._nd = null; return null; }
    var tp = t.replace(/[当做准新好喊叫](爸爸|妈妈)|(爸爸|妈妈)们|孩子的(爸爸|妈妈)|宝宝的(爸爸|妈妈)/g, '');
    if (/爷爷|外公|姥爷/.test(t)) (r = r || {}).gpa = 1;
    if (/奶奶|外婆|姥姥/.test(t)) (r = r || {}).gma = 1;
    if (/爸爸|妈妈|爸妈|父母/.test(tp)) (r = r || {}).par = 1;
    d._nd = r; return r;
  }
  // the family-tree gate: grandparents always, parents only for random (not system) events
  G.storyOk = function (d, sysToo) {
    var r = needs(d); if (!r) return true;
    if (r.gpa && !G.gpa('m')) return false;
    if (r.gma && !G.gpa('f')) return false;
    if (r.par && (!d.sys || sysToo) && !G.anyPar()) return false;
    return true;
  };

  /* ---------------- random events: caps and cool-downs ---------------- */
  var el = G.eligible;
  G.eligible = function (d, S2) {
    if (!el.apply(this, arguments)) return false;
    var p = S2.p, n = S2.done[d.id] || 0;
    if (n && d.rep) {
      if (n >= (d.max || 4)) return false;
      if (S2.cool[d.id] != null && p.age - S2.cool[d.id] < Math.max(d.cd || 4, 5)) return false;
    }
    var tz = zhOf(d.title);
    if (tz && S2.tSeen && S2.tSeen[tz] != null && p.age - S2.tSeen[tz] < 10) return false;
    if (!G.storyOk(d)) return false;
    return true;
  };

  /* ---------------- the runner: gates, throttles, quiet news ---------------- */
  // minimum years between two pop-ups of the same kind
  var GAP = { sys_admirer: 2, pure_date: 3, sys_mission: 3, sys_case: 3, sys_raid: 3, sys_bribe: 3, spy_story: 3, spy_case: 3, sys_assess: 3, v20_contract: 4, sys_biz_crisis: 3, trust_review: 5 };
  var LIFE_MAX = { sys_admirer: 10, pure_date: 6, v20_contract: 5, trust_review: 4 };
  var run0 = G.runEvent;
  G.runEvent = async function (id, prm, npcId) {
    var s = S(), d = G.EV[id];
    if (!s || !d) return run0.apply(this, arguments);
    var p = s.p;
    // a story about Grandpa needs a living Grandpa — even when the system queued it
    if (!G.storyOk(d, false)) return;
    s.lastRun = s.lastRun || {};
    if (GAP[id] != null) {
      var last = s.lastRun[id];
      var over = LIFE_MAX[id] && (s.done[id] || 0) >= LIFE_MAX[id];
      if (over || (last != null && s.year - last < GAP[id])) {
        // the admirer who never got to speak doesn't linger in your contacts
        if (id === 'sys_admirer' && npcId != null) { var a = s.npcs[npcId]; if (a && !a.pin && a.rel === 'contact' && a.met === s.year) delete s.npcs[npcId]; }
        return;
      }
      s.lastRun[id] = s.year;
    }
    // world news that doesn't touch you is written into the diary, not thrown in your face
    if (id === 'sys_history' && prm && !prm.h && !prm.hap && !prm.cash && !prm.job && !prm.life) {
      G.log('📰 ' + String(prm.t || '').split('|')[0] + '|📰 ' + (String(prm.t || '').indexOf('|') >= 0 ? String(prm.t).slice(String(prm.t).indexOf('|') + 1) : prm.t));
      (s.news = s.news || []).push({ y: s.year, t: prm.t }); if (s.news.length > 60) s.news.shift();
      G.emit('news', prm.t);
      return;
    }
    var tz = zhOf(typeof d.title === 'string' ? d.title : '');
    if (tz && !d.sys) { s.tSeen = s.tSeen || {}; s.tSeen[tz] = p.age; }
    return run0.apply(this, arguments);
  };

  /* ---------------- red second generation: Grandpa is one man ---------------- */
  function gate(id, f, extra) { var d = G.EV[id]; if (!d) return; var f0 = d.if; d.if = function (S2, p) { return f(S2, p) && (!f0 || f0(S2, p)); }; if (extra) for (var k in extra) d[k] = extra[k]; d._nd = undefined; }
  function gpaM() { return !!G.gpa('m'); }
  ['rd_compound', 'rd_grandpa_war', 'rd_career', 'rd_memoir', 'rd_village'].forEach(function (id) { gate(id, gpaM); });
  gate('rd_match', function () { return !!G.gpa('f'); });
  // Grandpa's old commander turns ninety while Grandpa himself is still around — not when you're eighty
  gate('rd_old_leader', gpaM, { a: [22, 46] });
  gate('rd_grandpa_end', gpaM, { rep: 0, a: [16, 70], noGate: 1 });
  var ge = G.EV.rd_grandpa_end;
  if (ge && ge.o) ge.o.forEach(function (o) {
    var r0 = o.run;
    o.run = async function (c) {
      var out = r0 ? await r0.apply(this, arguments) : null, g = G.gpa('m', 'p') || G.gpa('m');
      if (g) { g.alive = false; g.died = S().year; g.dieY = S().year; c.p.flags.gpaGone = S().year; G.major('爷爷{n}去世了|Grandpa {n} passed away', { n: g.name }); }
      (S().pendQ = S().pendQ || []).push({ id: 'r2_farewell' });
      return out;
    };
  });
  // when Grandpa dies of old age instead, the red family still says goodbye properly
  var tick0 = N.tick;
  N.tick = function () {
    var out = tick0.apply(this, arguments) || [], p = P();
    try {
      if (p && (p.origin === 'red' || p.flags.redfam) && !p.flags.gpaGone && out.some(function (n) { return n && n.rel === 'grand' && n.g === 'm'; }) && !G.gpa('m')) {
        p.flags.gpaGone = S().year; (S().pendQ = S().pendQ || []).push({ id: 'r2_farewell' });
      }
    } catch (e) { }
    return out;
  };

  // "a favour returned" only comes from people who are still around
  var fav = G.EV.v20_contract;
  if (fav && fav.prep) {
    var fp0 = fav.prep;
    fav.prep = function (c) {
      var r = fp0.apply(this, arguments); if (r === false) return r;
      var W = [['家里的世交|a family friend of three generations', 1], ['叔叔在部委的同学|your uncle\'s classmate at the ministry', 1], ['你小学同学的爸爸|the father of a primary-school classmate', 1], ['一位老客户的亲家|an old client\'s in-laws', 1]];
      if (N.rel('father').some(function (n) { return n.alive; })) W.push(['父亲的老战友|an old comrade of your father\'s', 1]);
      if (G.gpa('f')) W.push(['奶奶的牌友|your grandmother\'s mahjong partner', 1]);
      if (G.gpa('m')) W.push(['爷爷的老部下|one of your grandfather\'s old subordinates', 1]);
      c.prm.who = G.pick(W)[0];
    };
  }

  /* ---------------- fewer surprise half-siblings ---------------- */
  // royal.js rolls 30–42% for a father's child outside the marriage in every rich family; keep only a fraction of them
  var lc = G.life.create;
  G.life.create = function () {
    var s = lc.apply(this, arguments);
    try {
      var bornY = s.p.birthYear || (s.year - s.p.age);
      N.rel('sibling').filter(function (n) { return n.illegit && !n.dna && n.met === s.year; }).forEach(function (n, i) {
        if (i > 0 || !G.ch(.3)) { delete s.npcs[n.id]; }
      });
      void bornY;
    } catch (e) { console.error(e); }
    return s;
  };

  /* ---------------- New Year extras, per identity ---------------- */
  var NYX = {};
  G.NYX = function (id) { return NYX[id] || []; };
  G.nyx = function (id, list) { list.forEach(function (d) { d.sys = 1; G.ev(d); (NYX[id] = NYX[id] || []).push(d.id); }); };
})();
