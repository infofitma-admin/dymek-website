(function () {
  "use strict";
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  d.documentElement.classList.add("js");

  // Header glass on scroll
  var hdr = $(".hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Mobile nav
  var bg = $(".burger"), mn = $(".mnav");
  if (bg && mn) bg.addEventListener("click", function () { mn.hidden = !mn.hidden; bg.setAttribute("aria-expanded", String(!mn.hidden)); });

  // Dropdown click support
  $$(".dd > button").forEach(function (b) {
    b.addEventListener("click", function (e) { e.stopPropagation(); var li = b.parentElement; li.classList.toggle("open"); b.setAttribute("aria-expanded", String(li.classList.contains("open"))); });
  });
  d.addEventListener("click", function () { $$(".dd.open").forEach(function (x) { x.classList.remove("open"); }); });

  // YouTube embeds: click-to-play posters
  function yt(id, auto) {
    return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1" + (auto ? "&autoplay=1" : "");
  }
  function mount(box, id, auto) {
    box.innerHTML = '<iframe src="' + yt(id, auto) + '" title="I-Photonics video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
  }
  $$("[data-yt]").forEach(function (box) {
    var id = box.dataset.yt;
    if (box.dataset.autoplay === "1") {
      box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&loop=1&playlist=' + id + '&controls=0&rel=0&modestbranding=1&playsinline=1" title="I-Photonics video" allow="autoplay; encrypted-media; picture-in-picture" loading="eager"></iframe>';
      return;
    }
    var btn = $(".play", box);
    if (btn) btn.addEventListener("click", function () { mount(box, box.dataset.yt, true); });
  });

  // Video gallery
  var gal = $("[data-vgal]");
  if (gal) {
    var screen = $("[data-yt]", gal), title = $("[data-vtitle]", gal);
    $$(".vlist button", gal).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".vlist button", gal).forEach(function (x) { x.setAttribute("aria-current", "false"); });
        b.setAttribute("aria-current", "true");
        screen.dataset.yt = b.dataset.id; mount(screen, b.dataset.id, true);
        if (title) title.textContent = b.querySelector("b").textContent;
      });
    });
  }

  // Tabs (generic): [data-tabs] with [data-tab] + [data-pane]
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("[data-tab]", root), panes = $$("[data-pane]", root);
    function show(id) {
      tabs.forEach(function (t) { var on = t.dataset.tab === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
      panes.forEach(function (p) { p.hidden = p.dataset.pane !== id; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(t.dataset.tab); });
      t.addEventListener("keydown", function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!k) return;
        e.preventDefault(); var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); show(n.dataset.tab);
      });
    });
  });

  // Rails
  $$("[data-rail]").forEach(function (wrap) {
    var rail = $(".rail", wrap);
    $$("[data-dir]", wrap).forEach(function (b) { b.addEventListener("click", function () { rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.8, behavior: "smooth" }); }); });
  });

  // Counters
  var counters = $$("[data-count]");
  function run(el) {
    var to = +el.dataset.count, suf = el.dataset.suffix || "", t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  // Scroll reveal (only below the fold, so first paint is complete)
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove("pre");
        $$("[data-count]", e.target).forEach(run);
        if (e.target.hasAttribute("data-count")) run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    $$(".rv").forEach(function (el) { if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add("pre"); io.observe(el); });
  }

  // Retrofit checklist
  var chk = $("#retrofit");
  if (chk) {
    var cnt = $("#rf-count"), go = $("#rf-go");
    var upd = function () {
      var on = $$("input:checked", chk);
      cnt.textContent = on.length + " of " + $$("input", chk).length;
      go.href = "contact.html?type=upgrade&note=" + encodeURIComponent(on.length ? "OCP retrofit check. I can share: " + on.map(function (i) { return i.dataset.label; }).join("; ") : "OCP retrofit enquiry");
    };
    chk.addEventListener("change", upd); upd();
  }

  // Contact form (Netlify Forms)
  var form = $("#lead-form");
  if (form) {
    try {
      var q = new URLSearchParams(location.search), t = q.get("topic"), n = q.get("note");
      if (t) { var r = form.querySelector('input[name="topic"][value="' + t + '"]'); if (r) r.checked = true; var sel = form.querySelector('select[name="topic"]'); if (sel && sel.querySelector('option[value="' + t + '"]')) sel.value = t; }
      if (n) { var m = $("#f-msg"); if (m && !m.value) m.value = n + "\n\n"; }
    } catch (e) {}
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var st = $("#form-status"), b = form.querySelector('button[type="submit"]');
      b.disabled = true; st.hidden = false; st.className = "form-status"; st.textContent = "Sending…";
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (res) { if (!res.ok) throw 0; form.reset(); st.className = "form-status ok"; st.textContent = "Thank you. Your enquiry is with the Dymek team. Expect a reply within one working day."; })
        .catch(function () { st.className = "form-status err"; st.textContent = "Sorry, the message didn't send. Please email " + form.dataset.email + " directly."; })
        .finally(function () { b.disabled = false; });
    });
  }

  // Requirement box (hero) -> contact page with prefilled note
  var ask = document.getElementById("ask-form");
  if (ask) {
    var ta = ask.querySelector("textarea");
    [].slice.call(ask.querySelectorAll("[data-fill]")).forEach(function (b) {
      b.addEventListener("click", function () { ta.value = b.dataset.fill; ta.focus(); });
    });
    ask.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = ta.value.trim();
      location.href = "contact.html" + (v ? "?note=" + encodeURIComponent(v) : "");
    });
  }
  // Pause background video for reduced motion
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    [].slice.call(document.querySelectorAll(".hero-bg video")).forEach(function (v) { v.pause(); v.removeAttribute("autoplay"); });
  }
  // Word-by-word scroll reveal for statements
  $$(".statement").forEach(function (el) {
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); } else { var s = d.createElement("span"); s.className = "w"; s.textContent = p; frag.appendChild(s); } });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("gt")) { walk(n); }
        else if (n.nodeType === 1) { n.classList.add("w"); }
      });
    };
    walk(el);
    var words = $$(".w", el); el.classList.add("reveal");
    var upd = function () {
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    };
    window.addEventListener("scroll", upd, { passive: true }); upd();
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
// FAQ: on narrow screens, move the answer stage directly under the selected question
(function () {
  var root = document.querySelector(".faqx"); if (!root) return;
  var panel = root.querySelector(".faqx-panel"), home = panel.parentNode, mq = window.matchMedia("(max-width: 900px)");
  function place() {
    var sel = root.querySelector('.fq[aria-selected="true"]');
    if (mq.matches && sel) sel.after(panel); else if (panel.parentNode !== home) home.appendChild(panel);
  }
  root.addEventListener("click", function (e) { if (e.target.closest(".fq")) setTimeout(place, 0); });
  mq.addEventListener ? mq.addEventListener("change", place) : mq.addListener(place);
  place();
})();

