// Makes every page of the site in three languages (Rc, 2026-11-26: 每一页都有中文、英文、日文).
//
//   node tools/build.mjs
//
// Japanese pages stay where they were (/, /company.html, …); Chinese ones are under /zh/,
// English ones under /en/. Every piece of text is written here once as { ja, zh, en }: a text
// missing in one language stops the build, so no language can end up a paragraph short.
// The pages this writes are committed like any other file; nothing runs on the server.
// What is NOT made here and never changed by it: styles.css, script.js, assets/ (the logo is
// the original picture file), CNAME, robots.txt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SITE = "https://hinazou.jp/";
const EMAIL = "info@hinazou.jp";
const TEL = "090-3990-7999";
const TEL_LINK = "+819039907999";

const LANGS = {
  ja: { dir: "", html: "ja", og: "ja_JP", label: "日本語" },
  zh: { dir: "zh/", html: "zh-Hans", og: "zh_CN", label: "中文" },
  en: { dir: "en/", html: "en", og: "en_US", label: "English" },
};
const ORDER = ["ja", "zh", "en"];

let lang = "ja";
/** The text for the language being written. All three must be there. */
function L(text) {
  for (const code of ORDER) {
    if (typeof text?.[code] !== "string" || text[code] === "") throw new Error(`缺少 ${code} 的文字：${JSON.stringify(text).slice(0, 80)}`);
  }
  return text[lang];
}
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** From the folder of the language being written back to the top of the site. */
const up = () => (lang === "ja" ? "" : "../");
/** A link to [file] in [to] (a language), from a page of the language being written. */
function href(file, to = lang) {
  const path = `${up()}${LANGS[to].dir}${file === "index.html" ? "" : file}`;
  return path === "" ? "./" : path;
}
const url = (file, code) => `${SITE}${LANGS[code].dir}${file === "index.html" ? "" : file}`;

// ---------------------------------------------------------------- names and shared texts

const COMPANY = { ja: "雛象株式会社", zh: "雏象", en: "Hinazou Co Ltd" };
const APP_NAME = { ja: "【アプリ名】", zh: "【App名】", en: "[App name]" };
const ADDRESS = {
  ja: '〒530-0047 <span class="nowrap">大阪府大阪市北区</span><span class="nowrap">西天満四丁目8番28号</span>',
  zh: '〒530-0047 <span class="nowrap">日本大阪府大阪市北区</span><span class="nowrap">西天满四丁目8番28号</span>',
  en: '4-8-28 Nishitenma, Kita-ku, <span class="nowrap">Osaka 530-0047, Japan</span>',
};

const NAV = [
  { key: "home", file: "index.html", text: { ja: "ホーム", zh: "首页", en: "Home" } },
  { key: "services", file: "index.html", hash: "#services", text: { ja: "サービス", zh: "服务", en: "Services" } },
  { key: "cases", file: "index.html", hash: "#cases", text: { ja: "導入事例", zh: "案例", en: "Case studies" } },
  { key: "app", file: "app.html", text: { ja: "アプリ", zh: "App", en: "App" } },
  { key: "game", file: "index.html", hash: "#game", text: { ja: "ゲーム", zh: "游戏", en: "Games" } },
  { key: "flow", file: "index.html", hash: "#flow", text: { ja: "ご依頼の流れ", zh: "合作流程", en: "How it works" } },
  { key: "company", file: "company.html", text: { ja: "会社概要", zh: "公司概况", en: "Company" } },
  { key: "contact", file: "contact.html", text: { ja: "お問い合わせ", zh: "联系我们", en: "Contact" }, cta: true },
];

