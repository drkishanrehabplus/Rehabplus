// RehabPlus — Site Data Loader
// Reads from Firestore and applies content live to all pages

const _fbSDK = [
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"
];

let _db = null;

function _loadSDK(cb) {
  let loaded = 0;
  _fbSDK.forEach(src => {
    if (document.querySelector('script[src="' + src + '"]')) { if (++loaded === _fbSDK.length) cb(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { if (++loaded === _fbSDK.length) cb(); };
    s.onerror = () => { if (++loaded === _fbSDK.length) cb(); };
    document.head.appendChild(s);
  });
}

function _initFb() {
  try {
    var cfg = null;
    try { if (typeof FIREBASE_CONFIG !== 'undefined') cfg = FIREBASE_CONFIG; } catch(e1) {}
    if (!cfg) try { cfg = window.FIREBASE_CONFIG; } catch(e2) {}
    if (!cfg || cfg.apiKey === "YOUR_API_KEY") { _applyFallback(); return; }
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    _db = firebase.firestore();
    _loadAll();
  } catch(e) {
    console.warn("RehabPlus Firebase:", e.message);
    _applyFallback();
  }
}

function _loadAll() {
  _db.collection(DB_COLLECTION).get()
    .then(snap => {
      const d = {};
      snap.forEach(doc => { d[doc.id] = doc.data(); });
      _applyHero(d.hero);
      _applyStats(d.stats);
      _applyColors(d.colors);
      _applyAnnouncements(d.announce);
      _applySocial(d.social);
      _applyConfig(d.config);
      _applyContact(d.contact);
      _applyTestimonials(d.testimonials);
      _applyPopup(d.popup);
      _applyBlogs(d.blogs);
      _applyFaq(d.faq);
      _applyPricing(d.pricing);
      _applyMedia(d.media);
      _applyUpi(d.upi);
    })
    .catch(e => { console.warn("Firestore load:", e.message); _applyFallback(); });
}

function _applyHero(d) {
  if (!d) return;
  const h1 = document.querySelector(".hero h1");
  if (h1 && d.h1 && d.h2) h1.innerHTML = d.h1 + "<br>" + d.h2;
  const desc = document.querySelector(".hero-desc");
  if (desc && d.desc) desc.textContent = d.desc;
  const badge = document.querySelector(".pill");
  if (badge && d.badge) badge.textContent = d.badge;
}

function _applyStats(d) {
  if (!d) return;
  const stats = document.querySelectorAll(".stat");
  [[d.v1,d.l1],[d.v2,d.l2],[d.v3,d.l3]].forEach(([v,l], i) => {
    if (!stats[i]) return;
    const strong = stats[i].querySelector("strong");
    const span   = stats[i].querySelector("span");
    if (strong && v) strong.textContent = v;
    if (span   && l) span.textContent   = l;
  });
}

function _applyColors(d) {
  if (!d) return;
  const root = document.documentElement;
  if (d.primary) root.style.setProperty("--blue", d.primary);
}

function _applyAnnouncements(d) {
  if (!d || !Array.isArray(d.items)) return;
  const now = new Date();
  const active = d.items.filter(item => {
    if (!item.active) return false;
    if (item.date && new Date(item.date) < now) return false;
    return true;
  });
  if (!active.length) return;
  const colors = { info:"#63a5ff", success:"#27ae60", warning:"#f39c12", promo:"#111111" };
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;top:62px;left:0;right:0;z-index:290;";
  active.forEach(item => {
    const row = document.createElement("div");
    const col = colors[item.type] || "#63a5ff";
    row.style.cssText = `background:${col};color:#fff;text-align:center;padding:.4rem 5vw;font-size:.8rem;font-weight:500;display:flex;align-items:center;justify-content:center;gap:.8rem;`;
    row.innerHTML = `<span>${item.msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;opacity:.6;padding:0 .2rem;">✕</button>`;
    bar.appendChild(row);
  });
  document.body.insertAdjacentElement("afterbegin", bar);
}

function _applySocial(d) {
  if (!d || !Array.isArray(d.items)) return;
  const el = document.getElementById("eq-social-links");
  if (!el || !d.items.length) return;
  el.innerHTML = d.items.map(l =>
    `<a href="${l.url}" target="_blank" title="${l.name}" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:.9rem;text-decoration:none;">${l.icon}</a>`
  ).join("");
}

function _applyConfig(d) {
  if (!d) return;
  const wa  = document.querySelector(".wa-fab");
  const fab = document.querySelector(".chat-fab");
  const mq  = document.querySelector(".marquee-bar");
  if (wa  && d.wa  === false) wa.style.display  = "none";
  if (fab && d.fab === false) fab.style.display = "none";
  if (mq  && d.marquee === false) mq.style.display = "none";
}

function _applyContact(d) {
  if (!d) return;
  // Update phone links
  document.querySelectorAll('a[href^="tel:"]').forEach(a => {
    if (d.phone) { a.href = "tel:" + d.phone.replace(/\s/g,""); a.textContent = d.phone; }
  });
  // Update WhatsApp links
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    if (d.wa) a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + d.wa);
  });
  // Update email links
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    if (d.email) { a.href = "mailto:" + d.email; if (a.textContent.includes("@")) a.textContent = d.email; }
  });
  // Update eq-val spans
  const eqVals = document.querySelectorAll(".eq-val");
  eqVals.forEach(el => {
    if (el.textContent.includes("Mon") && d.hours) el.textContent = d.hours;
    if (el.textContent.includes("8 AM") && d.onlineHours) el.textContent = d.onlineHours;
    if (el.textContent.includes("Gurugram") && d.address) el.textContent = d.address;
  });
}

