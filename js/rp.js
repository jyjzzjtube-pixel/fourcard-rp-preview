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
  var targets = document.querySelectorAll('.t1, .t2, .ic, .cc, .sc, .rbox, .rg, .sup-c, .sup-img, .pnl, .poster figure, .g5 li, .steps li, .apps li, .faq');
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
    var per = 3;
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
})();
