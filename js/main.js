(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-button");
  const mobileMenu = document.querySelector("#mobile-menu");
  const hero = document.querySelector(".hero");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 아이콘은 인라인 SVG다 (외부 CDN 의존 없음 = 오프라인·CDN 장애에도 표시된다)
  const ICON_SVG = (paths) =>
    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' + paths + '</svg>';
  const ICON_MENU = ICON_SVG('<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>');
  const ICON_CLOSE = ICON_SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

  // 메뉴가 열린 동안 배경을 보조기기·탭 이동에서 제외할 대상
  const backgroundRegions = () => [
    document.querySelector("#main"),
    document.querySelector(".site-footer"),
    document.querySelector(".mobile-actions"),  // 메뉴 뒤에 가려지지만 탭으로 닿던 전화·문의 링크
    document.querySelector(".sticky-cta"),      // JS로 나중에 생기므로 매번 다시 찾는다
  ].filter(Boolean);

  const setMenu = (open) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    mobileMenu.hidden = !open;
    header?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menuButton.innerHTML = open ? ICON_CLOSE : ICON_MENU;

    // 열린 동안 배경으로 포커스가 빠져나가면 키보드 사용자가 위치를 잃는다
    backgroundRegions().forEach((region) => {
      region.inert = open;
      if (open) region.setAttribute("aria-hidden", "true");
      else region.removeAttribute("aria-hidden");
    });

    if (open) mobileMenu.querySelector("a")?.focus();
    else menuButton.focus();
  };

  // Escape로 닫고 포커스를 메뉴 버튼으로 되돌린다
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuButton?.getAttribute("aria-expanded") !== "true") return;
    event.preventDefault();
    setMenu(false);
  });

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  window.addEventListener("resize", () => {
    // 실제로 열려 있을 때만 닫는다. 닫힌 상태에서 setMenu(false)를 부르면 포커스를 메뉴 버튼으로 빼앗는다.
    if (window.innerWidth > 900 && menuButton.getAttribute("aria-expanded") === "true") setMenu(false);
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 28);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const heroImage = hero?.querySelector("img");
  const showHero = () => hero?.classList.add("is-ready");
  if (heroImage?.complete) {
    window.requestAnimationFrame(showHero);
  } else {
    heroImage?.addEventListener("load", showHero, { once: true });
  }

  // 같은 묶음은 순서대로 흘러들어오게 인덱스를 심는다 (CSS가 --i로 지연을 계산)
  const staggerGroups = [
    ".region-grid", ".system-list", ".principle-items",
    ".branch-track", ".trust-strip", ".rp-faq-list", ".space-mosaic",
  ];
  staggerGroups.forEach((sel) => {
    const group = document.querySelectorAll(sel);
    group.forEach((el) => {
      el.setAttribute("data-stagger", "");
      [...el.children].forEach((child, i) => {
        child.style.setProperty("--i", String(i));
        if (!child.classList.contains("image-reveal")) child.classList.add("reveal");
      });
    });
  });

  const observedItems = document.querySelectorAll(".reveal, .image-reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    observedItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    observedItems.forEach((item) => revealObserver.observe(item));
  }

  // 운영 매장 28개 같은 실적 수치는 0에서 올라가야 눈에 들어온다
  const countUp = (el) => {
    const target = parseInt(el.dataset.count || el.textContent, 10);
    if (!Number.isFinite(target)) return;
    if (reducedMotion) { el.textContent = String(target); return; }
    const duration = 1100;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = "0";
    requestAnimationFrame(step);
  };
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      counters.forEach((el) => { el.textContent = el.dataset.count; });
    } else {
      const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((el) => countObserver.observe(el));
    }
  }

  // 운영 시스템 4단계 진행선 — 스크롤 위치에 따라 채워진다
  const systemList = document.querySelector(".system-list");
  if (systemList && !reducedMotion) {
    let queued = false;
    const updateProgress = () => {
      queued = false;
      const rect = systemList.getBoundingClientRect();
      const span = rect.height + window.innerHeight * 0.5;
      const passed = window.innerHeight * 0.75 - rect.top;
      const p = Math.max(0, Math.min(1, passed / span));
      systemList.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(updateProgress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateProgress();
  }


  // ── 히어로 고정 상담바 (러너펍 패턴 복제) ──
  // 2필드만 받아 진입 장벽을 낮춘다. 상세는 하단 정식 폼에서 이어받는다.
  const quickForm = document.querySelector("#quick-form");
  if (quickForm) {
    const qStatus = document.querySelector(".quick-status");
    quickForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(quickForm);
      const name = String(data.get("qname") || "").trim();
      const phone = String(data.get("qphone") || "").trim();
      const agreed = quickForm.querySelector('input[name="qconsent"]').checked;
      if (!name || !phone) {
        if (qStatus) qStatus.textContent = "성함과 연락처를 입력해 주세요.";
        return;
      }
      if (!agreed) {
        if (qStatus) qStatus.textContent = "개인정보 수집·이용 동의가 필요합니다.";
        return;
      }
      const btn = quickForm.querySelector(".quick-submit");
      if (btn) btn.disabled = true;
      if (qStatus) qStatus.textContent = "상담 신청을 접수하고 있습니다.";
      try {
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, region: "", message: "히어로 빠른 상담", privacy: true, source: "hero-quick" }),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok && result.ok) {
          quickForm.reset();
          if (qStatus) qStatus.textContent = `상담 신청이 접수되었습니다. 접수번호 ${result.receipt}`;
          return;
        }
        throw new Error("fallback");
      } catch {
        // 저장소가 아직 연결되지 않아도 신청이 유실되지 않게 정식 폼으로 값을 넘긴다
        const main = document.querySelector("#inquiry-form") || document.querySelector("form:not(#quick-form)");
        if (main) {
          const n = main.querySelector('[name="name"]');
          const t = main.querySelector('[name="phone"]');
          if (n) n.value = name;
          if (t) t.value = phone;
        }
        if (qStatus) qStatus.textContent = "아래 상담 폼으로 옮겼습니다. 희망 지역만 확인하고 신청해 주세요.";
        document.querySelector("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }


  // ══════════════════════════════════════════════════
  // 전면 업그레이드 (2026-08-14) — 효과·스마트 기능
  // ══════════════════════════════════════════════════

  // ── 1. 상단 스크롤 진행 바 ──
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.innerHTML = "<i></i>";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);
  const progressBar = progress.firstElementChild;

  // ── 2. 내비 활성 밑줄 — 현재 섹션을 따라 미끄러진다 ──
  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  const navEl = document.querySelector(".desktop-nav");
  const navTargets = navLinks
    .map((a) => ({ a, sec: document.querySelector(a.getAttribute("href")) }))
    .filter((x) => x.sec);

  const moveNavUnderline = (link) => {
    if (!navEl || !link) return;
    navEl.style.setProperty("--nx", link.offsetLeft + "px");
    navEl.style.setProperty("--nw", link.offsetWidth + "px");
    navEl.style.setProperty("--no", "1");
  };

  // ── 3. 하단 미니 CTA — 히어로를 지나면 올라온다 ──
  const stickyCta = document.createElement("div");
  stickyCta.className = "sticky-cta";
  stickyCta.innerHTML =
    '<p>전국 8개 지역 <b>29개 매장</b> · 창업비용 공개</p>' +
    '<a class="cta-call" href="tel:01099548399">전화 상담</a>' +
    '<a class="cta-main" href="#contact">가맹 상담 신청</a>';
  document.body.appendChild(stickyCta);

  const heroSec = document.querySelector(".hero");
  const heroBar = document.querySelector(".hero-inquiry");

  // rAF 안에서만 플래그를 내리면, 탭이 백그라운드라 rAF가 멈출 때
  // 플래그가 true로 굳어 이후 스크롤이 전부 무시된다. 시각 기준 throttle 로 바꾼다.
  let lastRun = 0;
  const runUpgrade = () => {
    {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? Math.min(100, (scrollY / max) * 100) : 0;
      if (progressBar) progressBar.style.setProperty("--sp", pct.toFixed(2) + "%");

      // 히어로를 지났는지
      const passedHero = heroSec ? scrollY > heroSec.offsetHeight - 120 : scrollY > 600;
      stickyCta.classList.toggle("is-on", passedHero);
      if (heroBar) heroBar.style.opacity = passedHero ? "0" : "1";

      // 내비 활성 항목
      let current = null;
      navTargets.forEach(({ a, sec }) => {
        const top = sec.getBoundingClientRect().top;
        if (top <= 160) current = a;
      });
      navLinks.forEach((a) => a.classList.remove("is-current"));
      if (current) {
        current.classList.add("is-current");
        moveNavUnderline(current);
      } else if (navEl) {
        navEl.style.setProperty("--no", "0");
      }
    }
  };
  const onScrollUpgrade = () => {
    const now = Date.now();
    if (now - lastRun < 60) return;
    lastRun = now;
    runUpgrade();
  };
  window.addEventListener("scroll", onScrollUpgrade, { passive: true });
  window.addEventListener("resize", onScrollUpgrade, { passive: true });
  runUpgrade();

  // 이중화 — scroll 이벤트가 지연·누락되는 환경에서도 핵심 CTA 는 살아 있어야 한다.
  // 히어로 하단에 감시점을 두고 교차 여부로 직접 판단한다.
  if (heroSec && "IntersectionObserver" in window) {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;bottom:0;left:0;width:1px;height:1px;pointer-events:none;";
    sentinel.setAttribute("aria-hidden", "true");
    heroSec.appendChild(sentinel);
    new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const passed = !en.isIntersecting && en.boundingClientRect.top < 0;
          stickyCta.classList.toggle("is-on", passed);
          if (heroBar) heroBar.style.opacity = passed ? "0" : "1";
        });
      },
      { threshold: 0 }
    ).observe(sentinel);
  }

  // ── 4. 매장 캐러셀 — 자동 슬라이드 + 인디케이터 ──
  const track = document.querySelector(".branch-track");
  if (track) {
    const cards = [...track.children];
    const dots = document.createElement("div");
    dots.className = "branch-dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", "매장 사진 위치");
    const pages = Math.max(1, Math.ceil(cards.length / 3));
    for (let i = 0; i < pages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", i + 1 + "번째 묶음 보기");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      if (i === 0) b.classList.add("is-on");
      b.addEventListener("click", () => {
        const step = track.scrollWidth / pages;
        track.scrollTo({ left: step * i, behavior: reducedMotion ? "auto" : "smooth" });
        pauseAuto();
      });
      dots.appendChild(b);
    }
    track.parentElement.appendChild(dots);
    const dotEls = [...dots.children];

    const syncDots = () => {
      const step = track.scrollWidth / pages;
      const idx = Math.min(pages - 1, Math.round(track.scrollLeft / step));
      dotEls.forEach((d, i) => {
        d.classList.toggle("is-on", i === idx);
        d.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
    };
    track.addEventListener("scroll", () => {
      if (track.__t) clearTimeout(track.__t);
      track.__t = setTimeout(syncDots, 90);
    }, { passive: true });

    // 자동 재생 — 화면에 보일 때만, 사용자가 만지면 멈춘다
    let autoTimer = null;
    let paused = false;
    const advance = () => {
      if (paused || reducedMotion) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      const step = Math.max(320, track.clientWidth * 0.72);
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: "smooth" });
    };
    const startAuto = () => { if (!autoTimer && !reducedMotion) autoTimer = setInterval(advance, 4200); };
    const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
    let resumeTimer = null;
    function pauseAuto() {
      paused = true; stopAuto();
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; resumeTimer = null; startAuto(); }, 9000);
    }

    ["pointerdown", "wheel", "touchstart", "keydown"].forEach((ev) =>
      track.addEventListener(ev, pauseAuto, { passive: true })
    );
    // 읽는 중에 움직이지 않게 한다. 포커스나 마우스가 안에 있는 동안은 멈춘 상태를 유지한다.
    const holdAuto = () => { paused = true; stopAuto(); if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; } };
    const releaseAuto = () => { if (track.matches(":hover") || track.contains(document.activeElement)) return; pauseAuto(); };
    track.addEventListener("focusin", holdAuto);
    track.addEventListener("mouseenter", holdAuto);
    track.addEventListener("focusout", releaseAuto);
    track.addEventListener("mouseleave", releaseAuto);
    track.addEventListener("mouseenter", stopAuto);
    track.addEventListener("mouseleave", () => { if (!paused) startAuto(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => (e.isIntersecting ? startAuto() : stopAuto()));
      }, { threshold: 0.25 }).observe(track);
    } else startAuto();
  }

  // ── 5. 버튼 리플 — 누른 자리에서 퍼진다 ──
  if (!reducedMotion) {
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".button, .quick-submit, .track-controls button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const dot = document.createElement("span");
      dot.className = "ripple-dot";
      dot.style.left = e.clientX - r.left + "px";
      dot.style.top = e.clientY - r.top + "px";
      btn.appendChild(dot);
      setTimeout(() => dot.remove(), 650);
    });
  }

  // ── 6. 스마트 입력 — 전화번호 자동 하이픈 ──
  const formatPhone = (v) => {
    const d = v.replace(/[^0-9]/g, "").slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  };
  document.querySelectorAll('input[type="tel"], input[name="phone"], input[name="qphone"]').forEach((el) => {
    el.addEventListener("input", () => {
      const before = el.value;
      const after = formatPhone(before);
      if (before !== after) el.value = after;
    });
  });

  // ── 7. 팝인 — 보이는 순간 튀어 들어온다 ──
  if (!reducedMotion && "IntersectionObserver" in window) {
    const popObs = new IntersectionObserver((es, o) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("pop-in");
        o.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".region-group h3 em, .trust-strip dd strong, .site-flow li span").forEach((el) => popObs.observe(el));
  }

  const branchTrack = document.querySelector("[data-branch-track]");
  const moveTrack = (direction) => {
    if (!branchTrack) return;
    const distance = Math.max(320, branchTrack.clientWidth * 0.72);
    branchTrack.scrollBy({ left: distance * direction, behavior: reducedMotion ? "auto" : "smooth" });
  };

  document.querySelector("[data-track-prev]")?.addEventListener("click", () => moveTrack(-1));
  document.querySelector("[data-track-next]")?.addEventListener("click", () => moveTrack(1));
  branchTrack?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTrack(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTrack(1);
    }
  });

  const inquiryForm = document.querySelector("#inquiry-form");
  const formStatus = inquiryForm?.querySelector(".form-status");
  const submitButton = inquiryForm?.querySelector(".form-submit");

  // 개인정보 수집 항목 펼치기 (동의 체크박스와 별개로 내용을 확인할 수 있게)
  const privacyToggle = document.querySelector("[data-privacy-open]");
  const privacyDetail = document.querySelector("#privacy-detail");
  privacyToggle?.addEventListener("click", () => {
    const open = privacyDetail.hidden;
    privacyDetail.hidden = !open;
    privacyToggle.textContent = open ? "접기" : "수집 항목 보기";
    privacyToggle.setAttribute("aria-expanded", String(open));
  });
  privacyToggle?.setAttribute("aria-controls", "privacy-detail");
  privacyToggle?.setAttribute("aria-expanded", "false");

  inquiryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus?.classList.remove("is-error", "is-ready");

    if (!inquiryForm.checkValidity()) {
      inquiryForm.reportValidity();
      if (formStatus) {
        formStatus.textContent = "필수 항목과 개인정보 동의를 확인해 주세요.";
        formStatus.classList.add("is-error");
      }
      return;
    }

    const data = new FormData(inquiryForm);

    // 스팸 봇 차단. 화면에 안 보이는 함정 칸이라 사람은 채울 수 없다.
    // 채워져 있으면 봇이므로 서버로 보내지 않고, 봇에게는 성공한 것처럼 보이게 해 재시도를 막는다.
    if (String(data.get("company") || "").trim()) {
      if (formStatus) {
        formStatus.textContent = "상담 신청이 접수되었습니다.";
        formStatus.classList.add("is-ready", "is-done");
      }
      inquiryForm.reset();
      return;
    }

    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const region = String(data.get("region") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = `[FOURCARD 가맹 상담] ${name} / ${region || "지역 미정"}`;
    const body = [
      "FOURCARD 가맹 상담을 요청합니다.",
      "",
      `성함: ${name}`,
      `연락처: ${phone}`,
      `희망 지역: ${region || "미정"}`,
      "",
      "문의 내용:",
      message || "별도 기재 없음",
    ].join("\n");

    const fallback = document.querySelector("#inquiry-fallback");
    const fallbackText = document.querySelector("#inquiry-fallback-text");

    // 저장이 안 되는 상황에서도 신청이 유실되지 않도록 복사·전화 경로를 항상 준비해 둔다.
    // 메일 앱을 자동으로 띄우지 않는다 — 상담 신청 화면에서 갑자기 메일 창이 뜨면 그대로 이탈한다.
    const openFallback = (reason) => {
      if (fallbackText) fallbackText.value = `${subject}\n\n${body}`;
      // 복사를 시키지 않는다. 문자 앱에 본문을 실어 원탭 전송으로 연결한다
      const smsLink = document.querySelector("#inquiry-sms");
      if (smsLink) {
        const smsBody = encodeURIComponent(`[가맹 상담 신청]\n${body}`);
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        smsLink.href = `sms:01099548399${isiOS ? "&" : "?"}body=${smsBody}`;
      }
      if (fallback) {
        fallback.hidden = false;
        fallback.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      }
      if (formStatus) {
        formStatus.textContent = reason;
        formStatus.classList.add("is-ready");
      }
    };

    if (formStatus) {
      formStatus.textContent = "상담 신청을 접수하고 있습니다.";
      formStatus.classList.add("is-ready");
    }
    if (submitButton) submitButton.disabled = true;

    // 1순위: 서버에 저장해 담당자가 관리 화면에서 볼 수 있게 한다
    try {
      // 서버가 응답하지 않을 때 사용자가 무한정 기다리지 않도록 12초에서 끊고 문자·전화 안내로 넘긴다
      const ac = new AbortController();
      const abortTimer = setTimeout(() => ac.abort(), 12000);
      const response = await fetch("/api/inquiry", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          region,
          message,
          privacy: true,
          source: "homepage",
        }),
      });
      clearTimeout(abortTimer);
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        inquiryForm.reset();
        if (fallback) fallback.hidden = true;
        if (formStatus) {
          formStatus.textContent = `상담 신청이 접수되었습니다. 접수번호 ${result.receipt} · 담당자가 순서대로 연락드립니다.`;
          formStatus.classList.add("is-ready", "is-done");
          // 모바일에서 접수 안내가 하단 고정바에 가리던 문제 — 안내를 화면 가운데로 올린다
          formStatus.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      openFallback("작성하신 신청 내용을 아래에 준비했습니다. 복사해서 문자·카카오톡으로 보내주시거나 전화 주시면 바로 접수됩니다.");
    } catch {
      openFallback("연결이 원활하지 않습니다. 아래 신청 내용을 복사해 문자·카카오톡으로 보내주시거나 전화 주시면 바로 접수됩니다.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  document.querySelector("[data-copy-inquiry]")?.addEventListener("click", async () => {
    const el = document.querySelector("#inquiry-fallback-text");
    if (!el || !el.value) return;
    let copied = false;
    try {
      await navigator.clipboard.writeText(el.value);
      copied = true;
    } catch (error) {
      el.removeAttribute("readonly");
      el.select();
      copied = document.execCommand("copy");
      el.setAttribute("readonly", "");
      // 복사에 실패하면 선택을 풀지 않는다. 사용자가 바로 단축키로 복사할 수 있어야 문의가 유실되지 않는다.
      if (copied) window.getSelection()?.removeAllRanges();
    }
    if (!copied) {
      el.removeAttribute("readonly");
      el.focus();
      el.select();
      el.setAttribute("readonly", "");
    }
    const copyKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘＋C" : "Ctrl＋C";
    if (formStatus) {
      formStatus.textContent = copied
        ? "상담 내용을 복사했습니다. 문자나 카카오톡으로 보내주세요."
        : `내용을 선택해 두었습니다. ${copyKey} 를 눌러 복사한 뒤 문자나 카카오톡으로 보내주세요.`;
      formStatus.classList.remove("is-error");
      formStatus.classList.add(copied ? "is-ready" : "is-error");
    }
  });

  document.querySelectorAll(".rp-faq-list details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      document.querySelectorAll(".rp-faq-list details[open]").forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });

  const initCropStudio = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("crop") !== "1") return;

    const frames = [...document.querySelectorAll("[data-crop-id]")];
    if (!frames.length) return;

    const storageKey = "fourcard.crop.v2";
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      saved = {};
    }

    const parseValue = (value, fallback) => {
      const number = Number.parseFloat(value);
      return Number.isFinite(number) ? number : fallback;
    };

    const readValues = (frame) => {
      const styles = getComputedStyle(frame);
      return {
        x: parseValue(styles.getPropertyValue("--crop-x"), 50),
        y: parseValue(styles.getPropertyValue("--crop-y"), 50),
        scale: parseValue(styles.getPropertyValue("--crop-scale"), 1),
      };
    };

    frames.forEach((frame) => {
      const values = saved[frame.dataset.cropId];
      if (!values) return;
      frame.style.setProperty("--crop-x", `${values.x}%`);
      frame.style.setProperty("--crop-y", `${values.y}%`);
      frame.style.setProperty("--crop-scale", values.scale);
    });

    const toolbar = document.createElement("aside");
    toolbar.className = "crop-toolbar";
    toolbar.setAttribute("aria-label", "이미지 크롭 편집기");
    toolbar.innerHTML = `
      <header>
        <h2>이미지 크롭 편집</h2>
        <button type="button" data-crop-close>닫기</button>
      </header>
      <label>편집할 이미지
        <select data-crop-select>
          ${frames.map((frame) => `<option value="${frame.dataset.cropId}">${frame.dataset.cropId}</option>`).join("")}
        </select>
      </label>
      <label>가로 초점 <output data-crop-x-output>50%</output>
        <input data-crop-x aria-label="가로 초점" type="range" min="0" max="100" step="1" value="50">
      </label>
      <label>세로 초점 <output data-crop-y-output>50%</output>
        <input data-crop-y aria-label="세로 초점" type="range" min="0" max="100" step="1" value="50">
      </label>
      <label>확대 <output data-crop-scale-output>1.00x</output>
        <input data-crop-scale aria-label="확대" type="range" min="1" max="1.8" step="0.01" value="1">
      </label>
      <div class="crop-toolbar-actions">
        <button type="button" data-crop-reset>초기화</button>
        <button class="crop-save" type="button" data-crop-copy>CSS 값 복사</button>
      </div>
    `;
    document.body.appendChild(toolbar);

    const select = toolbar.querySelector("[data-crop-select]");
    const xInput = toolbar.querySelector("[data-crop-x]");
    const yInput = toolbar.querySelector("[data-crop-y]");
    const scaleInput = toolbar.querySelector("[data-crop-scale]");
    const xOutput = toolbar.querySelector("[data-crop-x-output]");
    const yOutput = toolbar.querySelector("[data-crop-y-output]");
    const scaleOutput = toolbar.querySelector("[data-crop-scale-output]");
    let activeFrame = frames[0];

    const syncControls = () => {
      frames.forEach((frame) => frame.classList.toggle("is-editing", frame === activeFrame));
      const values = readValues(activeFrame);
      xInput.value = values.x;
      yInput.value = values.y;
      scaleInput.value = values.scale;
      xOutput.value = `${Math.round(values.x)}%`;
      yOutput.value = `${Math.round(values.y)}%`;
      scaleOutput.value = `${values.scale.toFixed(2)}x`;
      activeFrame.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    };

    const persist = () => {
      saved[activeFrame.dataset.cropId] = readValues(activeFrame);
      localStorage.setItem(storageKey, JSON.stringify(saved));
    };

    const applyControls = () => {
      activeFrame.style.setProperty("--crop-x", `${xInput.value}%`);
      activeFrame.style.setProperty("--crop-y", `${yInput.value}%`);
      activeFrame.style.setProperty("--crop-scale", scaleInput.value);
      xOutput.value = `${xInput.value}%`;
      yOutput.value = `${yInput.value}%`;
      scaleOutput.value = `${Number(scaleInput.value).toFixed(2)}x`;
      persist();
    };

    select.addEventListener("change", () => {
      activeFrame = frames.find((frame) => frame.dataset.cropId === select.value) || frames[0];
      syncControls();
    });
    [xInput, yInput, scaleInput].forEach((input) => input.addEventListener("input", applyControls));

    toolbar.querySelector("[data-crop-reset]").addEventListener("click", () => {
      delete saved[activeFrame.dataset.cropId];
      localStorage.setItem(storageKey, JSON.stringify(saved));
      activeFrame.style.removeProperty("--crop-x");
      activeFrame.style.removeProperty("--crop-y");
      activeFrame.style.removeProperty("--crop-scale");
      syncControls();
    });

    toolbar.querySelector("[data-crop-copy]").addEventListener("click", async (event) => {
      const id = activeFrame.dataset.cropId;
      const values = readValues(activeFrame);
      const css = `[data-crop-id="${id}"] { --crop-x: ${values.x}%; --crop-y: ${values.y}%; --crop-scale: ${values.scale}; }`;
      try {
        await navigator.clipboard.writeText(css);
        // 콜백이 끝나면 event.currentTarget 은 null 이 된다. 미리 잡아둔다.
        const copyButton = event.currentTarget;
        copyButton.textContent = "복사 완료";
        window.setTimeout(() => {
          copyButton.textContent = "CSS 값 복사";
        }, 1400);
      } catch {
        window.prompt("아래 CSS 값을 복사하세요.", css);
      }
    });

    toolbar.querySelector("[data-crop-close]").addEventListener("click", () => {
      frames.forEach((frame) => frame.classList.remove("is-editing"));
      toolbar.remove();
    });

    syncControls();
  };
  initCropStudio();
})();


