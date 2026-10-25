# 2026-10-25 主导航闪动修复

## 原因与修改

AI、我的拥有自己的头部和内容内距，体育对比使用外壳品牌头部。原实现只对 RouterView 内容应用全页 `out-in` 退场/入场动画，而外层 header、shell class 与 main padding 已跟随目标路由更新。

逐帧记录复现：对比切到我的时，旧体育页先从top53px、width366px变成top0、width390px，之后才淡出。反向切换时，旧AI页又被放进目标页的53px头部之下。六个切换方向每次有9–10帧内容透明度低于0.4，加剧闪白与跳动。

`App.vue` 直接渲染 RouterView，让内容和外壳同步提交；移除失去用途的整页进退场CSS。保留导航及控件点击反馈、页面本身布局和已确认功能。

## 两轮复核

1. 修改后重新记录对比→我的→AI及反向六种切换：未记录到空白帧或低透明度帧，目标路由与对应页面、头部、宽度保持一致。
2. 在360/390/430px、正常动效设置下再次逐帧检查，确保未通过减少动效掩盖问题；另检查已滚动页面切换、快速连点和历史返回。读取并查看修复后的截图，底栏保持固定位置。

截图与帧记录：`outputs/navigation-audit/before/`、`outputs/navigation-audit/after/`、`outputs/navigation-audit/verification/`。

防回归用例：`tests/e2e/navigation-stability.spec.ts`。通用走查要求补充至 `docs/UI-REVIEW.md`。

本轮使用桌面Chrome的移动端视口，不声称Safari或Telegram真机已测试。不自动提交、推送或部署。

工程验证：`npm run check`、`npm run build`均退出码0；62项单元测试及134项移动端回归全部通过。
