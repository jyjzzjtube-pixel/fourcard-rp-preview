/* FOURCARD 가맹 안내 — 러너펍 구조 복제판 · 동작 스크립트
   외부 라이브러리 없음. 유료 API 없음. */
(function () {
  'use strict';

  /* 헤더 배경 고정 */
  var hd = document.getElementById('hd');
  var onScroll = function () {
    if (!hd) return;
    hd.classList.toggle('is-solid', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 모바일 메뉴 */
  var burger = document.querySelector('[data-menu]');
  var sheet = document.querySelector('[data-sheet]');
  if (burger && sheet) {
    burger.addEventListener('click', function () {
      var open = sheet.hasAttribute('data-open');
      if (open) {
        sheet.removeAttribute('data-open');
        sheet.hidden = true;
      } else {
        sheet.hidden = false;
        sheet.setAttribute('data-open', '');
      }
      burger.setAttribute('aria-expanded', String(!open));
    });
    sheet.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        sheet.removeAttribute('data-open');
        sheet.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* 개인정보 수집 항목 열기 */
  var pBtn = document.querySelector('[data-privacy]');
  var pBox = document.querySelector('[data-privacy-box]');
  if (pBtn && pBox) {
    pBtn.addEventListener('click', function () {
      pBox.hidden = !pBox.hidden;
    });
  }

  /* 진입 모션 */
  /* 러너펍 실측: 진입 애니메이션은 DIV opacity 0.5s 10개뿐이다(전체 모션 33개 요소·3종).
     내 것은 87개에 걸려 있어 3.6배였다. 러너펍처럼 섹션 제목에만 건다. */
  var targets = document.querySelectorAll('.t1');
  if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('on'); });
  } else {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('on');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* 상담 폼 — 메일 클라이언트로 넘긴다 (서버 없음) */
  function bind(form, statusSel) {
    if (!form) return;
    var status = document.querySelector(statusSel);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      if (d.get('company')) return;                     /* 스팸 방지 허니팟 */
      var name = (d.get('name') || '').toString().trim();
      var phone = (d.get('phone') || '').toString().trim();
      var agreed = form.querySelector('input[name="privacy"]');
      if (!name || !phone) {
        if (status) status.textContent = '성함과 연락처를 입력해 주세요.';
        return;
      }
      if (agreed && !agreed.checked) {
        if (status) status.textContent = '개인정보 수집·이용 동의가 필요합니다.';
        return;
      }
      var lines = [
        'FOURCARD 가맹 상담 신청',
        '성함: ' + name,
        '연락처: ' + phone
      ];
      if (d.get('region')) lines.push('희망 지역: ' + d.get('region'));
      if (d.get('message')) lines.push('문의 내용: ' + d.get('message'));
      var href = 'mailto:fourcard@naver.com'
        + '?subject=' + encodeURIComponent('[가맹 상담] ' + name + ' ' + phone)
        + '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = href;
      if (status) status.textContent = '메일 앱이 열리지 않으면 010-9954-8399로 전화 주세요.';
    });
  }
  bind(document.getElementById('inq'), '.dock-s');

  /* FAQ 페이지네이션 — 러너펍은 FAQ 를 3페이지로 나눈다 (rd_16) */
  (function () {
    var box = document.querySelector('[data-faq]');
    var pg = document.querySelector('[data-faqpg]');
    if (!box || !pg) return;
    var items = [].slice.call(box.querySelectorAll('details'));
    var per = 4;   /* 러너펍은 페이지당 8행. 항목이 8개라 4행 2페이지로 둔다(장치 유지) */
    var pages = Math.max(1, Math.ceil(items.length / per));
    var cur = 1;
    function draw() {
      items.forEach(function (el, i) {
        var on = Math.floor(i / per) + 1 === cur;
        el.hidden = !on;
        if (!on) el.open = false;
      });
      [].forEach.call(pg.querySelectorAll('button'), function (b) {
        var v = b.getAttribute('data-pg');
        if (v === 'prev' || v === 'next') {
          b.disabled = (v === 'prev' && cur === 1) || (v === 'next' && cur === pages);
          b.style.opacity = b.disabled ? '.35' : '1';
        } else {
          b.hidden = Number(v) > pages;
          b.classList.toggle('on', Number(v) === cur);
        }
      });
    }
    pg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-pg');
      if (v === 'prev') cur = Math.max(1, cur - 1);
      else if (v === 'next') cur = Math.min(pages, cur + 1);
      else cur = Number(v);
      draw();
    });
    draw();
  })();

  /* 관측1 · 가로 트랙 좌우 버튼 */
  (function () {
    var tr = document.querySelector('.poster[data-track]');
    if (!tr) return;
    var btns = [].slice.call(document.querySelectorAll('[data-pnav]'));
    function step() { var f = tr.querySelector('figure'); return f ? f.getBoundingClientRect().width + 20 : 340; }
    function sync() {
      var max = tr.scrollWidth - tr.clientWidth;
      btns.forEach(function (b) {
        var d = Number(b.getAttribute('data-pnav'));
        b.disabled = (d < 0 && tr.scrollLeft <= 82) || (d > 0 && tr.scrollLeft >= max - 2);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        tr.scrollBy({ left: Number(b.getAttribute('data-pnav')) * step(), behavior: 'smooth' });
      });
    });
    tr.addEventListener('scroll', sync, { passive: true });
    setTimeout(sync, 300);
  })();

  /* 관측2 · 모바일 메뉴가 바깥 클릭·ESC 로 닫히지 않았다 */
  (function () {
    var sheet = document.querySelector('[data-sheet]');
    var burger = document.querySelector('[data-menu]');
    if (!sheet || !burger) return;
    function close() {
      if (!sheet.hasAttribute('data-open')) return;
      sheet.removeAttribute('data-open'); sheet.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
    }
    document.addEventListener('click', function (e) {
      if (!sheet.hasAttribute('data-open')) return;
      if (sheet.contains(e.target) || burger.contains(e.target)) return;
      close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* 관측4 · FAQ 가 여러 개 동시에 열렸다 — 아코디언 표준대로 한 번에 하나만 */
  (function () {
    var list = [].slice.call(document.querySelectorAll('.faq details'));
    list.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        list.forEach(function (o) { if (o !== d && o.open) o.open = false; });
      });
    });
  })();

  /* 캐러셀 활성(2번째) 카드를 컨테이너 중앙에 정착시킨다 — 러너펍은 활성카드가 정중앙이다 */
  (function () {
    var tr = document.querySelector('.poster[data-track]');
    if (!tr || window.innerWidth < 1200) return;
    var figs = tr.querySelectorAll('figure');
    if (figs.length < 2) return;
    function center() {
      var a = figs[1];
      var want = a.offsetLeft + a.offsetWidth / 2 - tr.clientWidth / 2;
      tr.scrollLeft = Math.max(0, want);
    }
    setTimeout(center, 500);
  })();

  /* ⚠ 폐기 — 배지를 숨겼더니 22프레임 중 8장에서 사라져 러너펍(21/21 상시)과 어긋났다.
     숨기는 대신 CSS 에서 배지를 본문 뒤로 보내(z-index) 금액을 보호한다. */


  /* E-3 · 금액이 배지에 걸리는 구간에서만 배지를 옅게 물린다(숨기지 않는다).
     '뒤로 보내기'는 카드 사이 틈으로 흰 슬래브를 만들어 폐기했다. */
  (function () {
    var card = document.querySelector('.fixcard');
    if (!card) return;
    /* 전 구간 대조에서 배지가 개설 절차 04 카드 텍스트를 덮는 것을 확인했다.
       카드가 촘촘해 배지와 겹치는 구간을 함께 넣는다. */
    var zones = ['#cost', '#sales', '#process', '#supply'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    if (!zones.length) return;
    function sync() {
      var vh = window.innerHeight;
      var hit = zones.some(function (z) {
        var b = z.getBoundingClientRect();
        return b.top < vh * 0.8 && b.bottom > vh * 0.2;
      });
      card.classList.toggle('is-hide', hit);
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  })();

  /* 캐러셀 활성(확대) 카드를 스크롤 위치에 따라 갱신한다.
     전에는 CSS 가 2번째 카드를 영구 확대해서, 화살표로 넘겨도 확대 카드가 그대로였고
     1280px 에서 그 카드가 좌측 60px 잘린 채 남았다(중앙엔 일반 카드). */
  (function () {
    var tr = document.querySelector('.poster[data-track]');
    if (!tr) return;
    var figs = [].slice.call(tr.querySelectorAll('figure'));
    if (figs.length < 2) return;
    var raf = 0;
    function sync() {
      var mid = tr.scrollLeft + tr.clientWidth / 2, best = null, bd = Infinity;
      figs.forEach(function (f) {
        var d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid);
        if (d < bd) { bd = d; best = f; }
      });
      figs.forEach(function (f) { f.classList.toggle('is-active', f === best); });
    }
    tr.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; sync(); });
    }, { passive: true });
    window.addEventListener('resize', sync);
    figs[1].classList.add('is-active');   /* 초기값 — 로드 직후 중앙에 놓이는 카드 */
    setTimeout(sync, 700);
  })();
})();
