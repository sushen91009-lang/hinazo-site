// Checks the pages tools/build.mjs made:  node tools/check.mjs
// Every page is there in three languages with the same structure; no link leads nowhere;
// every page names its other two languages for search engines; nothing is written that the
// site must not say.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PAGES = ["index.html", "app.html", "company.html", "contact.html", "privacy.html", "app-privacy.html", "app-support.html"];
const DIRS = { ja: "", zh: "zh/", en: "en/" };
const HREFLANG = { ja: "ja", zh: "zh-Hans", en: "en" };
const problems = [];
const count = (html, tag) => (html.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length;
const TAGS = ["h1", "h2", "h3", "p", "li", "a", "th", "td", "dt", "dd", "section", "video", "img", "table"];

let links = 0;
for (const page of PAGES) {
  const shape = {};
  for (const [lang, dir] of Object.entries(DIRS)) {
    const file = join(ROOT, dir, page);
    if (!existsSync(file)) {
      problems.push(`没有这一页：${dir}${page}`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    shape[lang] = TAGS.map((tag) => count(html, tag)).join(",");
    if (!html.includes(`<html lang="${HREFLANG[lang]}"`)) problems.push(`${dir}${page}：html 的 lang 不对`);
    for (const other of Object.values(HREFLANG)) {
      if (!html.includes(`hreflang="${other}" href="https://hinazou.jp/`)) problems.push(`${dir}${page}：缺少 hreflang ${other}`);
    }
    if (!html.includes('hreflang="x-default"')) problems.push(`${dir}${page}：缺少 x-default`);
    if (!html.includes(`<link rel="canonical" href="https://hinazou.jp/${dir}${page === "index.html" ? "" : page}">`)) problems.push(`${dir}${page}：canonical 不对`);
    // Every link and every file a page uses is there; every #anchor exists on the page it points to.
    for (const match of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:)/.test(target)) continue;
      links += 1;
      const [path, hash] = target.split("#");
      const resolved = path === "" ? file : normalize(join(dirname(file), path.endsWith("/") || path === "." ? `${path}/index.html` : path));
      if (!existsSync(resolved)) {
        problems.push(`${dir}${page}：链接坏了 ${target}`);
        continue;
      }
      if (hash && !readFileSync(resolved, "utf8").includes(`id="${hash}"`)) problems.push(`${dir}${page}：没有这个位置 ${target}`);
    }
    // Not to be said (执行单 第八节), and things that must not come back.
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    for (const banned of ["第一", "唯一", "最准", "No.1", "ナンバーワン", "唯一の", "所有语言", "すべての言語", "all languages", "没网", "离线", "オフライン", "offline", "安卓", "Android", "百分之百", "100%", "100％", "gmail", "Co., Ltd", "Co.,Ltd", "App Store でダウンロード", "Download on the App Store"]) {
      if (text.replace(/第一次/g, "").toLowerCase().includes(banned.toLowerCase())) problems.push(`${dir}${page}：出现了不能写的「${banned}」`);
    }
    if (html.toLowerCase().includes("gmail")) problems.push(`${dir}${page}：还有个人邮箱`);
  }
  if (new Set(Object.values(shape)).size > 1) problems.push(`${page}：三种语言的结构不一样 ${JSON.stringify(shape)}`);
}
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
if ((sitemap.match(/<loc>/g) ?? []).length !== PAGES.length * 3) problems.push("sitemap.xml 的页数不对");
if (!existsSync(join(ROOT, "CNAME")) || readFileSync(join(ROOT, "CNAME"), "utf8").trim() !== "hinazou.jp") problems.push("CNAME 被动过");

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${PAGES.length} 页 × 3 种语言：结构一致，${links} 处链接和文件都在，hreflang 和 canonical 齐全，没有不能写的话。`);
