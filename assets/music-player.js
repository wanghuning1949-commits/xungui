/* ============================================================
   寻归荒野 · 声音档案（音乐库悬浮组件）
   - 右上角常驻一枚小音符按钮，点击才弹出面板；不点不弹。
   - 四间房：音笺（原四首 BGM + 红心收藏）| 听海 | 林间 | 找歌（线上试听）
   - 听海 / 林间是两间可以一直开着的房间：循环播放的海岸与森林录音，
     播放时有一张水彩的景，轻轻起伏；文案只有风景，不提任何人名。
   - 支持：播放 / 暂停 / 上一首 / 下一首 / 点选切歌 / 进度拖动 / 音量；
     面板可放大 / 缩小；悬浮标可拖动、位置记忆。
   - 不自动播放（需用户点击），不改页面既有 DOM，层级低于启动画面与公告。
   ============================================================ */
(() => {
  'use strict';
  if (window.__xunguiMusicLoaded) return;
  window.__xunguiMusicLoaded = true;

  /* ---------- 收藏曲库（原始四首，顺序与文件不改动） ---------- */
  const TRACKS = [
    { src: './assets/music/chunlai.mp3',        name: '春来' },
    { src: './assets/music/faguangshidai.mp3',  name: '发光时代' },
    { src: './assets/music/wohuainiande.mp3',   name: '我怀念的' },
    { src: './assets/music/yexin.mp3',          name: '野心' },
  ];

  /* ---------- 听海：原站那十五层海声，一层不差 ----------
     前三层是三片海，彼此互斥，一次只响一片；后十二层是围在四周的声音，
     想叠几层就叠几层——这就是原站那十五枚小图摆在一起时的听法。
     每条都只用包里这一份原站录音，不连线、不替换；没有照片，也没有画出来的替身：
     画面交给下方那片实时海面（与原站同一套天空、水面、木桩），声音与画面对在一起。
     图标也是原站那十五枚线描小图，一一对应。 ---------- */
  const SEA = [
    { src: './assets/ambience/sea-layers/calm-waves.mp3',       name: '平静的海',     sub: 'Calming sea',        main: true, gain: .8, icon: './assets/ambience/sea-icons/orig/waves1.svg' },
    { src: './assets/ambience/sea-layers/ocean.mp3',            name: '辽阔的海',     sub: 'Peaceful ocean',     main: true, gain: .8, icon: './assets/ambience/sea-icons/orig/waves2.svg' },
    { src: './assets/ambience/sea-layers/rough-sea.mp3',        name: '风暴将至',     sub: 'Rough storm',        main: true, gain: .8, icon: './assets/ambience/sea-icons/orig/waves3.svg' },
    { src: './assets/ambience/sea-layers/rowing.mp3',           name: '划桨的小船',   sub: 'Rowing a boat',                gain: .8, icon: './assets/ambience/sea-icons/orig/boat.svg' },
    { src: './assets/ambience/sea-layers/deck.mp3',             name: '桅杆与钢索',   sub: 'Boat mast',                    gain: .8, icon: './assets/ambience/sea-icons/orig/mast.svg' },
    { src: './assets/ambience/sea-layers/seagulls.mp3',         name: '海鸥',         sub: 'Seagulls',                     gain: .8, icon: './assets/ambience/sea-icons/orig/birds.svg' },
    { src: './assets/ambience/sea-layers/dolphins.mp3',         name: '海豚',         sub: 'Dolphins',                     gain: .8, icon: './assets/ambience/sea-icons/orig/dolphin.svg' },
    { src: './assets/ambience/sea-layers/sailboat-interior.mp3', name: '帆船舱里',    sub: 'Sailboat interior',            gain: .8, icon: './assets/ambience/sea-icons/orig/volant.svg' },
    { src: './assets/ambience/sea-layers/foghorn.mp3',          name: '远处的雾号',   sub: 'Distant foghorn',              gain: .8, icon: './assets/ambience/sea-icons/orig/foghorn.svg' },
    { src: './assets/ambience/sea-layers/walking-gravel.mp3',   name: '沙滩上的脚步', sub: 'Walking on a beach',           gain: .8, icon: './assets/ambience/sea-icons/orig/walk.svg' },
    { src: './assets/ambience/sea-layers/underwater.mp3',       name: '潜水',         sub: 'Underwater diving',            gain: .8, icon: './assets/ambience/sea-icons/orig/air.svg' },
    { src: './assets/ambience/sea-layers/ambient-music.mp3',    name: '潜艇里',       sub: 'Submarine ambiance',           gain: .8, icon: './assets/ambience/sea-icons/orig/ambient.svg' },
    { src: './assets/ambience/sea-layers/corals.mp3',           name: '浮标的铃',     sub: 'Buoy bells',                   gain: .8, icon: './assets/ambience/sea-icons/orig/bell.svg' },
    { src: './assets/ambience/sea-layers/motor-boat.mp3',       name: '摩托艇',       sub: 'Motor boat trip',              gain: .8, icon: './assets/ambience/sea-icons/orig/motor.svg' },
    { src: './assets/ambience/sea-layers/island-forest.mp3',    name: '岸上',         sub: 'On the land',                  gain: .8, icon: './assets/ambience/sea-icons/orig/island.svg' },
  ];
  /* 这间房只有一片海：原站那片天色（同一套参数），十五层声音共用它。 */
  const SEA_SCENE = { kind: 'sea', seed: 11, mood: 'day' };
  /* ---------- 林间：二十七片来自世界各地的森林。每片林子带三样——
     原站那条录音（remote，联网时优先）、包里的一份本地录音（离线或取不到时退回）、
     原站自己配的那张封面（photo，45 那片原站就没有图）+ 一幅画出来的兜底。 ---------- */
  const FOREST = [
    { src: './assets/ambience/forest/sierranevade.mp3', remote: 'https://newnow.cool/forest/sierranevade.mp3', name: '美国 · 塞拉内华达', sub: 'USA, California, Sierra Nevada', photo: './assets/ambience/forest-photos/t11.jpg?v=20261028h', scene: { kind: 'forest', seed: 411, mood: 'morning' } },
    { src: './assets/ambience/forest/Baltys-Soundscape.mp3', remote: 'https://newnow.cool/forest/Baltys-Soundscape.mp3', name: '立陶宛 · 维茹奥纳', sub: 'Lithuania, Vyžuonos', photo: './assets/ambience/forest-photos/t40.jpg?v=20261028h', scene: { kind: 'forest', seed: 440, mood: 'deep' } },
    { src: './assets/ambience/forest/LightRainBirdsAmbics.mp3', remote: 'https://newnow.cool/forest/LightRainBirdsAmbics.mp3', name: '爱尔兰 · 卡帕达夫', sub: 'Ireland, Soundctuary Cappaduff, County Clare', photo: './assets/ambience/forest-photos/t41.jpg?v=20261028h', scene: { kind: 'forest', seed: 441, mood: 'cool' } },
    { src: './assets/ambience/forest/HochschwendbergOvernightAT.mp3', remote: 'https://newnow.cool/forest/HochschwendbergOvernightAT.mp3', name: '奥地利 · 施文贝格', sub: 'Austria, Schwendberg Hippach-Schwendberg', photo: './assets/ambience/forest-photos/t42.jpg?v=20261028h', scene: { kind: 'forest', seed: 442, mood: 'deep' } },
    { src: './assets/ambience/forest/LangenbachEisWasser.mp3', remote: 'https://newnow.cool/forest/LangenbachEisWasser.mp3', name: '德国 · 美因蔡尔', sub: 'Germany, Zeil am Main', photo: './assets/ambience/forest-photos/t43.jpg?v=20261028h', scene: { kind: 'forest', seed: 443, mood: 'creek' } },
    { src: './assets/ambience/forest/AuenwaldWasser.mp3', remote: 'https://newnow.cool/forest/AuenwaldWasser.mp3', name: '德国 · 朗根巴赫谷', sub: 'Germany, Langenbachtal Nature Park Haßberge', photo: './assets/ambience/forest-photos/t44.jpg?v=20261028h', scene: { kind: 'forest', seed: 444, mood: 'creek' } },
    { src: './assets/ambience/forest/BundorfWaldsee.mp3', remote: 'https://newnow.cool/forest/BundorfWaldsee.mp3', name: '德国 · 黑尔湖', sub: "Germany, Forest Lake''Höllsee'' Nature Park Haßberge", photo: '', scene: { kind: 'forest', seed: 445, mood: 'misty' } },
    { src: './assets/ambience/forest/DrflisWieseJune.mp3', remote: 'https://newnow.cool/forest/DrflisWieseJune.mp3', name: '德国 · 哈斯贝格', sub: 'Germany, Nature Park Haßberge', photo: './assets/ambience/forest-photos/t46.jpg?v=20261028h', scene: { kind: 'forest', seed: 446, mood: 'spring' } },
    { src: './assets/ambience/forest/RadioAporeePrikoi.mp3', remote: 'https://newnow.cool/forest/RadioAporeePrikoi.mp3', name: '斯洛文尼亚 · 维帕瓦', sub: 'Slovenia, Vipava', photo: './assets/ambience/forest-photos/t47.jpg?v=20261028h', scene: { kind: 'forest', seed: 447, mood: 'dappled' } },
    { src: './assets/ambience/forest/TrnovoForestWind.mp3', remote: 'https://newnow.cool/forest/TrnovoForestWind.mp3', name: '斯洛文尼亚 · 特尔诺沃', sub: 'Slovenia, Trnovo', photo: './assets/ambience/forest-photos/t48.jpg?v=20261028h', scene: { kind: 'forest', seed: 448, mood: 'nordic' } },
    { src: './assets/ambience/forest/MonteRaschioOriolo.mp3', remote: 'https://newnow.cool/forest/MonteRaschioOriolo.mp3', name: '意大利 · 拉斯科山', sub: 'Italy, Monte Raschio', photo: './assets/ambience/forest-photos/t49.jpg?v=20261028h', scene: { kind: 'forest', seed: 449, mood: 'dappled' } },
    { src: './assets/ambience/forest/FrancescoFabrisYasuniNight.mp3', remote: 'https://newnow.cool/forest/FrancescoFabrisYasuniNight.mp3', name: '厄瓜多尔 · 阿南古湖', sub: 'Ecuador, Yasuni National Park, Añangu Lake', photo: './assets/ambience/forest-photos/t50.jpg?v=20261028h', scene: { kind: 'forest', seed: 450, mood: 'jungle' } },
    { src: './assets/ambience/forest/FrancescoFabrisYasuni07.mp3', remote: 'https://newnow.cool/forest/FrancescoFabrisYasuni07.mp3', name: '厄瓜多尔 · 亚苏尼', sub: 'Ecuador, Yasuni National Park', photo: './assets/ambience/forest-photos/t51.jpg?v=20261028h', scene: { kind: 'forest', seed: 451, mood: 'jungle' } },
    { src: './assets/ambience/forest/MorningBirds.mp3', remote: 'https://newnow.cool/forest/MorningBirds.mp3', name: '智利 · 瓦尔迪维亚', sub: 'Chile, Valdivia', photo: './assets/ambience/forest-photos/t52.jpg?v=20261028h', scene: { kind: 'forest', seed: 452, mood: 'dawn' } },
    { src: './assets/ambience/forest/AbbeySainte-MarieDesertBird01.mp3', remote: 'https://newnow.cool/forest/AbbeySainte-MarieDesertBird01.mp3', name: '法国 · 贝勒加德圣玛丽', sub: 'France, Bellegarde-Sainte-Marie', photo: './assets/ambience/forest-photos/t53.jpg?v=20261028h', scene: { kind: 'forest', seed: 453, mood: 'spring' } },
    { src: './assets/ambience/forest/DolonaSamy.mp3', remote: 'https://newnow.cool/forest/DolonaSamy.mp3', name: '波兰 · 鲁马内克', sub: 'Polska, Rumianek', photo: './assets/ambience/forest-photos/t54.jpg?v=20261028h', scene: { kind: 'forest', seed: 454, mood: 'morning' } },
    { src: './assets/ambience/forest/VuniseaNamaraRoadSound.mp3', remote: 'https://newnow.cool/forest/VuniseaNamaraRoadSound.mp3', name: '斐济 · 卡达武岛', sub: 'Fiji, Vunisea-Namara Road, Kadavu Island', photo: './assets/ambience/forest-photos/t55.jpg?v=20261028h', scene: { kind: 'forest', seed: 455, mood: 'jungle' } },
    { src: './assets/ambience/forest/SoundscapeAbaca09Uhr10.mp3', remote: 'https://newnow.cool/forest/SoundscapeAbaca09Uhr10.mp3', name: '斐济 · 阿巴卡瀑布径', sub: 'Fiji, Waterfall track, Abaca', photo: './assets/ambience/forest-photos/t56.jpg?v=20261028h', scene: { kind: 'forest', seed: 456, mood: 'creek' } },
    { src: './assets/ambience/forest/LargoCarpasexp.mp3', remote: 'https://newnow.cool/forest/LargoCarpasexp.mp3', name: '巴西 · 大西洋林', sub: 'Brazil, Atlantic Forest, Cantareira State Park', photo: './assets/ambience/forest-photos/t57.jpg?v=20261028h', scene: { kind: 'forest', seed: 457, mood: 'deep' } },
    { src: './assets/ambience/forest/RadioAporeeT023.mp3', remote: 'https://newnow.cool/forest/RadioAporeeT023.mp3', name: '巴西 · 佩德拉格兰德', sub: 'Brazil, Pedra Grande Cantareira 1', photo: './assets/ambience/forest-photos/t58.jpg?v=20261028h', scene: { kind: 'forest', seed: 458, mood: 'dappled' } },
    { src: './assets/ambience/forest/RadioAporeeT06502300443RX.mp3', remote: 'https://newnow.cool/forest/RadioAporeeT06502300443RX.mp3', name: '巴西 · 坎塔雷拉三', sub: 'Brazil, Parque da Cantareira 3', photo: './assets/ambience/forest-photos/t59.jpg?v=20261028h', scene: { kind: 'forest', seed: 459, mood: 'morning' } },
    { src: './assets/ambience/forest/RXimgradioaporee.mp3', remote: 'https://newnow.cool/forest/RXimgradioaporee.mp3', name: '巴西 · 坎塔雷拉二', sub: 'Brazil, Parque da Cantareira 2', photo: './assets/ambience/forest-photos/t60.jpg?v=20261028h', scene: { kind: 'forest', seed: 460, mood: 'spring' } },
    { src: './assets/ambience/forest/ShekPikCountryTrailSound.mp3', remote: 'https://newnow.cool/forest/ShekPikCountryTrailSound.mp3', name: '香港 · 大屿山', sub: 'Hong Kong, Lantau Island', photo: './assets/ambience/forest-photos/t61.jpg?v=20261028h', scene: { kind: 'forest', seed: 461, mood: 'amber' } },
    { src: './assets/ambience/forest/OiseauxGrandeHalle190418.mp3', remote: 'https://newnow.cool/forest/OiseauxGrandeHalle190418.mp3', name: '法国 · 科隆贝尔', sub: 'France, 2 Rue de lOrne, Colombelles', photo: './assets/ambience/forest-photos/t62.jpg?v=20261028h', scene: { kind: 'forest', seed: 462, mood: 'spring' } },
    { src: './assets/ambience/forest/BirdsSweden.mp3', remote: 'https://newnow.cool/forest/BirdsSweden.mp3', name: '瑞典 · 什恩斯卡特贝里', sub: 'Sweden, Skinnskattebergs kommun', photo: './assets/ambience/forest-photos/t63.jpg?v=20261028h', scene: { kind: 'forest', seed: 463, mood: 'cool' } },
    { src: './assets/ambience/forest/Soundsof.mp3', remote: 'https://newnow.cool/forest/Soundsof.mp3', name: '德国 · 不伦瑞克', sub: 'Germany, Brunswick', photo: './assets/ambience/forest-photos/t64.jpg?v=20261028h', scene: { kind: 'forest', seed: 464, mood: 'dappled' } },
    { src: './assets/ambience/forest/RemousmerSecondValleySA.mp3', remote: 'https://newnow.cool/forest/RemousmerSecondValleySA.mp3', name: '澳大利亚 · 芬尼斯谷', sub: 'Australia, 4 Finniss Vale Dr', photo: './assets/ambience/forest-photos/t65.jpg?v=20261028h', scene: { kind: 'forest', seed: 465, mood: 'amber' } },
  ];
  const ROOMS = {
    sea: { list: SEA, kicker: '听 海',
           line: '让大海陪着你', note: '十五层海声。三片海选一片，其余的一层层叠上去；海面会铺满整页，边玩边听也一直在。' },
    forest: { list: FOREST, kicker: '林 间',
              line: '林子不问你要去哪里。', note: '来自世界各地的二十七片林子，循环着，不会停。想走神就走神。' },
  };

  /* 四间房各自的一句话，只在换房时换。不提任何标签，也不解释自己。 */
  const LEDES = {
    fav: '有些歌不必听懂，它只是替你把那一天留下来。',
    sea: '把没说出口的话，交给潮水慢慢退回去。',
    forest: '不必解释自己，树影会替你把沉默接住。',
    search: '想找一首，刚好说中今天说不清的心情。',
  };

  const API_SEARCH = '/.netlify/functions/music-search';
  const GDS_API = 'https://music-api.gdstudio.xyz/api.php';
  const GDS_SOURCE = 'netease';
  const SCALES = [1, 1.25, 1.5];
  const STORE_KEY = 'xungui-music-v1';
  const state = { idx: 0, volume: 0.8, pos: null, posVer: 2, scale: 1, favs: [], room: { sea: 0, forest: 0 }, seaWant: SEA.map(() => false) };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isInteger(saved.idx) && saved.idx >= 0 && saved.idx < TRACKS.length) state.idx = saved.idx;
      if (typeof saved.volume === 'number') state.volume = Math.min(1, Math.max(0, saved.volume));
      // posVer!==2 为旧版右下角布局的记忆 → 丢弃，图标回到新版默认右上角
      if (saved.posVer === 2 && saved.pos && Number.isFinite(saved.pos.nx) && Number.isFinite(saved.pos.ny)) {
        state.pos = { nx: Math.min(1, Math.max(0, saved.pos.nx)), ny: Math.min(1, Math.max(0, saved.pos.ny)) };
      }
      if (SCALES.includes(saved.scale)) state.scale = saved.scale;
      if (saved.room && typeof saved.room === 'object') {
        for (const k of ['sea','forest']) {
          const n = Number(saved.room[k]);
          if (Number.isInteger(n) && n >= 0 && n < (k === 'sea' ? SEA : FOREST).length) state.room[k] = n;
        }
      }
      // 十五层里哪几层选着：只记住选择，刷新后仍要用户自己按播放
      if (Array.isArray(saved.seaWant) && saved.seaWant.length === SEA.length) {
        state.seaWant = saved.seaWant.map(Boolean);
        // 三片海最多只能留一片
        let seenMain = false;
        for (let i = 0; i < SEA.length; i++) {
          if (!SEA[i].main || !state.seaWant[i]) continue;
          if (seenMain) state.seaWant[i] = false;
          seenMain = true;
        }
      }
      if (Array.isArray(saved.favs)) {
        state.favs = saved.favs
          .filter(f => f && Number.isInteger(f.id) && typeof f.name === 'string')
          .slice(0, 20)
          .map(f => ({ id: f.id, name: f.name, artist: typeof f.artist === 'string' ? f.artist : '' }));
      }
    }
  } catch (_) { /* localStorage 不可用时静默降级 */ }

  const collectionList = () => TRACKS.concat(state.favs);
  const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {} };

  /* ---------- 图标 ---------- */
  const icn = {
    note: '<svg class="icn-netease-note" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.22 8.42a4.85 4.85 0 0 0-.24-1.2c.5-.7.8-1.42.7-2.1-.12-.84-.86-1.24-1.94-1.4a1.06 1.06 0 0 0-1.24.86c-.09.55.06 1.05.36 1.66a6.28 6.28 0 0 0-.44.94 15.5 15.5 0 0 0-2.16-1.03c-2.16-.85-4.14-1.03-5.8-.44-2.28.8-3.62 2.66-3.9 5.4-.26 2.48.3 4.9 1.6 6.98 1.36 2.18 3.4 3.72 5.76 4.34 2.16.57 4.28.24 5.96-.92 1.62-1.12 2.62-2.88 2.9-5.1.34-2.7-.28-5.4-1.56-7.99Zm-.64 7.82c-.22 1.78-1.02 3.18-2.3 4.06-1.34.93-3.06 1.2-4.84.74-2.02-.52-3.76-1.84-4.92-3.72a10.86 10.86 0 0 1-1.42-6.18c.22-2.26 1.24-3.72 3-4.34 1.34-.47 2.98-.32 4.82.4 1.02.4 1.96.94 2.8 1.58-.16.44-.24.9-.2 1.36.1.9.68 1.36 1.6 1.44.5.05.96-.04 1.4-.26.9 2.02 1.28 3.66 1.06 4.92ZM9.9 15.24a2.26 2.26 0 0 1-1.28-2.02c-.02-.8.3-1.5.94-2.02.6-.5 1.36-.72 2.14-.66l1.9-2.52a.95.95 0 0 1 1.32-.2c.42.32.5.9.2 1.32l-1.98 2.62c.44.64.62 1.4.48 2.16-.18 1-.94 1.74-1.96 1.94a2.6 2.6 0 0 1-1.76-.62Z"/></svg>',
    play: '<svg class="icn-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.54.84l9.9-6.5a1 1 0 0 0 0-1.68l-9.9-6.5A1 1 0 0 0 8 5.5Z"/></svg>',
    pause: '<svg class="icn-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 7 10.5 12 18 17Z"/><path d="M6.5 6h2v12h-2z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 7 13.5 12 6 17Z"/><path d="M15.5 6h2v12h-2z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6M11 8v6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 12.57 12 20l-7.5-7.43A5 5 0 1 1 12 6.01a5 5 0 1 1 7.5 6.56Z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.5 12.57 12 20l-7.5-7.43A5 5 0 1 1 12 6.01a5 5 0 1 1 7.5 6.56Z"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>',
  };
  // 网易云音乐官方 logo（取自 music.163.com 的站点图标，红色音符/透明底）
  const NETEASE_LOGO_HTML = '<img class="icn-ncm" src="./assets/ncm-logo.ico" alt="" draggable="false">';
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- 悬浮按钮 ---------- */
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'music-lib-fab';
  fab.title = '音乐库';
  fab.setAttribute('aria-label', '打开音乐库');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = NETEASE_LOGO_HTML;

  /* ---------- 面板 ---------- */
  const panel = document.createElement('div');
  panel.className = 'music-lib-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '音乐库');
  panel.innerHTML = `
    <div class="mlp-head">
      <span class="mlp-title">${icn.note}音乐库</span>
      <span class="mlp-head-right">
        <button type="button" class="mlp-zoom" data-act="zoomout" aria-label="缩小面板" title="缩小">−</button>
        <button type="button" class="mlp-zoom" data-act="zoomin" aria-label="放大面板" title="放大">+</button>
        <button type="button" class="mlp-close" data-act="close" aria-label="收起声音档案" title="收起">×</button>
      </span>
    </div>
    <p class="mlp-lede">有些歌不必听懂，它只是替你把那一天留下来。</p>
    <div class="mlp-tabs" role="tablist" aria-label="四间房">
      <button type="button" class="mlp-tab on" data-tab="fav" role="tab" aria-selected="true">
        <span class="mlp-win"><img src="./assets/music-library/window-note.jpg" alt="" decoding="async" draggable="false"><span class="mlp-win-n">01</span></span>
        <span class="mlp-tab-t">音笺</span>
      </button>
      <button type="button" class="mlp-tab" data-tab="sea" role="tab" aria-selected="false">
        <span class="mlp-win"><img src="./assets/music-library/window-sea.jpg" alt="" decoding="async" draggable="false"><span class="mlp-win-n">02</span></span>
        <span class="mlp-tab-t">听海</span>
      </button>
      <button type="button" class="mlp-tab" data-tab="forest" role="tab" aria-selected="false">
        <span class="mlp-win"><img src="./assets/music-library/window-forest.jpg" alt="" decoding="async" draggable="false"><span class="mlp-win-n">03</span></span>
        <span class="mlp-tab-t">林间</span>
      </button>
      <button type="button" class="mlp-tab" data-tab="search" role="tab" aria-selected="false">
        <span class="mlp-win"><img src="./assets/music-library/window-search.jpg" alt="" decoding="async" draggable="false"><span class="mlp-win-n">04</span></span>
        <span class="mlp-tab-t">找歌</span>
      </button>
    </div>
    <div class="mlp-room" data-room hidden>
      <canvas class="mlp-room-canvas" aria-hidden="true"></canvas>
      <div class="mlp-room-veil" aria-hidden="true"></div>
      <div class="mlp-room-tools">
        <button type="button" class="mlp-room-fs" data-act="roomfs" aria-label="铺满屏幕听" title="铺满屏幕">${icn.expand}</button>
      </div>
      <figure class="mlp-room-cap">
        <img class="mlp-cap-photo" alt="" aria-hidden="true" hidden>
        <span class="mlp-room-cap-txt">
          <span class="mlp-room-cap-name"></span>
          <span class="mlp-room-cap-sub"></span>
        </span>
      </figure>
      <div class="mlp-room-copy">
        <p class="mlp-room-line"></p>
        <div class="mlp-room-actions">
          <button type="button" class="mlp-room-play" data-act="roomplay" aria-label="播放这间房的声音">
            <span class="mlp-room-play-ic" aria-hidden="true">${icn.play}${icn.pause}</span><span class="mlp-room-play-t">播放</span>
          </button>
          <button type="button" class="mlp-room-shuffle" data-act="roomshuffle" aria-label="随机去一片" title="随机去一片">${icn.shuffle}</button>
        </div>
      </div>
    </div>
    <p class="mlp-room-note" hidden></p>
    <div class="mlp-search" hidden>
      <input type="search" class="mlp-search-input" placeholder="输入歌名 / 歌手，回车搜索" maxlength="40" aria-label="搜索歌曲">
      <button type="button" class="mlp-go" data-act="go" aria-label="搜索" title="搜索">${icn.zoom}</button>
    </div>
    <div class="mlp-status" hidden></div>
    <div class="mlp-mix" hidden></div>
    <ul class="mlp-list">
      ${TRACKS.map((t, i) => `
        <li data-idx="${i}" class="${i === state.idx ? 'active paused' : ''}">
          <button type="button" class="mlp-row" data-idx="${i}" title="${t.name}">
            <span class="mlp-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="mlp-main"><span class="mlp-name">${esc(t.name)}</span></span>
            <span class="mlp-eq" aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </li>`).join('')}
    </ul>
    <div class="mlp-progress">
      <span class="mlp-time mlp-cur">0:00</span>
      <div class="mlp-track" role="slider" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="mlp-fill"><div class="mlp-inner"></div></div>
      </div>
      <span class="mlp-time mlp-dur">--:--</span>
    </div>
    <div class="mlp-controls">
      <button type="button" class="mlp-btn" data-act="prev" aria-label="上一首" title="上一首">${icn.prev}</button>
      <button type="button" class="mlp-btn mlp-toggle" data-act="toggle" aria-label="播放或暂停" title="播放 / 暂停">${icn.play}${icn.pause}</button>
      <button type="button" class="mlp-btn" data-act="next" aria-label="下一首" title="下一首">${icn.next}</button>
    </div>
    <div class="mlp-volume">
      ${icn.vol}
      <input type="range" min="0" max="1" step="0.01" value="${state.volume}" aria-label="音量">
      <span class="mlp-vol-label">${Math.round(state.volume * 100)}%</span>
    </div>`;

  /* ---------- 全屏听：同一间房的画面铺满屏幕（不改动页面本身） ---------- */
  const immerse = document.createElement('div');
  immerse.className = 'mlp-immerse';
  immerse.setAttribute('role', 'dialog');
  immerse.setAttribute('aria-modal', 'true');
  immerse.setAttribute('aria-label', '全屏收听');
  immerse.hidden = true;
  immerse.innerHTML = `
    <canvas class="mlp-im-canvas" aria-hidden="true"></canvas>
    <div class="mlp-im-veil" aria-hidden="true"></div>
    <div class="mlp-im-top">
      <span class="mlp-im-kicker"></span>
      <button type="button" class="mlp-im-close" aria-label="回到页面" title="回到页面（Esc）">×</button>
    </div>
    <div class="mlp-im-copy">
      <p class="mlp-im-line"></p>
      <p class="mlp-im-cap">
        <img class="mlp-im-cap-photo" alt="" aria-hidden="true" hidden>
        <span class="mlp-im-cap-lead">此刻在你耳边</span><span class="mlp-im-cap-name"></span><span class="mlp-im-cap-sub"></span>
      </p>
      <p class="mlp-im-note"></p>
      <div class="mlp-im-actions">
        <button type="button" class="mlp-im-play" aria-label="播放">
          <span class="mlp-im-play-ic" aria-hidden="true">${icn.play}${icn.pause}</span><span class="mlp-im-play-t">播放</span>
        </button>
        <button type="button" class="mlp-im-shuffle" data-act="imshuffle" aria-label="随机去一片" title="随机去一片">
          ${icn.shuffle}<span class="mlp-im-shuffle-t">随机去一片</span>
        </button>
        <span class="mlp-im-hint">音量在音乐库里调 · Esc 回到页面</span>
      </div>
      <p class="mlp-im-drag-hint" hidden>这片海是实时画出来的 · 拖着可以转视角，点一下水面浪会大一些</p>
    </div>`;

  /* ---------- 音频：单曲一首；听海另开十五条，各自循环、各自一条音量 ---------- */
  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.volume = state.volume;

  /* ============================================================
     听海的十五层声音（照原站：三片海互斥，其余十二层自由叠加）
     - 一次只让一处出声：这里响起时，单曲那一首会停下；反过来也一样；
     - 每条都是一只自己的 <audio>，loop，音量 = 总音量 × 这一层的 0.8；
     - 只有真的点了、真的开始播，才建元素；不预载，不占内存与流量。
     ============================================================ */
  const seaEls = SEA.map(() => null);
  let seaOn = false;
  const seaAnyWant = () => state.seaWant.some(Boolean);
  const seaLive = () => seaOn && seaAnyWant();
  const seaIsPlaying = i => !!(seaEls[i] && !seaEls[i].paused);
  function seaEl(i) {
    let el = seaEls[i];
    if (el) return el;
    el = new Audio();
    el.preload = 'none';
    el.loop = true;
    el.src = SEA[i].src;
    el.volume = Math.min(1, state.volume * (SEA[i].gain || .8));
    el.addEventListener('playing', () => { if (seaOn) { setStatus(''); refreshSeaUI(); } });
    el.addEventListener('pause', () => {
      if (seaOn && !seaEls.some(x => x && !x.paused)) { seaOn = false; refreshSeaUI(); refreshPlaying(); }
      else refreshSeaUI();
    });
    el.addEventListener('error', () => {
      if (!el.getAttribute('src')) return;
      const was = state.seaWant[i];
      state.seaWant[i] = false;
      if (!seaAnyWant()) seaOn = false;
      persist(); refreshSeaUI(); refreshPlaying();
      if (was) { setStatus('这一段暂时放不出来，换一层试试'); setTimeout(() => setStatus(''), 2800); }
    });
    seaEls[i] = el;
    return el;
  }
  function seaVolume() {
    seaEls.forEach((el, i) => {
      if (el) el.volume = Math.min(1, state.volume * (SEA[i].gain || .8));
    });
  }
  function seaPlayOne(i) {
    const el = seaEl(i);
    if (!el.paused) { refreshSeaUI(); return; }
    el.play().catch(() => {
      state.seaWant[i] = false;
      if (!seaAnyWant()) seaOn = false;
      persist(); refreshSeaUI(); refreshPlaying();
    });
  }
  function seaStart() {
    if (!seaAnyWant()) state.seaWant[0] = true;
    seaOn = true;
    playingCtx = 'sea';
    if (!audio.paused) audio.pause();      // 同一时刻只让一处出声
    state.seaWant.forEach((w, i) => { if (w) seaPlayOne(i); });
    persist();
    refreshSeaUI();
    refreshPlaying();
    markPlaying(true);
  }
  function seaStop(quiet) {
    if (!seaOn) return;
    seaOn = false;
    seaEls.forEach(el => { if (el) el.pause(); });
    persist();
    if (!quiet) { refreshSeaUI(); refreshPlaying(); markPlaying(false); }
  }
  /* 点一层：三片海互斥；其余十二层各自开合。点开就出声，再点就收起。
     "选着但整组是暂停的"时候，点它先是让这一组接着响，而不是把它关掉——
     不然刚打开来一看就点第一枚，反而把预选的那一层熄了，一声也没有。 */
  function seaToggleLayer(i) {
    if (!SEA[i]) return;
    state.room.sea = i;
    const was = !!state.seaWant[i];
    if (was && !seaOn) { seaStart(); return; }
    if (SEA[i].main) {
      for (let j = 0; j < SEA.length; j++) {
        if (!SEA[j].main || j === i || !state.seaWant[j]) continue;
        state.seaWant[j] = false;
        if (seaEls[j]) seaEls[j].pause();
      }
    }
    state.seaWant[i] = !was;
    if (state.seaWant[i]) {
      if (!seaOn) { seaOn = true; playingCtx = 'sea'; if (!audio.paused) audio.pause(); }
      seaPlayOne(i);
    } else {
      if (seaEls[i]) seaEls[i].pause();
      if (!seaAnyWant()) seaOn = false;
    }
    persist();
    refreshSeaUI();
    refreshPlaying();
    markPlaying(seaLive());
  }

  /* ---------- 引用 ---------- */
  const $ = sel => panel.querySelector(sel);
  const toggleBtn = $('.mlp-toggle');
  const fill = $('.mlp-fill');
  const trackBar = $('.mlp-track');
  const curEl = $('.mlp-cur');
  const durEl = $('.mlp-dur');
  const volInput = $('.mlp-volume input');
  const volLabel = $('.mlp-vol-label');
  const listEl = $('.mlp-list');
  const mixEl = $('.mlp-mix');
  const zoomInBtn = panel.querySelector('.mlp-zoom[data-act="zoomin"]');
  const zoomOutBtn = panel.querySelector('.mlp-zoom[data-act="zoomout"]');
  const tabBtns = [...panel.querySelectorAll('.mlp-tab')];
  const searchWrap = $('.mlp-search');
  const searchInput = $('.mlp-search-input');
  const statusEl = $('.mlp-status');
  const roomEl = $('.mlp-room');
  const roomCanvas = $('.mlp-room-canvas');
  const roomCapName = $('.mlp-room-cap-name');
  const roomCapSub = $('.mlp-room-cap-sub');
  const roomCapPhoto = $('.mlp-cap-photo');
  const roomLine = $('.mlp-room-line');
  const roomPlayBtn = $('.mlp-room-play');
  const roomNote = $('.mlp-room-note');
  const progressEl = $('.mlp-progress');
  const ledeEl = $('.mlp-lede');
  const imArt = immerse.querySelector('.mlp-im-canvas');
  const imKicker = immerse.querySelector('.mlp-im-kicker');
  const imLine = immerse.querySelector('.mlp-im-line');
  const imCapName = immerse.querySelector('.mlp-im-cap-name');
  const imCapSub = immerse.querySelector('.mlp-im-cap-sub');
  const imCapPhoto = immerse.querySelector('.mlp-im-cap-photo');
  const imDragHint = immerse.querySelector('.mlp-im-drag-hint');
  const imNote = immerse.querySelector('.mlp-im-note');
  const imPlay = immerse.querySelector('.mlp-im-play');
  const imPlayT = immerse.querySelector('.mlp-im-play-t');
  const imShuffle = immerse.querySelector('.mlp-im-shuffle');
  const imClose = immerse.querySelector('.mlp-im-close');
  let imReturnFocus = null;
  let items = [...listEl.querySelectorAll('li')];

  /* ============================================================
     场景小画布：把每段海、每片林子画出来（纯 canvas 手绘，无外部素材）。
     - 面板卡片一张、全屏一张；播放时画面活着，暂停就停在同一帧；
     - 系统开了"减少动态效果"时只画一帧，不动；
     - 页面切到后台自动歇一歇，回到前台再继续。
     ============================================================ */
  const scenes = (() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const TAU = Math.PI * 2;
    const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const rng = seed => { let a = (seed * 2654435761) >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
    const px = c => {
      const s = String(c);
      if (s[0] === 'r') {                       // 'rgb(r,g,b)' —— mix() 的返回值再进 alpha() 时走这里
        const m = s.match(/[\d.]+/g) || [0, 0, 0];
        return [Math.round(Number(m[0])) || 0, Math.round(Number(m[1])) || 0, Math.round(Number(m[2])) || 0];
      }
      const v = s.replace('#', '');
      const t = v.length === 3 ? v.split('').map(ch => ch + ch).join('') : v;
      return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
    };
    const mix = (a, b, k) => {
      const A = px(a), B = px(b);
      return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
    };
    const alpha = (c, a) => { const A = px(c); return `rgba(${A[0]},${A[1]},${A[2]},${Math.max(0, Math.min(1, a))})`; };

    /* ---- 听海的天色：每段海自己的天气 ---- */
    const SEA_MOODS = {
      day:       { sky: ['#9ec7d8', '#e9f3ef'], sun: { x: .72, y: .28, r: .050, c: '#fff6da', glow: .55 }, deep: '#17455a', hor: '#a8cdd2', crest: '#ffffff', glint: '#fff3cf', glintA: .5,  rough: .55, birds: true },
      afternoon: { sky: ['#a9cfd4', '#f2ecd9'], sun: { x: .62, y: .24, r: .046, c: '#ffedc2', glow: .5 },  deep: '#1c4f5a', hor: '#b7d3cf', crest: '#fffefa', glint: '#ffedc4', glintA: .42, rough: .42, birds: false },
      overcast:  { sky: ['#aeb8b4', '#dfe3da'], sun: null, deep: '#25444c', hor: '#93a9a6', crest: '#f0f4ee', glint: '#e8eee6', glintA: .2,  rough: .7,  birds: true },
      storm:     { sky: ['#5f7076', '#9aa8a4'], sun: null, deep: '#152c33', hor: '#7d938f', crest: '#ebf2ee', glint: '#dfe8e2', glintA: .16, rough: 1,   birds: false },
      dusk:      { sky: ['#7d89a8', '#f2c184'], sun: { x: .30, y: .40, r: .055, c: '#ffd9a0', glow: .6 },  deep: '#1d3547', hor: '#d9a878', crest: '#ffe8c8', glint: '#ffd9a4', glintA: .5,  rough: .6,  birds: true },
      dawn:      { sky: ['#8fa7c0', '#f6cdb0'], sun: { x: .68, y: .42, r: .046, c: '#ffe4bd', glow: .55 }, deep: '#245061', hor: '#e8c3a6', crest: '#ffeed6', glint: '#ffe0b8', glintA: .45, rough: .35, birds: true },
    };
    /* ---- 林间的天气：每片林子自己的色调 ---- */
    const FOREST_MOODS = {
      morning: { sky: ['#f4e9c8', '#cfe3c0'], base: '#3c6b4f', shaft: '#ffe9b0', shaftA: .16, motes: { c: '#fff6d8', n: 26 }, conifer: .35, wind: 0,   stream: 0, birds: true,  mist: .5 },
      dappled: { sky: ['#f2e2ae', '#bcd98f'], base: '#416f45', shaft: '#ffdf96', shaftA: .22, motes: { c: '#fff3c8', n: 40 }, conifer: .25, wind: .3,  stream: 0, birds: false, mist: .25 },
      deep:    { sky: ['#eaf0d8', '#7ca878'], base: '#1f4a35', shaft: '#fff3bd', shaftA: .3,  motes: { c: '#fdf6d5', n: 60 }, conifer: .4,  wind: 0,   stream: 0, birds: false, mist: .35 },
      misty:   { sky: ['#e6ebe2', '#aebfae'], base: '#4a6355', shaft: '#ffffff', shaftA: .08, motes: { c: '#ffffff', n: 18 }, conifer: .45, wind: 0,   stream: 0, birds: false, mist: 1 },
      dawn:    { sky: ['#f6d7b6', '#e8a98a'], base: '#4a5f4a', shaft: '#ffd9a8', shaftA: .2,  motes: { c: '#ffe8c4', n: 30 }, conifer: .35, wind: 0,   stream: 0, birds: true,  mist: .6 },
      cool:    { sky: ['#dcebe2', '#9ec4b4'], base: '#35604f', shaft: '#eafff2', shaftA: .14, motes: { c: '#eafff4', n: 24 }, conifer: .55, wind: .2,  stream: 0, birds: true,  mist: .55 },
      jungle:  { sky: ['#d8e8b8', '#5d8f5f'], base: '#173f2a', shaft: '#f4ffc8', shaftA: .24, motes: { c: '#f2ffd8', n: 70 }, conifer: .1,  wind: .15, stream: .4, birds: false, mist: .45 },
      spring:  { sky: ['#f8f0c8', '#c2e39a'], base: '#4f7d3f', shaft: '#fff6c0', shaftA: .18, motes: { c: '#fff8d0', n: 44 }, conifer: .2,  wind: .4,  stream: 0, birds: true,  mist: .3 },
      nordic:  { sky: ['#d3e2e8', '#8fb4b8'], base: '#2e4f4d', shaft: '#eaf8ff', shaftA: .16, motes: { c: '#eef8ff', n: 34 }, conifer: .9,  wind: .8,  stream: 0, birds: false, mist: .4 },
      amber:   { sky: ['#f4d9a8', '#d9a86e'], base: '#6b5230', shaft: '#ffca7a', shaftA: .24, motes: { c: '#ffe0a8', n: 50 }, conifer: .35, wind: .5,  stream: 0, birds: true,  mist: .3 },
      creek:   { sky: ['#e0ecca', '#8fbf9a'], base: '#2c5544', shaft: '#e8ffdc', shaftA: .16, motes: { c: '#eaffea', n: 30 }, conifer: .5,  wind: .2,  stream: 1, birds: false, mist: .5 },
      canyon:  { sky: ['#efe3c0', '#c2a97e'], base: '#4a5a3c', shaft: '#ffe9b8', shaftA: .2,  motes: { c: '#fff2cc', n: 36 }, conifer: .3,  wind: .3,  stream: 1, birds: false, mist: .35 },
    };

    function blob(ctx, x, y, r, color, a) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, alpha(color, a)); g.addColorStop(1, alpha(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function bird(ctx, x, y, s, flap, color, a) {
      ctx.strokeStyle = alpha(color, a);
      ctx.lineWidth = Math.max(1, s * .16);
      ctx.lineCap = 'round';
      const f = Math.sin(flap) * s * .55;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.quadraticCurveTo(x - s * .35, y - f, x, y);
      ctx.quadraticCurveTo(x + s * .35, y - f, x + s, y);
      ctx.stroke();
    }
    /* 远景树冠：一排起伏的圆弧剪影，像山那边的林线（不用尖角，免得读成山脉） */
    function treeline(ctx, W, baseline, hMin, hMax, step, rand) {
      ctx.moveTo(-8, baseline + 8);
      ctx.lineTo(-8, baseline - hMin * .5);
      let lastX = 0, lastY = baseline - hMin - rand() * (hMax - hMin);
      ctx.lineTo(lastX, lastY);
      for (let x = step; x <= W + step; x += step) {
        const nx = x + (rand() - .5) * step * .4;
        const ny = baseline - hMin - rand() * (hMax - hMin);
        const mx = (lastX + nx) / 2;
        ctx.quadraticCurveTo(mx, Math.min(lastY, ny) - (hMax - hMin) * .3, nx, ny);
        lastX = nx; lastY = ny;
      }
      ctx.lineTo(W + 8, baseline - hMin * .5);
      ctx.lineTo(W + 8, baseline + 8);
      ctx.closePath();
    }
    /* 塔形的针叶树 */
    function conifer(ctx, x, baseY, h, w) {
      const tiers = 3, top = baseY - h;
      ctx.moveTo(x, top);
      for (let i = 0; i < tiers; i++) {
        const f = (i + 1) / tiers;
        const y = top + h * (0.26 + 0.74 * f);
        const ww = w * (0.34 + 0.66 * f);
        ctx.lineTo(x - ww, y);
        ctx.lineTo(x - ww * 0.42, y);
      }
      ctx.lineTo(x - w * .05, baseY);
      ctx.lineTo(x + w * .05, baseY);
      for (let i = tiers - 1; i >= 0; i--) {
        const f = (i + 1) / tiers;
        const y = top + h * (0.26 + 0.74 * f);
        const ww = w * (0.34 + 0.66 * f);
        ctx.lineTo(x + ww * 0.42, y);
        ctx.lineTo(x + ww, y);
      }
      ctx.closePath();
    }
    /* 圆冠的阔叶树 */
    function broadleaf(ctx, x, baseY, h, w, rand) {
      const top = baseY - h;
      ctx.rect(x - w * .05, top + h * .38, w * .1, h * .62);
      for (let i = 0; i < 3; i++) {
        const bx = x + (rand() - .5) * w * .7;
        const by = top + h * (0.16 + 0.24 * i) + (rand() - .5) * h * .06;
        const br = w * (.38 + rand() * .3);
        ctx.moveTo(bx + br, by);
        ctx.arc(bx, by, br, 0, TAU);
      }
    }

    /* ---- 海 ---- */
    function drawOcean(ctx, W, H, t, mood, seed) {
      const S = SEA_MOODS[mood] || SEA_MOODS.day;
      const hor = H * 0.58;
      let g = ctx.createLinearGradient(0, 0, 0, hor);
      g.addColorStop(0, S.sky[0]); g.addColorStop(1, S.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, hor + 2);
      // 云：三小团，慢慢挪
      const cloudC = mix(S.sky[0], '#ffffff', .6);
      for (let i = 0; i < 3; i++) {
        const cx = (((hash(seed + i * 31) * W + t * (3.2 + i * 1.4)) % (W + 320)) + (W + 320)) % (W + 320) - 160;
        const cy = hor * (.26 + .17 * i);
        const cw = W * (.09 + .04 * hash(seed + i * 7));
        blob(ctx, cx, cy, cw, cloudC, .16);
        blob(ctx, cx + cw * .55, cy + 3, cw * .7, cloudC, .13);
        blob(ctx, cx - cw * .6, cy + 4, cw * .6, cloudC, .11);
      }
      // 日头（阴天与风暴没有日头）
      if (S.sun) {
        const sx = S.sun.x * W;
        const sy = Math.min(S.sun.y * H, hor - H * .05);
        const r = S.sun.r * H * 1.5;
        blob(ctx, sx, sy, r * 5, S.sun.c, .15 * S.sun.glow);
        blob(ctx, sx, sy, r * 2.2, S.sun.c, .3 * S.sun.glow);
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        sg.addColorStop(0, alpha('#ffffff', .92));
        sg.addColorStop(.55, alpha(S.sun.c, .85));
        sg.addColorStop(1, alpha(S.sun.c, 0));
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
      }
      // 飞鸟：贴着天际慢慢横过
      if (S.birds) {
        for (let i = 0; i < 2; i++) {
          const bx = (((hash(seed + i * 17) * W + t * (16 + i * 7)) % (W + 160)) + (W + 160)) % (W + 160) - 80;
          const by = hor * (.3 + .12 * i) + Math.sin(t * .6 + i * 2) * 10;
          bird(ctx, bx, by, Math.max(5, H * .016), t * 5.2 + i * 1.3, '#22343c', .5);
        }
      }
      // 水面：越远越亮，越近越深
      g = ctx.createLinearGradient(0, hor, 0, H);
      g.addColorStop(0, S.hor); g.addColorStop(1, S.deep);
      ctx.fillStyle = g; ctx.fillRect(0, hor, W, H - hor);
      // 七层浪，一层层推过来
      const n = 7;
      const step = Math.max(6, W / 90);
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1);
        const baseY = hor + 5 + f * (H - hor - 8) + Math.sin(i * 2.7) * 3;
        const amp = (2.2 + 13 * f) * S.rough + 1.1;
        const wl = W * (0.9 - f * 0.55);
        const spd = (0.35 + f * 0.5) * (0.8 + 0.4 * Math.sin(seed + i));
        const yAt = x => baseY
          + Math.sin((x / wl) * TAU + t * spd + i * 1.7) * amp
          + Math.sin((x / (wl * .43)) * TAU - t * spd * .7 + i) * amp * .35;
        ctx.fillStyle = mix(S.hor, S.deep, 0.1 + f * 0.85);
        ctx.beginPath();
        ctx.moveTo(-2, H + 2);
        ctx.lineTo(-2, yAt(0));
        for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, yAt(x));
        ctx.lineTo(W + 2, H + 2);
        ctx.closePath();
        ctx.fill();
        // 浪尖上的一线光
        if (i >= 2) {
          ctx.strokeStyle = alpha(S.crest, 0.10 + f * 0.16);
          ctx.lineWidth = 1 + f * 1.2;
          ctx.beginPath();
          ctx.moveTo(0, yAt(0));
          for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, yAt(x));
          ctx.stroke();
        }
      }
      // 海面的粼光，日头附近最密
      const gx = S.sun ? S.sun.x * W : W * .5;
      const gh = Math.max(1, H / 640);
      for (let i = 0; i < 56; i++) {
        const h1 = hash(seed * 3.1 + i * 7.7);
        const h2 = hash(seed + i * 2.93);
        const x = h1 < .6 ? gx + (h2 - .5) * W * .36 : hash(seed + i * 11.3) * W;
        const yy = hor + 4 + Math.pow(hash(seed + i * 5.11), 1.5) * (H - hor - 8);
        const tw = Math.sin(t * (0.5 + h2 * 1.3) + i * 2.4);
        const a = Math.max(0, tw) * S.glintA * (0.35 + 0.65 * ((yy - hor) / (H - hor)));
        if (a <= 0.015) continue;
        const len = (5 + h2 * 15) * (W / 900 + 0.4);
        ctx.globalAlpha = Math.min(.8, a);
        ctx.fillStyle = S.glint;
        ctx.fillRect(x - len / 2, yy, len, gh);
      }
      ctx.globalAlpha = 1;
      // 地平线上一道极细的亮
      ctx.fillStyle = alpha(S.glint, .3);
      ctx.fillRect(0, hor - .8, W, 1.5);
    }

    /* ---- 林子 ---- */
    function drawForest(ctx, W, H, t, mood, seed) {
      const S = FOREST_MOODS[mood] || FOREST_MOODS.morning;
      const rand = rng(seed);
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, S.sky[0]); g.addColorStop(1, S.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 林梢上方的天光
      blob(ctx, W * .5, H * .04, W * .55, S.shaft, .2);
      const mistBand = (y, a) => {
        const mg = ctx.createLinearGradient(0, y - H * .09, 0, y + H * .09);
        mg.addColorStop(0, alpha('#ffffff', 0));
        mg.addColorStop(.5, alpha('#ffffff', a));
        mg.addColorStop(1, alpha('#ffffff', 0));
        ctx.fillStyle = mg; ctx.fillRect(0, y - H * .09, W, H * .18);
      };
      // 五层树，由远到近
      const layers = 5;
      for (let L = 0; L < layers; L++) {
        const f = L / (layers - 1);
        const col = mix(S.base, S.sky[1], 0.66 - f * 0.62);
        const baseline = H * (0.5 + f * 0.55);
        const scale = 0.5 + f * 0.8;
        ctx.fillStyle = col;
        if (L < 2) {
          ctx.beginPath();
          treeline(ctx, W, baseline, H * .04 * scale, H * .08 * scale, 26 + L * 10, rand);
          ctx.fill();
        } else {
          const tw = W * .044 * scale;
          let x = -tw + rand() * tw;
          ctx.beginPath();
          while (x < W + tw) {
            const h = H * (0.12 + rand() * 0.1) * scale;
            const w = tw * (0.7 + rand() * 0.6);
            if (rand() < S.conifer) conifer(ctx, x, baseline, h, w);
            else broadleaf(ctx, x, baseline, h, w, rand);
            x += w * (1.25 + rand() * 1.0);
          }
          ctx.fill();
        }
        if (L === 1) mistBand(H * .5, S.mist * .2);
        if (L === 3) mistBand(H * .74, S.mist * .15);
      }
      // 从林梢漏下来的光柱
      if (S.shaftA > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
          const sway = Math.sin(t * 0.07 + i * 2.1) * W * .02;
          const x0 = W * (0.16 + 0.3 * i) + sway;
          const wTop = W * (0.035 + 0.02 * hash(seed + i));
          const slant = H * 0.5;
          const a = S.shaftA * (0.75 + 0.25 * Math.sin(t * 0.23 + i * 1.7));
          const lg = ctx.createLinearGradient(0, 0, 0, H);
          lg.addColorStop(0, alpha(S.shaft, a));
          lg.addColorStop(1, alpha(S.shaft, 0));
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.moveTo(x0, -H * .05);
          ctx.lineTo(x0 + wTop, -H * .05);
          ctx.lineTo(x0 + wTop + slant, H);
          ctx.lineTo(x0 + slant, H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      // 小溪：近处一道浅浅的流光
      if (S.stream) {
        const gy = H * .8;
        const sg = ctx.createLinearGradient(0, gy, 0, H);
        sg.addColorStop(0, alpha('#cfe8d8', 0));
        sg.addColorStop(1, alpha('#cfe8d8', .15));
        ctx.fillStyle = sg; ctx.fillRect(0, gy, W, H - gy);
        for (let i = 0; i < 6; i++) {
          const yy = gy + (i / 6) * (H - gy) + 2;
          const off = ((t * (14 + i * 6) + hash(i * 3.3) * W) % (W + 200)) - 100;
          ctx.strokeStyle = alpha('#eafff2', .09 + .07 * Math.sin(t * 2 + i));
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(off - 60, yy);
          ctx.lineTo(off + 40 + hash(i) * 60, yy + 1.5);
          ctx.stroke();
        }
      }
      // 浮着的光尘（风大的林子里飘得快些）
      const M = S.motes;
      for (let i = 0; i < M.n; i++) {
        const h1 = hash(seed * 1.7 + i * 3.7), h2 = hash(seed + i * 9.1), h3 = hash(i * 5.3 + seed * .7);
        const speed = 6 + h2 * 10;
        const x = ((h1 * W + t * speed * (0.4 + S.wind)) % (W + 40) + (W + 40)) % (W + 40) - 20;
        const y = ((h2 * H - t * (3 + h3 * 5)) % H + H) % H;
        const s = 0.7 + h3 * 1.5;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + h1) + i);
        ctx.globalAlpha = (0.10 + 0.22 * h2) * tw;
        ctx.fillStyle = M.c;
        ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 偶尔有一两只鸟，从林梢上过
      if (S.birds) {
        for (let i = 0; i < 2; i++) {
          const bx = (((hash(seed + i * 13) * W + t * (14 + i * 6)) % (W + 160)) + (W + 160)) % (W + 160) - 80;
          const by = H * (.14 + .08 * i) + Math.sin(t * .6 + i * 2) * 8;
          bird(ctx, bx, by, Math.max(4.5, H * .014), t * 5 + i * 1.4, '#243328', .45);
        }
      }
      // 顶上垂下来的树叶：沿上缘一排柔和的圆弧，只占屏幕高度的一小条
      ctx.fillStyle = alpha(mix(S.base, '#0c1810', .45), .82);
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(W + 10, -10);
      ctx.lineTo(W + 10, H * .02);
      let cx = W + 10;
      const bumps = 7;
      for (let i = bumps; i >= 0; i--) {
        const bx = (i / bumps) * (W + 40) - 20;
        const dip = H * (.05 + hash(seed + i * 13) * .09);
        ctx.quadraticCurveTo((cx + bx) / 2, dip, bx, H * .015);
        cx = bx;
      }
      ctx.closePath();
      ctx.fill();
      // 四周一点点暗角，像从林子里往外看
      const vg = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .78);
      vg.addColorStop(0, 'rgba(8,16,10,0)');
      vg.addColorStop(1, 'rgba(8,16,10,.3)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    /* ---- 照片层：每段声音可以带一张自己的照片。加载成功就画照片（缓慢推近），
            失败或没加载完就保持下面手绘的画面作兜底。 ---- */
    const photos = new Map();   // src -> { img, ok, tried }
    function photoOf(src) {
      if (!src) return null;
      let p = photos.get(src);
      if (!p) {
        p = { img: new Image(), ok: false, tried: false };
        p.img.decoding = 'async';
        // 用 complete 兜底：缓存命中的图可能在我们挂监听之前就已经"加载完"，load 不再触发
        p.img.addEventListener('load', () => { p.ok = true; });
        p.img.addEventListener('error', () => { p.ok = false; p.tried = true; });
        p.img.src = src;
        if (p.img.complete) {
          p.ok = p.img.naturalWidth > 0;
          p.tried = p.img.naturalWidth === 0;
        }
        photos.set(src, p);
      } else if (!p.ok && !p.tried && p.img.complete) {
        p.ok = p.img.naturalWidth > 0;
        p.tried = p.img.naturalWidth === 0;
      }
      return p;
    }
    /* cover 方式把图画满画布，scale 再往外推一点（1.06 → 1.14 随播放缓慢推近） */
    function drawCover(ctx, img, W, H, scale) {
      const ir = img.width / img.height, cr = W / H;
      let dw, dh;
      if (ir > cr) { dh = H * scale; dw = dh * ir; }
      else { dw = W * scale; dh = dw / ir; }
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    /* 没有原站照片的那一条（原站自己也没有配图）：
       不画任何想象出来的风景，只铺原站那一档的底色——
       林间用原站空画面的深绿 #041b00，听海用深水色。
       这是"原本就没有配图"的样子，不是一张程序画的画。 */
    function drawPlate(ctx, W, H, kind) {
      const forest = kind === 'forest';
      ctx.fillStyle = forest ? '#041b00' : '#071f29';
      ctx.fillRect(0, 0, W, H);
      // 极淡的纸面颗粒，只为别让整块纯色看起来像没渲染完
      const rnd = mulberry32(97);
      const n = Math.round(W * H / 2600);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H, a = 0.012 + rnd() * 0.02;
        ctx.fillStyle = forest ? `rgba(190,215,190,${a.toFixed(3)})` : `rgba(190,220,225,${a.toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
      // 一道几乎看不见的横向明暗，给这块纸一点厚度
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0.035)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    /* 小随机数发生器：同一段海每次生成的碎光位置都一样 */
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    /* 海面照片上的波光：几道很淡的光带随呼吸起伏，水面有细碎的闪光。
       全部用播放时间 t 计算，暂停时和照片一起定格。 */
    function drawSeaShimmer(ctx, W, H, t, seed) {
      const hz = H * 0.55;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const y = hz + (H - hz) * (0.14 + i * 0.3) + Math.sin(t * 0.16 + i * 1.7 + seed) * H * 0.012;
        const a = 0.022 + 0.016 * (0.5 + 0.5 * Math.sin(t * 0.26 + i * 2.1 + seed));
        const g = ctx.createLinearGradient(0, y - H * 0.09, 0, y + H * 0.09);
        g.addColorStop(0, 'rgba(255,244,214,0)');
        g.addColorStop(0.5, 'rgba(255,244,214,' + a.toFixed(4) + ')');
        g.addColorStop(1, 'rgba(255,244,214,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y - H * 0.09, W, H * 0.18);
      }
      const rnd = mulberry32(seed * 7919 + 13);
      for (let i = 0; i < 26; i++) {
        const px = rnd() * W;
        const py = hz + rnd() * (H - hz) * 0.94;
        const ph = rnd() * Math.PI * 2;
        const sp = 0.7 + rnd() * 1.3;
        const tw = 0.5 + 0.5 * Math.sin(t * sp + ph);
        if (tw < 0.5) continue;
        ctx.globalAlpha = (tw - 0.5) * 0.5;
        ctx.fillStyle = '#fff6dc';
        ctx.beginPath();
        ctx.arc(px, py, 0.7 + tw * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* ---- 实例管理：两张画布，一张卡片、一张全屏。
            听海优先用 three.js 实时画一片海（另起一张 WebGL 画布盖住这张 2D 的），
            WebGL 用不了 / 上下文丢了，就把 2D 画布放回来，退回手绘海面。 ---- */
    const reg = new Map();
    /* sea3d.js 排在前面加载；这里每次现取，万一它没加载成功也只是退回 2D 海面 */
    const S3 = () => window.XGSea3D || null;
    let raf = 0, lastTs = 0, lastFrame = 0, pageHidden = false, slow = 0;
    function boxOf(inst) {
      const p = inst.cv.parentElement;
      const el = (p && p.clientWidth) ? p : inst.cv;
      return { w: el.clientWidth || el.offsetWidth || 300, h: el.clientHeight || el.offsetHeight || 150 };
    }
    function fit(inst) {
      const b = boxOf(inst);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const W = Math.max(1, Math.round(b.w * dpr)), H = Math.max(1, Math.round(b.h * dpr));
      if (inst.cv.width !== W || inst.cv.height !== H) { inst.cv.width = W; inst.cv.height = H; }
      if (inst.sea) inst.sea.setSize(b.w, b.h, inst.seaCap);
    }
    /* 同一张卡片上两张画布叠着：听海用上面那张 WebGL 的，别的时候用原来 2D 的。
       顺带在容器上挂/摘 sea-live —— 遮罩颜色跟着换，海才不会被绿色蒙层压灰。 */
    function show(inst, which) {
      if (!inst.seaCv) return;
      const seaOn = which === 'sea';
      if (inst.veilHost) {
        try { inst.veilHost.classList.toggle('sea-live', seaOn); } catch (_) {}
      }
      if (inst.seaCv.style.display === (seaOn ? '' : 'none')) return;
      inst.seaCv.style.display = seaOn ? '' : 'none';
      inst.cv.style.display = seaOn ? 'none' : '';
    }
    /* 第一次真的要画海时才建 WebGL 上下文：卡片没打开、全屏没打开，就不占资源 */
    function ensureSea(inst) {
      if (inst.seaTried) return inst.sea || null;
      const s3 = S3();
      if (!s3 || !s3.ok) return null;          // 模块没就位 / WebGL 不可用：留在 2D
      inst.seaTried = true;
      const c = document.createElement('canvas');
      c.className = inst.cv.className + ' mlp-sea3d' + (inst.drag ? ' mlp-sea3d-drag' : '');
      c.setAttribute('aria-hidden', 'true');
      inst.cv.parentNode.insertBefore(c, inst.cv.nextSibling);
      const s = s3.create(c, { dpr: inst.seaCap });
      if (!s) { try { c.remove(); } catch (_) {} return null; }
      inst.seaCv = c; inst.sea = s;
      inst.cv.style.display = 'none';
      c.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        inst.sea = null; inst.seaLost = true;
        c.style.display = 'none'; inst.cv.style.display = '';
        draw(inst, inst.t);
      }, false);
      if (inst.drag) bindSeaDrag(inst);
      return s;
    }
    /* 全屏那张海可以用手指/鼠标推着看：拖是转视角，轻点是在水面造一道浪。
       卡片里不做拖拽，免得手机上想往上滑却被画面抓住。 */
    function bindSeaDrag(inst) {
      const c = inst.seaCv;
      let down = false, moved = 0, px = 0, py = 0, id = null;
      c.addEventListener('pointerdown', (e) => {
        if (!inst.sea || (e.pointerType === 'mouse' && e.button !== 0)) return;
        down = true; moved = 0; px = e.clientX; py = e.clientY; id = e.pointerId;
        try { c.setPointerCapture(id); } catch (_) {}
      });
      c.addEventListener('pointermove', (e) => {
        if (!down || !inst.sea) return;
        const dx = e.clientX - px, dy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        inst.sea.orbit(dx * 0.0022, -dy * 0.0016);
        if (inst.playing) kick(); else draw(inst, inst.t);
      });
      const up = () => {
        if (!down) return;
        down = false;
        try { if (id !== null) c.releasePointerCapture(id); } catch (_) {}
        if (inst.sea) { inst.sea.release(); if (moved < 9) inst.sea.pulseAt_(); }
        if (inst.playing) kick(); else draw(inst, inst.t);
      };
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      c.addEventListener('pointerleave', up);
    }
    function draw(inst, t) {
      const d = inst.def;
      if (!d) return;
      if (d.kind === 'sea' && ensureSea(inst)) {
        show(inst, 'sea');
        const b = boxOf(inst);
        inst.sea.setSize(b.w, b.h, inst.seaCap);
        inst.sea.setMood(d.mood);
        inst.sea.render(t);
        return;
      }
      if (inst.seaCv) show(inst, 'flat');
      const ctx = inst.cv.getContext('2d');
      // 照片优先（这里是兜底路径）：加载完成就画照片，播放时缓慢推近（1.055 → 1.16），暂停停在同一帧
      const ph = d.photo ? photoOf(d.photo) : null;
      if (ph && ph.ok && ph.img.complete && ph.img.naturalWidth > 0) {
        const drift = inst.playing ? (0.055 + 0.02 * (1 + Math.sin(t * 0.021))) : (inst._photoScale || 0.055);
        inst._photoScale = drift;
        ctx.fillStyle = '#101b14';
        ctx.fillRect(0, 0, inst.cv.width, inst.cv.height);
        drawCover(ctx, ph.img, inst.cv.width, inst.cv.height, 1 + drift);
        if (d.kind === 'sea') drawSeaShimmer(ctx, inst.cv.width, inst.cv.height, t, d.seed);
        return;
      }
      if (d.kind === 'forest') drawPlate(ctx, inst.cv.width, inst.cv.height, 'forest');
      else drawPlate(ctx, inst.cv.width, inst.cv.height, 'sea');
    }
    function instActive(inst) {
      if (inst.cv === imArt) return !immerse.hidden;
      return isOpen() && isRoom(tab) && !roomEl.hidden;
    }
    function loop(ts) {
      raf = 0;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts;
      if (ts - lastFrame < 30) { raf = requestAnimationFrame(loop); return; }  // 30fps 足够了
      lastFrame = ts;
      const t0 = performance.now();
      let any = false;
      for (const inst of reg.values()) {
        if (!inst.playing || !inst.def) continue;
        if (!instActive(inst)) continue;
        inst.t += dt;
        fit(inst);
        draw(inst, inst.t);
        any = true;
      }
      // 一帧画得吃力就先降采样（不降帧），连续吃多才降一次
      if (performance.now() - t0 > 34) slow++; else if (slow > 0) slow--;
      if (slow > 24) {
        slow = 0;
        for (const inst of reg.values()) { if (inst.sea) inst.sea.lowerQuality(); }
      }
      if (any && !pageHidden) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && !pageHidden) { lastTs = 0; raf = requestAnimationFrame(loop); } }
    function fresh(inst, def) {
      if (inst.def !== def) { inst.def = def; inst.t = (def.seed % 97) * 0.37; inst._photoScale = 0.055; }
    }
    function shape(inst, cv) {
      inst.drag = (cv === imArt);
      inst.seaCap = inst.drag ? 1.2 : 1.5;
      if (!inst.veilHost) {
        inst.veilHost = cv.closest ? cv.closest('.mlp-room, .mlp-immerse') : null;
      }
    }
    function mount(cv, def, opts = {}) {
      if (!cv) return;
      let inst = reg.get(cv);
      if (!inst) { inst = { cv, t: 0, playing: false, def: null, _photoScale: 0.055, seaTried: false }; reg.set(cv, inst); }
      if (!def) { inst.playing = false; return; }
      shape(inst, cv);
      fresh(inst, def);
      inst.playing = !!opts.playing && !reduceMotion.matches;
      fit(inst);
      draw(inst, inst.t);
      // 照片是异步加载的：加载完成前先画兜底，加载完成后补一帧照片；
      // 若照片早已加载完（缓存命中），complete 为真，draw 里本来就会走照片分支。
      // 听海走实时海面时，照片改由名牌上的小图承担（这里预取一下就好）。
      if (def.photo) {
        const ph = photoOf(def.photo);
        if (ph && !ph.ok && !ph.tried) {
          ph.img.addEventListener('load', () => {
            if (inst.def === def && reg.get(cv) === inst) { draw(inst, inst.t); if (inst.playing) kick(); }
          }, { once: true });
        }
      }
      if (inst.playing) kick();
    }
    function stage(cv, def) {
      if (!cv || !def) return;
      let inst = reg.get(cv);
      if (!inst) { inst = { cv, t: 0, playing: false, def: null, _photoScale: 0.055, seaTried: false }; reg.set(cv, inst); }
      shape(inst, cv);
      fresh(inst, def);
      if (def.photo) photoOf(def.photo);   // 提前开始加载，点进全屏时就不用等
      if (def.kind === 'sea') { const s3 = S3(); if (s3 && s3.ok) s3.warm(); }
    }
    function setPlaying(cv, playing) {
      const inst = reg.get(cv);
      if (!inst || !inst.def) return;
      const p = !!playing && !reduceMotion.matches;
      if (inst.playing === p) { if (p) kick(); return; }
      inst.playing = p;
      if (!p) draw(inst, inst.t);   // 停在同一帧，不黑屏
      else kick();
    }
    function refit(cv) {
      const inst = reg.get(cv);
      if (inst && inst.def) { fit(inst); draw(inst, inst.t); }
    }
    function halt(cv) {
      const inst = reg.get(cv);
      if (inst) inst.playing = false;
    }
    function setHidden(h) { pageHidden = h; if (!h) kick(); }
    reduceMotion.addEventListener?.('change', () => {
      for (const inst of reg.values()) {
        if (reduceMotion.matches) { inst.playing = false; draw(inst, inst.t); }
      }
    });
    function seaLive(cv) { const i = reg.get(cv); return !!(i && i.sea); }
    return { mount, stage, setPlaying, refit, halt, setHidden, seaLive };
  })();


  /* ---------- 播放状态 ---------- */
  let tab = 'fav';            // 音笺(fav) / 听海(sea) / 林间(forest) / 找歌(search)
  let results = [];           // 搜索结果 [{id,name,artist}]
  let searchIdx = -1;         // 正在播放的搜索结果下标
  let playingCtx = 'fav';     // 当前播放上下文：fav / search / sea / forest
  let lastKw = '';

  const fmt = s => {
    s = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  // 进度填充条宽度（r: 0~1）
  function setFillRatio(r) {
    fill.style.width = `${Math.min(100, Math.max(0, Math.round((r || 0) * 10000) / 100))}%`;
  }
  const isOpen = () => panel.classList.contains('open');
  const isRoom = t => t === 'sea' || t === 'forest';
  /* 一间房"此刻真的在响没有"：听海看十五层里是否有声音，林间看那一条单曲。 */
  const roomLive = t => t === 'sea'
    ? seaLive()
    : (playingCtx === 'forest' && !!audio.src && !audio.paused);
  const roomReady = t => t === 'sea' ? seaAnyWant() : !!audio.src;
  const listFor = ctx =>
    ctx === 'search' ? results :
    ctx === 'fav' ? collectionList() :
    (ROOMS[ctx] ? ROOMS[ctx].list : []);
  const activeList = () => listFor(playingCtx);
  const activeIdx = () =>
    playingCtx === 'search' ? searchIdx :
    playingCtx === 'fav' ? state.idx :
    (ROOMS[playingCtx] ? state.room[playingCtx] : 0);

  /* ---------- 列表渲染 ---------- */
  function setStatus(text) {
    if (!text) { statusEl.hidden = true; statusEl.textContent = ''; return; }
    statusEl.hidden = false;
    statusEl.textContent = text;
  }
  function rowHtml(tr, i, kind) {
    const eq = `<span class="mlp-eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
    /* 左边那一小块，只用两样原样的东西：
       · 林间 —— 原站给这片林子配的那张封面；
       · 听海 —— 原站那套线描小图里的一枚（原站没有照片，只有这套图）。
       两样都没有时才退回编号牌。这里不放任何程序画出来的图。 */
    const n = String(i + 1).padStart(2, '0');
    const cover = tr.icon
      ? `<span class="mlp-cover mlp-cover-ico" aria-hidden="true"><img src="${esc(tr.icon)}" alt="" loading="lazy" decoding="async" draggable="false"></span>`
      : tr.photo
        ? `<span class="mlp-cover" aria-hidden="true"><span class="mlp-cover-n">${n}</span><img src="${esc(tr.photo)}" alt="" loading="lazy" decoding="async" draggable="false"></span>`
        : `<span class="mlp-cover mlp-cover-empty" aria-hidden="true"><span class="mlp-cover-n">${n}</span></span>`;
    const sub = tr.sub || tr.artist;
    const main = `<span class="mlp-main"><span class="mlp-name">${esc(tr.name)}</span>${sub ? `<span class="mlp-sub">${esc(sub)}</span>` : ''}</span>`;
    let extra = '';
    if (kind === 'fav' && i >= TRACKS.length) extra = `<button type="button" class="mlp-heart" data-heart="${i}" aria-label="从收藏移除" title="从收藏移除">${icn.heartFill}</button>`;
    if (kind === 'search') {
      const inFav = state.favs.some(f => f.id === tr.id);
      extra = `<button type="button" class="mlp-heart ${inFav ? 'on' : ''}" data-heart="${i}" aria-label="${inFav ? '已在收藏中，点按移除' : '加入收藏'}" title="${inFav ? '点击移出收藏' : '加入收藏'}">${inFav ? icn.heartFill : icn.heart}</button>`;
    }
    return `<li data-idx="${i}"><button type="button" class="mlp-row" data-idx="${i}" title="${esc(tr.name)}">${cover}${main}${eq}</button>${extra}</li>`;
  }
  /* ---------- 听海的十五枚小图：原站那套线描图，按原站的样子摆在一起 ----------
     三片海一排（互斥），其余十二层三列排开（可叠加）。 */
  function seaTileHtml(t, i) {
    return `<button type="button" class="mlp-mix-tile${t.main ? ' main' : ''}" data-sea="${i}" aria-pressed="false" title="${esc(t.name)} · ${esc(t.sub || '')}">
      <span class="mlp-mix-ic" aria-hidden="true"><img src="${esc(t.icon)}" alt="" loading="lazy" decoding="async" draggable="false"></span>
      <span class="mlp-mix-name">${esc(t.name)}</span>
    </button>`;
  }
  function renderMix() {
    if (mixEl.dataset.built !== '1') {
      mixEl.dataset.built = '1';
      const mains = SEA.map((t, i) => ({ t, i })).filter(x => x.t.main);
      const rest = SEA.map((t, i) => ({ t, i })).filter(x => !x.t.main);
      mixEl.innerHTML = `
        <p class="mlp-mix-h">三片海，选一片</p>
        <div class="mlp-mix-grid">${mains.map(x => seaTileHtml(x.t, x.i)).join('')}</div>
        <p class="mlp-mix-h">再叠上周围的声音</p>
        <div class="mlp-mix-grid">${rest.map(x => seaTileHtml(x.t, x.i)).join('')}</div>`;
      mixEl.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => { try { img.remove(); } catch (_) {} }, { once: true });
      });
    }
    refreshSeaUI();
    syncScrollHint(mixEl);
  }
  /* 清单与混音板底边还有内容时，给一道渐隐（.scroll-more），
     免得一排小图被硬切一半，看着像坏了。 */
  function syncScrollHint(el) {
    if (!el) return;
    el.classList.toggle('scroll-more', el.scrollHeight - el.clientHeight - el.scrollTop > 4);
  }
  function refreshSeaUI() {
    if (!mixEl) return;
    mixEl.querySelectorAll('.mlp-mix-tile').forEach(btn => {
      const i = Number(btn.dataset.sea);
      const on = !!state.seaWant[i];
      btn.classList.toggle('on', on);
      btn.classList.toggle('live', on && seaIsPlaying(i));
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (roomEl) roomEl.classList.toggle('sea-sounding', seaLive());
  }
  /* 名字牌上的这一句：一层就报这一层的名字，叠起来就报叠了几层 */
  function seaSummary() {
    const idxs = [];
    SEA.forEach((t, i) => { if (state.seaWant[i]) idxs.push(i); });
    if (!idxs.length) return { name: '还没有海声', sub: '挑一片，或者叠上几层', icon: '' };
    if (idxs.length === 1) {
      const t = SEA[idxs[0]];
      return { name: t.name, sub: t.sub || '', icon: t.icon || '' };
    }
    const names = idxs.map(i => SEA[i].name);
    return {
      name: `${names.length} 层海声叠在一起`,
      sub: names.slice(0, 3).join(' · ') + (names.length > 3 ? ' …' : ''),
      icon: SEA[idxs[idxs.length - 1]].icon || '',
    };
  }
  function renderList() {
    if (tab === 'sea') {
      mixEl.hidden = false;
      listEl.hidden = true;
      renderMix();
      items = [];
      return;
    }
    mixEl.hidden = true;
    listEl.hidden = false;
    const data = listData();
    listEl.innerHTML = data.length
      ? data.map((t, i) => rowHtml(t, i, tab)).join('')
      : '';
    // 缩略图要是缺了，就把图摘掉，露出下面的编号，不留一个破图框
    listEl.querySelectorAll('.mlp-cover img').forEach(img => {
      img.addEventListener('error', () => { try { img.remove(); } catch (_) {} }, { once: true });
    });
    items = [...listEl.querySelectorAll('li')];
    refreshActive();
    syncScrollHint(listEl);
  }
  function listData() {
    if (tab === 'search') return results.map(t => ({ name: t.name, artist: t.artist, id: t.id }));
    return listFor(tab);
  }
  function refreshActive() {
    const cur = activeIdx();
    items.forEach((li, i) => {
      const isActive = i === cur && tab === playingCtx && (playingCtx === 'search' ? searchIdx >= 0 : true);
      li.classList.toggle('active', isActive);
      li.classList.toggle('paused', isActive && audio.paused);
    });
  }
  function openTab(next) {
    if (tab === next) return;
    tab = next;
    tabBtns.forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    updateLede();
    searchWrap.hidden = tab !== 'search';
    setStatus('');
    updateRoomUI();
    renderList();
    if (isOpen()) { clampScaleToFit(); positionPanel(); }
  }
  /* 四个页签各有一句自己的话：换房就换，不重复。 */
  function updateLede() {
    if (!ledeEl) return;
    const text = LEDES[tab] || '';
    if (ledeEl.textContent !== text) ledeEl.textContent = text;
  }
  /* 听海 / 林间的房间画面与文案。只讲风景，不提任何站点或作者。 */
  function trackScene(ctx) {
    const room = ROOMS[ctx];
    if (!room) return null;
    return room.list[state.room[ctx]] || room.list[0];
  }
  /* 曲目 → 画布用的场景定义：把这张照片一并带上。
     缓存成同一个对象，保证同一段声音重复 mount 时场景时间不被重置。 */
  function sceneDef(tr) {
    if (!tr) return null;
    if (!tr._def) tr._def = Object.assign({}, tr.scene, tr.photo ? { photo: tr.photo } : null);
    return tr._def;
  }
  /* 名牌上的地点小图：听海换成实时画面后，照片挪到这里继续当"这个地方"的凭据。
     加载失败就整块藏起来，不留破图。 */
  function setChip(img, src, isIco) {
    if (!img) return;
    img.classList.toggle('is-ico', !!isIco);
    if (!src) { img.hidden = true; img.removeAttribute('src'); img.dataset.src = ''; return; }
    if (img.dataset.src !== src) {
      img.dataset.src = src;
      img.hidden = true;
      img.addEventListener('load', () => { if (img.dataset.src === src) img.hidden = false; }, { once: true });
      img.addEventListener('error', () => { if (img.dataset.src === src) img.hidden = true; }, { once: true });
      img.src = src;
    }
    if (img.complete) img.hidden = !(img.naturalWidth > 0);
  }
  function updateRoomUI() {
    const inRoom = isRoom(tab);
    panel.classList.toggle('room-open', inRoom);
    panel.classList.toggle('room-sea', inRoom && tab === 'sea');
    roomEl.hidden = !inRoom;
    roomNote.hidden = !inRoom;
    progressEl.hidden = inRoom;
    if (!inRoom) return;
    const room = ROOMS[tab];
    if (!room) return;
    roomEl.dataset.room = tab;
    roomLine.textContent = room.line;
    roomNote.textContent = room.note;
    syncRoomScene();
    syncRoomPlay();
  }
  /* 房间卡片里的小画布：听海永远是那片实时海面；林间是当前选中的林子 */
  function syncRoomScene() {
    if (!isRoom(tab)) return;
    const tr = trackScene(tab);
    if (!tr) return;
    const sea = tab === 'sea';
    const sum = sea ? seaSummary() : { name: tr.name, sub: tr.sub || '', icon: tr.icon || '' };
    roomCapName.textContent = sum.name;
    roomCapSub.textContent = sum.sub || '';
    setChip(roomCapPhoto, sea ? sum.icon : (tr.icon || tr.photo), sea ? true : !!tr.icon);
    scenes.mount(roomCanvas, sea ? SEA_SCENE : sceneDef(tr), {
      playing: roomLive(tab),
    });
  }
  /* 听林时整页的那张背景（由 index.html 的 #roomArt 接住）：
     只在"确实在响、而且响的是林间"时铺开；一暂停就收回。
     换林时音频会先来一记 pause，这里排一次 160ms 后的收回，
     紧跟着的 play 会把它取消——切下一片林子时不会闪一下空纸。 */
  let roomArtTimer = 0, roomArtSig = '';
  function broadcastRoomArt() {
    /* 听海在响 → 整页换成那片实时海面（index.html 的 #roomSea 接住）；
       林间在响 → 换成那片林子的照片；都没有 → 收回，场景插画照旧。 */
    const liveSea = seaLive();
    const liveForest = playingCtx === 'forest' && !!audio.src && !audio.paused;
    const roomNow = liveSea ? 'sea' : liveForest ? 'forest' : '';
    const tr = liveForest ? trackScene('forest') : null;
    const photo = roomNow === 'forest' && tr && tr.photo ? tr.photo : '';
    const sig = roomNow + '|' + photo;
    if (sig === roomArtSig) return;
    roomArtSig = sig;
    const emit = () => document.dispatchEvent(new CustomEvent('xg-roomart', {
      detail: { room: roomNow, photo },
    }));
    clearTimeout(roomArtTimer);
    if (photo || roomNow === 'sea') emit();
    else roomArtTimer = setTimeout(emit, 160);
  }
  function syncRoomPlay() {
    const here = isRoom(tab) && (tab === 'sea' ? roomReady(tab) : playingCtx === tab && roomReady(tab));
    const playing = isRoom(tab) && roomLive(tab);
    roomPlayBtn.classList.toggle('playing', playing);
    const label = roomPlayBtn.querySelector('.mlp-room-play-t');
    if (label) label.textContent = playing ? '暂停' : '播放';
    roomPlayBtn.setAttribute('aria-label', playing ? '暂停这间房的声音' : '播放这间房的声音');
    panel.classList.toggle('room-live', playing);
    if (isRoom(tab)) {
      scenes.setPlaying(roomCanvas, playing);
    }
    syncImmersive();
    broadcastRoomArt();
  }
  function syncImmersive() {
    if (!imPlay) return;
    const room = ROOMS[tab];
    const playing = isRoom(tab) && roomLive(tab);
    immerse.classList.toggle('playing', playing);
    imPlay.classList.toggle('playing', playing);
    imPlayT.textContent = playing ? '暂停' : '播放';
    imPlay.setAttribute('aria-label', playing ? '暂停' : '播放');
    // 全屏画面跟着当前这一段声音走：满屏的景 + 它的名字
    if (room && isRoom(tab)) {
      const tr = trackScene(tab);
      const sea = tab === 'sea';
      const sum = sea ? seaSummary() : { name: tr ? tr.name : '', sub: tr ? (tr.sub || '') : '', icon: tr ? (tr.icon || '') : '' };
      imKicker.textContent = room.kicker;
      imLine.textContent = room.line;
      imNote.textContent = room.note;
      if (tr) {
        imCapName.textContent = sum.name;
        imCapSub.textContent = sum.sub || '';
        setChip(imCapPhoto, sea ? sum.icon : (tr.icon || tr.photo), sea ? true : !!tr.icon);
        // 全屏开着时也要跟着换景：mount 同 def 是无害的，会补一次重绘并把 playing 对齐
        if (!immerse.hidden) {
          scenes.mount(imArt, sea ? SEA_SCENE : sceneDef(tr), { playing });
        } else {
          scenes.stage(imArt, sea ? SEA_SCENE : sceneDef(tr));
        }
      }
    }
    if (imDragHint) imDragHint.hidden = !scenes.seaLive(imArt);
    // 当前播的是另一间房（比如在听海全屏时从林间点了一首）：全屏内容照旧，只对齐播放键状态
  }
  function openImmerse() {
    if (!isRoom(tab)) return;
    const room = ROOMS[tab];
    if (!room) return;
    const tr = trackScene(tab);
    const sea = tab === 'sea';
    const sum = sea ? seaSummary() : { name: tr ? tr.name : '', sub: tr ? (tr.sub || '') : '', icon: tr ? (tr.icon || '') : '' };
    immerse.dataset.room = tab;
    imKicker.textContent = room.kicker;
    imLine.textContent = room.line;
    imNote.textContent = room.note;
    if (tr) {
      imCapName.textContent = sum.name;
      imCapSub.textContent = sum.sub || '';
      setChip(imCapPhoto, sea ? sum.icon : (tr.icon || tr.photo), sea ? true : !!tr.icon);
    }
    imReturnFocus = document.activeElement && document.activeElement !== document.body
      ? document.activeElement : roomPlayBtn;
    syncImmersive();
    immerse.hidden = false;
    if (tr) scenes.mount(imArt, sea ? SEA_SCENE : sceneDef(tr), {
      playing: roomLive(tab),
    });
    if (imDragHint) imDragHint.hidden = !scenes.seaLive(imArt);
    try { immerse.inert = false; panel.inert = true; fab.inert = true; } catch (_) {}
    requestAnimationFrame(() => immerse.classList.add('open'));
    document.documentElement.classList.add('mlp-immersed');
    setTimeout(() => { try { imClose.focus({ preventScroll: true }); } catch (_) { imClose.focus(); } }, 60);
  }
  function closeImmerse() {
    if (immerse.hidden) return;
    immerse.classList.remove('open');
    document.documentElement.classList.remove('mlp-immersed');
    scenes.mount(roomCanvas, tab === 'sea' ? SEA_SCENE : sceneDef(trackScene(tab)), {
      playing: roomLive(tab),
    });
    try { panel.inert = false; fab.inert = false; } catch (_) {}
    setTimeout(() => { immerse.hidden = true; scenes.halt(imArt); }, 620);
    try { if (imReturnFocus && imReturnFocus.focus) imReturnFocus.focus({ preventScroll: true }); } catch (_) {}
  }
  function markPlaying(playing) {
    const live = !!playing || seaLive();
    fab.classList.toggle('playing', live);
    toggleBtn.classList.toggle('playing', live);
    toggleBtn.setAttribute('aria-label', live ? '暂停' : '播放');
    syncRoomPlay();
  }

  function openPanel() {
    positionPanel();
    panel.classList.add('open');
    setPanelHidden(false);
  }
  function closePanel() {
    panel.classList.remove('open');
    setPanelHidden(true);
  }
  /* 收起状态：inert 一次解决焦点、Tab、读屏三种"隐形可达"；
     老浏览器不认 inert 时，CSS 里的 visibility:hidden 仍然会把按钮踢出 Tab 序列。 */
  function setPanelHidden(hidden) {
    fab.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    try { panel.inert = !!hidden; } catch (_) {}
    panel.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }
  function togglePanel() { isOpen() ? closePanel() : openPanel(); }

  /* ---------- 悬浮按钮位置（可拖动）与面板尺寸记忆 ---------- */
  const FAB_MARGIN = 8;
  function clampPos(x, y) {
    const w = window.innerWidth, h = window.innerHeight;
    return {
      x: Math.min(Math.max(x, FAB_MARGIN), w - fab.offsetWidth - FAB_MARGIN),
      y: Math.min(Math.max(y, FAB_MARGIN), h - fab.offsetHeight - FAB_MARGIN),
    };
  }
  function applyPos() {
    if (!state.pos) {
      fab.style.left = ''; fab.style.top = ''; fab.style.right = ''; fab.style.bottom = '';
      panel.style.left = ''; panel.style.top = ''; panel.style.right = ''; panel.style.bottom = '';
      return;
    }
    const p = clampPos(state.pos.nx * window.innerWidth, state.pos.ny * window.innerHeight);
    fab.style.right = 'auto'; fab.style.bottom = 'auto';
    fab.style.left = `${p.x}px`; fab.style.top = `${p.y}px`;
  }
  // 面板始终锚定在悬浮标旁（默认放上方；放大或贴近屏幕边缘时自动夹紧回屏内）
  function positionPanel() {
    if (!document.body.contains(panel)) return;
    const r = fab.getBoundingClientRect();
    const w = window.innerWidth, h = window.innerHeight;
    const pRect = panel.getBoundingClientRect();
    const pw = pRect.width, ph = pRect.height;
    let left = r.right - pw - 6;
    left = Math.max(FAB_MARGIN, Math.min(left, w - pw - FAB_MARGIN));
    let top = r.top - ph - 10;
    if (top < FAB_MARGIN) {
      // 上方放不下：优先翻转到悬浮标下方
      const below = r.bottom + 10;
      top = (below + ph <= h - FAB_MARGIN) ? below : Math.max(FAB_MARGIN, Math.min(top, h - ph - FAB_MARGIN));
    }
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    // 面板用 zoom 放大：zoom 会把 left/top 一并乘上倍数，这里先除回去，
    // 否则 1.25 档时右边缘会被推出屏幕（按钮点不到）。
    const z = state.scale && state.scale !== 1 ? state.scale : 1;
    panel.style.left = `${left / z}px`; panel.style.top = `${top / z}px`;
  }
  function applyScale() {
    panel.style.zoom = state.scale === 1 ? '' : String(state.scale);
  }
  // 当前视口下放得下的最大缩放档（即便被裁夹紧也要保证面板在屏内可见）
  function maxFittingScale() {
    const prevZoom = panel.style.zoom;
    panel.style.zoom = '';
    const bW = panel.offsetWidth, bH = panel.offsetHeight;
    panel.style.zoom = prevZoom;
    const availW = window.innerWidth - FAB_MARGIN * 2, availH = window.innerHeight - FAB_MARGIN * 2;
    let best = 1;
    for (const s of SCALES) { if (Math.round(bW * s) <= availW && Math.round(bH * s) <= availH) best = s; }
    return best;
  }
  function scaleList() {
    const maxS = maxFittingScale();
    return SCALES.filter(s => s <= maxS);
  }
  // 明确的放大 / 缩小（两个独立按钮，到边界自动置灰）
  function zoomIndexOf(list) {
    let at = list.indexOf(state.scale);
    if (at < 0) at = list.findIndex(s => s > state.scale);
    if (at < 0) at = list.length - 1;
    return at;
  }
  function zoomStep(dir) {
    const list = scaleList();
    if (!list.length) return;
    const next = Math.min(list.length - 1, Math.max(0, zoomIndexOf(list) + dir));
    if (!(next in list) || list[next] === state.scale) { syncZoomBtns(); return; }
    state.scale = list[next];
    applyScale();
    if (isOpen()) positionPanel();
    persist();
    syncZoomBtns();
  }
  function syncZoomBtns() {
    if (!zoomInBtn || !zoomOutBtn) return;
    const list = scaleList();
    const at = list.length ? zoomIndexOf(list) : 0;
    zoomOutBtn.disabled = !list.length || at <= 0;
    zoomInBtn.disabled = !list.length || at >= list.length - 1;
  }
  // 面板内容变高（比如切到听海/林间）后，把记忆里的放大档收回到当前放得下的最大档
  function clampScaleToFit() {
    const maxS = maxFittingScale();
    if (state.scale > maxS) { state.scale = maxS; applyScale(); persist(); }
    syncZoomBtns();
  }
  let drag = null, suppressClick = false;
  fab.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const r = fab.getBoundingClientRect();
    drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
    try { fab.setPointerCapture(e.pointerId); } catch (_) {}
  });
  fab.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    fab.classList.add('dragging');
    document.body.classList.add('mlp-dragging');
    const p = clampPos(drag.ox + dx, drag.oy + dy);
    fab.style.right = 'auto'; fab.style.bottom = 'auto';
    fab.style.left = `${p.x}px`; fab.style.top = `${p.y}px`;
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    fab.classList.remove('dragging');
    document.body.classList.remove('mlp-dragging');
    if (!moved) return; // 未拖动 → 交给 click 事件正常开合面板
    const r = fab.getBoundingClientRect();
    state.pos = { nx: Math.min(1, Math.max(0, r.left / window.innerWidth)), ny: Math.min(1, Math.max(0, r.top / window.innerHeight)) };
    persist();
    suppressClick = true;
    if (isOpen()) positionPanel();
  };
  fab.addEventListener('pointerup', endDrag);
  fab.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', () => {
    applyPos();
    if (isOpen()) { clampScaleToFit(); positionPanel(); }
    syncZoomBtns();
    scenes.refit(roomCanvas);
    if (!immerse.hidden) scenes.refit(imArt);
  });
  document.addEventListener('visibilitychange', () => { scenes.setHidden(document.hidden); });

  /* ---------- 事件：悬浮按钮 ---------- */
  fab.addEventListener('click', e => {
    e.stopPropagation();
    if (suppressClick) { suppressClick = false; return; }
    togglePanel();
  });

  /* ---------- 共用暂停/播放函数 ---------- */
  function playPause() {
    if (playingCtx === 'sea') { seaOn ? seaStop() : seaStart(); return; }
    if (!audio.src) {
      if (playingCtx === 'search') { if (results.length) playAt('search', Math.max(0, searchIdx), true); }
      else if (playingCtx === 'forest') playAt('forest', state.room.forest, true);
      else playAt('fav', state.idx, true);
      return;
    }
    if (audio.paused) { audio.play().catch(() => markPlaying(false)); markPlaying(true); }
    else { audio.pause(); }
  }
  /* 房间里的播放键：听海 = 整组十五层一起开始 / 一起停；
     林间 = 没在这间房里播就从上次听的那一片开始，正在播就暂停。
     全屏收听时页面被盖住、面板不可点，这里的键就是全屏层的那个播放键。 */
  function toggleRoom() {
    if (tab === 'sea') { seaOn ? seaStop() : seaStart(); return; }
    if (playingCtx === tab && audio.src) {
      if (audio.paused) { audio.play().catch(() => markPlaying(false)); markPlaying(true); }
      else { audio.pause(); }
      return;
    }
    playAt(tab, state.room[tab], true);
  }
  /* 「随机去一片」：林间里随机换一片林子。听海是三片海选一片，不放这枚键。 */
  function shuffleRoom() {
    if (tab === 'sea') {
      const i = Math.floor(Math.random() * 3);
      seaToggleLayer(i);
      return;
    }
    if (!isRoom(tab)) return;
    const n = ROOMS[tab].list.length;
    let i = Math.floor(Math.random() * n);
    if (n > 1 && i === state.room[tab]) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
    playAt(tab, i, true);
  }

  /* ---------- 事件：面板内控件 ---------- */
  panel.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') { closePanel(); return; }
    if (act === 'zoomin') { zoomStep(1); return; }
    if (act === 'zoomout') { zoomStep(-1); return; }
    if (act === 'go') { doSearch(); return; }
    const heart = e.target.closest('[data-heart]');
    if (heart) {
      toggleFav(Number(heart.dataset.heart));
      return;
    }
    const tbtn = e.target.closest('.mlp-tab');
    if (tbtn) { openTab(tbtn.dataset.tab); return; }
    const tile = e.target.closest('.mlp-mix-tile');
    if (tile) { seaToggleLayer(Number(tile.dataset.sea)); return; }
    const item = e.target.closest('.mlp-list button.mlp-row');
    if (item) {
      const i = Number(item.dataset.idx);
      // 点同一个标签里正在播的同一首 → 播放/暂停切换
      if (tab === playingCtx && i === activeIdx() && audio.src) {
        if (audio.paused) { audio.play().catch(() => markPlaying(false)); markPlaying(true); }
        else { audio.pause(); }
        return;
      }
      playAt(tab, i, true);
      return;
    }
    if (act === 'roomplay') { toggleRoom(); return; }
    if (act === 'roomfs') { openImmerse(); return; }
    if (act === 'roomshuffle') { shuffleRoom(); return; }
    if (act === 'imshuffle') { shuffleRoom(); return; }
    if (act === 'toggle') {
      if (!audio.src) { setStatus(''); playPause(); return; }
      playPause();
    } else if (act === 'prev') {
      if (audio.src && audio.currentTime > 3) { audio.currentTime = 0; return; }
      stepTrack(-1);
    } else if (act === 'next') {
      stepTrack(1);
    }
  });

  /* ---------- 原站线路优先：联网时播这条声音自己的原处，撑不住就退回包里那份 ----------
     听海与林间的每一段都可以带一个 remote（原站那条录音的直链）。规则：
       · 断网、或这一趟已经判定这条不行 → 直接用本地那份，不等；
       · 否则先连 remote，挂三把保险：
           1) play() 被拒或报错；
           2) 7 秒还没真正出声的看门狗（暂停着、或一直在 0 秒打转，都算没连上）；
           3) 起播后的卡顿判定：头 15 秒里累计卡住超过 4 秒、或卡满 4 回、
              或有一回一声不响超过 8 秒 —— 说明这条线追不上声音本身，
              接着听是一会儿有一会儿没有，不如换。
       · 任一保险触发 → 这条地址记入 remoteDead，改播本地那份，全程不弹错误、不留空播放；
       · 网络恢复（online）时把 remoteDead 清空，下次点击再试一次原站。
     界面上不写这是从哪儿来的——两边都只听得出"这一段海""这片林子"。 */
  const REMOTE_WAIT = 7000;      // 这么久还没真正出声 → 这条线不通
  const HALT_LIMIT = 8000;       // 播到一半一声不响超过这么久 → 也一样换
  const STALL_WATCH = 15000;     // 只判起播后的头 15 秒
  const STALL_SECONDS = 4;       // 这 15 秒里卡住的总时长上限
  const STALL_TIMES = 4;         // 这 15 秒里卡住的次数上限
  const remoteDead = new Set();
  let remoteTimer = 0;
  let haltTimer = 0;
  let remotePending = null;      // { tr, back } —— 正在等原站那条出声
  let stallWatch = null;         // { tr, back, t0, stalled, n, openAt } —— 出声之后接着判
  function armRemote(tr, token, autoplay, failMsg) {
    clearTimeout(remoteTimer);
    clearTimeout(haltTimer);
    remotePending = null;
    stallWatch = null;
    const back = () => {
      if (token !== playToken) return;      // 期间用户已经切走了
      clearTimeout(remoteTimer);
      clearTimeout(haltTimer);
      remotePending = null;
      stallWatch = null;
      remoteDead.add(tr.remote);
      audio.src = tr.src;                   // 退回本地那份
      if (autoplay) audio.play().catch(failMsg);
      else audio.load();
      setStatus('刚才那条有点不稳，先听这份稳的');
      setTimeout(() => setStatus(''), 3200);
    };
    remotePending = { tr, back };
    stallWatch = { tr, back, t0: 0, stalled: 0, n: 0, openAt: 0 };
    remoteTimer = setTimeout(() => {
      if (audio.paused || audio.currentTime === 0) back();
    }, REMOTE_WAIT);
    return back;
  }
  window.addEventListener('online', () => remoteDead.clear());

  /* ---------- 统一播放入口：本地音轨（收藏 / 听海 / 林间，带 src）与网络曲目（带 id，先解析 https 直链） ---------- */
  let playToken = 0;
  function playAt(ctx, i, autoplay) {
    if (ctx === 'sea') { seaToggleLayer(i); return; }   // 听海不是一曲接一曲，是十五层开关
    const data = listFor(ctx);
    if (!data[i]) return;
    const n = data.length;
    const idx = ((i % n) + n) % n;
    if (ctx === 'search') searchIdx = idx;
    else if (ctx === 'forest') { state.room.forest = idx; persist(); }
    else { state.idx = idx; persist(); }
    if (seaOn) seaStop(true);       // 另一边（单曲 / 林间）要响：听海先停，不交叉
    playingCtx = ctx;
    playToken += 1;
    const token = playToken;
    audio.loop = ctx === 'forest';  // 林间：一片接一片循环，不用管它
    refreshPlaying();
    const tr = data[idx];
    const failMsg = () => {
      markPlaying(false); refreshActive();
      setStatus(isRoom(ctx) ? '这段录音暂时无法播放' : '该曲目暂时无法播放');
      setTimeout(() => setStatus(''), 3000);
    };
    if (tr.src) {
      // 有原站线路就先走原站线路；断网或已知取不到时和原来一样直接播本地那份
      const wantRemote = !!tr.remote && navigator.onLine !== false && !remoteDead.has(tr.remote);
      if (!wantRemote) {
        clearTimeout(remoteTimer); clearTimeout(haltTimer);
        remotePending = null; stallWatch = null;
        audio.src = tr.src;
        if (autoplay) audio.play().catch(failMsg);
        else audio.load();
        return;
      }
      const back = armRemote(tr, token, autoplay, failMsg);
      audio.src = tr.remote;
      if (autoplay) {
        setStatus('正在连上这段声音…');
        audio.play().catch(() => { setStatus(''); back(); });
      } else {
        audio.load();
      }
      return;
    }
    if (!autoplay) return;
    setStatus('正在连接试听…');
    resolveStream(tr.id)
      .then(link => {
        if (token !== playToken) return; // 期间用户已切换到别处
        if (!link) { failMsg(); return; }
        audio.src = link;
        audio.play().catch(failMsg);
      })
      .catch(() => { if (token === playToken) failMsg(); });
  }
  // 试听直链解析：优先走自己的函数（部署了函数时最快最稳），失败自动回退公开接口
  async function resolveStream(id) {
    try {
      const res = await fetch(`${API_SEARCH}?stream=${id}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.url) return data.url;
      }
    } catch (_) { /* 本地打开或函数未部署 → 走公开接口 */ }
    const res = await fetch(`${GDS_API}?types=url&source=${GDS_SOURCE}&id=${encodeURIComponent(id)}&br=128`);
    if (!res.ok) throw new Error('resolve failed');
    const data = await res.json().catch(() => ({}));
    if (!data || !data.url) throw new Error('unplayable');
    return data.url;
  }
  /* ---------- 上一首/下一首（跟随当前播放上下文，含两间循环收听房） ---------- */
  function stepTrack(dir) {
    if (playingCtx === 'sea') return;     // 十五层不是一条队列，没有上一首下一首
    const ctx = playingCtx === 'forest' ? 'forest' : playingCtx === 'search' ? 'search' : 'fav';
    const list = listFor(ctx);
    if (!list.length) return;
    const cur = activeIdx();
    playAt(ctx, cur < 0 ? 0 : cur + dir, true);
  }
  /* ---------- 收藏/取消一首搜索结果 ---------- */
  function toggleFav(i) {
    if (tab === 'search') {
      const tr = results[i];
      if (!tr) return;
      const at = state.favs.findIndex(f => f.id === tr.id);
      if (at >= 0) state.favs.splice(at, 1);
      else { state.favs.push({ id: tr.id, name: tr.name, artist: tr.artist }); if (state.favs.length > 20) state.favs.shift(); }
      persist();
      setStatus(state.favs.some(f => f.id === tr.id) ? `已加入收藏：<${tr.name}>` : `已移出收藏：<${tr.name}>`);
      setTimeout(() => setStatus(''), 2000);
    } else {
      if (i >= TRACKS.length && i < collectionList().length) {
        const removed = state.favs.splice(i - TRACKS.length, 1);
        persist();
        if (state.idx === i) state.idx = 0;
        setStatus(removed.length ? '已移出收藏' : '');
        setTimeout(() => setStatus(''), 1500);
        renderList();
        if (isOpen()) positionPanel();
      }
    }
  }

  /* ---------- 搜索 ---------- */
  async function searchOwn(kw) {
    const res = await fetch(`${API_SEARCH}?kw=${encodeURIComponent(kw)}&limit=14`, { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `搜索服务暂不可用（HTTP ${res.status}）`);
    return (data.songs || []).map(s => ({ id: s.id, name: s.name || '(未知曲目)', artist: s.artist || '' }));
  }
  // 公开接口回退（拖拽部署 / 本地打开也能搜）：GD Studio 聚合检索，返回数组 [{id,name,artist[]}...]
  async function searchPublic(kw) {
    const res = await fetch(`${GDS_API}?types=search&source=${GDS_SOURCE}&name=${encodeURIComponent(kw)}&count=14&pages=1`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`搜索服务暂不可用（HTTP ${res.status}）`);
    const raw = await res.json().catch(() => ({}));
    return (Array.isArray(raw) ? raw : [])
      .filter(s => s && s.id)
      .map(s => ({
        id: String(s.id),
        name: s.name || '(未知曲目)',
        artist: Array.isArray(s.artist) ? s.artist.join('、') : (typeof s.artist === 'string' ? s.artist : ''),
      }));
  }
  async function doSearch() {
    const kw = searchInput.value.trim();
    if (!kw) { searchInput.focus(); setStatus('先输入想找的歌名或歌手'); setTimeout(() => setStatus(''), 2000); return; }
    lastKw = kw;
    setStatus(`正在搜索「${kw}」…`);
    searchInput.disabled = true;
    try {
      let list = [];
      try { list = await searchOwn(kw); } catch (_) { list = []; }
      if (!list.length) {
        // 自有函数不可用 / 无结果 → 公开接口兜底；公开接口自身出错才会抛出
        try { list = await searchPublic(kw); } catch (err) { if (!results.length) throw err; }
      }
      results = list;
      if (!results.length) {
        setStatus(`没有找到与「${kw}」相关的可试听歌曲`);
        renderList();
        setTimeout(() => setStatus(''), 3500);
        return;
      }
      searchIdx = -1;
      setStatus('');
      renderList();
      if (isOpen()) positionPanel();
    } catch (err) {
      results = [];
      renderList();
      setStatus(`${err.message || '搜索失败'} · 请稍后再试`);
      setTimeout(() => setStatus(''), 6000);
    } finally {
      searchInput.disabled = false;
    }
  }
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });

  /* ---------- 事件：音频状态 ---------- */
  audio.addEventListener('play', () => { markPlaying(true); refreshActive(); setStatus(''); });
  audio.addEventListener('pause', () => {
    markPlaying(false); refreshActive();
    // 还没出声就被按了暂停：那就停手，并且把落在原站那条上的指针换成包里那份 ——
    // 等他再按播放时，响得起的是稳的那一份，不是一段还在干等的空线。
    if (remotePending && audio.currentTime === 0) {
      clearTimeout(remoteTimer); clearTimeout(haltTimer);
      const p = remotePending;
      remotePending = null; stallWatch = null;
      remoteDead.add(p.tr.remote);
      audio.src = p.tr.src;
    }
  });
  audio.addEventListener('ended', () => { stepTrack(1); });
  audio.addEventListener('loadedmetadata', () => {
    durEl.textContent = Number.isFinite(audio.duration) ? fmt(audio.duration) : '--:--';
  });
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) setFillRatio(audio.currentTime / audio.duration);
    curEl.textContent = fmt(audio.currentTime);
  });
  /* 原站那条到底稳不稳，是量出来的不是猜的：只在"播的确实是这条 remote"时记账。 */
  function watchingRemote() {
    const w = stallWatch;
    return w && audio.src === w.tr.remote ? w : null;
  }
  audio.addEventListener('waiting', () => {
    const w = watchingRemote();
    if (!w) return;
    if (!w.openAt) w.openAt = Date.now();
    clearTimeout(haltTimer);                  // 一声不响太久也算这条线撑不住
    haltTimer = setTimeout(() => {
      const x = watchingRemote();
      if (x && !audio.paused) x.back();
    }, HALT_LIMIT);
  });
  audio.addEventListener('playing', () => {
    clearTimeout(haltTimer);
    // 真的出声了：撤掉看门狗，也不要有"正在连"的提示
    clearTimeout(remoteTimer); remotePending = null; setStatus('');
    const w = watchingRemote();
    if (!w) return;
    if (w.openAt) { w.stalled += (Date.now() - w.openAt) / 1000; w.n += 1; w.openAt = 0; }
    if (!w.t0) { w.t0 = Date.now(); return; }            // 头一回出声，从头计时
    if (w.stalled >= STALL_SECONDS || w.n >= STALL_TIMES) { w.back(); return; }
    if (Date.now() - w.t0 >= STALL_WATCH) stallWatch = null;   // 撑过判定窗口，认它稳
  });
  audio.addEventListener('error', () => {
    if (!audio.src) return;
    const p = remotePending;
    if (p && audio.src === p.tr.remote) { setStatus(''); p.back(); return; }  // 原站那条取不到 → 静默退回本地
    stallWatch = null;
    durEl.textContent = '无法加载';
    setStatus('曲目加载失败，试试换一首');
    setTimeout(() => { if (audio.paused) durEl.textContent = '--:--'; }, 2400);
    setTimeout(() => setStatus(''), 3000);
  });
  function refreshPlaying() {
    if (playingCtx === 'search') {
      durEl.textContent = '--:--';
      curEl.textContent = '0:00';
      setFillRatio(0);
    }
    if (isRoom(playingCtx)) { curEl.textContent = '0:00'; setFillRatio(0); }
    refreshActive();
    syncRoomScene();
    syncRoomPlay();
  }

  /* ---------- 事件：进度条拖动 ---------- */
  let scrubbing = false;
  const ratioFromEvent = e => {
    const rect = trackBar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };
  trackBar.addEventListener('pointerdown', e => {
    if (!audio.src || !audio.duration) return;
    scrubbing = true;
    trackBar.classList.add('dragging');
    trackBar.setPointerCapture(e.pointerId);
    audio.pause();
    markPlaying(false);
    setFillRatio(ratioFromEvent(e));
    curEl.textContent = fmt(ratioFromEvent(e) * audio.duration);
  });
  trackBar.addEventListener('pointermove', e => {
    if (!scrubbing) return;
    setFillRatio(ratioFromEvent(e));
    curEl.textContent = fmt(ratioFromEvent(e) * audio.duration);
  });
  trackBar.addEventListener('pointerup', e => {
    if (!scrubbing) return;
    scrubbing = false;
    trackBar.classList.remove('dragging');
    if (audio.src && audio.duration) {
      audio.currentTime = ratioFromEvent(e) * audio.duration;
      audio.play().catch(() => markPlaying(false));
    }
  });
  trackBar.addEventListener('pointercancel', () => {
    scrubbing = false;
    trackBar.classList.remove('dragging');
    if (!audio.paused) markPlaying(true);
  });

  /* ---------- 事件：音量 ---------- */
  volInput.addEventListener('input', () => {
    state.volume = Number(volInput.value);
    audio.volume = state.volume;
    seaVolume();                    // 十五层跟着同一枚总音量走
    volLabel.textContent = `${Math.round(state.volume * 100)}%`;
    persist();
  });

  /* ---------- 事件：全屏听 ---------- */
  imClose.addEventListener('click', closeImmerse);
  imPlay.addEventListener('click', toggleRoom);
  imShuffle.addEventListener('click', shuffleRoom);
  // 全屏收听只有三个控件：Tab 在它们之间来回，别让焦点跑到被盖住的页面上
  immerse.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const stops = [imClose, imShuffle, imPlay];
    const at = stops.indexOf(document.activeElement);
    e.preventDefault();
    if (e.shiftKey) stops[at <= 0 ? stops.length - 1 : at - 1].focus();
    else stops[at === -1 || at === stops.length - 1 ? 0 : at + 1].focus();
  });

  /* ---------- 事件：点击外部 / Esc 收起面板 ---------- */
  document.addEventListener('pointerdown', e => {
    if (!immerse.hidden) return;      /* 全屏听的时候，页面上的点击不关掉下面的音乐库 */
    if (!isOpen()) return;
    if (panel.contains(e.target) || fab.contains(e.target)) return;
    closePanel();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!immerse.hidden) { closeImmerse(); return; }
    if (isOpen()) closePanel();
  });

  /* ---------- 初始化（不自动播放） ---------- */
  function init() {
    document.body.appendChild(audio);
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    document.body.appendChild(immerse);
    [mixEl, listEl].forEach(el => {
      if (el) el.addEventListener('scroll', () => syncScrollHint(el), { passive: true });
    });
    window.addEventListener('resize', () => { syncScrollHint(listEl); syncScrollHint(mixEl); });
    try { immerse.inert = true; } catch (_) {}
    setPanelHidden(true);           /* 初始是收起态：先把 13 个按钮移出 Tab 序列 */
    applyPos();
    // 旧版（posVer 缺失）的位置记忆已按新版右上角默认处理，这里立即写回新版标记
    try {
      const old = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!old || old.posVer !== state.posVer) persist();
    } catch (_) { persist(); }
    // 视口过小时把保存的缩放档夹紧到可容纳的最大档
    const defS = maxFittingScale();
    if (state.scale > defS) { state.scale = defS; persist(); }
    applyScale();
    syncZoomBtns();
    tabBtns.forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    updateLede();
    searchWrap.hidden = tab !== 'search';
    updateRoomUI();
    if (state.idx >= collectionList().length) state.idx = 0;
    items.forEach(li => {
      const on = Number(li.dataset.idx) === state.idx;
      li.classList.toggle('active', on);
      li.classList.toggle('paused', on && audio.paused);
    });
    volLabel.textContent = `${Math.round(state.volume * 100)}%`;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
