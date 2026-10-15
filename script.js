// ========================================
// TWENTY CHAPTERS - SCRIPT
// MODE = "password" -> skip lock + intro, show gifts and jump straight to the password popup (test)
// MODE = "gifts"    -> skip lock + intro, show the 20 gifts (test gifts)
// MODE = "intro"    -> skip lock only: Happy Birthday -> warning -> gifts (test flow)
// MODE = "live"     -> real flow: countdown until Nov 3
// ========================================

const MODE = "intro";
const BIRTHDAY = new Date("2026-11-03T00:00:00");
const $ = (id) => document.getElementById(id);

// ---------- KRISHNA IMAGES (gifts cycle through these) ----------
const KRISHNA = ["images/krishna1.png", "images/krishna2.png", "images/krishna3.png"];

// ---------- PASSWORD SETTINGS ----------
const PASSWORD = "mukku";
const VIDEO = "images/surprise.mp4";
const MAX_TRIES = 5;
const HINTS = [
  "It's your name.",
  "It's your nickname.",
  "It's the name I call you the most.",
  "It starts with M.",
  "It ends with U.",
];

// ---------- CHAPTER DATA (edit captions here; add images/chapterN.jpg or .mp4) ----------
const messages = [
  "A beautiful memory to begin this journey.",
  "Some memories are too special to forget.",
  "A little moment that deserves a place here.",
  "Another chapter. Another memory.",
  "For the moments that made you smile.",
  "A memory worth keeping forever.",
  "Some moments become stories.",
  "And some stories deserve another look.",
  "A small piece of a much bigger journey.",
  "Ten chapters down. More memories ahead.",
  "The story continues.",
  "Another memory, another smile.",
  "A moment saved just for you.",
  "Some memories never really fade.",
  "Fifteen chapters of memories.",
  "A little more of the story.",
  "Another chapter waiting to be remembered.",
  "Almost at the end.",
  "One chapter before the finale.",
  "Happy Birthday, Deekshitha! ❤️",
];
const chapters = messages.map((message, i) => ({
  media: `images/chapter${i + 1}.jpg`,
  message,
}));

// ---------- COUNTDOWN DIALS ----------
const units = [["days", 30], ["hours", 24], ["minutes", 60], ["seconds", 60]];
const CIRC = 276.5; // 2 * PI * r(44)

$("dials").innerHTML = units.map(([n]) => `
  <div class="dial">
    <svg viewBox="0 0 100 100">
      <circle class="trk" cx="50" cy="50" r="44"/>
      <circle class="arc" id="a-${n}" cx="50" cy="50" r="44"/>
    </svg>
    <b id="v-${n}">00</b><small>${n.toUpperCase()}</small>
  </div>`).join("");

function tick() {
  const d = BIRTHDAY - new Date();
  if (d <= 0) return unlock();
  const v = {
    days: Math.floor(d / 864e5),
    hours: Math.floor(d / 36e5 % 24),
    minutes: Math.floor(d / 6e4 % 60),
    seconds: Math.floor(d / 1e3 % 60),
  };
  units.forEach(([n, max]) => {
    $("v-" + n).textContent = String(v[n]).padStart(2, "0");
    $("a-" + n).style.strokeDashoffset = CIRC * (1 - Math.min(v[n] / max, 1));
  });
}

let clock;
function unlock() {
  clearInterval(clock);
  $("lock").classList.add("hidden");
  setTimeout(startIntro, 1000);
}

// ---------- INTRO ----------
function fall(el) {
  el.style.cssText += `;left:${Math.random() * 100}%;animation-duration:${9 + Math.random() * 5}s;` +
    `animation-delay:${Math.random() * 4}s;--dx:${Math.random() * 120 - 60}px;--r:${Math.random() * 720}deg`;
  $("petals").appendChild(el);
}

