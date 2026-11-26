/* Which language to show (Rc, 2026-11-26): the first time someone opens the site it follows
   the language of their device — Chinese, English, otherwise Japanese. The buttons at the top
   right change it, and what was chosen there is remembered on that device (script.js).
   Japanese pages are the ones every address without /zh/ or /en/ leads to, so this only ever
   sends someone on from a Japanese page; it runs before the page is drawn. */
(function () {
  var root = document.documentElement;
  if (root.getAttribute("data-lang") !== "ja") return;
  // A search engine reading the Japanese page gets the Japanese page.
  if (/bot|crawl|spider|slurp|preview/i.test(navigator.userAgent || "")) return;
  var want = null;
  try {
    // An address ending in ?lang=ja (or zh, en) asks for that language outright, and it is remembered.
    var asked = /[?&]lang=(ja|zh|en)\b/.exec(window.location.search);
    if (asked) window.localStorage.setItem("hinazou-lang", asked[1]);
    want = asked ? asked[1] : window.localStorage.getItem("hinazou-lang");
  } catch (error) {}
  if (want !== "ja" && want !== "zh" && want !== "en") {
    var first = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
    want = first.indexOf("zh") === 0 ? "zh" : first.indexOf("en") === 0 ? "en" : "ja";
  }
  if (want === "ja") return;
  var to = root.getAttribute("data-alt-" + want);
  if (to) window.location.replace(to + window.location.hash);
})();
