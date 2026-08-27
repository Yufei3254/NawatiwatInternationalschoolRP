/* ===========================================================
   Campus map loader — fetches the three.js vendor files (and
   campus.js itself) manually first, with real download-progress
   tracking, then hands off to the actual ES-module scene script.

   Why this exists: a <script type="module"> only starts running
   AFTER its entire dependency graph has downloaded, so there is
   no hook to show "x% loaded" during that wait — the spinner
   would otherwise just sit there with no feedback. This file
   downloads the same bytes itself first (tracking progress as it
   goes), which also warms the browser's HTTP cache, so the
   module loader's own fetch of the same URLs a moment later is
   effectively instant.
   =========================================================== */
(function () {
  var VENDOR_FILES = [
    'vendor/three.module.min.js',
    'vendor/OrbitControls.js',
    'vendor/CSS2DRenderer.js',
    'campus.js'
  ];

  var loadingText = document.getElementById('loading-text');
  var loadingHint = document.getElementById('loading-hint');

  function setPercent(p) {
    if (loadingText) {
      loadingText.textContent = 'กำลังโหลดไฟล์แผนที่ 3 มิติ… ' + Math.max(0, Math.min(100, Math.round(p))) + '%';
    }
  }

  function bootModule() {
    var mod = document.createElement('script');
    mod.type = 'module';
    mod.src = 'campus.js';
    mod.onerror = function () {
      if (loadingHint) {
        loadingHint.classList.add('show');
        loadingHint.innerHTML = 'โหลด campus.js ไม่สำเร็จ (404 หรือไฟล์เสีย) — ลองเช็คว่าอัปโหลดไฟล์ครบและ path ถูกต้องหรือไม่';
      }
      if (loadingText) loadingText.textContent = 'โหลดแผนที่ 3 มิติไม่สำเร็จ';
    };
    var target = document.body || document.head;
    if (target) {
      target.appendChild(mod);
    } else {
      // If this script runs before <body> exists, wait for DOMContentLoaded.
      window.addEventListener('DOMContentLoaded', function () {
        (document.body || document.head).appendChild(mod);
      }, { once: true });
    }

    // Watchdog: campus.js is expected to hide #loading-overlay once
    // the scene is built. If that hasn't happened a few seconds
    // after the module was handed off, something failed silently
    // (e.g. a runtime error inside campus.js) — surface a message
    // instead of leaving the spinner stuck forever with no clue.
    setTimeout(function () {
      var overlay = document.getElementById('loading-overlay');
      if (overlay && !overlay.classList.contains('hide')) {
        if (loadingText) loadingText.textContent = 'การโหลดค้างอยู่นานผิดปกติ';
        if (loadingHint) {
          loadingHint.classList.add('show');
          loadingHint.innerHTML = 'ไฟล์โหลดครบแล้วแต่ฉาก 3 มิติยังไม่ขึ้น — ลองเปิด Console (F12) ดู error สีแดง แล้วส่งข้อความนั้นมาให้เช็คได้';
        }
      }
    }, 6000);
  }

  // Old-browser fallback: skip straight to a normal (no-progress)
  // module load rather than risk breaking the map. (Deliberately
  // NOT checking Response.prototype.body here — accessing that
  // getter on the bare prototype, rather than a real Response
  // instance, throws "Illegal invocation" in some engines.)
  if (!window.fetch || !window.ReadableStream) {
    bootModule();
    return;
  }

  var sizes = new Array(VENDOR_FILES.length).fill(1);
  var loadedBytes = new Array(VENDOR_FILES.length).fill(0);
  var slowLoadTimer = setTimeout(function () {
    if (loadingHint) {
      loadingHint.classList.add('show');
      loadingHint.innerHTML = 'เน็ตช้ากว่าปกติ กำลังดาวน์โหลดไฟล์ 3 มิติ (~700KB) อยู่ — รอสักครู่';
    }
  }, 4000);

  function updateOverall() {
    var sumSize = sizes.reduce(function (a, b) { return a + b; }, 0);
    var sumLoaded = loadedBytes.reduce(function (a, b) { return a + b; }, 0);
    setPercent((sumLoaded / sumSize) * 100);
  }

  function fetchWithProgress(url, idx) {
    return fetch(url, { cache: 'force-cache' }).then(function (res) {
      if (!res.ok || !res.body) {
        return res.arrayBuffer().then(function (buf) {
          sizes[idx] = buf.byteLength || 1;
          loadedBytes[idx] = sizes[idx];
          updateOverall();
        });
      }
      var contentLength = parseInt(res.headers.get('content-length') || '0', 10);
      sizes[idx] = contentLength || sizes[idx];
      var reader = res.body.getReader();
      function pump() {
        return reader.read().then(function (result) {
          if (result.done) {
            loadedBytes[idx] = sizes[idx];
            updateOverall();
            return;
          }
          loadedBytes[idx] += result.value.length;
          updateOverall();
          return pump();
        });
      }
      return pump();
    }).catch(function () {
      // A failed prefetch here isn't fatal — the real module load
      // right after will surface a proper error if a file is
      // genuinely missing/broken. We just stop tracking its bytes.
      loadedBytes[idx] = sizes[idx];
      updateOverall();
    });
  }

  var fetches = VENDOR_FILES.map(fetchWithProgress);

  Promise.all(fetches).then(function () {
    clearTimeout(slowLoadTimer);
    setPercent(100);
    bootModule();
  });
})();
