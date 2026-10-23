# 视觉规范与验收

## 当前实现优先

先读 [当前实现基准](current-baseline.md)。其记录用户已确认的首页、字体、过渡、底栏和占位范围；本文件的未来业务组件与关键页面说明不代表当前已实现，也不授权自动恢复旧页面。

## 已批准方向

`../assets/aegis-approved-home.png` 是冰川蓝 2.0 的首页效果图。左侧是 H5 首页，右侧是 Telegram 首页/AI 入口态；两者都不是长分析详情截图。长分析页以业务契约与共享材质为规范，不宣称存在已批准的详情截图。构图、材质与验收尺寸详见 [参考图还原细则](reference-fidelity.md)。

产品面向亚洲移动用户。气质为清晰、理性、轻盈；不要变成深色交易终端、娱乐场海报或满屏 3D 装饰。

| Token | 值 | 用途 |
| --- | --- | --- |
| primary | #2563EB | CTA、选中状态、AI 入口 |
| primary-soft | #60A5FA | 辅助高光 |
| background | #F5F8FF | 页面底色 |
| surface | #FFFFFF | 内容表面 |
| text | #14213D | 正文与标题 |
| muted | #526581 | 次级文字 |
| success | #087F6B | 有数据支持的正常状态 |
| warning | #9A5A00 | 延迟、待关注 |
| danger | #B42318 | 失败与异常 |

## 材质层次

- 背景层：白至浅蓝的低对比渐变，标题区可有局部冰川/冰晶与蓝色光晕，数据区保持干净。不要误把“排除外部雪山海报”理解为删除手机内所有冰川元素。
- 内容层：乳白底、16–24px 圆角、细边线。表格不透出复杂背景。
- 控制层：玻璃胶囊、约 18px blur、高光边缘、轻柔双层阴影。页面同时可见的大面积 blur 表面尽量不超过 3 个，不在滚动列表每行加 blur。
- 聚焦层：AI 主按钮用蓝色玻璃高光或纯蓝降级，保留清晰图标和文字。
- 不支持 backdrop-filter 时使用实色近白底。用户选择减少透明度时通过 `data-transparency="reduced"` 切换；系统媒体查询只能渐进增强，不能假设所有 WebView 支持。
- 不用持续 WebGL 或 SVG displacement 实现整页“真折射”；若用户特别要求动态折射，单独评估低端 Android 性能。

## 布局与文字

- 设计基准 390px，支持 360–430px；平板和桌面保留居中最大 430px 的应用栏，可按明确需求扩展。
- 当前主内容水平边距 12px，头部 20px，首页区块间距以 8–12px 为起点，标题区可用 12–16px；卡片内边距 12–16px。长分析页可用 20–24px 的段间距，不把长文留白套到首页。
- 主标题 24–28px、首页区块标题 16–18px、正文 14–16px、辅助信息 12–13px。仅极次要时间说明可为 10px，具体已确认字号见当前实现基准；禁止将正文缩到 8–10px 来塞入信息。数字用 tabular-nums，时间标注时区。
- 系统字体栈包含 PingFang SC、Microsoft YaHei；聊天输入至少 16px，避免 iOS 自动放大。
- 图标采用一种已安装的 SVG 图标体系；不用 emoji 代替正式导航图标。
- 最小触控区 44×44px。提供可见 focus、按钮 accessible name 与当前页 aria-current。
- 普通正文目标对比度至少 4.5:1；warning 用深琥珀文字和浅底，避免浅黄色字。

## 组件职责

| 组件 | 职责 |
| --- | --- |
| GlassSurface | 统一 glass/data/solid 表面与降级 |
| GlassButton | CTA、loading、disabled、focus |
| FloatingDock | 五项路由、中央 AI、当前项与安全区 |
| AiComposer | 输入、发送、停止、IME 中文组合输入 |
| AnalysisCard | 多维证据与盘口结论 |
| OddsRanking | 同盘口赔率与快照 |
| FundingRanking | 链/金额/窗口筛选、耗时与样本 |
| SourceBadge | 来源与更新状态，可展开依据 |

## 后续业务设计参考（按用户指定页面实施）

首页：品牌与角色切换 → 直接问 AI → 出金监测/赔率/VIP/代理快捷入口 → 监测摘要 → 平台观察 → 悬浮底栏。

AI：用户问题 → 赛事确认 → 状态/伤停/赛程/盘口分析 → 盘口倾向与不确定性 → 同盘口赔率排名 → 已知出入金数据排名 → 来源 → 继续追问。

长分析使用消息滚动区，输入框保持可见。进入专注聊天时可隐藏应用底栏，避免与输入框争抢底部空间；返回首页后恢复常驻 AI 导航。不要覆盖 TG 原生按钮区域。

## 动效与性能

按压/聚焦 120–180ms，页面切换 150ms，角色滑块 220ms，优先 transform/opacity；不动画 blur 值。遵守 prefers-reduced-motion。用户滚离底部时不要强制自动滚回聊天末尾。只在用户点击时发送问题，Enter 需避开 IME composition。

## 视觉验证矩阵

检查 360/390/430px；Safari 与 Android Chromium；可用时检查 iOS TG 和 Android TG；键盘开关、长商家名、多行问题、无数据、来源过期、停止后重试、无 blur、减少动效。真实 TG 未实机验证要明确说明。

材质方向参考：[Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)。本技能参数是 Aegis 的 Web 实现选择，并非 Apple 官方数值。
