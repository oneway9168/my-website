const OWNER = "oneway9168";
const REPO = "my-website";
const BRANCH = "main";
const POSTS_PATH = "content/posts.json";
const TOKEN_KEY = "one-way-admin-token";

const state = {
  posts: [],
  sha: "",
  selectedSlug: "",
  token: localStorage.getItem(TOKEN_KEY) || "",
};

const loginPanel = document.getElementById("login-panel");
const editorPanel = document.getElementById("editor-panel");
const authStatus = document.getElementById("auth-status");
const tokenInput = document.getElementById("token-input");
const connectButton = document.getElementById("connect-button");
const logoutButton = document.getElementById("logout-button");
const newPostButton = document.getElementById("new-post-button");
const saveButton = document.getElementById("save-button");
const deleteButton = document.getElementById("delete-button");
const postList = document.getElementById("post-list");
const postCount = document.getElementById("post-count");
const message = document.getElementById("message");

const fields = {
  title: document.getElementById("title-input"),
  date: document.getElementById("date-input"),
  slug: document.getElementById("slug-input"),
  category: document.getElementById("category-input"),
  summary: document.getElementById("summary-input"),
  body: document.getElementById("body-input"),
  featured: document.getElementById("featured-input"),
  published: document.getElementById("published-input"),
};

connectButton.addEventListener("click", connect);
logoutButton.addEventListener("click", logout);
newPostButton.addEventListener("click", createPost);
saveButton.addEventListener("click", savePosts);
deleteButton.addEventListener("click", deleteSelectedPost);
fields.title.addEventListener("input", syncSlugFromTitle);

if (state.token) {
  showEditor();
  loadPosts();
}

async function connect() {
  const token = tokenInput.value.trim();
  if (!token) {
    setMessage("请先粘贴 GitHub Token。", true);
    return;
  }

  state.token = token;
  localStorage.setItem(TOKEN_KEY, token);
  showEditor();
  await loadPosts();
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  state.token = "";
  state.posts = [];
  state.sha = "";
  state.selectedSlug = "";
  loginPanel.hidden = false;
  editorPanel.hidden = true;
  logoutButton.hidden = true;
  authStatus.textContent = "未连接 GitHub";
  setMessage("已退出后台。");
}

function showEditor() {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
  logoutButton.hidden = false;
  authStatus.textContent = "已连接 GitHub";
}

