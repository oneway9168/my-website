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
- 把首页文章卡片改成独立文章页面
- 增加博客归档页
- 增加 RSS
- 增加访问统计
