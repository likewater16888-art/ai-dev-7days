# 发布契约 · PUBLISH

> 这个文件是**给我（AI 助手）看的执行说明**，也是给人看的说明书。
> 用法：把项目文件夹（里面要带 `PUBLISH.md` + `publish.config.json`）丢给我，说一句「**发布**」。
> 我会按下面的「执行清单」做完，然后回你一个可以发给任何人的网址。
> 换项目也照样管用——把这两个文件复制到新项目里，改一下 `repo.name` 就行。

## 1. 一句话意图

把这个目录当作**纯静态网站**发布到 GitHub，开启 GitHub Pages，产出公网地址供他人直接访问。

## 2. 当前项目

| 项 | 值 |
| --- | --- |
| 项目名 | AI 应用开发 7 天 · 沙盒实训 |
| 站点类型 | 纯静态（HTML + CSS + 原生 JS，**无构建、无后端、无 npm**） |
| 站点根目录 | 本目录（入口 `index.html`） |
| 仓库名 | `ai-dev-7days` |
| 可见性 | **public**（GitHub 免费账号只有公开仓库能开 Pages） |
| 分支 | `main` |
| 发布模式 | `new`（一个项目 = 一个独立仓库，仓库根即站点根） |
| 预计公开地址 | `https://likewater16888-art.github.io/ai-dev-7days/` |
| 外部依赖 | **无**（不加载 CDN、不请求接口；沙盒命令与 GPU/模型都是本地模拟） |
| 敏感信息 | **无**（无 API Key / token / 密码；姓名与进度只写在本机 localStorage） |

## 3. 执行清单（我按顺序做）

1. **体检**：`node --check` 全部 JS；扫一遍 `sk-`、`token`、`password` 等硬编码密钥；确认没有 `_*` 临时文件被纳入。
2. **初始化**：`git init -b main`（已有 `.git` 则跳过）；按 `.gitignore` 过滤 `_*`、`*.out`、`node_modules`。
3. **提交身份**：`user.name` / `user.email` 用 GitHub 账号与 `…@users.noreply.github.com`（不暴露真实邮箱）。
4. **建仓库**：`gh repo create <name> --public --source . --remote origin`（仓库已存在则跳过）。
5. **推送**：`git add -A && git commit && git push -u origin main`。
6. **开 Pages**：`gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=main" -f "source[path]=/"`（已存在则 PUT 更新）。
7. **验证**：逐个请求 `publish.config.json` 里 `verify` 的地址，直到 `/` 返回 200（首次部署约 30–90 秒）。
8. **回写**：把最终地址写到本文件「4. 当前地址」和 `README.md` 顶部的分享徽章里。
9. **汇报**：输出 `✅ 已发布`、公开地址、仓库地址、本次提交的文件数与体积。

## 4. 当前地址

| 名称 | 地址 |
| --- | --- |
| 🌐 公开访问 | https://likewater16888-art.github.io/ai-dev-7days/ |
| 📦 源码仓库 | https://github.com/likewater16888-art/ai-dev-7days |

## 5. 发布后怎么更新

对着我说「**发布**」或「**更新一下**」即可：我会 `git add/commit/push`，Pages 自动重建（约 30 秒），**地址永远不变**。

命令行等价操作：

```powershell
node tools/stamp-assets.js   # 改了 js/css 才需要：重打 ?v= 版本号
git add -A; git commit -m "update: xxx"; git push
```
### 5.1 「更新完了，打开还是旧版」

GitHub Pages 给所有文件回 `cache-control: max-age=600`（10 分钟，站点这边改不了）。所以 push 完、Pages 也重建完了，
浏览器仍可能拿旧缓存 —— 这不是没发布成功，先确认再动手：

```powershell
# 1. 线上到底是哪一版？比对 index.html 的 md5（本地按 LF 归一化后比）
node -e "const h=require('https'),c=require('crypto'),f=require('fs');h.get('https://likewater16888-art.github.io/ai-dev-7days/index.html',r=>{let d='';r.on('data',x=>d+=x);r.on('end',()=>{console.log('remote',c.createHash('md5').update(d).digest('hex'));console.log('local ',c.createHash('md5').update(f.readFileSync('index.html','utf8').replace(/\r\n/g,'\n')).digest('hex'))})})"
```