function startIntro() {
  $("intro").classList.remove("hidden");

  setTimeout(() => {
    $("black").classList.add("hide");
    const colors = ["#E8B84A", "#F29A3C", "#1C8C8C", "#f7c6d9", "#FFF3D6"];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement("i");
      p.style.background = colors[i % 5];
      fall(p);
    }
    for (let i = 0; i < 4; i++) {
      const f = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      f.innerHTML = '<use href="#feather"/>';
      fall(f);
    }
  }, 1000);

  setTimeout(() => $("partA").classList.add("hide"), 10000);
  setTimeout(() => {
    $("partA").style.display = "none";
    $("warn").classList.add("show");
    $("intro").classList.add("alert");
  }, 11000);
}

// ---------- OPEN SURPRISE -> "20 CHAPTERS" -> GIFTS ----------
function swap(from, to) {
  $(from).classList.remove("show");
  setTimeout(() => $(to).classList.add("show"), 500);
}
$("openBtn").onclick = () => swap("warn", "sure");
$("backBtn").onclick = () => swap("sure", "warn");
$("yesBtn").onclick = () => showChapters(false);

function showChapters(instant) {
  $("intro").classList.add("hidden");
  $("title").classList.add("visible");
  if (instant) {
    $("chapters").classList.add("visible");
    $("count").classList.add("visible");
    return;
  }
  setTimeout(() => $("reveal").classList.add("active"), 700);
  setTimeout(() => $("reveal").classList.remove("active"), 4200);
  setTimeout(() => {
    $("chapters").classList.add("visible");
    $("count").classList.add("visible");
  }, 5000);
}

// ---------- GIFTS ----------
let current = null, currentData = null, timer = null, opened = 0;

chapters.forEach((c, i) => {
  const g = document.createElement("button");
  g.className = "gift a" + (i % 3);
  g.setAttribute("aria-label", `Open chapter ${i + 1}`);
  // each gift gets krishna1 / krishna2 / krishna3 in turn
  const kImg = KRISHNA[i % KRISHNA.length];
  g.innerHTML = `<span class="lid"></span>
    <span class="body"><span class="band"></span><svg class="emb emb-f"><use href="#feather"/></svg><img class="emb emb-k" src="${kImg}" alt=""><span class="eye"></span></span>
    <em>CHAPTER ${String(i + 1).padStart(2, "0")}</em>`;
  g.onclick = () => openGift(g, c);
  $("slider").appendChild(g);
});

// Decode photos in the background so opening a gift never stalls
function preload() {
  chapters.forEach((c) => {
    if (/\.(mp4|webm)$/i.test(c.media)) return;
    const img = new Image();
    img.src = c.media;
    img.decode && img.decode().catch(() => {});
  });
}

function openGift(g, c) {
  if (current) return;
  current = g;
  currentData = c;
  g.classList.add("open");

  const isVideo = /\.(mp4|webm)$/i.test(c.media);
  $("stage").innerHTML =
    (isVideo
      ? `<video src="${c.media}" autoplay muted playsinline loop></video>`
      : `<img src="${c.media}" alt="">`) + `<p>${c.message}</p>`;

  setTimeout(() => {
    $("stage").classList.add("on");
    $("dim").classList.add("on");
  }, 450);
  timer = setTimeout(closeGift, 10000);
}

function closeGift() {
  if (!current) return;
  clearTimeout(timer);
  $("stage").classList.remove("on");
  $("dim").classList.remove("on");

  current.classList.replace("open", "done");
  if (!/\.(mp4|webm)$/i.test(currentData.media)) {
    current.querySelector(".eye").style.backgroundImage = `url("${currentData.media}")`;
    current.classList.add("photo");
  }
  $("count").textContent = `${++opened} / 20 opened`;
  current = currentData = null;

  // all 20 opened -> password popup after 1 second
  if (opened === chapters.length) setTimeout(showPassword, 1000);

  setTimeout(() => { if (!current) $("stage").innerHTML = ""; }, 600);
}

$("dim").onclick = $("stage").onclick = closeGift;

// ---------- PASSWORD ----------
let tries = 0, lastChance = false, revealed = false;
const norm = (s) => s.trim().toLowerCase();

// blanks like _ _ _ _ _ ; M shows after 4 hints, U shows after 5 hints, all letters once revealed
function renderBlanks() {
  const last = PASSWORD.length - 1;
  $("pwBlanks").innerHTML = [...PASSWORD].map((ch, i) => {
    const show = revealed || (i === 0 && tries >= 4) || (i === last && tries >= 5);
    return `<span>${show ? ch.toUpperCase() : "_"}</span>`;
  }).join("");
}