/* ══ FAQ 페이지네이션 (러너펍 블록12 방식 · 4문항 x 3페이지) ══ */
(function(){
  var list=document.getElementById('rp-faq-list'); if(!list) return;
  var pages=[].slice.call(list.querySelectorAll('.rp-faq-page'));
  var nums=[].slice.call(document.querySelectorAll('.rp-pg-num'));
  var prev=document.querySelector('[data-rp-nav="prev"]');
  var next=document.querySelector('[data-rp-nav="next"]');
  if(!pages.length || !prev || !next) return;
  var cur=1;
  function go(n){
    cur=Math.min(Math.max(n,1),pages.length);
    pages.forEach(function(p,i){ p.hidden=(i+1!==cur);
      p.querySelectorAll('details').forEach(function(d){ d.open=false; }); });
    nums.forEach(function(b,i){ var on=(i+1===cur); b.classList.toggle('is-current',on);
      if(on){ b.setAttribute('aria-current','true'); } else { b.removeAttribute('aria-current'); } });
    prev.disabled=(cur===1); next.disabled=(cur===pages.length);
  }
  nums.forEach(function(b){ b.addEventListener('click',function(){ go(+b.dataset.rpGoto); }); });
  prev.addEventListener('click',function(){ go(cur-1); });
  next.addEventListener('click',function(){ go(cur+1); });
  go(1);
})();
