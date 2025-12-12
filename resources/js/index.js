// === 全局音乐工具函数（到处可用） ===
window.__musicState = { isPlaying: false };

window.playBgMusic = function () {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  try {
    const p = audio.play(); // 移动端需要用户手势才允许播放
    if (p && typeof p.then === 'function') {
      p.then(() => {
        window.__musicState.isPlaying = true;
        const btn = document.getElementById('music-btn');
        if (btn) btn.setAttribute('src', 'resources/images/musicon.webp');
      }).catch(() => {});
    } else {
      window.__musicState.isPlaying = !audio.paused;
      if (window.__musicState.isPlaying) {
        const btn = document.getElementById('music-btn');
        if (btn) btn.setAttribute('src', 'resources/images/musicon.webp');
      }
    }
  } catch (_) {}
};

window.pauseBgMusic = function () {
  const audio = document.getElementById('bg-music');
  if (!audio) return;
  try { audio.pause(); } catch (_) {}
  window.__musicState.isPlaying = false;
  const btn = document.getElementById('music-btn');
  if (btn) btn.setAttribute('src', 'resources/images/musicoff.webp');
};

// ==========================================================
// === 新增：背景视频源动态切换逻辑 ===
// ==========================================================
/**
 * 动态加载背景视频源：
 * - 屏幕宽度 <= 768px: 使用 data-mobile-src (lulu.mp4)
 * - 屏幕宽度 > 768px: 使用 data-desktop-src (cyrene.mp4)
 */
function setBackgroundVideoSource() {
    const videoElement = document.getElementById('bg-video');
    // 如果找不到视频元素或没有 data 属性，则退出
    if (!videoElement || !videoElement.hasAttribute('data-desktop-src')) return;

    // 假设手机/平板的断点为 768px
    const isMobileOrTablet = window.innerWidth <= 768; 
    
    // 获取 data- 属性中的视频路径
    const desktopSrc = videoElement.getAttribute('data-desktop-src');
    const mobileSrc = videoElement.getAttribute('data-mobile-src');
    
    // 根据设备类型选择视频源
    const newSrc = isMobileOrTablet ? mobileSrc : desktopSrc;

    // 只有在新源和旧源不一致时才更新，避免不必要的加载
    if (videoElement.src.indexOf(newSrc) === -1) {
        // 记录当前的播放时间，以便切换后从相同位置继续播放
        const currentTime = videoElement.currentTime;
        
        // 暂停、更改源
        videoElement.pause();
        videoElement.src = newSrc;
        
        // 重新加载并设置播放时间，然后尝试播放
        videoElement.load();
        videoElement.currentTime = currentTime;

        // 注意：这里不立即调用 .play()，而是留给后面的 tryPlayBgVideo / Intro 逻辑去处理
    }
}

// 首次加载时执行，确保视频源设置完毕
setBackgroundVideoSource();

// 监听窗口大小变化（例如，设备从横屏切换到竖屏）时执行
let resizeTimeout;
window.addEventListener('resize', () => {
    // 使用 debounce 避免频繁触发
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setBackgroundVideoSource, 200);
});

// === 全局：背景视频自动播放 / 兼容微信 / 各类 WebView ===
window.tryPlayBgVideo = function () {
  const v = document.getElementById('bg-video');
  if (!v) return;

  // 确保在尝试播放前视频源已设置
  setBackgroundVideoSource(); 

  // 防止不同浏览器解释不同大小写
  v.muted = true;
  v.playsInline = true;

  // DOM 属性层也再强化一遍，照顾各种内核
  v.setAttribute('muted', 'muted');
  v.setAttribute('playsinline', 'true');
  v.setAttribute('webkit-playsinline', 'true');
  v.setAttribute('x5-playsinline', 'true');

  try {
    const playPromise = v.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // 自动播放被拦截也没关系，后面还有手势兜底
      });
    }
  } catch (_) {}
};