function setLeft() {
  const left = MAX_TRIES - tries;
  $("pwLeft").textContent = revealed ? "" :
    lastChance ? "LAST TRY" : `${left} ${left === 1 ? "CHANCE" : "CHANCES"} LEFT`;
}

function addHint(text) {
  const li = document.createElement("li");
  li.textContent = text;
  $("pwHints").appendChild(li);
}

function showPassword() {
  renderBlanks();
  setLeft();
  $("pwDim").classList.add("on");
  $("pw").classList.add("on");
  setTimeout(() => $("pwInput").focus(), 600);
}

function shake() {
  const c = $("pwCard");
  c.classList.remove("shake");
  void c.offsetWidth;
  c.classList.add("shake");
}

function submitPassword() {
  const val = norm($("pwInput").value);
  if (!val) return;

  if (val === norm(PASSWORD)) return unlockVideo();

  $("pwInput").value = "";
  shake();

  if (revealed) return;                       // password already shown, she just types it
  if (lastChance) return revealPassword();    // last try was wrong -> show the password

  tries++;
  addHint(HINTS[tries - 1]);
  renderBlanks();
  setLeft();

  if (tries >= MAX_TRIES) {                   // 5th wrong try -> ask what she wants
    $("pwForm").hidden = true;
    $("pwChoice").hidden = false;
  }
}

function revealPassword() {
  revealed = true;
  renderBlanks();
  setLeft();
  addHint(`The password is ${PASSWORD.toUpperCase()}. Type it to open your surprise 💛`);
  $("pwChoice").hidden = true;
  $("pwForm").hidden = false;
  $("pwInput").focus();
}

function unlockVideo() {
  $("pw").classList.remove("on");
  $("pwDim").classList.remove("on");
  
  const video = $("finVideo");
  video.src = VIDEO;
  video.onerror = () => ($("finNote").hidden = false);
  
  // Automatically try to enter fullscreen when she hits play on the video
  video.onplay = () => {
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(err => console.log("Fullscreen error:", err));
    } else if (video.webkitRequestFullscreen) { /* Safari */
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { /* IE/Edge */
      video.msRequestFullscreen();
    }
  };

  setTimeout(() => {
    $("finale").classList.add("on");
  }, 600);
}

$("pwBtn").onclick = submitPassword;
$("pwInput").onkeydown = (e) => { if (e.key === "Enter") submitPassword(); };
$("lastTryBtn").onclick = () => {
  lastChance = true;
  setLeft();
  $("pwChoice").hidden = true;
  $("pwForm").hidden = false;
  $("pwInput").focus();
};
$("showPwBtn").onclick = revealPassword;

// ---------- STARS ----------
function addStars(el, n) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i"), z = Math.random() * 2 + 1;
    s.className = "star";
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${z}px;height:${z}px;` +
      `--t:${3 + Math.random() * 4}s;animation-delay:-${Math.random() * 6}s` + (Math.random() < 0.2 ? ";background:#E8B84A" : "");
    el.prepend(s);
  }
}
addStars($("lock"), 70);
addStars($("main"), 70);
addStars($("finale"), 70);

// ---------- STARTUP ----------
// Swap feathers for the Krishna images only if ALL three images exist
Promise.all(KRISHNA.map((src) => new Promise((resolve, reject) => {
  const im = new Image();
  im.onload = resolve;
  im.onerror = reject;
  im.src = src;
}))).then(() => document.documentElement.classList.add("has-krishna"))
  .catch(() => {});

preload();
if (MODE === "gifts" || MODE === "password") {
  $("lock").classList.add("hidden");
  showChapters(true);
  if (MODE === "password") setTimeout(showPassword, 800);
} else if (MODE === "intro" || new Date() >= BIRTHDAY) {
  $("lock").classList.add("hidden");
  setTimeout(startIntro, 500);
} else {
  tick();
  clock = setInterval(tick, 1000);
}