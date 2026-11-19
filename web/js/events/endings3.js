/* Version 3.2 — more endings.
   The old ending titles were few and generic ("billionaire", "an ordinary person" covered most lives). Now a life
   that had a story ends with that story: spies, prisoners, centenarians, serial founders, gamblers, globetrotters,
   lonely hearts, big families… and when nothing else fits, the verdict of your own origin becomes the title.
   Every ending you reach is collected in an ending gallery. */
(function () {
  'use strict';
  var N = G.N;
  function S() { return G.S; }
  var GENERIC = ['亿万富翁', '普通人', '大善人', '碌碌无为', '失信人', '自由自在', '平凡而幸福', '多情', '潦倒一生', '含着金汤匙的闲人', '富可敌国', '金汤匙里的空虚', '他乡即故乡'];
  function zh(x) { return String(x || '').split('|')[0]; }
  function T2(x, o) { return G.L(x, o || {}); }
  // [test(p, c, f, d, extra), key, title, verdict]
  var ENDS = [
    // ---- spies
    [function (p, c, f) { return f.spyH && f.spyH.jailed; }, 'spy_caught', '落网的间谍|The Spy Who Was Caught', '凌晨的敲门声结束了一切。你在牢里写了一本回忆录，没有一个字能出版。|A knock before dawn ended it all. In prison you wrote a memoir; not one word may be published.'],
    [function (p, c, f) { return f.spyH && f.spyH.swapped; }, 'spy_bridge', '桥上归来的人|Back Across the Bridge', '那天的雾很大。你走过桥中间时，对面的人和你点了点头。|The fog was thick that day. Halfway across, the man coming the other way nodded at you.'],
    [function (p, c, f) { return f.spyH && f.spyH.double; }, 'spy_double', '双面人生|A Double Life', '两个国家都以为你是自己人。到最后，连你自己也说不清。|Two countries each believed you were theirs. In the end, even you couldn\'t say.'],
    [function (p, c, f) { return f.spyH && f.spyH.foreign; }, 'spy_mole', '潜伏者|The Sleeper', '你在自己的国家里，替别人活了一辈子。|You lived your whole life in your own country — for someone else.'],
    [function (p, c, f) { return f.spyH && f.spyH.medal && !f.spyH.jailed && (f.spyH.max || 0) >= 3 && p.h.karma >= 0; }, 'spy_hero', '无名英雄|The Nameless Hero', '你的名字不会出现在任何史书里。可在某个没有窗户的房间里，有一枚勋章属于代号「{code}」。|Your name will never appear in a history book. But in a windowless room, a medal belongs to the codename "{code}".'],
    [function (p, c, f) { return f.spyH && f.spyH.missions >= 10; }, 'spy_ace', '王牌特工|The Ace', '快车、舞会、雪山、赌场……代号「{code}」完成了{m}次任务，一次比一次漂亮。|Trains, balls, ski lifts, casinos… codename "{code}" ran {m} missions, each cleaner than the last.'],
    [function (p, c, f) { return f.spyH && (f.spyH.max || 0) >= 1; }, 'spy_ret', '退休的特工|The Retired Agent', '邻居们只知道你是个{cover}，每天按时上下班，从不惹麻烦。|The neighbours only knew you as a {cover} who kept regular hours and never caused trouble.'],
    // ---- prison
    [function (p, c) { return (c.escape || 0) >= 1; }, 'escape', '越狱者|The Escapee', '你从高墙里逃了出来，余生都在看身后有没有人。|You got over the wall, and spent the rest of your life checking over your shoulder.'],
    [function (p, c) { return (c.jailYrs || 0) >= 15; }, 'longjail', '高墙里的半生|Half a Life Behind Walls', '你在里面度过了{y}年。出来那天，你连手机都不会用了。|{y} years inside. The day you walked out, you couldn\'t work a phone.'],
    [function (p, c) { return (c.jail || 0) >= 1 && p.h.karma >= 30; }, 'redeemed', '浪子回头|The Prodigal Returns', '你走过弯路，后来用半辈子把它走直了。|You took the wrong road once, and spent half a life straightening it.'],
    [function (p, c) { return (c.crimes || 0) >= 6; }, 'outlaw', '江湖人|A Life Outside the Law', '你这一辈子，从没把规矩放在眼里。|You never once let the rules get in your way.'],
    // ---- life span
    [function (p) { return p.age >= 100; }, 'centenarian', '百岁人瑞|A Hundred Years', '你活过了整整一个世纪，见过的变化比书里写的还多。|You lived a full century and saw more change than any book could hold.'],
    [function (p) { return p.age < 18; }, 'unfinished', '未完成的人生|A Life Unfinished', '你的故事才刚刚开始，就停在了这里。|Your story had only just begun when it stopped.'],
    [function (p, c, f, d) { return /牺牲|殉职|Killed|line of duty/.test(String(d.cause || '')); }, 'fallen', '以身殉职|Fallen in the Line of Duty', '你倒在了自己选择的岗位上。|You fell at the post you chose.'],
    [function (p) { return p.age < 35; }, 'young', '英年早逝|Gone Too Soon', '你走得太早，很多事还没来得及做。|You left too early, with so much still undone.'],
    // ---- family
    [function (p, c) { return (c.grandkids || 0) >= 8; }, 'clan', '儿孙满堂|A House Full of Grandchildren', '你的葬礼上，光是孙辈就站满了三排。|At your funeral, the grandchildren alone filled three rows.'],
    [function (p, c) { return N.all(function (n) { return n.rel === 'child'; }).length >= 5; }, 'bigfam', '人丁兴旺|A Big Family', '饭桌越换越大，家里永远热热闹闹。|The dining table kept getting bigger; the house was never quiet.'],
    [function (p, c) { return (c.divorces || 0) >= 2; }, 'fortress', '围城内外|In and Out of Marriage', '你结过几次婚，离过几次婚，最后才明白自己想要的是什么。|Married and divorced more than once, you finally learned what you wanted.'],
    [function (p, c) { var sp = N.spouse(); return !!sp && sp.alive && p.age >= 75 && (c.marriages || 1) <= 1 && !(c.affairs || 0); }, 'oldtogether', '白头偕老|Grown Old Together', '一辈子只牵过一个人的手，一直牵到了最后。|One hand held for a lifetime, right to the end.'],
    [function (p) { return p.age >= 65 && !N.spouse() && !N.all(function (n) { return n.rel === 'child'; }).length; }, 'alone', '一个人的一生|A Life Alone', '没有伴侣，没有孩子。你把日子过成了自己喜欢的样子。|No partner, no children. You made the days exactly as you liked them.'],
    [function (p, c) { return (c.lovers || 0) >= 12 || (c.affairs || 0) >= 3; }, 'casanova', '情场浪子|The Heartbreaker', '你爱过很多人，可能也伤过很多人。|You loved a great many people — and probably hurt a few.'],
    // ---- money stories
    [function (p, c) { return (c.pbankrupt || 0) >= 1 && G.netWorth() >= G.$(1e6); }, 'comeback', '东山再起|Back from Ruin', '你破产过，然后又从零爬了回来。|You went bankrupt — and climbed all the way back.'],
    [function (p, c) { return (c.jackpot || 0) >= 1; }, 'windfall', '天降横财|A Windfall', '一张彩票改变了你的命运——至于变好还是变坏，只有你自己知道。|One lottery ticket changed your fate. Whether for better or worse, only you know.'],
    [function (p, c) { return (c.gambles || 0) >= 12; }, 'gambler', '赌徒|The Gambler', '你这一辈子都在押注，赢过，也输过。|You spent your life placing bets. Sometimes you won.'],
    [function (p, c) { return (c.scammed || 0) >= 3; }, 'naive', '老实人|Too Trusting', '你被骗过好几次，可你还是愿意相信别人。|You were cheated more than once, and still chose to trust people.'],
    [function (p, c) { return (c.houses || 0) >= 5; }, 'landlord', '包租公/包租婆|The Landlord', '你名下的房子，比你住过的还多。|You owned more homes than you ever lived in.'],
    [function (p, c) { return (c.cars || 0) >= 6; }, 'carlover', '车痴|The Car Fanatic', '车库里停着你一辈子的爱好。|Your life\'s passion is parked in the garage.'],
    [function (p, c) { return (c.lux || 0) >= 12; }, 'collector', '收藏家|The Collector', '你的衣帽间，比很多人的家还大。|Your walk-in wardrobe was bigger than many people\'s homes.'],
    // ---- work
    [function (p, c) { return (c.founded || 0) >= 3; }, 'founder', '连续创业者|Serial Founder', '你开了{n}家公司。有的成了，有的没成，但你从没停下。|You founded {n} companies. Some made it, some didn\'t, but you never stopped.'],
    [function (p, c) { return (c.fired || 0) >= 3; }, 'survivor', '打不死的打工人|The Unkillable Employee', '你被开除过好几次，每次都能找到下一份工作。|Fired several times, you always found the next job.'],
    [function (p, c) { return (c.jobs || 0) >= 9; }, 'nomad', '职场游牧民|The Career Nomad', '你换过{n}份工作，每一份都教会了你一点东西。|{n} jobs, and every one taught you something.'],
    [function (p) { return (p.edu && p.edu.deg >= 6); }, 'scholar', '学海无涯|A Life of Learning', '你读到了最高的学位，也读了一辈子的书。|You earned the highest degree, and never stopped reading.'],
    [function (p, c) { return (c.space || 0) >= 1; }, 'stars', '星辰大海|Among the Stars', '你从太空回望过地球。那之后，什么烦恼都显得很小。|You looked back at Earth from space. After that, every worry seemed small.'],
    [function (p, c) { return (c.bribes || 0) >= 3; }, 'corrupt', '贪官|The Corrupt Official', '你收下的每一个红包，最后都写进了判决书。|Every envelope you took ended up in the verdict.'],
    [function (p) { return p.st.fame >= 85; }, 'legend', '一代传奇|A Legend', '很多年后，还有人在谈论你。|Years later, people were still talking about you.'],
    // ---- the world
    [function (p, c) { return (c.emigrate || 0) >= 2; }, 'global', '世界公民|Citizen of the World', '你在好几个国家生活过，每一个都曾是你的家。|You lived in several countries, and each was home for a while.'],
    [function (p, c) { return (c.travel || 0) >= 10; }, 'traveler', '环球旅行家|The Globetrotter', '你的护照盖满了章，你的相册比日记还厚。|Your passport was full of stamps, your albums thicker than your diary.'],
    [function (p, c) { return (c.pets || 0) >= 3; }, 'petlover', '毛孩子的家长|Parent to Many Pets', '你这一生，被好几只毛孩子爱过。|In your life, you were loved by a whole parade of pets.'],
    [function (p, c) { return (c.hero || 0) >= 1; }, 'brave', '挺身而出|The One Who Stepped Up', '在别人后退的时候，你往前走了一步。|When others stepped back, you stepped forward.']
  ];
  G.ENDS3 = ENDS;
  function originTitles() { var n = 0, E = (G.ODBX && G.ODBX.ends) || {}; for (var k in E) n += E[k].length; return n; }
  G.endingTotal = function () { return ENDS.length + originTitles() + 30; };

  var cmp = G.ending.compute;
  G.ending.compute = function () {
    var d = cmp.apply(this, arguments), s = S(), p = s.p, c = s.cnt || {}, f = p.flags || {};
    try {
      var cur = zh(d.title), key = null;
      var generic = !d.title || GENERIC.indexOf(cur) >= 0;
      if (generic) {
        var h = f.spyH || {};
        var vars = { code: G.T(h.code || '无名|Nameless'), cover: G.T(h.cover || '普通职员|office worker'), m: h.missions || 0, y: c.jailYrs || 0, n: (c.founded || c.jobs || 0) };
        for (var i = 0; i < ENDS.length; i++) {
          var e = ENDS[i], ok = false;
          try { ok = e[0](p, c, f, d); } catch (er) { ok = false; }
          if (ok) {
            if (e[1] === 'nomad') vars.n = c.jobs || 0;
            if (e[1] === 'founder') vars.n = c.founded || 0;
            d.title = e[2]; d.td = T2(e[3], vars); d.epitaph = d.td; key = e[1]; break;
          }
        }
        // nothing special happened: your origin's own verdict becomes the title
        if (!key && d.ov) { d.title = d.ov.t; d.td = d.ov.d; d.epitaph = d.ov.d; key = 'o_' + d.ov.org + '_' + zh(d.ov.t); }
      }
      key = key || 'k_' + zh(d.title);
      var M = G.meta; if (M) { M.endSeen = M.endSeen || {}; d.endNew = !M.endSeen[key]; M.endSeen[key] = 1; d.endN = Object.keys(M.endSeen).length; d.endTot = Math.max(G.endingTotal(), d.endN); }
      d.endKey = key;
    } catch (e) { console.error(e); }
    return d;
  };
})();