// === 主页面逻辑（倒计时 / 多语言 / 音乐按钮） ===
$(function () {
  let timerId = null;

  const texts = {
    en: {
      title: "Our 28-Year Promise: I Will Be There.",
      subTitle1: "「This time, together with me…」",
      subTitle2: "「Let’s write a new chapter of the story♪」",
      days: "days",
      hours: "hours",
      min: "min",
      sec: "sec",
      countingUp: "♪"
    },
    zh: {
      title: "28年之约 绝不失约",
      subTitle1: "「这次，与我一起……」",
      subTitle2: "「为故事写下新的篇章吧♪」",
      days: "days",
      hours: "hours",
      min: "min",
      sec: "sec",
      countingUp: "♪"
    }
  };

  function getUserLang() {
    const lang = navigator.language || navigator.userLanguage || "";
    return lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  let currentLang = getUserLang();

  function setLangText(lang = currentLang) {
    const t = texts[lang];
    $(".title").text(t.title);
    $(".sub-title").eq(0).text(t.subTitle1);
    $(".sub-title").eq(1).text(t.subTitle2);
    $(".days .text").text(t.days);
    $(".hours .text").text(t.hours);
    $(".min .text").text(t.min);
    $(".sec .text").text(t.sec);
    currentLang = lang;
  }

  // 把字符串按 UTC+8 解析为日期
  function parseAsUTC8(dateTimeStr) {
    const iso = dateTimeStr.replace(" ", "T") + "+08:00";
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;

    const m = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return new Date(NaN);
    const [_, Y, M, D, h, mnt, s] = m.map(Number);
    return new Date(Date.UTC(Y, M - 1, D, h - 8, mnt, s, 0));
  }

  function splitDHMS(ms) {
    ms = Math.max(0, Math.floor(ms));
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    const minMs = 60 * 1000;
    const days = Math.floor(ms / dayMs);
    ms %= dayMs;
    const hours = Math.floor(ms / hourMs);
    ms %= hourMs;
    const minutes = Math.floor(ms / minMs);
    ms %= minMs;
    const seconds = Math.floor(ms / 1000);
    const pad = (n) => (n < 10 ? "0" + n : String(n));
    return { d: pad(days), h: pad(hours), m: pad(minutes), s: pad(seconds) };
  }

  function renderDHMS({ d, h, m, s }) {
    $("p.day").text(d);
    $("p.hour").text(h);
    $("p.min").text(m);
    $("p.sec").text(s);
  }

  function startTicker(targetDateUTC) {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    const setModeVisual = (isCountUp) => {
      const $root = $(".time");
      $root.toggleClass("counting-up", isCountUp);
      const t = texts[currentLang];
      const tipBase = $(".tips").attr("data-tip-base") || $(".tips").text();
      $(".tips").attr("data-tip-base", tipBase);
      if (isCountUp) {
        $(".tips").text(`${tipBase} · ${t.countingUp}`);
      } else {
        $(".tips").text(tipBase);
      }
    };

    const tick = () => {
      const now = new Date();
      const diff = targetDateUTC.getTime() - now.getTime();
      if (diff >= 0) {
        setModeVisual(false);
        renderDHMS(splitDHMS(diff));
      } else {
        setModeVisual(true);
        renderDHMS(splitDHMS(-diff));
      }
    };

    tick();
    timerId = setInterval(tick, 1000);
  }

  // 倒计时目标时间（UTC+8）
  const futureTime = "2052-02-29 00:00:00";
  const targetDate = parseAsUTC8(futureTime);

  setLangText();
  $(".tips").text(`${futureTime} (UTC+8)`);
  startTicker(targetDate);

  // 语言切换按钮
  $("#switch-en").on("click", function () { setLangText("en"); });
  $("#switch-zh").on("click", function () { setLangText("zh"); });

  // 音乐按钮逻辑（使用全局 helper）
  const musicBtn = $("#music-btn");
  if (musicBtn.length) {
    // 初始图标：未播放
    musicBtn.attr("src", "resources/images/musicoff.webp");
    musicBtn.on("click", function () {
      if (window.__musicState.isPlaying) {
        window.pauseBgMusic();
      } else {
        window.playBgMusic();
      }
    });
  }
});


// === Intro 黑屏遮罩逻辑（顶部黑屏，6s 自动消失）===
(function () {
  function run() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    document.body.classList.add('no-scroll');
    let autoTimer = null;

    // 在无手势场景下也尽力播音乐；若被拦截，则等到下一次用户手势再补播
    function ensureMusic() {
      const audio = document.getElementById('bg-music');
      if (!audio) return;

      // 直接尝试；若被浏览器策略拦截，下面挂的手势会兜底
      window.playBgMusic();

      const resumeOnGesture = () => {
        ['click','touchstart','keydown'].forEach(evt =>
          document.removeEventListener(evt, resumeOnGesture)
        );
        window.playBgMusic();
      };
      ['click','touchstart','keydown'].forEach(evt =>
        document.addEventListener(evt, resumeOnGesture, { once: true })
      );
    }

    function dismissIntro(isAuto = false) {
      if (!intro || intro.classList.contains('hidden')) return;

      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }

      if (isAuto) {
        ensureMusic();
      } else {
        // 手动关闭时一定是手势回调里，直接播音乐
        window.playBgMusic();
      }
      
      // *** 确保在播放前设置好视频源 ***
      setBackgroundVideoSource(); 
      // *** END OF CHANGE ***

      // 不论自动还是手动关闭 Intro，都再尝试一次播放背景视频
      window.tryPlayBgVideo();

      intro.classList.add('hidden');
      intro.addEventListener('transitionend', () => {
        intro.remove();
      }, { once: true });

      document.body.classList.remove('no-scroll');
    }

    // 用户手势立即关闭
    ['click','touchstart','keydown'].forEach(evt =>
      intro.addEventListener(evt, () => dismissIntro(false), { once: true })
    );

    // 6 秒后自动关闭
    autoTimer = setTimeout(() => dismissIntro(true), 6000);
  }

  // DOM 就绪后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();

// === 微信内置浏览器专用：桥接事件触发媒体播放 ===
document.addEventListener('WeixinJSBridgeReady', function () {
  // *** 确保在播放前设置好视频源 ***
  setBackgroundVideoSource();
  // *** END OF CHANGE ***

  // 尝试播放背景视频（微信会在这个时机允许播放）
  window.tryPlayBgVideo();

  // 如果想在微信里也自动播音乐，可以取消下面这行注释
  // window.playBgMusic();
}, false);
