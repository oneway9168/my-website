# 风里有回声个人博客

这是 `one-way.top` 的个人博客网站，适合部署到 Cloudflare Pages。

建议 GitHub 仓库名：`my-website`

## 本地预览

直接打开 `index.html` 即可预览。

也可以在这个文件夹里启动一个本地服务：

```bash
python3 -m http.server 8787
```

然后访问：

```text
http://localhost:8787
```

## 文章后台

后台地址：

```text
https://one-way.top/admin/
```

现在后台使用 Decap CMS。文章会保存到：

```text
content/posts.json
```

每篇文章在后台的“文章管理”列表里维护，字段包括文章标识、标题、发布日期、分类、摘要、是否置顶、是否发布和正文。

第一次在线登录后台前，需要给 GitHub 仓库配置 Decap CMS 的 GitHub 登录授权。配置好之后，你就可以在 `/admin/` 里新增、编辑、删除文章；保存后会自动提交到 GitHub，Cloudflare Pages 会自动更新网站。

前台首页会自动读取站内的 `content/posts.json`，并显示在最新文章、分类和近期文章里。

## 部署到 Cloudflare Pages

1. 把这个文件夹里的文件上传到 GitHub 仓库 `my-website`。
2. 打开 Cloudflare Dashboard。
3. 进入 Workers & Pages。
4. 创建 Pages 项目，并连接 GitHub 仓库。
5. 构建命令留空。
6. 输出目录填写 `/`。
7. 部署完成后，在 Custom domains 里绑定 `one-way.top`。

## 后续可以继续完善

- 替换真实邮箱或联系方式
- 配置 Decap CMS 的 GitHub 登录授权
- 接入 Giscus、Waline 或 Twikoo 这类评论系统
- 增加博客归档页
- 增加 RSS
- 增加访问统计
