// scripts/holes.js
/* Insert random "holes" per row; one unique word per hole; hover date tooltips; reveal stagger. */
(function () {
  // ---- tiny seeded RNG ----
  function xmur3(str){ let h=1779033703^str.length; for(let i=0;i<str.length;i++){ h=Math.imul(h^str.charCodeAt(i),3432918353); h=(h<<13)|(h>>>19);} return function(){ h=Math.imul(h^(h>>>16),2246822507); h=Math.imul(h^(h>>>13),3266489909); return (h^=h>>>16)>>>0; }; }
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^(a>>>15),1|a); t^=t+Math.imul(t^(t>>>7),61|t); return ((t^(t>>>14))>>>0)/4294967296; }; }

  // ---- helpers ----
  function pickUnique(count, max, rand){
    const s = new Set();
    while (s.size < count && s.size < max) s.add(Math.floor(rand() * max));
    return s;
  }
  function shuffleInPlace(arr, rand){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function parseDateFromTile(tile){
    const data = (tile.getAttribute('data-date')||"").trim();
    if (data) return data;
    const href = tile.querySelector('a')?.getAttribute('href') || "";
    const alt  = tile.querySelector('img')?.getAttribute('alt') || "";
    const cap  = tile.querySelector('figcaption')?.textContent || "";
    const m = (href.match(/\d{4}-\d{2}-\d{2}/) || alt.match(/\d{4}-\d{2}-\d{2}/) || cap.match(/\d{4}-\d{2}-\d{2}/));
    return m ? m[0] : "";
  }
  function makeHole(word){
    const d=document.createElement('div');
    d.className='hole reveal';
    d.setAttribute('role','presentation');
    d.setAttribute('aria-hidden','true');
    const w=document.createElement('span');
    w.className='hole-word';
    w.textContent=word || '';
    w.style.cssText="position:absolute;inset:0;display:grid;place-items:center;font-weight:600;letter-spacing:.02em;color:rgba(255,255,255,.55);text-align:center;padding:6px 10px;";
    d.appendChild(w);
    return d;
  }
  function loadWords(grid){
    // Prefer JSON script (exactly controlled by Nunjucks), else data-attr, else fallback.
    const node = document.getElementById('hole-words');
    if (node) {
      try {
        const arr = JSON.parse(node.textContent);
        if (Array.isArray(arr)) return arr.map(x=>String(x).trim()).filter(Boolean);
      } catch {}
    }
    const attr = grid.dataset.holeWords || '';
    if (attr) return attr.split(',').map(s=>s.trim()).filter(Boolean);
    return ["STORY","HUMAN","WIND","LOVE","EPILOG"];
  }

  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    // controls
    const rate = Math.max(0, Math.min(1, parseFloat(grid.dataset.holeRate || "0.22")));
    const maxHoles = Math.max(0, Math.min(6, parseInt(grid.dataset.maxHoles || "2", 10)));
    const seedStr = grid.dataset.seed || (location.hash.match(/seed=(\w+)/)?.[1] || String(Math.random()));
    const rand = mulberry32(xmur3(seedStr)());

    // words: dedupe → shuffle → consume once
    const uniqueWords = Array.from(new Set(loadWords(grid)));
    const deck = shuffleInPlace(uniqueWords.slice(), rand);
    let deckIdx = 0;
    const nextWord = () => (deckIdx < deck.length ? deck[deckIdx++] : ""); // no repeats

    // columns (respects CSS breakpoints)
    const colCount = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 6;

    // tiles & dates
    const tiles = Array.from(grid.querySelectorAll('.tile'));
    const dates = tiles.map(parseDateFromTile).filter(Boolean);

    // stagger
    let k = 0;
    const stampReveal = (el) => { el.classList.add('reveal'); el.style.setProperty('--reveal-delay', `${(k++ % colCount) * 40}ms`); return el; };

    const frag = document.createDocumentFragment();
    let i = 0;

    while (i < tiles.length) {
      // holes for this row
      let holesCount = 0;
      for (let n = 0; n < colCount; n++) if (rand() < rate) holesCount++;
      holesCount = Math.min(holesCount, maxHoles);

      const holePositions = pickUnique(holesCount, colCount, rand);

      for (let col = 0; col < colCount && i < tiles.length; col++) {
        if (holePositions.has(col)) {
          const hole = stampReveal(makeHole(nextWord()));
          const tipDate = dates.length ? dates[Math.floor(rand() * dates.length)] : "";
          if (tipDate) hole.setAttribute('title', `Date: ${tipDate}`);
          frag.appendChild(hole);
        } else {
          const t = tiles[i++];
          stampReveal(t);
          const d = parseDateFromTile(t);
          if (d) t.setAttribute('title', `Date: ${d}`);
          frag.appendChild(t);
        }
      }
    }

    // pad last partial row with holes
    const remainder = (k % colCount);
    if (remainder !== 0) {
      for (let r = remainder; r < colCount; r++) {
        const hole = stampReveal(makeHole(nextWord()));
        const tipDate = dates.length ? dates[Math.floor(rand() * dates.length)] : "";
        if (tipDate) hole.setAttribute('title', `Date: ${tipDate}`);
        frag.appendChild(hole);
      }
    }

    grid.innerHTML = '';
    grid.appendChild(frag);

    console.info(`holes.js → seed=${seedStr} cols=${colCount} rate=${rate} maxHoles=${maxHoles} words=${uniqueWords.length}`);
  });
})();
