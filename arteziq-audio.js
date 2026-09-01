/*!
 * ARTEZIQ Audio Module  v1.0
 * Portable game-audio engine: music beds with crossfade, a "sting" that fully ducks
 * the music, pooled sound effects, iOS unlock-on-first-touch, and persisted settings.
 *
 * Drop this file in, include it BEFORE your game script, then call AUDIO.init(...).
 * No dependencies. Plain <script> — no bundler, no modules.
 */
(function (global) {
  "use strict";

  // ---- tiny storage wrapper (Safari private mode throws on localStorage) ----
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };

  function AudioEngine() {
    var DIR = "assets/audio/";
    var PREFIX = "aud_";
    var MUSIC = {};     // key -> filename
    var SFX = {};       // key -> filename
    var unlocked = false, cur = null, curKey = null, sting = null;
    var pool = {}, duckT = null, duckDepth = 0;

    function bool(k, d) { var v = store.get(PREFIX + k); return v === null ? d : v === "1"; }
    function num(k, d) { var v = parseFloat(store.get(PREFIX + k)); return isNaN(v) ? d : Math.max(0, Math.min(1, v)); }

    var musicOn = bool("music", true), sfxOn = bool("sfx", true);
    var musicVol = num("musicvol", 0.55), sfxVol = num("sfxvol", 0.5);

    function mk(file, loop, vol) {
      var a = new Audio(DIR + file);
      a.loop = !!loop; a.volume = vol; a.preload = "auto";
      a.addEventListener("error", function () {}, { once: true });   // missing file = silent no-op
      return a;
    }

    function fade(el, to, ms, done) {
      if (!el) return;
      var from = el.volume, t0 = (global.performance || Date).now();
      (function step(now) {
        now = now || (global.performance || Date).now();
        var p = (now - t0) / ms; if (p > 1) p = 1;
        try { el.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch (e) {}
        if (p < 1) requestAnimationFrame(step); else if (done) done();
      })();
    }

    // ---- music -------------------------------------------------------------
    function playMusic(key) {
      if (!MUSIC[key]) return;
      if (curKey === key && cur && !cur.paused) return;
      curKey = key;
      if (!unlocked || !musicOn) return;          // remembered; starts at unlock()
      var next = mk(MUSIC[key], true, 0), old = cur;
      cur = next;
      next.play().then(function () {
        fade(next, musicVol, 900);
        if (old) fade(old, 0, 700, function () { try { old.pause(); } catch (e) {} });
      }).catch(function () {});
    }
    function stopMusic() { if (cur) fade(cur, 0, 400, function () { try { cur.pause(); } catch (e) {} }); }

    // ---- ducking: take the bed fully out under a sting ----------------------
    function duckDown() {
      if (!cur) return;
      if (!duckDepth) duckDepth = musicVol;
      clearTimeout(duckT); duckT = null;
      fade(cur, 0, 200);
    }
    function duckUp(delay) {
      clearTimeout(duckT);
      duckT = setTimeout(function () {
        duckT = null;
        var back = duckDepth || musicVol; duckDepth = 0;
        if (cur) fade(cur, back, 1100);
      }, delay || 0);
    }

    return {
      /**
       * AUDIO.init({ dir, music:{key:file}, sfx:{key:file}, sting:file, prefix })
       */
      init: function (cfg) {
        cfg = cfg || {};
        if (cfg.dir) DIR = cfg.dir;
        if (cfg.prefix) PREFIX = cfg.prefix;
        MUSIC = cfg.music || {};
        SFX = cfg.sfx || {};
        this._stingFile = cfg.sting || "reveal-sting.mp3";
        musicOn = bool("music", true); sfxOn = bool("sfx", true);
        musicVol = num("musicvol", 0.55); sfxVol = num("sfxvol", 0.5);
        // iOS/Android block audio until a user gesture. Unlock on the first touch anywhere.
        // NOTE: do NOT listen for "keydown" here — in fullscreen Safari shows a
        // "typing in full screen" security prompt if the page listens for keys.
        var self = this;
        ["pointerdown", "touchstart"].forEach(function (ev) {
          document.addEventListener(ev, function once() {
            ["pointerdown", "touchstart"].forEach(function (e2) {
              document.removeEventListener(e2, once, true);
            });
            self.unlock();
          }, true);
        });
        return this;
      },

      unlock: function () {
        if (unlocked) return;
        unlocked = true;
        if (curKey) { var k = curKey; curKey = null; playMusic(k); }   // resume what was asked for
      },

      music: playMusic,
      stop: stopMusic,

      /** Big moment: play the sting and take the music fully out under it. */
      sting: function () {
        if (!unlocked || (!musicOn && !sfxOn)) return;
        try {
          if (!sting) {
            sting = mk(this._stingFile, false, 0.9);
            sting.addEventListener("ended", function () { duckUp(120); });
          }
          sting.volume = Math.max(sfxVol, musicVol, 0.6);
          duckDown();
          sting.currentTime = 0;
          var p = sting.play();
          if (p && p.catch) p.catch(function () { duckUp(0); });
          var dur = (isFinite(sting.duration) && sting.duration > 0) ? sting.duration * 1000 : 5200;
          duckUp(dur + 400);                                  // safety net if 'ended' never fires
        } catch (e) { duckUp(0); }
      },

      /** Dip the music for any other one-off moment. */
      duckFor: function (ms) { duckDown(); duckUp(ms || 1200); },

      /** Short effect. Pooled + pitch-varied so repeats don't grate. Missing file = no-op. */
      sfx: function (name) {
        if (!unlocked || !sfxOn || !SFX[name]) return;
        try {
          var arr = pool[name];
          if (!arr) arr = pool[name] = [mk(SFX[name], false, sfxVol), mk(SFX[name], false, sfxVol), mk(SFX[name], false, sfxVol)];
          var a = arr.find(function (x) { return x.paused || x.ended; }) || arr[0];
          a.volume = sfxVol;
          a.currentTime = 0;
          a.playbackRate = 0.94 + Math.random() * 0.12;
          a.play().catch(function () {});
        } catch (e) {}
      },

      // ---- settings ----------------------------------------------------------
      isMusicOn: function () { return musicOn; },
      isSfxOn: function () { return sfxOn; },
      getMusicVol: function () { return musicVol; },
      getSfxVol: function () { return sfxVol; },
      setMusicVol: function (v) {
        musicVol = Math.max(0, Math.min(1, v)); store.set(PREFIX + "musicvol", String(musicVol));
        if (cur) { try { cur.volume = musicVol; } catch (e) {} }
        if (musicVol > 0 && !musicOn) { musicOn = true; store.set(PREFIX + "music", "1");
          if (curKey) { var k = curKey; curKey = null; playMusic(k); } }
      },
      setSfxVol: function (v) {
        sfxVol = Math.max(0, Math.min(1, v)); store.set(PREFIX + "sfxvol", String(sfxVol));
        if (sfxVol > 0 && !sfxOn) { sfxOn = true; store.set(PREFIX + "sfx", "1"); }
      },
      /** Cycles: both -> music only -> off -> both. Returns {musicOn,sfxOn}. */
      toggle: function () {
        if (musicOn && sfxOn) { sfxOn = false; }
        else if (musicOn && !sfxOn) { musicOn = false; stopMusic(); }
        else { musicOn = true; sfxOn = true; if (curKey) { var k = curKey; curKey = null; playMusic(k); } }
        store.set(PREFIX + "music", musicOn ? "1" : "0");
        store.set(PREFIX + "sfx", sfxOn ? "1" : "0");
        return { musicOn: musicOn, sfxOn: sfxOn };
      },
      /** Pause on tab hide, resume on return. Call once with the key to resume. */
      bindVisibility: function (resumeKeyFn) {
        var self = this;
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) self.stop();
          else { var k = typeof resumeKeyFn === "function" ? resumeKeyFn() : resumeKeyFn; if (k) self.music(k); }
        });
      }
    };
  }

  global.AUDIO = AudioEngine();
})(window);