/* ===== Lead tools: spec check, system finder, contact routes, call booking (sends to web@dymek.com) ===== */
(function () {
  "use strict";
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var W3F = "b6a82774-3c24-4790-bfef-8705a4bdb606", TO = "web@dymek.com";
  function status(f, cls, html) { var st = $(".form-status", f); if (!st) return; st.hidden = false; st.className = "form-status " + cls; st.innerHTML = html; }
  function send(f, done) {
    var fd = new FormData(f), lead = f.dataset.lead || "Enquiry", name = fd.get("name") || "website visitor";
    var w = new FormData();
    w.append("access_key", W3F); w.append("subject", "i-Photonics site · " + lead + " · " + name); w.append("from_name", "Dymek × i-Photonics website");
    if (fd.get("email")) w.append("replyto", fd.get("email"));
    w.append("Request type", lead);
    var seen = {};
    fd.forEach(function (v, k) { if (k === "form-name" || k === "bot-field" || !String(v).trim()) return; seen[k] = seen[k] ? seen[k] + ", " + v : String(v); });
    Object.keys(seen).forEach(function (k) { w.append(k.replace(/_/g, " ").replace(/^./, function (c) { return c.toUpperCase(); }), seen[k]); });
    w.append("Page", location.pathname);
    var a = fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: w }).then(function (r) { return r.json(); }).then(function (j) { return !!j.success; }).catch(function () { return false; });
    var b = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() }).then(function (r) { return r.ok; }).catch(function () { return false; });
    return Promise.all([a, b]).then(function (r) { done(r[0] || r[1]); });
  }
  function bind(f, onOk) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (f.querySelector('[name="bot-field"]') && f.querySelector('[name="bot-field"]').value) return;
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var btn = $('button[type="submit"]', f), lbl = btn.textContent; btn.disabled = true; btn.textContent = "Sending…";
      status(f, "", "Sending your request…");
      send(f, function (ok) {
        btn.disabled = false; btn.textContent = lbl;
        if (ok) { status(f, "ok", "<b>Thank you.</b> Your request is with the Dymek team. We will reply by email, usually within 2 working days."); if (onOk) onOk(); else f.reset(); }
        else status(f, "err", "Sorry, that didn't send. Please email <a href=\"mailto:" + TO + "\">" + TO + "</a> directly.");
      });
    });
  }

  /* 1 · Hero spec check (3 steps) */
  var sp = $("#spec-form");
  if (sp) {
    var steps = $$(".spec-step", sp), dots = $$(".spec-dots li", sp), cur = 0, bk = $("[data-back]", sp), nx = $("[data-next]", sp), sb = $('button[type="submit"]', sp);
    function show(i) {
      cur = i; steps.forEach(function (s, k) { s.hidden = k !== i; }); dots.forEach(function (x, k) { x.classList.toggle("on", k <= i); });
      bk.hidden = i === 0; nx.hidden = i === steps.length - 1; sb.hidden = i !== steps.length - 1;
    }
    function valid(i) { var ok = true; $$("input,select,textarea", steps[i]).forEach(function (el) { if (ok && !el.checkValidity()) { el.reportValidity(); ok = false; } }); return ok; }
    nx.addEventListener("click", function () { if (valid(cur)) { show(cur + 1); var f = $("input:not([type=radio]),select", steps[cur]); if (f) f.focus({ preventScroll: true }); } });
    bk.addEventListener("click", function () { show(cur - 1); });
    $$('input[type="radio"]', sp).forEach(function (r) { r.addEventListener("change", function () { setTimeout(function () { if (cur === 0) show(1); }, 180); }); });
    bind(sp, function () { sp.reset(); show(0); });
    show(0);
  }

  /* 2 · System finder */
  var fd = $("[data-finder]");
  if (fd) {
    var A = {}, R = {
      loss: { ac: "IBS", k: "Ion beam sputtering", n: "LIDIZ IBS platform", d: "For ultra-low-loss laser mirrors and precision optics where absorption, scatter and layer accuracy decide the result.", img: "lidiz-700-ion-beam-sputtering-system-ibs.avif", big: "lidiz-1100-ion-beam-sputtering-system-ibs.avif", url: "precision-coatings.html", why: ["Dense, low-scatter layers", "Excellent layer accuracy and repeatability"] },
      filters: { ac: "PARMS", k: "PARMS sputtering", n: "MERIDIAN PARMS platform", d: "For complex interference coatings and filters, with plasma assistance and in-process optical monitoring.", img: "meridian-parms-magnetron-sputtering.avif", url: "precision-coatings.html", why: ["Built for demanding filter stacks", "Optical monitoring in the process"] },
      rd: { ac: "PIAD", k: "PIAD evaporation", n: "ORTUS PIAD platform", d: "A flexible platform for optical and functional thin films, new materials and process development.", img: "ortus-700-ion-beam-assisted-deposition-system-ibad.avif", big: "ortus-1500-ion-beam-assisted-deposition-system-ibad.avif", url: "thin-film-rd.html", why: ["Configurable sources and holders", "Grows with your research"] },
      ir: { ac: "DLC", k: "Infrared & DLC", n: "IR coatings with DIAMANTA DLC", d: "Broadband MWIR and LWIR coatings on Ge, Si and ZnS, protected with diamond-like carbon for harsh environments.", img: "diamanta-dlc-system.avif", url: "infrared-dlc.html", why: ["Broadband IR anti-reflection", "Hard DLC protection outdoors"] },
      upgrade: { ac: "OCP", k: "Retrofit", n: "OCP optical monitoring", d: "Add in-situ spectral monitoring and layer endpoint control to the coater you already own.", img: "ocp-broadband-optical-monitoring-system.avif", url: "optical-monitoring.html", why: ["No new coater needed", "More repeatable multilayer runs"] }
    };
    var labels = {};
    $$(".fd-step", fd).forEach(function (st) {
      $$("button", st).forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          $$("button", st).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          A[st.dataset.q] = b.dataset.v; labels[st.dataset.q] = b.textContent; st.classList.add("done"); paint();
        });
      });
    });
    function paint() {
      var g = A.goal, r = g ? R[g] : null; if (!r) return;
      if (g === "rd" && (A.stage === "prod" || A.stage === "pilot")) r = { ac: "MS", k: "Magnetron sputtering", n: "ASTRA-S sputtering platform", d: "Lab-scale sputtering that reproduces inline conditions, with a clear path from pilot toward production.", img: "astra-s-inline-vacuum-system.avif", url: "thin-film-rd.html", why: ["Lab results that transfer to production", "Scales from pilot to inline"] };
      if (g === "filters" && A.stage === "lab" && A.size === "s") r = R.loss, r = Object.assign({}, R.filters, { why: R.filters.why.concat(["IBS is also worth comparing for small, low-loss filters"]) });
            var sizeNote = { s: "Compact configuration for substrates up to 100 mm", m: "Mid-size chamber for 100–200 mm substrates", l: "Larger chamber or batch holders above 200 mm" }[A.size];
      var stageNote = { lab: "Research lab set-up", pilot: "Pilot-line ready", prod: "Production-ready configuration" }[A.stage];
      var why = r.why.slice(); if (sizeNote && g !== "upgrade") why.push(sizeNote); if (stageNote && g !== "upgrade") why.push(stageNote); if (A.when) why.push("Timeline: " + A.when);
      var ac = $("[data-fac]", fd); if (ac.textContent !== r.ac) { ac.classList.remove("pop"); void ac.offsetWidth; ac.textContent = r.ac; ac.classList.add("pop"); }
      $("[data-fsub]", fd).textContent = r.k + " by i-Photonics";
      $("[data-fmeter]", fd).style.width = (Object.keys(A).length / 4 * 100) + "%";
      $("[data-fk]", fd).textContent = "Worth a closer look · " + r.k;
      $("[data-fn]", fd).textContent = r.n;
      $("[data-fd]", fd).innerHTML = r.d + ' <a class="tlink" href="' + r.url + '">Learn more</a>';
      $("[data-fw]", fd).innerHTML = why.map(function (w) { return "<li>" + w + "</li>"; }).join("");
      var f = $(".fd-form", fd); f.hidden = false;
      f.answers.value = Object.keys(labels).map(function (k) { return labels[k]; }).join(" · ");
      f.suggestion.value = r.n;
      fd.classList.add("has");
      if (Object.keys(A).length === 4 && innerWidth < 960 && !fd.__scrolled) { fd.__scrolled = 1; setTimeout(function () { $(".fd-r", fd).scrollIntoView({ behavior: "smooth", block: "start" }); }, 250); }
    }
    bind($(".fd-form", fd));
  }

  /* 3 · Contact routes (tabs) + prefill from links */
  var ct = $("[data-ctabs]");
  if (ct) {
    var tabs = $$("[data-ct]", ct), panes = $$("[data-cp]", ct);
    function open(id, focus) {
      if (!$('[data-cp="' + id + '"]', ct)) id = "message";
      tabs.forEach(function (t) { var on = t.dataset.ct === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
      panes.forEach(function (p) { p.hidden = p.dataset.cp !== id; });
      if (focus) { var t = $('[data-ct="' + id + '"]', ct); t.focus(); }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { open(t.dataset.ct); history.replaceState(null, "", "?type=" + t.dataset.ct); });
      t.addEventListener("keydown", function (e) { var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return; e.preventDefault(); var n = tabs[(i + k + tabs.length) % tabs.length]; open(n.dataset.ct, true); });
    });
    var q = new URLSearchParams(location.search), ty = q.get("type"), note = q.get("note"), topic = q.get("topic");
    if (!ty && topic === "monitoring") ty = "upgrade";
    open(ty || "message");
    var pane = $('[data-cp]:not([hidden])', ct);
    if (note) { var ta = $("textarea", pane); if (ta && !ta.value) ta.value = note; }
    if (topic) { var sel = $('select[name="topic"]', ct); if (sel && sel.querySelector('option[value="' + topic + '"]')) sel.value = topic; }
    $$("form[data-lead]", ct).forEach(function (f) { bind(f); });

    /* call booking: next 10 working days, 09:00–17:00 Malaysia time shown in the visitor's own time */
    var days = $("[data-days]", ct), times = $("[data-times]", ct);
    if (days && times) {
      var form = days.closest("form"), tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
      form.timezone.value = tz;
      var list = [], dt = new Date(); dt.setHours(12, 0, 0, 0);
      while (list.length < 10) { dt.setDate(dt.getDate() + 1); var wd = dt.getDay(); if (wd && wd < 6) list.push(new Date(dt)); }
      var fmtD = function (x) { return x.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); };
      days.innerHTML = list.map(function (x, i) { return '<button type="button" role="radio" aria-checked="false" data-i="' + i + '"><small>' + x.toLocaleDateString(undefined, { weekday: "short" }) + "</small><b>" + x.getDate() + "</b><small>" + x.toLocaleDateString(undefined, { month: "short" }) + "</small></button>"; }).join("");
      function paintTimes(day) {
        var out = [];
        for (var h = 9; h <= 16; h++) {
          var utc = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h - 8, 0); // Malaysia is UTC+8
          var local = new Date(utc), my = String(h).padStart(2, "0") + ":00";
          var loc = local.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          out.push('<button type="button" role="radio" aria-checked="false" data-v="' + fmtD(day) + ", " + my + " Malaysia time (" + loc + " " + (tz || "local") + ')"><b>' + loc + "</b><small>" + my + " MYT</small></button>");
        }
        times.innerHTML = out.join(""); form.time.value = "";
      }
      days.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("button", days).forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); var dd = list[+b.dataset.i]; form.day.value = fmtD(dd); paintTimes(dd); });
      times.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("button", times).forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); form.time.value = b.dataset.v; });
      times.innerHTML = '<p class="muted slot-hint">Choose a day first.</p>';
      form.addEventListener("submit", function (e) { if (!form.day.value || !form.time.value) { e.stopImmediatePropagation(); e.preventDefault(); status(form, "err", "Please pick a day and a time for the call."); } }, true);
    }
  }
})();
