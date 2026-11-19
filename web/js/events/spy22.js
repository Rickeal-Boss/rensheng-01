/* Version 3.2 — the spy life, rebuilt.
   - No more instinct quizzes: every spy test is settled by who you are (brains, charm, nerve, luck, rank, gear).
   - The periodic "field case" quiz is replaced by real missions: a train, a ski lift, an embassy ball, a casino,
     a bridge exchange… each with different approaches (force, wits, charm, a gadget) and different outcomes.
   - Your own codename, your own cover job, and a gadget workshop: gadgets you earn open new options later.
   - Everything you do as a spy is remembered for the ending. */
(function () {
  'use strict';
  var N = G.N, H = G.EH;
  function S() { return G.S; }
  function P() { return G.S.p; }
  function sp() { return P().spy; }
  function hist() { var f = P().flags; f.spyH = f.spyH || { max: 0, missions: 0, gear: 0 }; return f.spyH; }
  function merit(n) { if (sp()) sp().merit += n; }
  function heat(n) { if (sp()) sp().heat = G.clamp((sp().heat || 0) + n, 0, 100); }
  function cash(usd) { var m = G.$(usd); if (G.fin) G.fin.tag = G.L('情报工作|Intelligence work'); G.addMoney(m); if (G.fin) G.fin.tag = null; return m; }

  /* ---------- 1. no quiz: the test is you ---------- */
  G.spyGame = async function (o) {
    o = o || {};
    var p = P(), s = sp() || {}, st = p.st;
    var gear = (s.gear || []).length;
    var sc = G.clamp(.2 + st.smarts / 260 + st.eq / 320 + (st.luck || 50) / 600 + (s.rank || 0) * .03 + gear * .02 + G.R() * .35 - (o.diff || 0) - (s.heat || 0) / 500, 0, 1);
    var ok = G.ch(G.clamp(sc * .9 + .05, .05, .95));
    if (sp()) sp().ops = (sp().ops || 0) + 1;
    return { score: sc, ok: ok, great: ok && sc >= .82 };
  };
  if (G.UI) G.UI.spyGame = null;
  var STRIP = [/（直觉小游戏）/g, / ?\(instinct test\)/g, /（[一二三两四]关）/g, / ?\(\d tests?\)/g, /（直觉）/g];
  function clean(x) { if (typeof x !== 'string') return x; STRIP.forEach(function (re) { x = x.replace(re, ''); }); return x; }
  (G.SPY_STORIES || []).forEach(function (st) {
    (st.o || []).forEach(function (o, i) {
      o.t = clean(o.t);
      // only someone who actually took the offer lives a double life
      if (st.id === 'ss_turn_offer' && i === 0) { var r0 = o.run; o.run = async function () { var r = await r0.apply(this, arguments); if (/双面|double/i.test(String(r || '')) || G.ch(.5)) hist().double = 1; return r; }; }
    });
  });
  ['spy_arrest', 'spy_youth', 'spy_recruit', 'spy_high'].forEach(function (id) { var d = G.EV[id]; if (d && d.o) d.o.forEach(function (o) { o.t = clean(o.t); }); });
  (G.ACT_CATS || []).forEach(function (c) { if (c.id === 'spy') (c.items || []).forEach(function (a) { a.n = clean(a.n); }); });

  /* ---------- 2. gadgets ---------- */
  var GEAR = {
    lipstick: ['💄', '口红麻醉枪|Lipstick Dart Gun'], camera: ['📷', '纽扣相机|Button Camera'], pen: ['🖊️', '隐形墨水钢笔|Invisible-Ink Pen'],
    key: ['🗝️', '万能钥匙|Skeleton Key'], mask: ['🎭', '仿真面具|Latex Mask'], watch: ['⌚', '激光手表|Laser Watch'],
    phone: ['🛰️', '卫星电话|Satellite Phone'], car: ['🏎️', '改装跑车|Modified Sports Car'], umbrella: ['☂️', '滑翔伞雨伞|Glider Umbrella']
  };
  G.SPY_GEAR = GEAR;
  function hasGear(k) { return !!sp() && (sp().gear || []).indexOf(k) >= 0; }
  function giveGear(k) { var s = sp(); if (!s) return ''; s.gear = s.gear || []; if (s.gear.indexOf(k) >= 0) return ''; s.gear.push(k); hist().gear = s.gear.length; return G.L('\n获得装备：{i}{n}|\nNew gadget: {i} {n}', { i: GEAR[k][0], n: GEAR[k][1] }); }
  function gname(k) { return GEAR[k][0] + G.T(GEAR[k][1]); }
  function code() { var s = sp(); return s && s.code ? G.T(s.code) : G.T('无名|Nameless'); }

  /* ---------- 3. missions ---------- */
  // [key, minRank, title, icon, text, approaches, gadget, gadgetResult]
  // approach: [label, stat, base, okText, badText, okFx]
  var M = [
    ['train', 0, '东方快车|The Night Express', '🚂', '目标会在夜车的餐车里交易一只公文包。列车十一点穿过边境，你只有两个小时。|The target will swap a briefcase in the dining car of the night express. It crosses the border at eleven; you have two hours.', [
      ['扮成乘务员送咖啡|Pose as a steward with coffee', 'eq', .45, '你把咖啡洒在了他的西装上，趁他擦的时候换走了公文包。|You spilled coffee on his suit and swapped the case while he mopped it up.', '他盯着你的工牌看了三秒。你只好在下一站跳车。|He stared at your badge for three seconds. You jumped off at the next stop.'],
      ['从车顶爬到他的包厢|Climb along the roof to his compartment', 'health', .35, '风很大，可你做到了。窗户打开的时候，他正在睡觉。|The wind howled, but you made it. When the window opened he was asleep.', '你差点被隧道削掉脑袋，任务只能放弃。|A tunnel nearly took your head off; you had to abort.']
    ], 'mask', '你戴上面具变成了他的接头人，他亲手把公文包交给了你。|You wore his contact\'s face. He handed you the briefcase himself.'],
    ['ball', 0, '大使馆的舞会|The Embassy Ball', '💃', '大使馆的年度舞会。你要在午夜前拍下保险柜里的一份名单。|The embassy\'s annual ball. Before midnight you must photograph a list in the safe.', [
      ['邀请大使夫人跳舞，套出密码|Dance with the ambassador\'s spouse and charm out the code', 'eq', .45, '第三支舞时，你听到了一串数字——是他们结婚的日期。|By the third dance you had the digits: their wedding date.', '你踩了对方三次脚，对方提前离场了。|You trod on their feet three times; they left early.'],
      ['伪装成侍者溜进书房|Slip into the study as a waiter', 'smarts', .4, '你在托盘下面拍完了名单，还顺手端走了一杯香槟。|You shot the list under your tray — and took a glass of champagne on the way out.', '书房里坐着一个保镖，正在吃你要送的那盘点心。|A bodyguard sat in the study, eating the canapés you were "delivering".']
    ], 'camera', '你的纽扣相机在你和大使握手时就拍下了保险柜的密码。|Your button camera caught the safe code while you shook the ambassador\'s hand.'],
    ['casino', 1, '赌场的筹码|Casino Chips', '🎰', '对方的出纳在赌场洗钱。你得坐上他的牌桌，赢到他不得不亲自出面。|Their paymaster launders money through a casino. You must win at his table until he has to show himself.', [
      ['靠记牌|Count cards', 'smarts', .4, '你赢了一百万筹码。出纳来了，你们握手时，你把追踪器按进了他的袖口。|You won a million in chips. The paymaster came over; as you shook hands, a tracker went into his cuff.', '赌场经理客气地请你离开，并给你拍了一张照片。|The manager politely asked you to leave — and took your photo.'],
      ['靠运气，全押|Trust luck — all in', 'luck', .3, '轮盘停在了十七。全场欢呼，出纳脸都白了。|The wheel stopped on seventeen. The room erupted; the paymaster went white.', '你输光了总部的经费，还要写三万字的检讨。|You lost HQ\'s whole budget and had to write a thirty-thousand-word apology.']
    ], 'watch', '你用激光手表在他的筹码上刻了一个记号。三天后，那批筹码出现在了对方的金库里。|You etched a mark on his chips with your laser watch. Three days later they turned up in the enemy vault.'],
    ['ski', 1, '雪山缆车|The Ski Lift', '🚡', '线人约你在雪山缆车上见面。可缆车开到一半，你发现对面车厢里坐着两个杀手。|Your source meets you on a mountain cable car. Halfway up, you spot two killers in the car opposite.', [
      ['跳到下面的雪道上|Jump to the piste below', 'health', .4, '你在雪地里滚了五十米，带着线人滑下了山。|You rolled fifty metres through the snow and skied down with your source.', '你摔断了腿，线人被带走了。|You broke your leg; your source was taken.'],
      ['在车厢里设陷阱|Set a trap in the cabin', 'smarts', .4, '杀手打开车门的时候，你已经把门把手接上了缆车的电线。|When the killers opened the door, you\'d wired the handle to the cable.', '陷阱没起作用，你只好和他们在车厢里打了一架。|The trap failed; you fought them hand to hand.']
    ], 'umbrella', '你撑开雨伞，带着线人从缆车上滑翔而下。杀手们在上面目瞪口呆。|You opened the umbrella and glided off the lift with your source. The killers just stared.'],
    ['wedding', 0, '婚礼摄影师|The Wedding Photographer', '📸', '对方高官的女儿要结婚了。你要扮成婚礼摄影师，拍下所有宾客。|A senior official\'s daughter is getting married. You\'ll pose as the photographer and shoot every guest.', [
      ['真的认真拍婚礼|Actually shoot a great wedding', 'eq', .5, '新娘很喜欢你拍的照片，还推荐你去拍她表妹的婚礼。总部得到了宾客名单，你得到了一份副业。|The bride loved your photos and recommended you to her cousin. HQ got the guest list; you got a side gig.', '你把镜头对准宾客太久，新郎的伴郎起了疑心。|You lingered on the guests too long; the best man got suspicious.'],
      ['只拍目标，不管新人|Ignore the couple; shoot only the targets', 'smarts', .4, '名单拿到了。新人的照片……有点糊。|You got the list. The couple\'s photos were… a bit blurry.', '新娘发现相册里没有一张她的正脸，当场报警。|The bride found no clear picture of herself and called the police.']
    ], 'camera', '纽扣相机全程自动拍摄，你还顺便抢到了捧花。|The button camera shot everything on its own — and you caught the bouquet.'],
    ['deaddrop', 0, '死信箱|The Dead Drop', '🪨', '公园第三张长椅下有一块松动的砖，里面是一份情报。可今天，长椅上坐着一个一直在喂鸽子的老人。|Under the third park bench is a loose brick with intel inside. Today an old man sits there, feeding pigeons.', [
      ['坐下来，和他一起喂鸽子|Sit down and feed the pigeons with him', 'eq', .5, '你们喂了一个小时鸽子。他走后，你从砖下取走了情报——后来你才知道，他是来保护你的。|An hour of pigeons. When he left you took the intel — later you learned he was there to protect you.', '老人走的时候，拿走了砖下的东西。|When the old man left, he took what was under the brick.'],
      ['制造混乱：撒一把面包屑|Make chaos: throw a handful of crumbs', 'luck', .45, '一千只鸽子扑了过来，老人落荒而逃。|A thousand pigeons descended; the old man fled.', '鸽子扑了你一身，你被路人拍成了短视频。|The pigeons swarmed you instead, and a passer-by filmed it.']
    ], 'pen', '你在长椅上用隐形墨水留了一句话，第二天情报就换了一个地方等你。|You left a line in invisible ink on the bench; next day the intel was waiting somewhere safer.'],
    ['museum', 2, '博物馆的夜|A Night at the Museum', '🏛️', '一份微缩胶片藏在国家博物馆一幅油画的画框里。博物馆晚上九点闭馆。|A microfilm is hidden in the frame of a painting in the national museum. It closes at nine.', [
      ['藏在埃及石棺里等闭馆|Hide in an Egyptian sarcophagus until closing', 'health', .4, '你在石棺里躺了四个小时，出来时差点吓死巡逻的保安。|Four hours in a sarcophagus. When you climbed out you nearly gave the guard a heart attack.', '石棺太窄，你在里面抽筋了，被保安发现。|The sarcophagus was too narrow; you cramped up and were found.'],
      ['申请当一天志愿讲解员|Volunteer as a guide for the day', 'smarts', .45, '你给一个旅游团讲了两个小时的油画，讲完以后，胶片已经在你口袋里了。|You lectured a tour group on the painting for two hours; by the end the microfilm was in your pocket.', '有个游客是艺术史教授，当场指出你讲错了三处。你只好撤退。|One tourist was an art historian who corrected you three times. You withdrew.']
    ], 'key', '万能钥匙打开了画框背面的暗格。|The skeleton key opened the hidden panel behind the frame.'],
    ['scientist', 2, '叛逃的科学家|The Defecting Scientist', '🧪', '一位核物理学家想叛逃，可他要求带上他的猫、他的钢琴和他九十岁的母亲。|A nuclear physicist wants to defect — with his cat, his piano and his ninety-year-old mother.', [
      ['全部带上|Bring them all', 'smarts', .35, '你们把钢琴装进了一辆搬家公司的卡车，猫坐在副驾驶，老太太一路都在织毛衣。|The piano went in a removals van, the cat rode shotgun, and his mother knitted the whole way.', '钢琴卡在了楼梯上，整栋楼的人都出来看。任务泡汤了。|The piano jammed in the stairwell and the whole building came out to watch. Mission over.'],
      ['说服他只带母亲|Persuade him to bring only his mother', 'eq', .45, '他哭着把猫交给了邻居。到安全屋后的第一件事，他又买了一只一模一样的猫。|He tearfully left the cat with a neighbour. His first act in the safe house was to buy an identical cat.', '他拒绝了，叛逃取消。|He refused. The defection was off.']
    ], 'car', '改装跑车的后座装下了科学家、他母亲和猫。钢琴，下次再说。|The modified car fitted the scientist, his mother and the cat. The piano could wait.'],
    ['bridge', 3, '桥上的交换|The Exchange on the Bridge', '🌉', '凌晨五点，雾很大。你负责在桥中间交换一名被俘的同事。对方的人带着狙击手。|5 a.m., thick fog. You\'re to swap a captured colleague in the middle of the bridge. Their side has a sniper.', [
      ['一步一步按规矩走|Walk it exactly by the book', 'eq', .5, '你们在桥中间擦肩而过。同事走过你身边时，低声说了一句：“谢谢。”|You passed in the middle of the bridge. Your colleague whispered: "Thank you."', '对方临时变卦，交换推迟了一个月。|They changed the terms at the last minute; the exchange was delayed a month.'],
      ['让自己的狙击手先瞄准他们的狙击手|Have your sniper cover theirs first', 'smarts', .45, '雾散的时候，两边的狙击手互相看见了对方，都放下了枪。交换顺利完成。|As the fog lifted the snipers saw each other and lowered their rifles. The exchange went through.', '对方察觉到了，交换差点变成枪战。|They noticed, and the exchange nearly became a gunfight.']
    ], 'phone', '你用卫星电话直接打给了对方的局长：“我们都想早点回家吃早饭。”交换提前了十分钟。|You called their director on the satellite phone: "We\'d all like to be home for breakfast." The swap happened ten minutes early.'],
    ['hacker', 1, '黑客松|The Hackathon', '💻', '对方在一场国际黑客大赛里藏了一个招募测试。你要混进去，找出他们的招募官。|The other side has hidden a recruiting test inside an international hackathon. Get in and find their recruiter.', [
      ['真的去比赛|Actually compete', 'smarts', .4, '你拿了第二名，招募官主动来找你了。|You came second — and their recruiter came looking for you.', '你第一轮就被淘汰了，还被一个十五岁的孩子嘲笑。|Out in round one, mocked by a fifteen-year-old.'],
      ['在茶歇区社交|Work the coffee break', 'eq', .45, '你请所有人喝了咖啡，最后只有一个人没喝——他就是招募官。|You bought everyone coffee; only one person didn\'t drink — the recruiter.', '你聊了一下午，只认识了一群想找女朋友/男朋友的程序员。|An afternoon of chat, and you only met coders hoping for a date.']
    ], 'phone', '你的卫星电话在会场里截获了一个异常的加密信号。|Your satellite phone picked up an odd encrypted signal in the hall.'],
    ['delivery', 0, '外卖员|The Delivery Rider', '🛵', '目标住在一栋门禁森严的公寓里，但他每天晚上八点点同一家店的麻辣烫。|The target lives in a tightly guarded building, but every night at eight he orders the same spicy hotpot.', [
      ['去那家店打工，亲自送餐|Work at the shop and deliver it yourself', 'eq', .5, '你送了一个月麻辣烫，他每次都给你五星好评。最后一次，你把窃听器放进了他的筷子盒。|A month of deliveries and five stars every time. On the last one, the bug went in his chopstick box.', '第二天他换了一家店。|The next day he switched restaurants.'],
      ['在麻辣烫里加料|Add something to the hotpot', 'smarts', .35, '他吃完睡了十二个小时，你拷走了他电脑里的所有文件。|He slept twelve hours after dinner; you copied every file on his laptop.', '你加错了料，他只是拉了一晚上肚子。|Wrong ingredient. He just had a very bad night.']
    ], 'lipstick', '你用口红麻醉枪隔着门缝放倒了他的保镖。|The lipstick dart gun dropped his bodyguard through the gap in the door.'],
    ['zoo', 0, '动物园接头|The Zoo Contact', '🐼', '接头地点在动物园熊猫馆。暗号是：“今天的竹子很新鲜。”可今天熊猫馆前排着三百个游客。|The meet is at the zoo\'s panda house. Password: "The bamboo is fresh today." Three hundred tourists are queuing.', [
      ['对每个人都说一遍暗号|Say the password to everyone', 'luck', .4, '第二百四十七个人回答：“可惜熊猫在睡觉。”接头成功。|Person 247 replied: "Pity the panda\'s asleep." Contact made.', '游客们都觉得你很奇怪，有人叫来了保安。|Everyone thought you were odd; someone called security.'],
      ['去熊猫馆后门|Go round the back of the panda house', 'smarts', .5, '饲养员就是你的接头人。他给了你一根竹子，情报就藏在竹节里。|The keeper was your contact. He handed you a bamboo stalk — the intel was inside.', '后门锁了，你被一只小熊猫追了半个园区。|The back door was locked, and a red panda chased you halfway across the zoo.']
    ], null, ''],
    ['island', 3, '富豪的私人岛屿|The Billionaire\'s Island', '🏝️', '一位军火商在私人岛上过生日，全世界的富豪都来了。他的服务器在岛中心的灯塔里。|An arms dealer is throwing a birthday on his private island. The server is in the lighthouse at the centre.', [
      ['扮成派对上的富豪|Pass yourself off as a billionaire guest', 'looks', .45, '你穿着借来的礼服，喝着香槟，聊着根本不存在的游艇。三小时后，硬盘在你的手包里。|Borrowed gown, champagne, talk of a yacht that didn\'t exist. Three hours later the drive was in your clutch.', '一位真富豪问你游艇是哪个船厂造的，你答不上来。|A real billionaire asked which yard built your yacht. You had no answer.'],
      ['夜里从海上游过去|Swim in by night', 'health', .4, '你游了两公里，从灯塔下面的礁石爬了上去。|Two kilometres of open water, then up the rocks under the lighthouse.', '你被巡逻艇的探照灯照了个正着。|The patrol boat\'s searchlight caught you.']
    ], 'car', '你的改装跑车其实是一辆水陆两用车。你直接开上了岛。|Your "car" was amphibious. You drove straight onto the island.'],
    ['mole_hunt', 3, '茶水间的内鬼|The Mole by the Coffee Machine', '☕', '总部里有一个内鬼。线索只有一条：他每天早上会在茶水间多拿一包糖。|There\'s a mole at HQ. One clue: every morning he takes an extra sugar sachet in the kitchen.', [
      ['在糖包上做记号|Mark the sugar sachets', 'smarts', .5, '三天后，带记号的糖包出现在了对方使馆的垃圾桶里。内鬼是后勤处的一个老好人。|Three days later the marked sachets turned up in the enemy embassy\'s rubbish. The mole was a kindly old man in logistics.', '大家发现糖包上有记号，以为是食堂搞的抽奖。|People thought the marks were a canteen prize draw.'],
      ['每天早上都在茶水间蹲守|Stake out the kitchen every morning', 'eq', .4, '你喝了一个月咖啡，和每个人都聊过天。最后，只有一个人从来不跟你聊天。|A month of coffee and chats. Only one person never spoke to you.', '你喝咖啡喝到心悸，被送去体检。|So much coffee you got palpitations and were sent for a check-up.']
    ], 'camera', '纽扣相机拍下了他把文件塞进糖罐的那一刻。|The button camera caught him slipping documents into the sugar tin.']
  ];
  G.SPY_MISSIONS = M;
  function avail() {
    var s = sp(); if (!s || s.youth) return [];
    var done = s.mDone || [];
    return M.filter(function (m) { return s.rank >= m[1] && done.indexOf(m[0]) < 0; });
  }
  function mOf(c) { return M.filter(function (m) { return m[0] === c.prm.mk; })[0]; }
  function resolve(c, ok, okT, badT, gainGear) {
    var s = sp(), p = c.p, rk = (s && s.rank) || 0, h = hist();
    h.missions++;
    if (ok) {
      var g = G.ri(15, 30) + rk * 6, m = cash(G.ri(8, 20) * 1000 * (1 + rk * .3)); merit(g); heat(-5);
      var extra = gainGear && G.ch(.5) ? giveGear(gainGear) : '';
      return G.L('{t}\n（代号「{c}」· 功绩+{g} · 奖金{m}）|{t}\n(Codename "{c}" · merit +{g} · bonus {m})', { t: okT, c: code(), g: g, m: G.M(m) }) + extra;
    }
    heat(G.ri(10, 20)); H.fx(c, { stress: 8 }); if (G.ch(.15)) H.fx(c, { health: -6 });
    return G.L('{t}\n（暴露风险{h}%）|{t}\n(Exposure risk {h}%)', { t: badT, h: Math.round((sp() || {}).heat || 0) });
  }
  var mission = G.EV.spy_case;
  if (mission) {
    mission.title = function (c) { var m = mOf(c); return m ? m[2] : '情报任务|Field Case'; };
    mission.icon = '🕵️';
    mission.prep = function (c) {
      if (!G.spyOn || !G.spyOn()) return false;
      var L = avail(); if (!L.length) return false;
      var m = G.pick(L); c.prm.mk = m[0]; var s = sp(); (s.mDone = s.mDone || []).push(m[0]);
    };
    mission.t = function (c) { var m = mOf(c); return m ? m[4] : ''; };
    mission.o = [0, 1, 2, 3].map(function (i) {
      return {
        t: function (c) { var m = mOf(c); if (!m) return ''; if (i < 2) return m[5][i][0]; if (i === 2) return m[6] ? G.L('用装备：{g}|Use gadget: {g}', { g: gname(m[6]) }) : ''; return G.L('放弃任务，安全撤离|Abort and get out clean'); },
        if: function (c) { var m = mOf(c); if (!m) return false; if (i < 2) return !!m[5][i]; if (i === 2) return !!m[6] && hasGear(m[6]); return true; },
        run: function (c) {
          var m = mOf(c), p = c.p;
          if (i === 3) { heat(-3); merit(-3); return G.L('你悄悄撤了。总部没说什么，但你的档案里多了一行“谨慎”。|You quietly withdrew. HQ said nothing, but your file now says "cautious".'); }
          if (i === 2) return resolve(c, G.ch(.9), m[7], '', null);
          var a = m[5][i], v = a[1] === 'luck' ? (p.st.luck || 50) : (p.st[a[1]] || 50);
          var ok = G.ch(G.clamp(a[2] + (v - 50) / 160 + ((sp() || {}).rank || 0) * .04 - ((sp() || {}).heat || 0) / 400, .08, .92));
          var reward = G.pick(Object.keys(GEAR).filter(function (k) { return !hasGear(k); }));
          return resolve(c, ok, a[3], a[4], reward);
        }
      };
    });
  }
  // missions come every couple of years now, not as a yearly exam
  var pre = G.pickRandomEvents;
  G.pickRandomEvents = function (n) {
    var out = pre.apply(this, arguments), s = sp();
    if (s && !s.youth && !P().jail && out && out.length === 1 && out[0] && out[0].id === 'spy_case' && !avail().length) {
      // all missions done: let ordinary life through
      return pre.apply(this, arguments).filter(function (x) { return x && x.id !== 'spy_case'; });
    }
    return out;
  };

  /* ---------- 4. codename, cover job, gadget lab, a few spy-life stories ---------- */
  var CODES = ['夜莺|Nightingale', '白鸽|White Dove', '老猫|Old Cat', '火柴|Matchstick', '候鸟|Migrant Bird', '零号|Zero', '月光|Moonlight', '青蛙|Frog', '麻将|Mahjong', '饺子|Dumpling', '北极星|Polaris', '蒲公英|Dandelion'];
  var COVERS = [['花店老板|Florist', '💐'], ['出租车司机|Taxi Driver', '🚕'], ['大学讲师|University Lecturer', '👨‍🏫'], ['驻外记者|Foreign Correspondent', '📰'], ['厨师|Chef', '🍳'], ['钢琴调音师|Piano Tuner', '🎹'], ['宠物医生|Vet', '🐶']];
  G.evs([
    { id: 'spy_codename', sys: 1, title: '你的代号|Your Codename', icon: '🏷️',
      prep: function (c) { var s = sp(); if (!s || s.code) return false; c.prm.L = G.sample(CODES, 3); },
      t: '档案室的老人把一张空白卡片推到你面前：“从今天起，你没有名字，只有代号。自己挑一个吧。”|The old archivist slides a blank card across: "From today you have no name, only a codename. Pick one."',
      o: [0, 1, 2].map(function (i) { return { t: function (c) { return c.prm.L ? c.prm.L[i] : ''; }, run: function (c) { var s = sp(); if (s) s.code = c.prm.L[i]; hist().code = c.prm.L[i]; return G.L('卡片上写下了「{c}」。很多年后，有人只知道这两个字，不知道你是谁。|The card now reads "{c}". Years later, people would know those words and never who you were.', { c: G.T(c.prm.L[i]) }); } }; }) },
    { id: 'spy_cover', sys: 1, title: '掩护身份|Your Cover', icon: '🪪',
      prep: function (c) { var s = sp(); if (!s || s.youth || s.cover) return false; c.prm.L = G.sample(COVERS, 3); },
      t: '你需要一个掩护身份：一份真实的、每天要上班的工作。总部给了三个选择。|You need a cover: a real job you actually go to every day. HQ offers three.',
      o: [0, 1, 2].map(function (i) { return { t: function (c) { return c.prm.L ? c.prm.L[i][1] + ' ' + G.T(c.prm.L[i][0]) : ''; }, run: function (c) { var s = sp(), cv = c.prm.L[i]; if (s) s.cover = cv[0]; hist().cover = cv[0]; G.addMoney(G.$(3000)); return G.L('从今天起，你是一名{c}。邻居们都说你干得不错——他们不知道你下班以后去了哪里。|From today you are a {c}. The neighbours say you\'re good at it — they don\'t know where you go after work.', { c: G.T(cv[0]) }); } }; }) },
    { id: 'spy_lab', sys: 1, title: '装备科|The Gadget Lab', icon: '🔧',
      prep: function (c) { var s = sp(); if (!s || s.youth) return false; var L = Object.keys(GEAR).filter(function (k) { return !hasGear(k); }); if (L.length < 2) return false; c.prm.L = G.sample(L, Math.min(3, L.length)); },
      t: '装备科的怪老头把三样东西摆在桌上：“你只能拿一样。别问为什么，预算紧。”|The eccentric in the gadget lab lays three things on the bench: "One. Don\'t ask why. Budget\'s tight."',
      o: [0, 1, 2].map(function (i) { return { t: function (c) { var k = c.prm.L && c.prm.L[i]; return k ? gname(k) : ''; }, if: function (c) { return !!(c.prm.L && c.prm.L[i]); }, run: function (c) { var k = c.prm.L[i]; giveGear(k); return G.L('“别弄坏了，”老头说，“上一个人把它弄丢在了蒙特卡洛。”|"Don\'t break it," he says. "The last one lost it in Monte Carlo."') + G.L('\n获得装备：{g}|\nNew gadget: {g}', { g: gname(k) }); } }; }) },
    { id: 'spy_cover_life', sys: 1, title: '掩护身份的烦恼|Trouble with the Cover', icon: '😅',
      prep: function (c) { var s = sp(); if (!s || !s.cover) return false; },
      t: function (c) { var cv = G.T(sp().cover); return G.L('你的掩护身份是{c}。最近，你在这份“假工作”上干得太好了：顾客排队、同行嫉妒、电视台还想来采访你。|Your cover is {c}. Lately you\'ve been too good at the "fake" job: queues of customers, jealous rivals, and a TV station wants an interview.', { c: cv }); },
      o: [{ t: '接受采访——最好的伪装就是出名|Do the interview — fame is the best disguise', run: function (c) { H.fx(c, { fame: 3, happy: 4 }); heat(G.ch(.5) ? -8 : 10); return G.L('节目播出了。总部的人看完说：“你演得比真的还真。”|It aired. Someone at HQ said: "More convincing than the real thing."'); } },
        { t: '故意搞砸几单生意，低调一点|Botch a few jobs and lie low', run: function (c) { heat(-10); H.fx(c, { happy: -2 }); return G.L('差评多了几条，你终于又变回了一个“普通人”。|A few bad reviews, and you were safely ordinary again.'); } }] }
  ]);
  // schedule them inside the yearly tick: codename first, cover at rank 1, the lab every few years
  var mt = G.money.tick;
  G.money.tick = function () {
    var r = mt.apply(this, arguments), s = S(), p = s.p, q = s.pendQ = s.pendQ || [];
    try {
      if (p.spy && !p.jail && !s.dead) {
        var spx = p.spy, h = hist(); h.max = Math.max(h.max || 0, spx.rank || 0);
        if (spx.ag !== p.country) h.foreign = 1;
        if ((spx.done || []).indexOf('ss_medal') >= 0) h.medal = 1;
        if (!spx.code) q.push({ id: 'spy_codename' });
        else if (!spx.youth && !spx.cover) q.push({ id: 'spy_cover' });
        else if (!spx.youth && (spx.labY == null || s.year - spx.labY >= 5) && G.ch(.5)) { spx.labY = s.year; q.push({ id: 'spy_lab' }); }
        else if (spx.cover && !spx.coverLife && G.ch(.15)) { spx.coverLife = 1; q.push({ id: 'spy_cover_life' }); }
      }
      if (p.flags.swapTo) hist().swapped = 1;
      if (p.jail && p.flags.spyH && p.flags.spyH.missions != null && !p.spy && (p.jail.why || '').indexOf('间谍') >= 0) hist().jailed = 1;
    } catch (e) { console.error(e); }
    return r;
  };
  var arr = G.EV.spy_arrest;
  if (arr) arr.o.forEach(function (o) { var r0 = o.run; o.run = async function (c) { hist().jailed = 1; return r0.apply(this, arguments); }; });
})();
