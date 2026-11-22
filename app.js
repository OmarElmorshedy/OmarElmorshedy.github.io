(() => {
  const items = window.PORTFOLIO || [];
  const media = (it, ext) => `media/${it.slug}${ext}?v=3`;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

  document.getElementById("year").textContent = new Date().getFullYear();

  // nav background after scrolling
  const nav = document.querySelector(".nav");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });

  // hero: drifting wall of vertical work; stills on phones and for reduced motion
  const wall = document.getElementById("heroWall");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches || innerWidth < 700;
  const verticals = items.filter(it => it.vertical);
  const COLS = 7, PER = 4;
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement("div");
    col.className = "col";
    const picks = Array.from({ length: PER }, (_, i) => verticals[(c + i * COLS) % verticals.length]);
    [...picks, ...picks].forEach(it => {
      const el = document.createElement(still ? "img" : "video");
      if (still) { el.src = media(it, ".jpg"); el.alt = ""; el.loading = "lazy"; }
      else Object.assign(el, { muted: true, loop: true, autoplay: true, playsInline: true, poster: media(it, ".jpg"), src: media(it, "-preview.mp4") });
      col.appendChild(el);
    });
    wall.appendChild(col);
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) wall.querySelectorAll(".col").forEach(c => c.style.animation = "none");

  // work grid
  const order = [];
  const appear = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); appear.unobserve(e.target); }
  }), { rootMargin: "0px 0px -60px 0px" });

  items.forEach(it => {
    const grid = document.querySelector(`[data-grid="${it.category}${it.vertical ? "" : "-wide"}"]`);
    const card = document.createElement("article");
    card.className = "card" + (it.vertical ? "" : " wide");
    card.innerHTML = `
      <img loading="lazy" src="${media(it, ".jpg")}" alt="${it.client} — ${it.title}">
      <div class="card-meta"><em>${it.tag || ""}</em><em>${fmt(it.duration)}</em></div>
      <div class="play"></div>
      <div class="card-info"><strong>${it.client}</strong><span>${it.title}</span></div>`;
    if (!it.tag) card.querySelector(".card-meta em").remove();

    let pv;
    card.addEventListener("mouseenter", () => {
      if (!matchMedia("(hover: hover)").matches) return;
      if (!pv) {
        pv = document.createElement("video");
        Object.assign(pv, { muted: true, loop: true, playsInline: true, src: media(it, "-preview.mp4") });
        card.insertBefore(pv, card.querySelector(".card-meta"));
      }
      pv.play().then(() => card.classList.add("playing")).catch(() => {});
    });
    card.addEventListener("mouseleave", () => { if (pv) { pv.pause(); card.classList.remove("playing"); } });
    card.addEventListener("click", () => openAt(order.indexOf(it)));

    grid.appendChild(card);
    appear.observe(card);
  });
  // lightbox order follows the page: hand-made wide, hand-made, ai wide, ai
  document.querySelectorAll("[data-grid]").forEach(g => {
    const key = g.dataset.grid;
    items.filter(i => `${i.category}${i.vertical ? "" : "-wide"}` === key).forEach(i => order.push(i));
  });

  // filter tabs
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
    const f = tab.dataset.filter;
    document.querySelectorAll(".group").forEach(g => { g.hidden = f !== "all" && g.dataset.group !== f; });
  }));

  // lightbox
  const lb = document.getElementById("lightbox");
  const lbv = document.getElementById("lbVideo");
  let cur = 0;
  function openAt(i) {
    cur = (i + order.length) % order.length;
    const it = order[cur];
    lbv.poster = media(it, ".jpg");
    lbv.src = media(it, ".mp4");
    document.getElementById("lbClient").textContent = it.client;
    document.getElementById("lbTitle").textContent = it.title + (it.tag ? ` · ${it.tag}` : "");
    show(false);
  }
  function show(single) {
    lb.classList.toggle("single", single);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbv.play().catch(() => {});
  }
  // full showreel with sound in the same player, without prev/next
  document.getElementById("playReel").onclick = () => {
    lbv.poster = "media/reel/showreel.jpg?v=1";
    lbv.src = "media/reel/showreel.mp4?v=1";
    document.getElementById("lbClient").textContent = "Showreel 2026";
    document.getElementById("lbTitle").textContent = "Motion · Colour · Edit & Sound · AI";
    show(true);
  };
  function close() {
    lbv.pause(); lbv.removeAttribute("src"); lbv.load();
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  lb.querySelector(".lb-close").onclick = close;
  lb.querySelector(".lb-prev").onclick = () => openAt(cur - 1);
  lb.querySelector(".lb-next").onclick = () => openAt(cur + 1);
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (lb.classList.contains("single")) return;
    if (e.key === "ArrowLeft") openAt(cur - 1);
    if (e.key === "ArrowRight") openAt(cur + 1);
  });
})();
