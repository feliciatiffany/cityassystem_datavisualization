// scripts/animation.js
(function () {
  const opts = { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.06 };
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);           // reveal once
      }
    }
  }, opts);

  function attachAll(ctx = document) {
    ctx.querySelectorAll(".reveal:not(.is-visible)").forEach(el => io.observe(el));
  }

  // Observe .reveal elements added later (e.g., holes.js rebuild)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(".reveal")) io.observe(node);
        // Also catch .reveal inside fragments
        node.querySelectorAll?.(".reveal").forEach(n => io.observe(n));
      });
    }
  });

  function init() {
    attachAll(document);
    mo.observe(document.body, { childList: true, subtree: true });
  }

  const prm = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prm.matches) {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
    });
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  // Optional: expose a manual hook if you ever need it
  window.revealAttach = attachAll;
})();
