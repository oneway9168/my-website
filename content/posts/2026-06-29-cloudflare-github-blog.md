---
title: "用 Cloudflare Pages 和 GitHub 搭建博客"
date: "2026-06-29"
category: "数字工具"
summary: "用 GitHub 保存网站代码，用 Cloudflare Pages 自动部署，再绑定自己的域名，就能低成本拥有一个稳定、带 HTTPS、方便长期维护的个人博客。"
featured: false
published: true
---

这个博客现在的结构很轻：GitHub 保存网站文件，Cloudflare Pages 负责自动部署，域名指向 Cloudflare。

这种方式的好处是成本低、速度快、维护少。只要把内容提交到 GitHub，Cloudflare Pages 就会自动发布到线上。

现在再加上文章后台之后，写文章就不一定要手动改代码了。后台会把文章保存成 Markdown 文件，前台页面再读取这些文件并展示出来。

对个人博客来说，这样已经足够用了。
