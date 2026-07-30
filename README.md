# 研途 · 2027 考研进度台

面向 2027 考研的离线优先学习看板，包含每日任务、四科打卡、倒计时、学习进度、七日时长和月历热度。

## 数据说明

- 学习记录默认保存在浏览器 `localStorage`，不会提交到 GitHub 仓库。
- 设置页可以导出和导入完整 JSON 备份。
- GitHub Pages 只负责托管网页。电脑与手机实时同步需要另行接入带账户隔离和 RLS 的云数据库。

## 本地运行

静态资源需要通过 HTTP 服务打开，才能完整测试 Service Worker 和离线安装。

## 发布

推送到 `main` 分支后，仓库内的 GitHub Actions 工作流会发布到 GitHub Pages。首次使用时，需要在仓库 `Settings > Pages` 中将 Source 设为 `GitHub Actions`。