const FOOTER = [
  { file: "index.html", text: { ja: "ホーム", zh: "首页", en: "Home" } },
  { file: "app.html", text: { ja: "アプリ", zh: "App", en: "App" } },
  { file: "company.html", text: { ja: "会社概要", zh: "公司概况", en: "Company" } },
  { file: "contact.html", text: { ja: "お問い合わせ", zh: "联系我们", en: "Contact" } },
  { file: "privacy.html", text: { ja: "プライバシーポリシー", zh: "隐私政策", en: "Privacy policy" } },
  { file: "app-privacy.html", text: { ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" } },
  { file: "app-support.html", text: { ja: "アプリのサポート", zh: "App 支持", en: "App support" } },
];

const CTA = {
  title: { ja: "まずはお気軽にご相談ください", zh: "欢迎先来聊一聊", en: "Talk to us first" },
  text: {
    ja: "SNS運用に関するお悩み、まずはお気軽にご相談ください。現状のアカウント診断から、最適なご提案をいたします。",
    zh: "关于 SNS 运营的任何烦恼，都欢迎先来咨询。我们会从诊断您现在的账号开始，给出最合适的方案。",
    en: "Whatever is on your mind about social media, ask us first. We start by looking at your current account and propose what fits.",
  },
  button: { ja: "お問い合わせはこちら", zh: "联系我们", en: "Contact us" },
};

// ---------------------------------------------------------------- the frame every page sits in

function layout(page) {
  const title = L(page.title);
  const description = L(page.description);
  const home = page.file === "index.html";
  const navLink = (item) => {
    const here = item.file === page.file && !item.hash;
    const target = item.hash ? (home ? item.hash : `${href("index.html")}${item.hash}`) : href(item.file);
    return `          <li${item.cta ? ' class="nav-cta"' : ""}><a href="${target}"${here ? ' aria-current="page"' : ""}>${L(item.text)}</a></li>`;
  };
  const alternates = ORDER.map((code) => `  <link rel="alternate" hreflang="${LANGS[code].html}" href="${url(page.file, code)}">`).join("\n");
  const switcher = ORDER.map(
    (code) => `<a href="${href(page.file, code)}" hreflang="${LANGS[code].html}" lang="${LANGS[code].html}" data-lang="${code}"${code === lang ? ' aria-current="true"' : ""}>${LANGS[code].label}</a>`,
  ).join("");
  const jsonLd = home
    ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "雛象株式会社",
    "alternateName": "Hinazou Co Ltd",
    "url": "${SITE}",
    "logo": "${SITE}assets/hinazo-elephant-transparent.png",
    "telephone": "+81-90-3990-7999",
    "email": "${EMAIL}",
    "foundingDate": "2025-03-28",
    "address": {
      "@type": "PostalAddress",
      "postalCode": "530-0047",
      "addressRegion": "大阪府",
      "addressLocality": "大阪市北区",
      "streetAddress": "西天満四丁目8番28号",
      "addressCountry": "JP"
    }
  }
  </script>`
    : "";
  return `<!DOCTYPE html>
<html lang="${LANGS[lang].html}" data-lang="${lang}" data-alt-zh="${href(page.file, "zh")}" data-alt-en="${href(page.file, "en")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url(page.file, lang)}">
${alternates}
  <link rel="alternate" hreflang="x-default" href="${url(page.file, "ja")}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(L(COMPANY))}">
  <meta property="og:locale" content="${LANGS[lang].og}">
${ORDER.filter((code) => code !== lang).map((code) => `  <meta property="og:locale:alternate" content="${LANGS[code].og}">`).join("\n")}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url(page.file, lang)}">
  <meta property="og:image" content="${SITE}assets/hinazo-elephant-transparent.png">
  <meta property="og:image:width" content="819">
  <meta property="og:image:height" content="819">
  <meta property="og:image:alt" content="${esc(L({ ja: "雛象株式会社のロゴマーク", zh: "雏象的标志", en: "The Hinazou logo mark" }))}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}assets/hinazo-elephant-transparent.png">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="${up()}favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="${up()}favicon.png">
  <link rel="stylesheet" href="${up()}styles.css">
  <script>document.documentElement.classList.add("js");</script>
  <script src="${up()}lang.js"></script>
  <script src="${up()}script.js" defer></script>${jsonLd}
</head>
<body>

  <a class="skip-link" href="#main">${L({ ja: "本文へスキップ", zh: "跳到正文", en: "Skip to content" })}</a>

  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${href("index.html")}">
        <img class="brand-mark" src="${up()}assets/hinazo-elephant-transparent.png" width="819" height="819" alt="">
        <span class="brand-text">
          <span class="brand-jp">${L(COMPANY) === "Hinazou Co Ltd" ? "Hinazou Co Ltd" : L(COMPANY)}</span>
          <span class="brand-en">${lang === "en" ? "雛象株式会社" : "Hinazou Co Ltd"}</span>
        </span>
      </a>
      <div class="lang-switch" role="group" aria-label="${L({ ja: "言語", zh: "语言", en: "Language" })}">${switcher}</div>
      <button type="button" class="menu-button" aria-expanded="false" aria-controls="site-nav">
        <span class="menu-icon" aria-hidden="true"></span>
        <span>${L({ ja: "メニュー", zh: "菜单", en: "Menu" })}</span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="${L({ ja: "メインメニュー", zh: "主菜单", en: "Main menu" })}">
        <ul>
${NAV.map(navLink).join("\n")}
        </ul>
      </nav>
    </div>
  </header>

  <main id="main">
${page.body()}
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-inner">
        <div>
          <p class="footer-name">${L(COMPANY)}</p>
          <p class="footer-en">${lang === "en" ? "雛象株式会社" : "Hinazou Co Ltd"}</p>
          <p>${L(ADDRESS)}</p>
        </div>
        <nav class="footer-nav" aria-label="${L({ ja: "フッターメニュー", zh: "页脚菜单", en: "Footer menu" })}">
          <ul>
${FOOTER.map((item) => `            <li><a href="${href(item.file)}"${item.file === page.file ? ' aria-current="page"' : ""}>${L(item.text)}</a></li>`).join("\n")}
          </ul>
        </nav>
      </div>
      <p class="copyright">© 2026 雛象株式会社 Hinazou Co Ltd</p>
    </div>
  </footer>

</body>
</html>
`;
}

const pageHead = (title) => `    <div class="page-head">
      <div class="wrap">
        <h1>${L(title)}</h1>
      </div>
    </div>
`;

const ctaBand = () => `    <section class="cta" aria-labelledby="cta-title">
      <div class="wrap">
        <h2 id="cta-title">${L(CTA.title)}</h2>
        <p>${L(CTA.text)}</p>
        <div class="btn-row">
          <a class="btn btn--light" href="${href("contact.html")}">${L(CTA.button)}</a>
        </div>
      </div>
    </section>`;

const cards = (items, numbered) =>
  items
    .map(
      (item, index) => `          <li class="card">
${numbered ? `            <span class="card-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>\n` : ""}            <h3>${L(item.title)}</h3>
            <p>${L(item.text)}</p>
          </li>`,
    )
    .join("\n");

// ---------------------------------------------------------------- home

const SERVICES = [
  {
    title: { ja: "IPアカウント構築", zh: "IP 账号搭建", en: "Building a character account" },
    text: {
      ja: "店舗やブランドの個性を掘り下げ、ファンに愛される「キャラクター」としてのアカウントを企画・立ち上げます。コンセプト設計、プロフィール作成、投稿方針まで丁寧に整えます。",
      zh: "深入挖掘店铺和品牌的个性，策划并建立一个让粉丝喜欢的「人设」账号。从概念设计、主页资料到发帖方针，一项一项仔细做好。",
      en: "We dig into what makes your shop or brand itself, then plan and launch an account with a character fans can love: concept, profile and posting policy, each done with care.",
    },
  },
  {
    title: { ja: "店舗アカウント運用代行", zh: "店铺账号代运营", en: "Running your shop's account" },
    text: {
      ja: "企画・撮影・編集・投稿・コメント対応まで、日々の運用をまるごとお任せいただけます。各プラットフォームの特性に合わせ、継続的に成果を積み上げます。",
      zh: "策划、拍摄、剪辑、发布、回复评论，日常运营可以整个交给我们。按各个平台的特点来做，持续把成果积累起来。",
      en: "Planning, shooting, editing, posting and answering comments: you can leave the daily work to us. We work to each platform's nature and build results steadily.",
    },
  },
  {
    title: { ja: "集客改善コンサルティング", zh: "引流改善咨询", en: "Consulting to bring in more customers" },
    text: {
      ja: "「投稿しているのに伸びない」アカウントを分析し、課題を明確にしたうえで改善策をご提案。数字に基づいた運用で、フォロワーと来店につなげます。",
      zh: "分析「一直在发却涨不起来」的账号，把问题找清楚，再提出改善方案。用数据说话的运营，把粉丝变成到店的客人。",
      en: "We analyse accounts that post but do not grow, make the problems clear and propose what to change. Work based on the numbers turns followers into visits.",
    },
  },
];

const CASES = [
  { poster: "video1", preload: "metadata", title: { ja: "海鮮店「艇鮮匯」の導入事例", zh: "海鲜店「艇鲜汇」的案例", en: "Case study: the seafood restaurant 艇鮮匯" } },
  { poster: "video2", preload: "metadata", title: { ja: "初心者とプロチーム、<br>立ち上げの違い", zh: "新手和专业团队，<br>起步时的差别", en: "A beginner and a professional team:<br>how the start differs" } },
  { poster: "video3", preload: "none", title: { ja: "視聴者1万人のライブ配信ルーム構築", zh: "搭建一万人观看的直播间", en: "Building a live stream room with 10,000 viewers" } },
  { poster: "video6", preload: "none", title: { ja: "成果ハイライト", zh: "成果集锦", en: "Results highlights" } },
];

const STRENGTHS = [
  {
    title: { ja: "立ち上げから改善まで一貫対応", zh: "从起步到改善，一家做到底", en: "From launch to improvement, one company" },
    text: {
      ja: "アカウントの構築、日々の運用、集客の改善までを一社で一貫してサポートします。",
      zh: "账号搭建、日常运营、引流改善，都由我们一家连贯地支持。",
      en: "Building the account, running it day to day and improving how it brings in customers: all supported by one company, start to finish.",
    },
  },
  {
    title: { ja: "プラットフォームに合わせた運用", zh: "按平台来运营", en: "Run to suit each platform" },
    text: {
      ja: "小紅書・TikTok・Instagramを中心に、各プラットフォームの特性に合わせて運用します。",
      zh: "以小红书、TikTok、Instagram 为中心，按各个平台的特点来运营。",
      en: "Centred on Xiaohongshu, TikTok and Instagram, we run each account the way its platform works.",
    },
  },
  {
    title: { ja: "数字に基づいた改善", zh: "根据数据来改善", en: "Improvement based on numbers" },
    text: {
      ja: "アカウントを分析して課題を明確にし、数字に基づいた運用で改善を重ねます。",
      zh: "分析账号、把问题找清楚，用数据说话的运营一步一步改善。",
      en: "We analyse the account, make the problems clear, and improve step by step with work based on the numbers.",
    },
  },
];

const FLOW = [
  {
    title: { ja: "お問い合わせ", zh: "联系我们", en: "Get in touch" },
    text: { ja: "メールまたはお電話で、まずはお気軽にご相談ください。", zh: "发邮件或打电话都可以，欢迎先来咨询。", en: "By e-mail or phone: ask us first, without obligation." },
  },
  {
    title: { ja: "現状のアカウント診断", zh: "诊断现在的账号", en: "A look at your current account" },
    text: { ja: "現在のアカウントの状況を確認し、課題を明確にします。", zh: "确认账号现在的情况，把问题找清楚。", en: "We check how your account stands now and make the problems clear." },
  },
  {
    title: { ja: "ご提案", zh: "提出方案", en: "Our proposal" },
    text: { ja: "診断の内容をもとに、最適なプランをご提案いたします。", zh: "根据诊断的结果，提出最合适的方案。", en: "From what we found, we propose the plan that fits best." },
  },
  {
    title: { ja: "構築・運用・改善", zh: "搭建、运营、改善", en: "Build, run, improve" },
    text: {
      ja: "アカウントの構築や日々の運用を進めながら、継続的に改善していきます。",
      zh: "一边搭建账号、做日常运营，一边持续改善。",
      en: "We build the account and run it day to day, improving as we go.",
    },
  },
];

function homeBody() {
  const business = [
    {
      to: "#services",
      label: { ja: "メディア事業", zh: "媒体业务", en: "Media" },
      title: { ja: "SNS運用コンサルティング", zh: "SNS 运营咨询", en: "Social media consulting" },
      text: {
        ja: "小紅書・TikTok・Instagramで、お店の“顔”を育てる。",
        zh: "在小红书、TikTok、Instagram 上，把店铺的门面养起来。",
        en: "Build your shop's presence on Xiaohongshu, TikTok and Instagram.",
      },
    },
    {
      to: href("app.html"),
      badge: { ja: "ベータテスト中", zh: "内测中", en: "Beta" },
      label: { ja: "AIプロダクト事業", zh: "AI 产品", en: "AI Products" },
      title: { ja: `翻訳アプリ${APP_NAME.ja}`, zh: `翻译 App${APP_NAME.zh}`, en: `Translation app ${APP_NAME.en}` },
      text: {
        ja: "対面の会話も、スマホの画面も、長い説明も。",
        zh: "面对面的对话、手机屏幕、长篇讲解，都能翻。",
        en: "Conversations, screens and long explanations.",
      },
    },
    {
      to: "#game",
      label: { ja: "ゲーム", zh: "游戏", en: "Games" },
      title: { ja: "ゲーム＆チャージ", zh: "游戏与充值", en: "Games & top-ups" },
      text: { ja: "準備中。", zh: "准备中。", en: "Coming soon." },
    },
  ];
  return `    <section class="hero">
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <p class="eyebrow">${L({ ja: "AI × メディア", zh: "AI × 媒体", en: "AI × Media" })}</p>
          <h1>${L({
            ja: "AIとメディアで、<span class=\"nowrap\">小さな雛形を、</span><span class=\"nowrap\">大きなかたちへ。</span>",
            zh: "用 AI 和媒体，<span class=\"nowrap\">让每一个雏形，</span><span class=\"nowrap\">长成万千气象。</span>",
            en: "With AI and media, every small beginning grows into something great.",
          })}</h1>
          <p class="hero-sub">${L({
            ja: "雛象は、AIとメディアをかけ合わせる会社です。店舗のSNS運用を支援し、海外で暮らす人のための翻訳アプリを開発しています。",
            zh: "雏象是一家把 AI 和媒体合在一起的公司：帮店铺做 SNS 运营，做给海外生活的人用的翻译 App。",
            en: "Hinazou brings AI and media together: we run social media for shops, and we build a translation app for people living abroad.",
          })}</p>
          <div class="btn-row">
            <a class="btn" href="#services">${L({ ja: "サービスを見る", zh: "看服务", en: "See our services" })}</a>
            <a class="btn btn--outline" href="${href("app.html")}">${L({ ja: "アプリを見る", zh: "看 App", en: "See the app" })}</a>
            <a class="btn btn--outline" href="${href("contact.html")}">${L({ ja: "無料相談はこちら", zh: "免费咨询", en: "Free consultation" })}</a>
          </div>
        </div>
        <div class="hero-media">
          <img class="hero-fallback" src="${up()}assets/videos/video4.jpg" alt="">
          <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="${up()}assets/videos/video4.jpg">
            <source src="${up()}assets/videos/video4_hero.mp4" type="video/mp4">
          </video>
        </div>
      </div>
    </section>

    <section class="section section--cream" id="business" aria-labelledby="business-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="business-title">${L({ ja: "事業紹介", zh: "业务介绍", en: "What we do" })}</h2>
        </header>
        <ul class="card-grid biz-grid">
${business
  .map(
    (item) => `          <li class="card biz-card">
            <a class="biz-link" href="${item.to}">
              <span class="biz-label">${L(item.label)}${item.badge ? ` <span class="badge">${L(item.badge)}</span>` : ""}</span>
              <h3>${L(item.title)}</h3>
              <p>${L(item.text)}</p>
            </a>
          </li>`,
  )
  .join("\n")}
        </ul>
      </div>
    </section>

    <section class="section" id="services" aria-labelledby="services-title">
      <div class="wrap">
        <header class="section-head">
          <p class="eyebrow">${L({ ja: "メディア事業", zh: "媒体业务", en: "Media" })}</p>
          <h2 id="services-title">${L({ ja: "サービス", zh: "服务", en: "Services" })}</h2>
          <p class="section-tagline">${L({ ja: "SNSで、お店の“顔”を育てる。", zh: "用 SNS，把店铺的门面养起来。", en: "Give your shop a face on social media." })}</p>
          <p class="lead">${L({
            ja: "ブランドの魅力を、届くべき人へ。戦略から実行まで伴走します。",
            zh: "把品牌的魅力，送到该看到的人面前。从策略到执行，我们一路陪跑。",
            en: "Your brand's appeal, in front of the people it should reach. We go with you from strategy to execution.",
          })}</p>
        </header>
        <ul class="card-grid">
${cards(SERVICES, true)}
        </ul>
      </div>
    </section>

    <section class="section section--cream" id="cases" aria-labelledby="cases-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="cases-title">${L({ ja: "導入事例", zh: "案例", en: "Case studies" })}</h2>
          <p class="lead">${L({
            ja: "さまざまな業種のお客様と、成果を形にしてきました。",
            zh: "我们和各行各业的客户一起，把成果做了出来。",
            en: "With clients in many lines of business, we have turned work into results.",
          })}</p>
        </header>
        <ul class="case-grid">
${CASES.map(
  (item, index) => `          <li class="case-card">
            <div class="case-video">
              <video controls muted playsinline preload="${item.preload}" poster="${up()}assets/videos/${item.poster}.jpg" aria-labelledby="case-${index + 1}-title">
                <source src="${up()}assets/videos/${item.poster}.mp4" type="video/mp4">
              </video>
            </div>
            <h3 id="case-${index + 1}-title">${L(item.title)}</h3>
          </li>`,
).join("\n")}
        </ul>
      </div>
    </section>

    <section class="section" id="game" aria-labelledby="game-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="game-title">${L({ ja: "ゲーム", zh: "游戏", en: "Games" })}</h2>
          <p class="lead">${L({
            ja: "遊んで、つながる。雛象の新しいエンターテインメント。",
            zh: "一起玩，连在一起。雏象的新娱乐。",
            en: "Play, and connect. New entertainment from Hinazou.",
          })}</p>
        </header>
        <div class="game-row">
          <article class="game-video-card">
            <div class="game-video">
              <video controls playsinline preload="metadata" poster="${up()}assets/videos/video5.jpg">
                <source src="${up()}assets/videos/video5.mp4" type="video/mp4">
              </video>
            </div>
            <h3>${L({ ja: "eスポーツ大会ハイライト", zh: "电竞比赛集锦", en: "E-sports tournament highlights" })}</h3>
          </article>
          <div class="game-card">
            <p class="game-badge">COMING SOON</p>
            <p class="game-title">${L({ ja: "ゲーム＆チャージ 準備中", zh: "游戏与充值 准备中", en: "Games & top-ups: coming soon" })}</p>
            <p>${L({
              ja: "ゲームのプレイやチャージができるページを準備しています。公開まで、今しばらくお待ちください。",
              zh: "可以玩游戏、充值的页面正在准备。公开之前，请再等一等。",
              en: "We are preparing a page where you can play games and top up. Please wait a little longer until it opens.",
            })}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--cream" id="strengths" aria-labelledby="strengths-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="strengths-title">${L({ ja: "雛象の強み", zh: "雏象的长处", en: "Why Hinazou" })}</h2>
        </header>
        <ul class="card-grid">
${cards(STRENGTHS, false)}
        </ul>
      </div>
    </section>

    <section class="section" id="flow" aria-labelledby="flow-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="flow-title">${L({ ja: "ご依頼の流れ", zh: "合作流程", en: "How it works" })}</h2>
        </header>
        <ol class="flow">
${FLOW.map(
  (item) => `          <li>
            <h3>${L(item.title)}</h3>
            <p>${L(item.text)}</p>
          </li>`,
).join("\n")}
        </ol>
      </div>
    </section>

${ctaBand()}`;
}

// ---------------------------------------------------------------- the app

const APP_FEATURES = [
  {
    key: "talk",
    title: { ja: "対面翻訳", zh: "对话翻译", en: "Face-to-face translation" },
    text: {
      ja: "話し終わるとすぐ翻訳して、読み上げます。スマホを机に置けば、画面が二つに分かれ、相手側の文字は相手の向きに表示されます。",
      zh: "说完就翻，自动读出来。手机放在桌上，屏幕分成两半，对方那一半的字朝着对方。",
      en: "It translates and reads aloud as soon as you finish speaking. Put the phone on the table: the screen splits in two, and the other person's half faces them.",
    },
    // A drawing of the idea, not a picture of the app.
    sketch: () => `<div class="sketch sketch--talk" aria-hidden="true"><span class="sketch-half sketch-half--far">${L({ ja: "相手", zh: "对方", en: "Them" })}</span><span class="sketch-half">${L({ ja: "自分", zh: "自己", en: "You" })}</span></div>`,
  },
  {
    key: "screen",
    title: { ja: "画面翻訳", zh: "屏幕翻译", en: "Screen translation" },
    text: {
      ja: "折りたたみiPhoneの左右分割で、片方に元のアプリ、もう片方に翻訳を表示。ページをめくれば翻訳もついてきます。スクリーンショットは不要です。",
      zh: "折叠屏左右分屏，一边是原来的 App，一边是译文。翻页译文跟着走，不用截图。",
      en: "On a foldable iPhone, the original app sits on one side and the translation on the other. Turn the page and the translation follows. No screenshots.",
    },
    sketch: () => `<div class="sketch sketch--screen" aria-hidden="true"><span class="sketch-half">${L({ ja: "元のアプリ", zh: "原来的 App", en: "Original app" })}</span><span class="sketch-half sketch-half--tint">${L({ ja: "翻訳", zh: "译文", en: "Translation" })}</span></div>`,
  },
  {
    key: "listen",
    title: { ja: "リスニング字幕", zh: "旁听", en: "Live captions" },
    text: {
      ja: "説明会や会議、窓口での長い説明を、その場で字幕に。直前の数分をまとめたり、「締め切りはいつ？」と聞き返したりできます。",
      zh: "说明会、会议、窗口的长篇讲解，当场变成字幕。可以总结最近几分钟，也可以直接问“截止日期是几号”。",
      en: "Briefings, meetings and long explanations at a counter become captions on the spot. Get a summary of the last few minutes, or just ask, “When is the deadline?”",
    },
    sketch: () => `<div class="sketch sketch--listen" aria-hidden="true"><span class="sketch-line"></span><span class="sketch-line sketch-line--short"></span><span class="sketch-line"></span><span class="sketch-line sketch-line--tint"></span></div>`,
  },
];

const APP_SCENES = [
  { ja: "役所・病院・銀行の窓口", zh: "市役所、医院、银行的窗口", en: "City hall, hospital and bank counters" },
  { ja: "部屋探し", zh: "租房", en: "Apartment hunting" },
  { ja: "学校の説明会", zh: "学校说明会", en: "School briefings" },
  { ja: "職場の会議", zh: "公司会议", en: "Work meetings" },
  { ja: "現地アプリやお知らせの画面", zh: "当地 App 和通知", en: "Local apps and notices" },
];

const APP_SMALL = [
  {
    title: { ja: "聞き間違いの修正", zh: "纠正", en: "Fix a misheard word" },
    text: { ja: "「AじゃなくてB」と言えば、その一語だけ直します。", zh: "听错了，说“不是 A 是 B”，只改那一个词。", en: "Say “not A, B” and only that word changes." },
  },
  {
    title: { ja: "お気に入り", zh: "收藏", en: "Favorites" },
    text: { ja: "大事な文を保存して、あとで見返せます。", zh: "重要的句子收藏起来，回头再看。", en: "Save important sentences and come back to them." },
  },
];

const APP_STATUS = [
  { name: { ja: "対応言語", zh: "语言", en: "Languages" }, value: { ja: "中国語 ⇔ 日本語、英語", zh: "中文 ⇔ 日语、英语", en: "Chinese ⇔ Japanese, English" } },
  { name: { ja: "対応端末", zh: "设备", en: "Device" }, value: { ja: "iPhone（折りたたみ機種に最適化）", zh: "iPhone（为折叠屏机型优化）", en: "iPhone (optimised for foldable models)" } },
  {
    name: { ja: "現在", zh: "现在", en: "Status" },
    value: {
      ja: "ベータテスト中。招待コードでご利用いただけます。App Store 公開準備中。",
      zh: "内测中，凭邀请码使用，App Store 上架准备中。",
      en: "In beta, used with an invitation code. App Store release in preparation.",
    },
  },
];

function appBody() {
  return `    <section class="hero hero--app">
      <div class="wrap app-hero">
        <p class="eyebrow">${L({ ja: `翻訳アプリ${APP_NAME.ja}`, zh: `翻译 App${APP_NAME.zh}`, en: `Translation app ${APP_NAME.en}` })} <span class="badge">${L({ ja: "ベータテスト中", zh: "内测中", en: "Beta" })}</span></p>
        <h1>${L({
          ja: "聞き取れない、読めない、話せない。<span class=\"nowrap\">そのすべてを、</span><span class=\"nowrap\">スマホひとつで。</span>",
          zh: "听不懂、看不懂、说不出？<span class=\"nowrap\">一台手机全解决。</span>",
          en: "Can't follow, can't read, can't reply? One phone handles it all.",
        })}</h1>
        <p class="hero-sub">${L({
          ja: "海外で暮らす人のための翻訳アプリ（ベータテスト中）",
          zh: "为海外生活的人做的翻译 App（内测中）",
          en: "A translation app for people living abroad (in beta)",
        })}</p>
        <div class="btn-row">
          <a class="btn" href="${href("contact.html")}">${L({ ja: "テストに参加する", zh: "申请内测", en: "Join the beta" })}</a>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="features-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="features-title">${L({ ja: "三つの機能", zh: "三个功能", en: "Three features" })}</h2>
        </header>
        <ul class="card-grid feature-grid">
${APP_FEATURES.map(
  (item, index) => `          <li class="card feature-card">
            ${item.sketch()}
            <span class="card-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
            <h3>${L(item.title)}</h3>
            <p>${L(item.text)}</p>
          </li>`,
).join("\n")}
        </ul>
        <p class="sketch-note">${L({
          ja: "※ 上の図はしくみを示すイメージです。実際の画面の写真は、準備ができしだい掲載します。",
          zh: "※ 上面的图是说明原理的示意图。实际画面的截图，准备好以后再放上来。",
          en: "* The drawings above only show the idea. Pictures of the real screens will be added when they are ready.",
        })}</p>
      </div>
    </section>

    <section class="section section--cream" aria-labelledby="scenes-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="scenes-title">${L({ ja: "こんな場面で", zh: "用在这些时候", en: "Where it helps" })}</h2>
        </header>
        <ul class="scene-list">
${APP_SCENES.map((item) => `          <li>${L(item)}</li>`).join("\n")}
        </ul>
      </div>
    </section>

    <section class="section" aria-labelledby="small-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="small-title">${L({ ja: "ほかにも", zh: "还有", en: "Also" })}</h2>
        </header>
        <ul class="card-grid card-grid--two">
${cards(APP_SMALL, false)}
        </ul>
      </div>
    </section>

    <section class="section section--cream" aria-labelledby="status-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="status-title">${L({ ja: "現在の状況", zh: "现在的情况", en: "Where things stand" })}</h2>
        </header>
        <table class="info-table">
          <tbody>
${APP_STATUS.map(
  (item) => `            <tr>
              <th scope="row">${L(item.name)}</th>
              <td>${L(item.value)}</td>
            </tr>`,
).join("\n")}
          </tbody>
        </table>
        <p class="links-row"><a class="text-link" href="${href("app-support.html")}">${L({ ja: "アプリのサポート", zh: "App 支持", en: "App support" })}</a> <a class="text-link" href="${href("app-privacy.html")}">${L({ ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" })}</a></p>
      </div>
    </section>

    <section class="cta" aria-labelledby="cta-title">
      <div class="wrap">
        <h2 id="cta-title">${L({ ja: "テストに参加したい方へ", zh: "想参加内测", en: "Want to join the beta?" })}</h2>
        <p>${L({ ja: "テストに参加したい方は、お気軽にご連絡ください。", zh: "想参加内测，欢迎联系我们。", en: "To join the beta, get in touch." })}</p>
        <div class="btn-row">
          <a class="btn btn--light" href="${href("contact.html")}">${L({ ja: "テストに参加する", zh: "申请内测", en: "Join the beta" })}</a>
        </div>
      </div>
    </section>`;
}

function appSupportBody() {
  const faq = [
    {
      q: { ja: "どうすれば使えますか。", zh: "怎么才能用上？", en: "How can I use it?" },
      a: {
        ja: "現在はベータテスト中で、招待コードをお持ちの方にご利用いただいています。参加をご希望の方は、下記の連絡先までご連絡ください。",
        zh: "现在是内测阶段，凭邀请码使用。想参加的话，请按下面的方式联系我们。",
        en: "The app is in beta and is used with an invitation code. If you would like to take part, contact us as shown below.",
      },
    },
    {
      q: { ja: "どの端末で使えますか。", zh: "哪些设备能用？", en: "Which devices does it run on?" },
      a: { ja: "iPhone でご利用いただけます（折りたたみ機種に最適化しています）。", zh: "iPhone（为折叠屏机型优化）。", en: "iPhone (optimised for foldable models)." },
    },
    {
      q: { ja: "どの言語に対応していますか。", zh: "支持哪些语言？", en: "Which languages does it handle?" },
      a: { ja: "中国語と日本語、中国語と英語のあいだの翻訳に対応しています。", zh: "中文和日语之间、中文和英语之间的翻译。", en: "Translation between Chinese and Japanese, and between Chinese and English." },
    },
    {
      q: { ja: "App Store からダウンロードできますか。", zh: "能从 App Store 下载吗？", en: "Can I download it from the App Store?" },
      a: { ja: "App Store での公開は準備中です。", zh: "App Store 上架还在准备中。", en: "The App Store release is in preparation." },
    },
    {
      q: { ja: "不具合を見つけた、または使い方がわからないときは。", zh: "发现了问题，或者不知道怎么用？", en: "I found a problem, or I am not sure how to use it." },
      a: {
        ja: "下記の連絡先まで、どの画面で何が起きたかをお知らせください。",
        zh: "请按下面的方式联系我们，告诉我们是在哪个画面、发生了什么。",
        en: "Contact us as shown below and tell us on which screen it happened and what happened.",
      },
    },
  ];
  return `${pageHead({ ja: "アプリのサポート", zh: "App 支持", en: "App support" })}
    <section class="section" aria-label="${L({ ja: "サポート", zh: "支持", en: "Support" })}">
      <div class="wrap prose">
        <p>${L({
          ja: `翻訳アプリ${APP_NAME.ja}（ベータテスト中）についてのお問い合わせ先と、よくあるご質問です。`,
          zh: `翻译 App${APP_NAME.zh}（内测中）的联系方式和常见问题。`,
          en: `How to reach us about the translation app ${APP_NAME.en} (in beta), and common questions.`,
        })}</p>

        <h2>${L({ ja: "お問い合わせ先", zh: "怎么联系", en: "How to reach us" })}</h2>
        <dl>
          <dt>${L({ ja: "メール", zh: "邮箱", en: "E-mail" })}</dt>
          <dd><a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a></dd>
          <dt>${L({ ja: "運営", zh: "运营方", en: "Operated by" })}</dt>
          <dd>雛象株式会社（Hinazou Co Ltd）</dd>
        </dl>

        <h2>${L({ ja: "よくあるご質問", zh: "常见问题", en: "Common questions" })}</h2>
${faq.map((item) => `        <h3 class="faq-q">${L(item.q)}</h3>\n        <p>${L(item.a)}</p>`).join("\n")}

        <p class="links-row"><a class="text-link" href="${href("app.html")}">${L({ ja: "アプリの紹介へ", zh: "App 介绍", en: "About the app" })}</a> <a class="text-link" href="${href("app-privacy.html")}">${L({ ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" })}</a></p>
      </div>
    </section>`;
}

// The app's privacy policy (Rc 2026-11-27: the Chinese text is final and word for word; the Japanese
// and English are translations of it). The three texts live in tools/policy/app-privacy.{zh,ja,en}.md.
// The date it was made is the day it went online: change POLICY_DATE when the date changes.
const POLICY_DATE = { ja: "2026年11月27日", zh: "2026年11月27日", en: "November 27, 2026" };
const POLICY_TEXT = Object.fromEntries(
  ORDER.map((code) => [code, readFileSync(new URL(`./policy/app-privacy.${code}.md`, import.meta.url), "utf8")]),
);

/** The policy file of the language being written, as HTML: only what those files use
 *  (a first-line title, **numbered titles**, (1) sub-titles, - lists, paragraphs, **bold**). */
function policyHtml() {
  let text = POLICY_TEXT[lang];
  text = text.replace(/【上线当天的日期】|【公開当日の日付】|\[Date of publication\]/, POLICY_DATE[lang]);
  if (/【|\[Date/.test(text)) throw new Error("隐私政策里还有没填的占位");
  const inline = (line) =>
    esc(line)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/info@hinazou\.jp/g, `<a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a>`);
  const blocks = text
    .replace(/^# .*\n/, "")
    .trim()
    .split(/\n{2,}/);
  // The closing sentence about which version prevails is already written by the page itself.
  if (/正本とします|Japanese version prevails/.test(blocks[blocks.length - 1])) blocks.pop();
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    let paragraph = [];
    let list = [];
    const flush = () => {
      if (paragraph.length) out.push(`<p>${paragraph.map(inline).join("<br>\n")}</p>`);
      if (list.length) out.push(`<ul>\n${list.map((item) => `  <li>${inline(item)}</li>`).join("\n")}\n</ul>`);
      paragraph = [];
      list = [];
    };
    for (const line of lines) {
      if (/^\*\*\d+\. .+\*\*$/.test(line)) {
        flush();
        out.push(`<h2>${inline(line.replace(/^\*\*|\*\*$/g, ""))}</h2>`);
      } else if (/^\(\d+\) /.test(line)) {
        flush();
        out.push(`<h3>${inline(line)}</h3>`);
      } else if (line.startsWith("- ")) {
        if (paragraph.length) flush();
        list.push(line.slice(2));
      } else {
        if (list.length) flush();
        paragraph.push(line);
      }
    }
    flush();
  }
  return out.map((line) => `        ${line.replace(/\n/g, "\n        ")}`).join("\n");
}

function appPrivacyBody() {
  return `${pageHead({ ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" })}
    <section class="section" aria-label="${L({ ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" })}">
      <div class="wrap prose">
${policyHtml()}
        <p class="lang-note">${L({
          ja: "本ポリシーは日本語版を正とします。",
          zh: "本政策有日文、中文、英文三个版本，内容以日文版为准。",
          en: "This policy is published in Japanese, Chinese and English. The Japanese version prevails.",
        })}</p>
      </div>
    </section>`;
}

// ---------------------------------------------------------------- company, contact, privacy

function companyBody() {
  const rows = [
    [{ ja: "商号", zh: "公司名称", en: "Company name" }, { ja: "雛象株式会社<br>Hinazou Co Ltd", zh: "雛象株式会社（雏象）<br>Hinazou Co Ltd", en: "Hinazou Co Ltd<br>雛象株式会社" }],
    [{ ja: "設立", zh: "成立", en: "Founded" }, { ja: "令和7年3月28日", zh: "2025年3月28日", en: "March 28, 2025" }],
    [{ ja: "資本金", zh: "注册资本", en: "Capital" }, { ja: "3,000万円", zh: "3,000 万日元", en: "JPY 30,000,000" }],
    [{ ja: "代表取締役", zh: "代表董事", en: "Representative Director" }, { ja: "鄭栄春（テイ エイシュン）", zh: "郑荣春", en: "鄭栄春 (Tei Eishun)" }],
    [{ ja: "所在地", zh: "地址", en: "Address" }, { ja: `〒530-0047<br>${ADDRESS.ja.replace("〒530-0047 ", "")}`, zh: `〒530-0047<br>${ADDRESS.zh.replace("〒530-0047 ", "")}`, en: ADDRESS.en }],
    [{ ja: "TEL", zh: "电话", en: "Tel" }, { ja: `<a class="text-link" href="tel:${TEL_LINK}">${TEL}</a>`, zh: `<a class="text-link" href="tel:${TEL_LINK}">${TEL}</a>`, en: `<a class="text-link" href="tel:${TEL_LINK}">+81 90-3990-7999</a>` }],
    [{ ja: "Email", zh: "邮箱", en: "E-mail" }, { ja: `<a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a>`, zh: `<a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a>`, en: `<a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a>` }],
  ];
  const business = [
    { ja: "IPアカウント構築", zh: "IP 账号搭建", en: "Building character accounts" },
    { ja: "店舗アカウント運用代行", zh: "店铺账号代运营", en: "Running shop accounts" },
    { ja: "集客改善コンサルティング", zh: "引流改善咨询", en: "Consulting to bring in more customers" },
    { ja: "AI翻訳アプリの企画・開発・運営", zh: "AI 翻译 App 的策划、开发、运营", en: "Planning, development and operation of an AI translation app" },
  ];
  return `${pageHead({ ja: "会社概要", zh: "公司概况", en: "Company" })}
    <section class="section" aria-label="${L({ ja: "会社情報", zh: "公司信息", en: "Company information" })}">
      <div class="wrap">
        <table class="info-table">
          <tbody>
${rows
  .map(
    ([name, value]) => `            <tr>
              <th scope="row">${L(name)}</th>
              <td>${L(value)}</td>
            </tr>`,
  )
  .join("\n")}
            <tr>
              <th scope="row">${L({ ja: "事業内容", zh: "业务内容", en: "Business" })}</th>
              <td>
                <ul>
${business.map((item) => `                  <li>${L(item)}</li>`).join("\n")}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

${ctaBand()}`;
}

function contactBody() {
  return `${pageHead({ ja: "お問い合わせ", zh: "联系我们", en: "Contact" })}
    <section class="section" aria-label="${L({ ja: "お問い合わせ方法", zh: "联系方式", en: "Ways to reach us" })}">
      <div class="wrap">
        <header class="section-head">
          <p class="lead">${L({
            ja: "SNS運用に関するお悩みも、翻訳アプリのテスト参加のご希望も、まずはお気軽にご連絡ください。",
            zh: "SNS 运营的烦恼，或者想参加翻译 App 的内测，都欢迎先联系我们。",
            en: "Questions about social media, or a wish to join the beta of the translation app: get in touch with us first.",
          })}</p>
        </header>

        <div class="contact-grid">
          <div class="contact-card">
            <h2>${L({ ja: "メールでのお問い合わせ", zh: "发邮件", en: "By e-mail" })}</h2>
            <p>${L({ ja: "下のボタンからメールソフトが開きます。", zh: "点下面的按钮会打开邮件软件。", en: "The button below opens your mail app." })}</p>
            <a class="btn" href="mailto:${EMAIL}">${EMAIL}</a>
          </div>
          <div class="contact-card">
            <h2>${L({ ja: "お電話でのお問い合わせ", zh: "打电话", en: "By phone" })}</h2>
            <p>${L({
              ja: "スマートフォンでは、下のボタンからそのまま発信できます。",
              zh: "用手机的话，点下面的按钮可以直接拨打。",
              en: "On a phone, the button below dials directly.",
            })}</p>
            <a class="btn btn--outline" href="tel:${TEL_LINK}">${lang === "en" ? "+81 90-3990-7999" : TEL}</a>
          </div>
        </div>

        <div class="note">
          <h2>${L({ ja: "個人情報の取扱いについて", zh: "关于个人信息", en: "About your personal information" })}</h2>
          <p>${L({
            ja: `お問い合わせの際にいただいた個人情報は、<a class="text-link" href="${href("privacy.html", "ja")}">プライバシーポリシー</a>に基づいて取り扱います。`,
            zh: `您联系我们时提供的个人信息，按<a class="text-link" href="${href("privacy.html", "zh")}">隐私政策</a>处理。`,
            en: `Personal information you give us when you get in touch is handled under our <a class="text-link" href="${href("privacy.html", "en")}">privacy policy</a>.`,
          })}</p>
        </div>
      </div>
    </section>

    <section class="section section--cream" aria-labelledby="address-title">
      <div class="wrap">
        <header class="section-head">
          <h2 id="address-title">${L({ ja: "所在地", zh: "地址", en: "Address" })}</h2>
        </header>
        <p>雛象株式会社（Hinazou Co Ltd）</p>
        <p>${L(ADDRESS)}</p>
      </div>
    </section>`;
}

function privacyBody() {
  const list = (items) => `        <ul>\n${items.map((item) => `          <li>${L(item)}</li>`).join("\n")}\n        </ul>`;
  return `${pageHead({ ja: "プライバシーポリシー", zh: "隐私政策", en: "Privacy policy" })}
    <section class="section" aria-label="${L({ ja: "個人情報の取扱い", zh: "个人信息的处理", en: "Handling of personal information" })}">
      <div class="wrap prose">
        <p>${L({
          ja: "雛象株式会社（以下「当社」といいます）は、お客様からお預かりする個人情報の重要性を認識し、個人情報の保護に関する法律その他の関係法令を遵守するとともに、以下の方針に基づいて個人情報を適切に取り扱います。",
          zh: "雛象株式会社（以下称「本公司」）认识到客户交给我们的个人信息的重要性，遵守日本《个人信息保护法》及其他相关法令，并按以下方针妥善处理个人信息。",
          en: "Hinazou Co Ltd (“we”) recognises the importance of the personal information our customers entrust to us. We comply with Japan's Act on the Protection of Personal Information and other related laws, and handle personal information properly under the following policy.",
        })}</p>

        <h2>${L({ ja: "1. 取得する情報", zh: "1. 收集哪些信息", en: "1. Information we collect" })}</h2>
        <p>${L({
          ja: "当社は、メールまたはお電話でお問い合わせをいただく際に、以下の情報を取得することがあります。",
          zh: "您通过邮件或电话联系我们时，本公司可能会取得以下信息。",
          en: "When you contact us by e-mail or phone, we may obtain the following information.",
        })}</p>
${list([
  { ja: "お名前", zh: "姓名", en: "Your name" },
  { ja: "会社名・店舗名", zh: "公司名称、店铺名称", en: "Company or shop name" },
  { ja: "メールアドレス", zh: "邮箱地址", en: "E-mail address" },
  { ja: "電話番号", zh: "电话号码", en: "Telephone number" },
  { ja: "お問い合わせの内容、その他お客様からご提供いただいた情報", zh: "咨询的内容，以及您提供的其他信息", en: "What you ask us, and any other information you give us" },
])}

        <h2>${L({ ja: "2. 利用目的", zh: "2. 用来做什么", en: "2. How we use it" })}</h2>
        <p>${L({ ja: "取得した個人情報は、以下の目的の範囲内で利用します。", zh: "取得的个人信息，只在以下目的的范围内使用。", en: "We use the personal information we obtain only for the following purposes." })}</p>
${list([
  { ja: "お問い合わせ・ご相談への回答およびご連絡のため", zh: "回复您的咨询，以及与您联系", en: "To answer your enquiries and to contact you" },
  { ja: "当社サービスに関するご案内、ご提案のため", zh: "介绍本公司的服务、提出方案", en: "To tell you about our services and make proposals" },
  { ja: "ご契約いただいたサービスの提供および、それに伴うご連絡のため", zh: "提供您签约的服务，以及由此需要的联系", en: "To provide the services you have contracted, and to contact you in connection with them" },
])}

        <h2>${L({ ja: "3. 第三者提供", zh: "3. 向第三方提供", en: "3. Providing information to third parties" })}</h2>
        <p>${L({
          ja: "当社は、次の場合を除き、ご本人の同意を得ることなく個人情報を第三者に提供しません。",
          zh: "除以下情况外，本公司不会在未经本人同意的情况下向第三方提供个人信息。",
          en: "We do not provide personal information to third parties without the consent of the person concerned, except in the following cases.",
        })}</p>
${list([
  { ja: "法令に基づく場合", zh: "依据法令的情况", en: "Where required by law" },
  {
    ja: "人の生命、身体または財産の保護のために必要があり、ご本人の同意を得ることが困難な場合",
    zh: "为保护人的生命、身体或财产有必要，且难以取得本人同意的情况",
    en: "Where it is necessary to protect a person's life, body or property and it is difficult to obtain the person's consent",
  },
  {
    ja: "国の機関や地方公共団体などが法令の定める事務を遂行することに協力する必要がある場合",
    zh: "需要配合国家机关或地方公共团体等执行法令规定的事务的情况",
    en: "Where we need to cooperate with a national or local government body carrying out duties set by law",
  },
])}

        <h2>${L({ ja: "4. 安全管理", zh: "4. 安全管理", en: "4. Security" })}</h2>
        <p>${L({
          ja: "当社は、個人情報の漏えい、滅失または毀損を防止するため、必要かつ適切な安全管理措置を講じます。利用する必要がなくなった個人情報は、遅滞なく消去するよう努めます。",
          zh: "为防止个人信息泄露、丢失或毁损，本公司采取必要且适当的安全管理措施。不再需要使用的个人信息，将尽快删除。",
          en: "We take the security measures that are necessary and appropriate to prevent personal information from being leaked, lost or damaged. We endeavour to erase without delay personal information we no longer need to use.",
        })}</p>

        <h2>${L({ ja: "5. 開示等の請求", zh: "5. 查阅等请求", en: "5. Requests for disclosure and the like" })}</h2>
        <p>${L({
          ja: "ご本人から、ご自身の個人情報について、開示、訂正、追加、削除、利用の停止などのご請求があった場合は、ご本人であることを確認したうえで、法令に従い速やかに対応します。ご請求は、下記のお問い合わせ窓口までご連絡ください。",
          zh: "本人就自己的个人信息提出查阅、更正、补充、删除、停止使用等请求时，本公司在确认是本人之后，依照法令尽快处理。请联系下面的窗口。",
          en: "When a person asks us to disclose, correct, add to, delete or stop using their own personal information, we confirm that the request comes from that person and respond promptly as the law requires. Please send such requests to the contact below.",
        })}</p>

        <h2>${L({ ja: "6. 本ポリシーの変更", zh: "6. 本政策的变更", en: "6. Changes to this policy" })}</h2>
        <p>${L({
          ja: "当社は、法令の改正や取扱いの見直しに応じて、本ポリシーの内容を変更することがあります。変更後の内容は、本ページに掲載した時点から適用されます。",
          zh: "随着法令的修改或处理方式的调整，本公司可能变更本政策的内容。变更后的内容，自刊登在本页时起适用。",
          en: "We may change this policy when laws are revised or when we review how we handle information. The changed policy applies from the time it is published on this page.",
        })}</p>

        <h2>${L({ ja: "7. お問い合わせ窓口", zh: "7. 联系窗口", en: "7. Contact" })}</h2>
        <p>${L({
          ja: "個人情報の取扱いに関するお問い合わせは、下記までご連絡ください。",
          zh: "关于个人信息处理的咨询，请联系以下窗口。",
          en: "For enquiries about how we handle personal information, please contact:",
        })}</p>
        <dl>
          <dt>${L({ ja: "事業者名", zh: "经营者", en: "Company" })}</dt>
          <dd>雛象株式会社（Hinazou Co Ltd）</dd>
          <dt>${L({ ja: "代表者", zh: "代表人", en: "Representative" })}</dt>
          <dd>${L({ ja: "代表取締役 鄭栄春", zh: "代表董事 郑荣春", en: "Representative Director 鄭栄春 (Tei Eishun)" })}</dd>
          <dt>${L({ ja: "所在地", zh: "地址", en: "Address" })}</dt>
          <dd>${L(ADDRESS)}</dd>
          <dt>${L({ ja: "電話", zh: "电话", en: "Telephone" })}</dt>
          <dd><a class="text-link" href="tel:${TEL_LINK}">${lang === "en" ? "+81 90-3990-7999" : TEL}</a></dd>
          <dt>${L({ ja: "メール", zh: "邮箱", en: "E-mail" })}</dt>
          <dd><a class="text-link" href="mailto:${EMAIL}">${EMAIL}</a></dd>
        </dl>
        <p class="lang-note">${L({
          ja: "本ポリシーは日本語版を正とします。",
          zh: "本政策有日文、中文、英文三个版本，内容以日文版为准。",
          en: "This policy is published in Japanese, Chinese and English. The Japanese version prevails.",
        })}</p>

        <!-- TODO(Rc): 制定日 -->
      </div>
    </section>`;
}

// ---------------------------------------------------------------- the pages

const SUFFIX = { ja: "｜雛象株式会社（Hinazou Co Ltd）", zh: "｜雏象（Hinazou Co Ltd）", en: " | Hinazou Co Ltd" };
const titled = (name) => ({ ja: `${name.ja}${SUFFIX.ja}`, zh: `${name.zh}${SUFFIX.zh}`, en: `${name.en}${SUFFIX.en}` });

const PAGES = [
  {
    file: "index.html",
    title: { ja: "雛象株式会社｜Hinazou Co Ltd", zh: "雏象｜Hinazou Co Ltd", en: "Hinazou Co Ltd｜雛象株式会社" },
    description: {
      ja: "雛象株式会社は、AIとメディアをかけ合わせる会社です。店舗のSNS運用（小紅書・TikTok・Instagram）を支援し、海外で暮らす人のための翻訳アプリを開発しています。",
      zh: "雏象是一家把 AI 和媒体合在一起的公司：帮店铺做 SNS 运营（小红书、TikTok、Instagram），做给海外生活的人用的翻译 App。",
      en: "Hinazou brings AI and media together: we run social media for shops (Xiaohongshu, TikTok, Instagram), and we build a translation app for people living abroad.",
    },
    body: homeBody,
  },
  {
    file: "app.html",
    title: titled({ ja: `翻訳アプリ${APP_NAME.ja}`, zh: `翻译 App${APP_NAME.zh}`, en: `Translation app ${APP_NAME.en}` }),
    description: {
      ja: "海外で暮らす人のための翻訳アプリ（ベータテスト中）。対面の会話、スマホの画面、長い説明を、スマホひとつで。",
      zh: "为海外生活的人做的翻译 App（内测中）。面对面的对话、手机屏幕、长篇讲解，一台手机全解决。",
      en: "A translation app for people living abroad (in beta). Conversations, screens and long explanations, handled by one phone.",
    },
    body: appBody,
  },
  {
    file: "company.html",
    title: titled({ ja: "会社概要", zh: "公司概况", en: "Company" }),
    description: {
      ja: "雛象株式会社（Hinazou Co Ltd）の会社概要です。商号、代表者、所在地、連絡先、事業内容をご案内します。",
      zh: "雏象（Hinazou Co Ltd）的公司概况：公司名称、代表人、地址、联系方式、业务内容。",
      en: "About Hinazou Co Ltd: company name, representative, address, contact details and business.",
    },
    body: companyBody,
  },
  {
    file: "contact.html",
    title: titled({ ja: "お問い合わせ", zh: "联系我们", en: "Contact" }),
    description: {
      ja: "雛象株式会社へのお問い合わせはこちら。メールまたはお電話でお気軽にご連絡ください。",
      zh: "联系雏象：欢迎通过邮件或电话与我们联系。",
      en: "Contact Hinazou Co Ltd by e-mail or phone.",
    },
    body: contactBody,
  },
  {
    file: "privacy.html",
    title: titled({ ja: "プライバシーポリシー", zh: "隐私政策", en: "Privacy policy" }),
    description: {
      ja: "雛象株式会社の個人情報の取扱いについてご案内します。",
      zh: "雏象对个人信息的处理方针。",
      en: "How Hinazou Co Ltd handles personal information.",
    },
    body: privacyBody,
  },
  {
    file: "app-privacy.html",
    title: titled({ ja: "アプリのプライバシーポリシー", zh: "App 隐私政策", en: "App privacy policy" }),
    description: {
      ja: "翻訳アプリのプライバシーポリシー。取り扱う情報、送信先、保存期間などをご案内します。",
      zh: "翻译 App 的隐私政策：处理哪些信息、发给谁、保存多久。",
      en: "Privacy policy of the translation app: what is handled, who receives it and how long it is kept.",
    },
    body: appPrivacyBody,
  },
  {
    file: "app-support.html",
    title: titled({ ja: "アプリのサポート", zh: "App 支持", en: "App support" }),
    description: {
      ja: "翻訳アプリについてのお問い合わせ先と、よくあるご質問。",
      zh: "翻译 App 的联系方式和常见问题。",
      en: "How to reach us about the translation app, and common questions.",
    },
    body: appSupportBody,
  },
];

for (const code of ORDER) {
  lang = code;
  if (LANGS[code].dir) mkdirSync(`${ROOT}${LANGS[code].dir}`, { recursive: true });
  for (const page of PAGES) writeFileSync(`${ROOT}${LANGS[code].dir}${page.file}`, layout(page));
}

// The page for an address that does not exist: one file for the whole site, so it speaks all three.
lang = "ja";
writeFileSync(
  `${ROOT}404.html`,
  `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ページが見つかりません｜雛象株式会社（Hinazou Co Ltd）</title>
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>

  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/">
        <img class="brand-mark" src="/assets/hinazo-elephant-transparent.png" width="819" height="819" alt="">
        <span class="brand-text">
          <span class="brand-jp">雛象株式会社</span>
          <span class="brand-en">Hinazou Co Ltd</span>
        </span>
      </a>
    </div>
  </header>

  <main id="main">
${[
  ["ja", "ページが見つかりません", "お探しのページは、移動または削除された可能性があります。", "ホームへ戻る", "/"],
  ["zh-Hans", "找不到这个页面", "您要找的页面可能已经移动或删除。", "回到首页", "/zh/"],
  ["en", "Page not found", "The page you are looking for may have been moved or removed.", "Back to the home page", "/en/"],
]
  .map(
    ([code, title, text, button, to], index) => `    <div class="wrap notfound" lang="${code}">
      <${index === 0 ? "h1" : "h2"} class="notfound-title">${title}</${index === 0 ? "h1" : "h2"}>
      <p>${text}</p>
      <div class="btn-row">
        <a class="btn${index === 0 ? "" : " btn--outline"}" href="${to}">${button}</a>
      </div>
    </div>`,
  )
  .join("\n")}
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p class="copyright">© 2026 雛象株式会社 Hinazou Co Ltd</p>
    </div>
  </footer>

</body>
</html>
`,
);

// For search engines: every page with its two other languages named, so the three are read
// as one page in three languages and not as copies of each other.
const entries = PAGES.flatMap((page) =>
  ORDER.map(
    (code) => `  <url>
    <loc>${url(page.file, code)}</loc>
${ORDER.map((other) => `    <xhtml:link rel="alternate" hreflang="${LANGS[other].html}" href="${url(page.file, other)}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(page.file, "ja")}"/>
  </url>`,
  ),
);
writeFileSync(
  `${ROOT}sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`,
);

console.log(`${PAGES.length} 页 × ${ORDER.length} 种语言，另有 404.html 和 sitemap.xml`);