function _applyTestimonials(d) {
  if (!d || !Array.isArray(d.items)) return;
  const active = d.items.filter(t => t.active !== false);
  if (!active.length) return;
  const grids = document.querySelectorAll(".testi-grid");
  grids.forEach(grid => {
    const stars = n => "★".repeat(n) + "☆".repeat(5-n);
    grid.innerHTML = active.map(t => `
      <div class="testi-card">
        <div class="stars">${stars(t.rating||5)}</div>
        <p>"${t.text}"</p>
        <div class="testi-auth">
          <div class="testi-av">${t.avatar||"⭐"}</div>
          <div><div class="testi-name">${t.name}</div>
          <div class="testi-det">${t.service||""}</div></div>
        </div>
      </div>`).join("");
  });
}

function _applyPopup(d) {
  if (!d || !d.enabled) return;
  const bg = d.bg || "#63a5ff";
  if (d.sticky) {
    const bar = document.createElement("div");
    bar.style.cssText = `position:fixed;top:62px;left:0;right:0;z-index:289;background:${bg};color:#fff;text-align:center;padding:.45rem 5vw;font-size:.82rem;font-weight:500;display:flex;align-items:center;justify-content:center;gap:1rem;`;
    bar.innerHTML = `<strong>${d.title||""}</strong><span style="opacity:.8;">${d.msg||""}</span>${d.btn?`<a href="${d.link||"#"}" style="background:#fff;color:${bg};padding:.2rem .8rem;border-radius:2rem;font-size:.76rem;font-weight:700;text-decoration:none;">${d.btn}</a>`:""}<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;opacity:.6;">✕</button>`;
    document.body.insertAdjacentElement("afterbegin", bar);
  } else {
    setTimeout(() => {
      if (sessionStorage.getItem("rp_popup_seen")) return;
      sessionStorage.setItem("rp_popup_seen","1");
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;";
      overlay.innerHTML = `<div style="background:#fff;border-radius:1rem;padding:2rem;max-width:420px;width:100%;text-align:center;position:relative;">
        <button onclick="this.closest('[style]').remove()" style="position:absolute;top:.7rem;right:.9rem;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#888;">✕</button>
        <div style="font-size:1.4rem;font-weight:700;color:#111;margin-bottom:.5rem;">${d.title||""}</div>
        <div style="font-size:.88rem;color:#666;margin-bottom:1.2rem;">${d.msg||""}</div>
        ${d.btn?`<a href="${d.link||"#"}" style="display:inline-block;background:${bg};color:#fff;padding:.55rem 1.5rem;border-radius:2rem;font-weight:700;text-decoration:none;font-size:.88rem;">${d.btn}</a>`:""}
      </div>`;
      document.body.appendChild(overlay);
    }, (d.delay||3) * 1000);
  }
}

function _applyFallback() {
  // Apply localStorage data as fallback when Firebase not available
  try {
    const social = JSON.parse(localStorage.getItem("rp_social")||"null");
    if (social) _applySocial({ items: social });
    const popup = JSON.parse(localStorage.getItem("rp_popup")||"null");
    if (popup) _applyPopup(popup);
    const testi = JSON.parse(localStorage.getItem("rp_testimonials")||"null");
    if (testi) _applyTestimonials({ items: testi });
    const contact = JSON.parse(localStorage.getItem("rp_contact")||"null");
    if (contact) _applyContact(contact);
  } catch(e) {}
}


function _applyBlogs(d) {
  if (!d || !Array.isArray(d.items)) return;
  // Update blog grids dynamically
  const grid = document.getElementById('blog-list') || document.querySelector('.blog-grid');
  if (!grid) return;
  const active = d.items.filter(b => b.status !== 'draft');
  if (!active.length) return;
  grid.innerHTML = active.slice(0,6).map(b => `
    <article class="blog-card">
      <div class="blog-thumb" style="background:#f2f2f2;height:160px;display:flex;align-items:center;justify-content:center;font-size:2rem;">${b.emoji||'📝'}</div>
      <div class="blog-body" style="padding:1rem;">
        <div style="font-size:.65rem;color:#888;margin-bottom:.3rem;">${b.date||''} · ${b.category||''}</div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:#111;margin-bottom:.3rem;">${b.title||''}</h3>
        <p style="font-size:.78rem;color:#666;line-height:1.6;">${(b.excerpt||'').substring(0,100)}...</p>
      </div>
    </article>`).join('');
}

function _applyFaq(d) {
  if (!d || !Array.isArray(d.items)) return;
  const container = document.getElementById('faq-list') || document.querySelector('.faq-list');
  if (!container) return;
  container.innerHTML = d.items.filter(f => f.active !== false).map(f => `
    <div class="faq-item" style="border:1px solid rgba(0,0,0,.08);border-radius:.7rem;margin-bottom:.6rem;overflow:hidden;">
      <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" style="padding:1rem 1.2rem;cursor:pointer;font-weight:600;font-size:.88rem;color:#111;display:flex;justify-content:space-between;align-items:center;">${f.q} <span>+</span></div>
      <div style="display:none;padding:.8rem 1.2rem;font-size:.82rem;color:#666;line-height:1.7;border-top:1px solid rgba(0,0,0,.06);">${f.a}</div>
    </div>`).join('');
}

function _applyPricing(d) {
  if (!d || !Array.isArray(d.rows)) return;
  const grid = document.querySelector('.packages-grid') || document.querySelector('.pricing-grid');
  if (!grid) return;
  grid.innerHTML = d.rows.map((p,i) => `
    <div class="pkg-card${i===1?' featured':''}">
      ${i===1?'<div class="pkg-badge">Most Popular</div>':''}
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:#111;">${p.name||''}</h3>
      <div class="pkg-price">&#8377;${p.price||''}<span>/session</span></div>
      <a href="booking.html" class="btn btn-green btn-sm btn-full" style="margin-top:.8rem;">Book Now</a>
    </div>`).join('');
}



function _applyUpi(d) {
  if (!d || !d.id) return;
  var id   = encodeURIComponent(d.id);
  var name = encodeURIComponent(d.name || 'Kishan Vaishnav');
  var prices = d.prices || {};
  var planMap = {
    '600':  prices.online    || '600',
    '800':  prices.clinic    || '800',
    '1200': prices.home      || '1200',
    '2499': prices.physiopro || '2499',
  };
  document.querySelectorAll('[href^="upi://pay"]').forEach(function(el) {
    var amMatch = el.href.match(/[&?]am=([0-9]+)/);
    var oldAmt = amMatch ? amMatch[1] : null;
    var newAmt = planMap[oldAmt] || oldAmt;
    if (newAmt) {
      var tn = el.href.match(/[&?]tn=([^&]+)/);
      var note = tn ? tn[1] : 'RehabPlus';
      el.href = 'upi://pay?pa=' + id + '&pn=' + name + '&am=' + newAmt + '&cu=INR&tn=' + note;
    }
  });
}
function _applyMedia(d) {
  if (!d) return;
  // Hero image
  if (d.hero_image) {
    var heroRight = document.querySelector('.hero-right img') || document.querySelector('.hero-img');
    if (heroRight) heroRight.src = d.hero_image;
  }
  // Doctor image
  if (d.doctor_image) {
    document.querySelectorAll('.doc-avatar img, .doctor-photo, .doc-img').forEach(function(img) {
      img.src = d.doctor_image; img.style.display = 'block';
    });
  }
  // Video embed
  if (d.video_url) {
    var videoId = d.video_url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (videoId) {
      var frames = document.querySelectorAll('.video-frame, #intro-video');
      frames.forEach(function(f) {
        f.src = 'https://www.youtube.com/embed/' + videoId[1];
        f.style.display = 'block';
      });
    }
  }
  // Service images
  if (d.service_images) {
    document.querySelectorAll('.s-card').forEach(function(card) {
      var name = card.querySelector('h3');
      if (!name) return;
      var key = name.textContent.trim().replace(/\s+/g,'_').toLowerCase();
      if (d.service_images[key]) {
        var icon = card.querySelector('.s-icon');
        if (icon) icon.innerHTML = '<img src="'+d.service_images[key]+'" style="width:100%;height:100%;object-fit:cover;border-radius:.5rem;">';
      }
    });
  }
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => _loadSDK(_initFb));
