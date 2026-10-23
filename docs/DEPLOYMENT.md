# GitHub / Vercel

已准备配置，未创建远程仓库、推送或部署。

本地初始化 main，无首次提交。先 `git status` 检查忽略项，确认原始资料、密钥不在提交范围，再提交并添加你自己的 GitHub remote。共享技能和 AGENTS.md 应随代码版本管理。

## Vercel 导入

- 连接 GitHub 仓库，Root 为项目根目录，Framework 为 Vite。
- Node 24.x；Install `npm ci`；Build `npm run build`；Output `dist`。
- 默认演示，可显式设置 VITE_DATA_MODE=demo。真实模式设置 api 及 VITE_API_BASE_URL，但后端仍需实现。
- `vercel.json` 的 SPA 回退避开 API 和静态资源；未来后端函数另行配置。
- VITE_* 变量会公开，不放模型密钥、Bot token 或知识库凭据。
- 上线后核对 /ai 和 /compare 深链刷新、键盘、安全区、错误与空态。
- TG 使用正式 HTTPS URL 在 BotFather 设置，此操作尚未执行。

GitHub CI 检查类型/lint/单测/构建及移动端 Chromium e2e。项目尚未替你选择开源许可证，公开前由项目所有者确定许可和资料范围。

参考：[Vercel Vite 官方文档](https://vercel.com/docs/frameworks/frontend/vite)。