两个 md5 一样 = 线上就是最新的，你看到旧版纯粹是浏览器缓存。

治这个的正解是 `node tools/stamp-assets.js`：它把 `css/*.css`、`js/**/*.js` 的地址改成 `?v=<内容哈希>`，
文件一变地址就变，浏览器没法复用旧缓存；没变的文件地址不变，照旧走缓存。整页构建号写在
`<html data-build="…">`，一眼能看出线上是哪一版。幂等，重复跑结果不变；`--check` 只检查不写盘。

临时救急：`Ctrl + F5` 强刷，或地址后加个参数（`…/ai-dev-7days/?v=2`）。


## 6. 不想公开源码怎么办

把 `publish.config.json` 里 `pages.provider` 改成 `cloudflare`，仓库可见性改成 `private`，
改用 Cloudflare Pages 连接该仓库（免费版支持私有仓库，国内访问通常更快）。其余流程不变。

## 7. 排障速查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| Pages 里看不到 `main` 分支 | 还没 push 成功 | 先 `git push -u origin main` |
| 打开是 404 | Pages 首次构建中 | 等 1–2 分钟；确认 Settings→Pages 的 Source 是 `main` / `(root)` |
| 打开还是旧版 | 浏览器缓存（Pages 固定 `max-age=600`） | `Ctrl + F5` 强刷；发布前跑 `node tools/stamp-assets.js`（见 5.1） |
| 页面白屏、控制台 404 | 仓库根目录不是站点根目录 | 保证 `index.html` 在仓库根目录 |
| 关卡一直是灰的 | 命令没在终端里执行（关卡只认沙盒终态） | 点小节里的 `▶ 运行`，或按 `~` 打开终端自己敲 |
| 课程内容显示不全 | `js/data/d1.js … d7.js` 没提交 | `git add js/data` 后重新发布 |

## 8. 多项目：发布模式与命名（同一个脚本通用）

### 8.1 三种落点

| 模式 | 命令 | 仓库结构 | 公开地址 |
| --- | --- | --- | --- |
| A 独立仓库（默认） | `.\deploy.ps1 -Mode new` | 仓库根 = 本项目 | `https://USER.github.io/REPO/` |
| B 复用已有仓库的根 | `.\deploy.ps1 -Mode existing` | 本项目覆盖仓库根 | `https://USER.github.io/REPO/` |
| C 放进已有仓库的子目录 | `.\deploy.ps1 -Mode existing -Subdir sites/foo` | 只更新那一个子目录，其它文件不动 | `https://USER.github.io/REPO/sites/foo/` |

模式 C 的实现：临时 clone 目标仓库 → 把本目录文件（按 `.gitignore` 过滤后）复制进 `子目录/` → 提交并 push 回 `main`，不改动仓库里其它路径，因此可以一个仓库放多个项目。

### 8.2 仓库名怎么定

优先级：命令行 `-Repo` > `publish.config.json` 的 `repo.name` > 本文件夹名（自动转 slug）。
`repo.name` 写 `auto` 也等于"按文件夹名自动取名"。

转换规则：转小写；非 `a-z0-9._-` 的字符变 `-`；连续 `-` 合并；首尾 `- . _` 去掉；超 64 字符截断；整段为空（例如中文文件夹名）则回退为 `site-YYYYMMDD`。脚本每次都会打印最终使用的名字，不满意就 `-Repo 新名字`。

### 8.3 重名处理

- 仓库已存在 → 直接复用（幂等，重复运行安全）。
- 想另开一个新仓库 → 换 `-Repo`。
- `-Mode existing` 但仓库不存在 → 脚本直接报错退出，不会偷偷新建。

### 8.4 发布前先看计划

`.\deploy.ps1 -DryRun` 只做本地检查与提交，不 push、不开 Pages，用来确认"名字/模式/地址"三项是否符合预期。

| 在线 AI 模式报跨域 | 接口不允许浏览器直连 | 改用支持 CORS 的接口，或继续用本地知识库模式 |
