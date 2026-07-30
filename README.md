# 研途 · 2027 考研进度台

面向 2027 考研的离线优先学习看板，包含每日任务、四科打卡、倒计时、学习进度、七日时长、月历热度、专注计时和手机系统分享。

## 数据说明

- 学习记录默认保存在浏览器 `localStorage`，不会提交到 GitHub 仓库。
- 设置页可以导出和导入完整 JSON 备份。
- GitHub Pages 只负责托管网页。电脑与手机实时同步需要另行接入带账户隔离和 RLS 的云数据库。

## 自动同步（可选）

1. 在 Supabase 创建项目，在 SQL Editor 执行 `supabase-schema.sql`。
2. 在项目 Authentication 中启用 Email 登录，并按需关闭“必须验证邮箱”。
3. 在 Settings 页面复制 Project URL 与 anon public key，打开看板“设置 → 手机与离线”填写。
4. 在电脑和手机使用同一个邮箱账户登录。应用会把每个账户的数据保存为一行，并在联网时自动同步；离线修改会先保存在本机。首次发现两台设备都有未同步修改时，会要求选择云端版本或本机版本，避免静默覆盖。

Supabase Auth 的 Site URL 和 Redirect URL 应加入 `https://2410736812.github.io/yantu-kaoyan-dashboard/`。本地测试时可额外加入 `http://127.0.0.1:4173/`。

`anon` 公钥可以出现在浏览器中，真正的访问边界是 `study_states` 表的 RLS 策略。不要把 service-role key、数据库密码或任何私密密钥填入网页或提交到仓库。

## 本地运行

静态资源需要通过 HTTP 服务打开，才能完整测试 Service Worker 和离线安装。

## 发布

推送到 `main` 分支后，仓库内的 GitHub Actions 工作流会发布到 GitHub Pages。首次使用时，需要在仓库 `Settings > Pages` 中将 Source 设为 `GitHub Actions`。