async function loadPosts() {
  setBusy(true);
  setMessage("正在读取文章...");

  try {
    const file = await githubRequest(`/repos/${OWNER}/${REPO}/contents/${POSTS_PATH}?ref=${BRANCH}`);
    const json = JSON.parse(decodeBase64(file.content || ""));
    state.sha = file.sha;
    state.posts = (json.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    state.selectedSlug = state.posts[0]?.slug || "";
    renderList();
    fillForm(getSelectedPost() || blankPost());
    setMessage("文章已读取。");
  } catch (error) {
    setMessage(error.message || "读取文章失败。", true);
  } finally {
    setBusy(false);
  }
}

function renderList() {
  postCount.textContent = String(state.posts.length);
  postList.innerHTML = state.posts
    .map(
      (post) => `
        <button class="post-item ${post.slug === state.selectedSlug ? "active" : ""}" type="button" data-slug="${escapeHtml(post.slug)}">
          <strong>${escapeHtml(post.title || "未命名文章")}</strong>
          <span>${escapeHtml(post.date || "")} · ${escapeHtml(post.category || "")}</span>
        </button>
      `,
    )
    .join("");

  postList.querySelectorAll(".post-item").forEach((button) => {
    button.addEventListener("click", () => {
      saveFormToState();
      state.selectedSlug = button.dataset.slug;
      renderList();
      fillForm(getSelectedPost());
    });
  });
}

function fillForm(post) {
  fields.title.value = post.title || "";
  fields.date.value = post.date || new Date().toISOString().slice(0, 10);
  fields.slug.value = post.slug || "";
  fields.category.value = post.category || "生活观察";
  fields.summary.value = post.summary || "";
  fields.body.value = post.body || "";
  fields.featured.checked = Boolean(post.featured);
  fields.published.checked = post.published !== false;
}

function getFormPost() {
  return {
    slug: normalizeSlug(fields.slug.value),
    title: fields.title.value.trim(),
    date: fields.date.value,
    category: fields.category.value,
    summary: fields.summary.value.trim(),
    featured: fields.featured.checked,
    published: fields.published.checked,
    body: fields.body.value.trim(),
  };
}

function saveFormToState() {
  if (!state.selectedSlug) return;
  const index = state.posts.findIndex((post) => post.slug === state.selectedSlug);
  if (index === -1) return;

  const post = getFormPost();
  state.posts[index] = post;
  state.selectedSlug = post.slug;
}

function createPost() {
  saveFormToState();
  const post = blankPost();
  state.posts.unshift(post);
  state.selectedSlug = post.slug;
  renderList();
  fillForm(post);
  setMessage("新文章已创建，写完后点保存发布。");
}

function deleteSelectedPost() {
  if (!state.selectedSlug) return;
  const post = getSelectedPost();
  if (!post) return;

  const confirmed = window.confirm(`确定删除《${post.title || "未命名文章"}》吗？`);
  if (!confirmed) return;

  state.posts = state.posts.filter((item) => item.slug !== state.selectedSlug);
  state.selectedSlug = state.posts[0]?.slug || "";
  renderList();
  fillForm(getSelectedPost() || blankPost());
  setMessage("文章已从列表移除，点保存发布后生效。");
}

async function savePosts() {
  saveFormToState();
  const validation = validatePosts();
  if (validation) {
    setMessage(validation, true);
    return;
  }

  setBusy(true);
  setMessage("正在保存到 GitHub...");

  try {
    const content = JSON.stringify({ posts: state.posts }, null, 2) + "\n";
    const result = await githubRequest(`/repos/${OWNER}/${REPO}/contents/${POSTS_PATH}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Update posts from admin`,
        content: encodeBase64(content),
        sha: state.sha,
        branch: BRANCH,
      }),
    });
    state.sha = result.content.sha;
    renderList();
    setMessage("保存成功，Cloudflare 会自动更新网站。");
  } catch (error) {
    setMessage(error.message || "保存失败。", true);
  } finally {
    setBusy(false);
  }
}

function validatePosts() {
  const slugs = new Set();

  for (const post of state.posts) {
    if (!post.title || !post.slug || !post.date) {
      return "标题、日期、文章标识都要填写。";
    }
    if (slugs.has(post.slug)) {
      return `文章标识重复：${post.slug}`;
    }
    slugs.add(post.slug);
  }

  return "";
}

async function githubRequest(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || `GitHub 请求失败：${response.status}`);
  }

  return data;
}

function getSelectedPost() {
  return state.posts.find((post) => post.slug === state.selectedSlug);
}

function blankPost() {
  const date = new Date().toISOString().slice(0, 10);
  return {
    slug: `new-post-${Date.now()}`,
    title: "",
    date,
    category: "生活观察",
    summary: "",
    featured: false,
    published: true,
    body: "",
  };
}

function syncSlugFromTitle() {
  if (state.selectedSlug && fields.slug.value.trim()) return;
  fields.slug.value = normalizeSlug(fields.title.value);
}

function normalizeSlug(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\u4e00-\u9fa5]+/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `post-${Date.now()}`
  );
}

function decodeBase64(value) {
  return decodeURIComponent(
    Array.from(atob(value.replace(/\n/g, "")))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

function encodeBase64(value) {
  return btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );
}

function setBusy(isBusy) {
  connectButton.disabled = isBusy;
  saveButton.disabled = isBusy;
  newPostButton.disabled = isBusy;
  deleteButton.disabled = isBusy;
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b3261e" : "#174ea6";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
