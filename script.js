const REPO_OWNER = "oneway9168";
const REPO_NAME = "my-website";
const POSTS_PATH = "content/posts";

document.getElementById("year").textContent = new Date().getFullYear();

const fallbackPosts = [
  {
    slug: "2026-06-29-why-personal-blog",
    title: "为什么我想拥有一个自己的个人博客",
    date: "2026-06-29",
    category: "建站记录",
    summary: "平台适合分发，个人网站适合沉淀。把长期内容放在自己的域名下，像是在互联网上留下一间可以慢慢布置的房间。",
    featured: true,
    body: "平台适合分发，个人网站适合沉淀。\n\n我希望这里能成为一个长期记录的地方。它不需要每天更新，也不需要追热点，只要在某个时刻把真实的观察、工具体验和想法留下来，就已经很有意义。",
  },
  {
    slug: "2026-06-29-cloudflare-github-blog",
    title: "用 Cloudflare Pages 和 GitHub 搭建博客",
    date: "2026-06-29",
    category: "数字工具",
    summary: "用 GitHub 保存网站代码，用 Cloudflare Pages 自动部署，再绑定自己的域名，就能低成本拥有一个稳定、带 HTTPS、方便长期维护的个人博客。",
    featured: false,
    body: "这个博客现在的结构很轻：GitHub 保存网站文件，Cloudflare Pages 负责自动部署，域名指向 Cloudflare。",
  },
  {
    slug: "2026-06-29-what-to-write",
    title: "我想在这里记录什么",
    date: "2026-06-29",
    category: "生活观察",
    summary: "这里会慢慢放下生活笔记、工具体验、建站记录、读书摘录和一些不急着给出答案的思考。",
    featured: false,
    body: "我想让这个网站保持松弛一点。\n\n它可以记录生活里的细节，也可以记录工具、软件、网站搭建和一些实践过程。",
  },
];

let posts = fallbackPosts;

loadPosts();
window.addEventListener("hashchange", renderRoute);

async function loadPosts() {
  try {
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`;
    const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github.v3+json" } });
    if (!response.ok) {
      throw new Error("Cannot read posts from GitHub");
    }

    const files = await response.json();
    const markdownFiles = files.filter((file) => file.name.endsWith(".md"));
    const loadedPosts = await Promise.all(markdownFiles.map(loadPostFile));

    posts = loadedPosts
      .filter((post) => post.published !== false)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    posts = fallbackPosts;
  }

  renderPosts();
  renderRoute();
}

async function loadPostFile(file) {
  const response = await fetch(file.download_url);
  if (!response.ok) {
    throw new Error(`Cannot load ${file.name}`);
  }

  const markdown = await response.text();
  return parseMarkdown(markdown, file.name.replace(/\.md$/, ""));
}

function parseMarkdown(markdown, slug) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const frontmatter = match ? match[1] : "";
  const body = match ? match[2].trim() : markdown.trim();
  const data = {};

  frontmatter.split("\n").forEach((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (value === "true") value = true;
    if (value === "false") value = false;
    data[key] = value;
  });

  return {
    slug,
    title: data.title || "未命名文章",
    date: data.date || "",
    category: data.category || "文章",
    summary: data.summary || body.slice(0, 90),
    featured: data.featured === true,
    published: data.published !== false,
    body,
  };
}

function renderPosts() {
  const featured = posts.find((post) => post.featured) || posts[0];
  const list = posts.filter((post) => post.slug !== featured.slug);

  document.getElementById("featured-post").innerHTML = `
    <div class="post-visual"><span>${escapeHtml(featured.category)}</span></div>
    <div class="featured-copy">
      <p class="post-meta">置顶 · ${escapeHtml(featured.date)} · ${escapeHtml(featured.category)}</p>
      <h2>${escapeHtml(featured.title)}</h2>
      <p>${escapeHtml(featured.summary)}</p>
      <a class="read-more" href="#post/${featured.slug}">继续阅读</a>
    </div>
  `;

  document.getElementById("post-list").innerHTML = list
    .map(
      (post) => `
        <article class="post-card">
          <p class="post-meta">${escapeHtml(post.date)} · ${escapeHtml(post.category)}</p>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.summary)}</p>
          <a class="read-more" href="#post/${post.slug}">阅读全文</a>
        </article>
      `,
    )
    .join("");

  renderCategories();
  renderRecentPosts();
}

function renderCategories() {
  const counts = posts.reduce((map, post) => {
    map[post.category] = (map[post.category] || 0) + 1;
    return map;
  }, {});

  document.getElementById("category-list").innerHTML = Object.entries(counts)
    .map(
      ([category, count]) => `
        <li><a href="#notes"><span>${escapeHtml(category)}</span><strong>${count}</strong></a></li>
      `,
    )
    .join("");
}

function renderRecentPosts() {
  document.getElementById("recent-posts").innerHTML = posts
    .slice(0, 5)
    .map((post) => `<a href="#post/${post.slug}">${escapeHtml(post.title)}</a>`)
    .join("");
}

function renderRoute() {
  const slug = decodeURIComponent(window.location.hash.replace(/^#post\//, ""));
  const articleView = document.getElementById("article-view");
  const post = posts.find((item) => item.slug === slug);

  if (!post || !window.location.hash.startsWith("#post/")) {
    articleView.hidden = true;
    return;
  }

  articleView.hidden = false;
  articleView.innerHTML = `
    <a class="back-link" href="#notes">返回文章列表</a>
    <p class="post-meta">${escapeHtml(post.date)} · ${escapeHtml(post.category)}</p>
    <h2>${escapeHtml(post.title)}</h2>
    <div class="article-body">${markdownToHtml(post.body)}</div>
  `;
  articleView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function markdownToHtml(markdown) {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("### ")) return `<h4>${escapeHtml(block.slice(4))}</h4>`;
      if (block.startsWith("## ")) return `<h3>${escapeHtml(block.slice(3))}</h3>`;
      if (block.startsWith("# ")) return `<h2>${escapeHtml(block.slice(2))}</h2>`;
      return `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
