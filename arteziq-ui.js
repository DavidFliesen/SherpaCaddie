/*!
 * ARTEZIQ UI Kit  v1.0  —  corner buttons + settings panel + fullscreen
 * Pairs with arteziq-audio.js (optional: works standalone, audio controls just hide).
 * No dependencies. Include after arteziq-audio.js, then call UIKIT.init().
 */
(function (global) {
  "use strict";

  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };

  var PREFIX = "app_";
  var A = (global.AUDIO && typeof global.AUDIO.sfx === "function") ? global.AUDIO : null;
  function sfx(n) { if (A) A.sfx(n); }

  /* ---------------- fullscreen (with iOS fallback) ---------------- */
  function fsSupported() {
    var e = document.documentElement;
    return !!(e.requestFullscreen || e.webkitRequestFullscreen);
  }
  function fsActive() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function enterFS() {
    var e = document.documentElement;
    (e.requestFullscreen || e.webkitRequestFullscreen || function () {}).call(e);
  }
  function exitFS() { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); }

  function toggleFS() {
    // iPhone/iPad Safari has no Fullscreen API for pages -> fall back to an
    // "immersive" body class that hides the app's own chrome instead.
    if (fsSupported()) { fsActive() ? exitFS() : enterFS(); }
    else { document.body.classList.toggle("immersive"); }
    paintFS();
  }
  function fsLockOn() { return store.get(PREFIX + "fslock") === "1"; }
  function applyFSLock() {
    if (!fsLockOn()) return;
    try {
      if (fsSupported()) { if (!fsActive()) enterFS(); }
      else document.body.classList.add("immersive");
      paintFS();
    } catch (e) {}
  }

  /* ---------------- icons ---------------- */
  var IC = {
    expand:   '<svg viewBox="0 0 24 24"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>',
    compress: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/></svg>',
    sndBoth:  '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/></svg>',
    sndMusic: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>',
    sndOff:   '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6"/><path d="M22 9l-5 6"/></svg>',
    gear:     '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9c.24.58.8.97 1.42 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>'
  };

  function el(id) { return document.getElementById(id); }
  function blurActive() {
    try { var a = document.activeElement;
      if (a && a !== document.body && a.blur) a.blur(); } catch (e) {}
  }

  function paintFS() {
    var b = el("uiFsBtn"); if (!b) return;
    var on = fsActive() || document.body.classList.contains("immersive");
    b.innerHTML = on ? IC.compress : IC.expand;
  }
  function paintSnd() {
    var b = el("uiSndBtn"); if (!b || !A) return;
    var m = A.isMusicOn(), s = A.isSfxOn();
    b.innerHTML = m && s ? IC.sndBoth : (m ? IC.sndMusic : IC.sndOff);
    b.classList.toggle("off", !m && !s);
    b.setAttribute("aria-label", m && s ? "Sound on" : (m ? "Music only" : "Sound off"));
  }

  /* ---------------- markup ---------------- */
  function buildButtons() {
    if (el("uiCorner")) return;
    var wrap = document.createElement("div");
    wrap.id = "uiCorner"; wrap.className = "ui-corner";
    wrap.innerHTML =
      '<button class="ui-btn" id="uiFsBtn"  type="button" aria-label="Toggle fullscreen"></button>' +
      (A ? '<button class="ui-btn" id="uiSndBtn" type="button" aria-label="Toggle sound"></button>' : '') +
      '<button class="ui-btn" id="uiSetBtn" type="button" aria-label="Settings">' + IC.gear + '</button>';
    document.body.appendChild(wrap);
  }

  function buildPanel(extraHTML) {
    if (el("uiSettings")) return;
    var d = document.createElement("div");
    d.id = "uiSettings"; d.className = "ui-overlay";
    d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.innerHTML =
      '<div class="ui-card"><div class="ui-panel">' +
        '<div class="ui-eyebrow">Settings</div>' +
        '<h2 class="ui-h2">Sound &amp; Display</h2>' +
        (A ?
        '<div class="ui-row">' +
          '<label for="uiMusicVol">Music level <span class="ui-val" id="uiMusicVolVal">55%</span></label>' +
          '<input type="range" id="uiMusicVol" min="0" max="100" step="5" value="55" tabindex="-1" inputmode="none" />' +
        '</div>' +
        '<div class="ui-row">' +
          '<label for="uiSfxVol">Sound level <span class="ui-val" id="uiSfxVolVal">50%</span></label>' +
          '<input type="range" id="uiSfxVol" min="0" max="100" step="5" value="50" tabindex="-1" inputmode="none" />' +
        '</div>' : '') +
        '<div class="ui-switchrow">' +
          '<div class="ui-txt"><h4>Fullscreen lock</h4><p>Go fullscreen on launch and stay there between levels.</p></div>' +
          '<button class="ui-switch" id="uiFsLock" type="button" role="switch" aria-checked="false" aria-label="Fullscreen lock"></button>' +
        '</div>' +
        (extraHTML || '') +
        '<div class="ui-cta"><button class="ui-done" id="uiSetClose">Done</button></div>' +
      '</div></div>';
    document.body.appendChild(d);
  }

  function paintRange(inp) { if (inp) inp.style.setProperty("--pct", inp.value + "%"); }

  function openSettings() {
    blurActive(); sfx("open");
    if (A) {
      var mv = el("uiMusicVol"), sv = el("uiSfxVol");
      mv.value = Math.round(A.getMusicVol() * 100); el("uiMusicVolVal").textContent = mv.value + "%"; paintRange(mv);
      sv.value = Math.round(A.getSfxVol() * 100);   el("uiSfxVolVal").textContent   = sv.value + "%"; paintRange(sv);
    }
    var lk = el("uiFsLock");
    lk.classList.toggle("on", fsLockOn());
    lk.setAttribute("aria-checked", fsLockOn() ? "true" : "false");
    var p = el("uiSettings");
    document.body.appendChild(p);                     // always paint on top
    p.classList.add("show");
  }
  function closeSettings() { blurActive(); sfx("close"); el("uiSettings").classList.remove("show"); }

  global.UIKIT = {
    /** UIKIT.init({ prefix:"ajig_", extraSettingsHTML:"" }) */
    init: function (cfg) {
      cfg = cfg || {};
      if (cfg.prefix) PREFIX = cfg.prefix;
      A = (global.AUDIO && typeof global.AUDIO.sfx === "function") ? global.AUDIO : null;

      buildButtons();
      buildPanel(cfg.extraSettingsHTML);
      paintFS(); paintSnd();

      el("uiFsBtn").onclick  = function () { blurActive(); sfx("tap"); toggleFS(); };
      el("uiSetBtn").onclick = function () { openSettings(); };
      el("uiSetClose").onclick = function () { closeSettings(); };
      if (A && el("uiSndBtn")) el("uiSndBtn").onclick = function () {
        A.unlock(); A.toggle(); paintSnd(); sfx("tap");
      };

      if (A) {
        var mv = el("uiMusicVol"), sv = el("uiSfxVol");
        mv.addEventListener("input", function () { A.unlock();
          var v = +mv.value; el("uiMusicVolVal").textContent = v + "%"; paintRange(mv);
          A.setMusicVol(v / 100); paintSnd(); });
        sv.addEventListener("input", function () { A.unlock();
          var v = +sv.value; el("uiSfxVolVal").textContent = v + "%"; paintRange(sv);
          A.setSfxVol(v / 100); paintSnd(); });
        sv.addEventListener("change", function () { A.sfx("tap"); blurActive(); });
        mv.addEventListener("change", blurActive);
        [mv, sv].forEach(function (r) {
          r.addEventListener("pointerup", function () { setTimeout(blurActive, 0); });
        });
      }

      var lk = el("uiFsLock");
      lk.onclick = function () {
        var now = !fsLockOn();
        store.set(PREFIX + "fslock", now ? "1" : "0");
        lk.classList.toggle("on", now);
        lk.setAttribute("aria-checked", now ? "true" : "false");
        sfx("tap");
        if (now) applyFSLock();
      };

      ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
        document.addEventListener(ev, function () {
          document.body.classList.toggle("immersive", !!fsActive());
          paintFS();
        });
      });
      return this;
    },
    applyFSLock: applyFSLock,     // call at level start / after leaving a splash
    isFsLockOn: fsLockOn,
    openSettings: openSettings,
    closeSettings: closeSettings,
    refreshSoundIcon: paintSnd,
    blurActive: blurActive
  };
})(window);
