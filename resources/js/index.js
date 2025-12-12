// === 背景视频源动态切换函数 ===
function setBackgroundVideoSource() {
    const videoElement = document.getElementById('bg-video');
    if (!videoElement) return;

    const desktopSrc = videoElement.getAttribute('data-desktop-src');
    const mobileSrc = videoElement.getAttribute('data-mobile-src');
    
    // 判定手机端：宽度小于等于 768px
    const isMobile = window.innerWidth <= 768;
    const targetSrc = isMobile ? mobileSrc : desktopSrc;

    // 只有当 src 发生变化时才重新加载，防止闪烁
    const currentSrc = videoElement.getAttribute('src');
    if (targetSrc && currentSrc !== targetSrc) {
        videoElement.pause();
        videoElement.setAttribute('src', targetSrc);
        videoElement.load();
        videoElement.play().catch(function(e) {
            console.log("自动播放被拦截");
        });
    }
}

// === 全局音乐控制 ===
window.__musicState = { isPlaying: false };

window.playBgMusic = function () {
    const audio = document.getElementById('bg-music');
    if (!audio) return;
    audio.play().then(() => {
        window.__musicState.isPlaying = true;
        $('#music-btn').attr('src', 'resources/images/musicon.webp');
    }).catch(() => {});
};

window.pauseBgMusic = function () {
    const audio = document.getElementById('bg-music');
    if (audio) audio.pause();
    window.__musicState.isPlaying = false;
    $('#music-btn').attr('src', 'resources/images/musicoff.webp');
};

// === 页面逻辑初始化 ===
$(function () {
    // 1. 初始化视频源
    setBackgroundVideoSource();
    $(window).on('resize', function() {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(setBackgroundVideoSource, 250);
    });

    // 2. 倒计时逻辑
    const futureTime = "2052-02-29 00:00:00";
    function updateCountdown() {
        const target = new Date("2052-02-29T00:00:00+08:00").getTime();
        const now = new Date().getTime();
        const diff = Math.abs(target - now);

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        $('.day').text(d < 10 ? '0' + d : d);
        $('.hour').text(h < 10 ? '0' + h : h);
        $('.min').text(m < 10 ? '0' + m : m);
        $('.sec').text(s < 10 ? '0' + s : s);
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // 3. 语言切换 (简易示例)
    $('#switch-en').click(function() { alert('Switching to English'); });
    $('#switch-zh').click(function() { alert('切换至中文'); });

    // 4. 音乐按钮
    $('#music-btn').click(function() {
        if (window.__musicState.isPlaying) window.pauseBgMusic();
        else window.playBgMusic();
    });

    // 5. Intro 遮罩逻辑
    const intro = $('#intro');
    function dismiss() {
        if (intro.hasClass('hidden')) return;
        intro.addClass('hidden');
        window.playBgMusic();
        document.getElementById('bg-video').play().catch(()=>{});
        setTimeout(() => intro.remove(), 800);
    }
    intro.on('click touchstart', dismiss);
    setTimeout(dismiss, 6000);
});
