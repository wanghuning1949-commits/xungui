/* 寻归荒野 · 听海的画面：原来那片海
   ------------------------------------------------------------
   这不是"另一种海"，就是原来那个网站上的那片海：three.js 的水面着色器 +
   解析式天空 + 九十根木桩，连水色（0x02C7D4）、太阳色（0xf5ebce）、
   镜头高度（15→随浪 14 上下）、天空的五个参数、木桩的每一处坐标，
   都按原站那份渲染脚本原样搬过来。两张贴图（水面法线、木纹）也是原站的。
   代码与许可：three.js r82（MIT）、WaterShader / SkyShader / Mirror（MIT，
   作者见文件头），全部在 assets/three/vt/ 里；下面只是把它装进一张画布。

   用法与上一版一致：
     var s = XGSea3D.create(canvas, { dpr: 1.2 });
     s.setSize(w, h); s.render(秒); s.dispose();
   贴图是异步的：好了以后会调用 s.onReady()，调用方补一帧即可。
   暂停时只要不再调 render，画面就停在同一帧。
   WebGL 用不了时 create() 返回 null，调用方退回 2D 纸面。 */
(function () {
  'use strict';

  var T = (typeof window !== 'undefined') ? window.THREE : null;
  var api = { ok: false, reason: '', create: create, warm: warm, moods: { day: {} } };
  if (!T || !T.Water || !T.Sky || !T.Mirror) {
    api.reason = 'no-three';
    if (typeof window !== 'undefined') window.XGSea3D = api;
    return;
  }
  api.ok = true;

  /* ---------- 原站的常量 ---------- */
  var WATER_COLOR = 0x02c7d4;
  var SUN_COLOR = 0xf5ebce;
  var DISTORTION = 15.0;
  var AZIMUTH = 0.45843;
  var INCLINATION = 0.3011;
  var TEX_W = (window.XG_SEA_TEX && window.XG_SEA_TEX.water) || './assets/ambience/sea-visual/water-normals.jpg';
  var TEX_WOOD = (window.XG_SEA_TEX && window.XG_SEA_TEX.wood) || './assets/ambience/sea-visual/wood.jpg';

  function sunPosition() {
    var distance = 4500;
    var theta = Math.PI * (INCLINATION - 0.5);
    var phi = 2 * Math.PI * (AZIMUTH - 0.5);
    return new T.Vector3(
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.sin(phi) * Math.cos(theta)
    );
  }
  /* 原站脚本里的伪随机：同一根木桩每次都在同一个位置 */
  function random(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /* ---------- 两张贴图：只加载一次，所有画布共用 ---------- */
  var tex = { state: 0, water: null, wood: null, waiters: [], api: null };
  function loadTextures(done) {
    if (tex.state === 2) { done(); return; }
    if (tex.state === 3) return;
    tex.waiters.push(done);
    if (tex.state === 1) return;
    tex.state = 1;
    var loader = new T.TextureLoader();
    var left = 2, bad = false;
    function fin(which, t) {
      if (t) {
        t.wrapS = t.wrapT = T.RepeatWrapping;
        if (which === 'water') {
          t.mapping = T.UVMapping;
          tex.water = t;
        } else {
          tex.wood = t;
        }
      } else {
        bad = true;
      }
      if (--left > 0) return;
      tex.state = bad ? 3 : 2;
      var list = tex.waiters;
      tex.waiters = [];
      if (bad) {
        api.ok = false;
        api.reason = 'texture-failed';
        return;
      }
      for (var i = 0; i < list.length; i++) {
        try { list[i](); } catch (e) { }
      }
    }
    loader.load(TEX_W, function (t) { fin('water', t); }, undefined, function () { fin('water', null); });
    loader.load(TEX_WOOD, function (t) { fin('wood', t); }, undefined, function () { fin('wood', null); });
  }
  function warm() { if (api.ok) loadTextures(function () { }); }
  warm();

  /* ---------- 支持性只探一次（软件渲染直接退回 2D 纸面） ---------- */
  var probe = null;
  function supported() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        var r = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
        if (/swiftshader|software|llvmpipe|basic render/i.test(r)) return 'soft-renderer';
      }
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return '';
    } catch (e) { return 'probe-failed'; }
  }

  function create(canvas, opts) {
    opts = opts || {};
    if (!api.ok) return null;
    if (!opts.force) {
      if (probe === null) probe = supported();
      if (probe) { api.reason = probe; return null; }
    }
    var inst = null;
    try { inst = build(canvas, opts); } catch (e) {
      api.reason = 'build-failed:' + (e && e.message ? String(e.message).slice(0, 40) : '');
      return null;
    }
    return inst;
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function build(canvas, opts) {
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, stencil: false });
    renderer.setClearColor(0xdfe9ee, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(55, 1, 0.5, 3000000);
    camera.position.set(0, 15, 0);

    var sky = new T.Sky();
    scene.add(sky.mesh);
    var su = sky.uniforms;
    su.turbidity.value = 0.01;
    su.rayleigh.value = 0.0066;
    su.luminance.value = 0.8;
    su.mieCoefficient.value = 10.1;
    su.mieDirectionalG.value = 0.824;
    var sun = sunPosition();
    su.sunPosition.value.copy(sun);

    var ambient = new T.AmbientLight(SUN_COLOR, 0.25);
    scene.add(ambient);
    var light = new T.DirectionalLight(SUN_COLOR, 0.8);
    light.position.copy(sun);
    light.castShadow = true;
    light.shadow = new T.LightShadow(new T.PerspectiveCamera(40, 0.7, 4000, 4800));
    light.shadow.bias = 0.0000001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    var st = {
      renderer: renderer, scene: scene, camera: camera, sky: sky,
      ready: false, disposed: false, w: 0, h: 0, dpr: 1, cap: opts.dpr || 1.5,
      onReady: null
    };
    var plane = null, water = null, verts = null, pileGeo = [], pileMat = null;

    st.setSize = function (cssW, cssH, cap) {
      if (cap) st.cap = cap;
      var dpr = clamp(window.devicePixelRatio || 1, 0.8, st.cap);
      var w = Math.max(1, Math.round(cssW)), h = Math.max(1, Math.round(cssH));
      if (st.w === w && st.h === h && st.dpr === dpr) return false;
      st.w = w; st.h = h; st.dpr = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!st.ready) {
        try { renderer.clear(); } catch (e) { }
      }
      return true;
    };

    function init() {
      if (st.disposed) return;
      water = new T.Water(renderer, camera, scene, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: tex.water,
        alpha: 1.0,
        sunDirection: sun.clone().normalize(),
        sunColor: SUN_COLOR,
        waterColor: WATER_COLOR,
        distortionScale: DISTORTION
      });
      /* 反射相机保持原站的 55°。画面最底下那一条（原站被页脚盖掉的部分）
         是反射贴图到边后被拉伸的颜色，属于原站渲染本身的一部分；上层用一层
         很短的渐隐把它收掉，和原站用页脚盖住是同一个效果。 */
      if (water.mirrorCamera) {
        water.mirrorCamera.fov = 55;
        water.mirrorCamera.updateProjectionMatrix();
      }
      plane = new T.Mesh(new T.PlaneGeometry(4400, 4400, 120, 120), water.material);
      plane.rotation.x = -Math.PI * 0.5;
      plane.add(water);
      scene.add(plane);
      verts = plane.geometry.vertices;
      st.plane = plane; st.water = water; st.verts = verts; st.piles = [];

      pileMat = new T.MeshPhongMaterial({
        specular: SUN_COLOR, shininess: 23, specularMap: tex.wood,
        shading: T.FlatShading, map: tex.wood
      });
      var n = 90;
      for (var i = n - 1; i >= 0; i--) {
        var g = new T.CylinderGeometry(5, 5, (random(i) + 1) * 50, 4);
        var addU = Math.random();
        var addV = Math.random();
        for (var z = 0; z < g.faces.length; z++) {
          g.faceVertexUvs[0][z][0].x += addU;
          g.faceVertexUvs[0][z][0].y += addV;
          g.faceVertexUvs[0][z][1].x += addU;
          g.faceVertexUvs[0][z][1].y += addV;
          g.faceVertexUvs[0][z][2].x += addU;
          g.faceVertexUvs[0][z][2].y += addV;
        }
        g.uvsNeedUpdate = true;
        var mesh = new T.Mesh(g, pileMat);
        scene.add(mesh);
        mesh.position.y = g.parameters.height / 2 - 5;
        mesh.position.x = (random(i + 214) - 0.5) * 1500;
        mesh.position.z = -random(i * 35) * 1500 - 100;
        mesh.rotation.set(random(i) * Math.PI / 20, 0, 0);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        pileGeo.push(g);
        st.piles.push(mesh);
      }
      st.ready = true;
      if (typeof st.onReady === 'function') {
        try { st.onReady(); } catch (e) { }
      }
    }
    loadTextures(init);

    st.render = function (t) {
      if (st.disposed || !st.ready || st.w < 1 || st.h < 1) return;
      var tt = (Number(t) || 0) * 0.5;
      /* 原站把逐顶点起伏加在"夜里那片"（不显示的那张网）上，白天这张网始终是平的；
         镜头高度跟着那个值上下浮动，就是原站画面里唯一的位置变化。照原样来：
         平面不动，只有镜头在 15 上下轻轻摆。原站振幅 ±4.5，镜头落到 12 以下时
         画面最底边会翻出反射贴图的边——原站用页脚盖住了它，我们铺满整页没有
         页脚可挡，所以把起伏收在 15 ± 1.2，海仍是活的，边不会翻出来。 */
      camera.position.y = 15 + Math.sin(7320 + tt * -1) * 1.2;
      water.material.uniforms.time.value = -t;
      water.render();
      renderer.render(scene, camera);
    };

    /* 原来那片海没有"换天气"也没有拖拽转视角：这几个接口留着，
       只为上层代码不必改动。 */
    st.setMood = function () { return true; };
    st.orbit = function () { };
    st.release = function () { };
    st.pulseAt_ = function () { };
    st.lowerQuality = function () {
      if (st.cap <= 0.85) return false;
      st.cap = st.cap > 1.2 ? 1 : 0.85;
      var w = st.w, h = st.h; st.w = st.h = 0;
      st.setSize(w, h, st.cap);
      return true;
    };
    st.dispose = function () {
      st.disposed = true;
      try {
        if (plane) { plane.geometry.dispose(); scene.remove(plane); }
        if (water && water.material) water.material.dispose();
        for (var i = 0; i < pileGeo.length; i++) pileGeo[i].dispose();
        if (pileMat) pileMat.dispose();
        sky.mesh.geometry.dispose();
        sky.mesh.material.dispose();
        renderer.dispose();
      } catch (e) { }
    };
    return st;
  }

  if (typeof window !== 'undefined') window.XGSea3D = api;
})();
