// .eleventy.js
module.exports = function (eleventyConfig) {
  // --- passthroughs & watch ---
  eleventyConfig.addPassthroughCopy({ "styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "script": "script" });
  // prevent GitHub Pages’ Jekyll from meddling with /docs
  eleventyConfig.addPassthroughCopy({ ".nojekyll": ".nojekyll" });

  eleventyConfig.addWatchTarget("styles");
  eleventyConfig.addWatchTarget("images");
  eleventyConfig.addWatchTarget("script");

  // --- helpers (deterministic RNG for spanClass) ---
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Filters ---
  // 1) Random span class for grid items (default dist 65/28/7)
  eleventyConfig.addFilter("spanClass", function (index, dist = [65, 28, 7], seed = "rowflow") {
    if (typeof dist === "string") dist = dist.split(",").map(Number);
    const total = dist.reduce((a, b) => a + b, 0) || 100;
    const [p1, p2, p3] = dist.map(n => (n / total) * 100);

    const seedInt = xmur3(`${seed}:${index}`)();
    const r = mulberry32(seedInt)() * 100;
    if (r < p1) return "span-1";
    if (r < p1 + p2) return "span-2";
    return "span-3";
  });

  // 2) Date formatter (Intl)
  eleventyConfig.addFilter("formatDate", function (value, locale = "en-US") {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  });

  // 3) Type helper
  eleventyConfig.addFilter("isArray", v => Array.isArray(v));

  // --- pathPrefix for GitHub Pages subfolder ---
  const PATH_PREFIX =
    process.env.ELEVENTY_PATH_PREFIX ||
    (process.env.ELEVENTY_ENV === "production" ? "/cityassystem_datavisualization/" : "/");

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "docs",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
    pathPrefix: PATH_PREFIX, // <-- key fix
  };
};
