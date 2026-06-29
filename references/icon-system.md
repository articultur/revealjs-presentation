# 演示文稿图标系统

> 专为 reveal.js 演示文稿设计的 inline SVG 图标库。零依赖、零请求、自动跟随主题色。
>
> 先读 `references/element-semantics.md` 的 Icon 规则。图标是状态、动作、分类、方向的辅助 cue,不是 proof object / 论证对象；需要证明主张时应使用图表、表格、截图、流程或证据卡,不要用通用图标替代。

## 设计规范

| 属性 | 值 | 原因 |
|------|---|------|
| viewBox | `0 0 24 24` | 标准尺寸，缩放无损 |
| 描边宽度 | `1.6` | 2.4m 投影距离清晰可辨 |
| 填充 | `none` | 线性风格，适配任何背景 |
| 颜色 | `currentColor` | 自动继承父元素 `color`，主题自适应 |
| 端点 | `round` | 柔和专业，避免生硬截断 |
| 接合 | `round` | 与端点统一 |
| 尺寸 | `24px`（正文）/ `32px`（标题）/ `48px`（强调） | 根据层级选择 |

### 基础模板

```html
<!-- 最小用法 -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- 路径写在这里 -->
</svg>

<!-- 带悬停效果的用法 -->
<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- 路径 -->
</svg>
```

### CSS 辅助类

```css
/* 基础图标样式 */
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: transform 200ms var(--ease-out-quart, cubic-bezier(0.25,1,0.5,1)),
              opacity 200ms ease;
}
.icon:hover {
  transform: scale(1.08);
}

/* 尺寸变体 */
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 24px; height: 24px; }   /* 默认 */
.icon-lg { width: 32px; height: 32px; }
.icon-xl { width: 48px; height: 48px; }

/* 强调色图标 */
.icon-accent { color: var(--c-accent); }

/* 图标容器（用于圆形/方形背景） */
.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: oklch(from var(--c-accent) l c h / 0.12);
  color: var(--c-accent);
}
.icon-box svg { width: 24px; height: 24px; }

/* 列表中的图标对齐 */
.icon-list {
  list-style: none;
  padding: 0;
}
.icon-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.icon-list li svg {
  flex-shrink: 0;
  color: var(--c-accent);
}
```

---

## 图标目录

### 导航与方向

#### arrow-right → 流程推进
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
```

#### arrow-left → 回顾/返回
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>
```

#### arrow-up → 增长/提升
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M6 11l6-6 6 6"/></svg>
```

#### arrow-down → 下降/深入
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M18 13l-6 6-6-6"/></svg>
```

#### chevron-right → 列表层级/面包屑
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
```

#### refresh → 迭代/循环
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9"/><path d="M21 3v6h-6"/></svg>
```

#### external-link → 外部引用/链接
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></svg>
```

---

### 状态与信号

#### check → 完成确认
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
```

#### check-circle → 成功状态
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
```

#### x → 关闭/移除
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
```

#### x-circle → 错误/失败
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
```

#### alert-triangle → 警告/风险
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
```

#### info → 信息提示
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></svg>
```

#### question → 疑问/未知
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
```

#### star → 重点/收藏
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z"/></svg>
```

---

### 数据与图表

#### bar-chart → 柱状图/比较
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
```

#### trending-up → 增长趋势
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
```

#### trending-down → 下降趋势
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
```

#### pie-chart → 饼图/占比
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
```

#### activity → 波动/活跃度
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
```

#### filter → 筛选/过滤
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
```

#### gauge → 指标/性能
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12l3.5-7.5"/><circle cx="12" cy="12" r="10"/><path d="M4.93 7.7A10 10 0 0 1 12 2a10 10 0 0 1 7.07 5.7"/></svg>
```

---

### 流程与连接

#### flow → 流程/管道
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h3"/><path d="M14 12h3"/><path d="M12 7v3"/><path d="M12 14v3"/></svg>
```

#### git-branch → 分支/并行路径
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
```

#### git-merge → 合并/汇聚
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
```

#### layers → 层次/架构
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
```

#### workflow → 工作流
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h4"/><path d="M14 6.5a3.5 3.5 0 0 1 0 7"/><path d="M10 17.5a3.5 3.5 0 0 1 0-7"/></svg>
```

#### cycle → 循环/闭环
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.22-8.56"/><path d="M21 3v6h-6"/></svg>
```

---

### 人物与团队

#### user → 个人/用户
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
```

#### users → 团队/受众
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
```

#### user-check → 认证/已验证
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M17 11l2 2 4-4"/></svg>
```

#### presentation → 演讲/报告
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8h4"/><path d="M7 11h10"/></svg>
```

#### megaphone → 公告/推广
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
```

---

### 技术与工具

#### code → 代码/开发
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
```

#### terminal → 命令行
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
```

#### database → 数据库/存储
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
```

#### cloud → 云服务/部署
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
```

#### server → 服务器/基础设施
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="0.5" fill="currentColor"/><circle cx="6" cy="18" r="0.5" fill="currentColor"/></svg>
```

#### cpu → 计算/处理器
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></svg>
```

#### wifi → 网络/连接
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
```

#### shield → 安全/保护
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
```

#### key → 密钥/关键
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
```

#### zap → 性能/速度（替代 ⚡ emoji）
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
```

#### cpu-ai → AI/机器学习
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></svg>
```

---

### 时间与进度

#### clock → 时限/周期
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
```

#### calendar → 日期/排期
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
```

#### milestone → 里程碑
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M4 6h16"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><circle cx="12" cy="13" r="3"/></svg>
```

#### timer → 计时器/紧急
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><path d="M12 2v3"/></svg>
```

---

### 内容与概念

#### lightbulb → 灵感/想法（替代 💡 emoji）
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3z"/></svg>
```

#### target → 目标/聚焦（替代 🎯 emoji）
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
```

#### compass → 方向/战略
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
```

#### search → 搜索/分析
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
```

#### book → 知识/文档
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
```

#### file-text → 文档/报告
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
```

#### image → 图片/视觉
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
```

#### puzzle → 集成/解决方案
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.63l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.13 7.13 0 0 0-1.67-.97l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65a7.13 7.13 0 0 0-1.67.97l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.63l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.63l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.06.73 1.67.97l.38 2.65c.05.24.26.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65a7.13 7.13 0 0 0 1.67-.97l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.63l-2.11-1.65z"/><circle cx="12" cy="12" r="3"/></svg>
```

#### globe → 全球化/国际化
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
```

#### rocket → 发布/启动（替代 🚀 emoji）
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
```

---

### 动作与操作

#### play → 开始/播放
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
```

#### download → 下载/获取
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
```

#### upload → 上传/提交
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
```

#### share → 分享/传播
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51l-6.82 3.98"/></svg>
```

#### copy → 复制/备份
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
```

#### settings → 配置/设置
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
```

#### plus → 添加/新增
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
```

#### minus → 减少/移除
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
```

---

### 连接线与装饰符

> 以下不是"图标"，而是用于构建时间线、连接线、分隔符的结构性 SVG 片段。

#### connector-arrow → 水平连接箭头（时间线步骤间）
```html
<svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="0" y1="12" x2="34" y2="12"/><path d="M30 7l5 5-5 5"/></svg>
```

#### connector-dash → 虚线连接（可选/条件路径）
```html
<svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="0" y1="12" x2="34" y2="12" stroke-dasharray="4 4"/><path d="M30 7l5 5-5 5"/></svg>
```

#### divider-line → 分隔线
```html
<svg width="200" height="2" viewBox="0 0 200 2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"><line x1="0" y1="1" x2="200" y2="1"/></svg>
```

#### divider-dot → 点状分隔线
```html
<svg width="200" height="4" viewBox="0 0 200 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.3"><line x1="2" y1="2" x2="198" y2="2" stroke-dasharray="2 8"/></svg>
```

---

## 使用场景速查

### 特性列表
```html
<ul class="icon-list">
  <li>
    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    <span>高性能渲染引擎</span>
  </li>
  <li>
    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    <span>零配置开箱即用</span>
  </li>
</ul>
```

### 特性卡片（icon-box）
```html
<div style="display: flex; gap: 24px;">
  <div style="flex: 1;">
    <div class="icon-box">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    </div>
    <h3 style="margin-top: 12px;">极速性能</h3>
    <p style="color: var(--c-fg-3);">亚秒级响应，流畅交互体验</p>
  </div>
</div>
```

### 时间线
```html
<div style="display: flex; align-items: center; gap: 8px;">
  <!-- 步骤 1 -->
  <div class="icon-box" style="background: var(--c-accent); color: white;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  </div>
  <!-- 连接器 -->
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="var(--c-accent)" stroke-width="1.6"><line x1="0" y1="12" x2="34" y2="12"/><path d="M30 7l5 5-5 5"/></svg>
  <!-- 步骤 2 -->
  <div class="icon-box">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  </div>
</div>
```

### 状态指示器
```html
<!-- 成功 -->
<div style="display: flex; align-items: center; gap: 8px;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
  <span style="color: var(--success, #22c55e);">部署完成</span>
</div>

<!-- 警告 -->
<div style="display: flex; align-items: center; gap: 8px;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning, #f59e0b)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
  <span style="color: var(--warning, #f59e0b);">需要关注</span>
</div>
```

---

## 内容类型 → 图标映射

生成 PPT 时，根据内容自动匹配图标：

| 内容类型 | 推荐图标 | 说明 |
|---------|---------|------|
| 特性列表 | `check` | 简洁的勾选标记 |
| 成功/完成 | `check-circle` | 带圆形的成功状态 |
| 警告/风险 | `alert-triangle` | 三角警示 |
| 错误/失败 | `x-circle` | 圆形错误标记 |
| 增长/提升 | `trending-up` | 上升趋势线 |
| 流程步骤 | `arrow-right` + `connector-arrow` | 流程推进 |
| 时间节点 | `clock` / `calendar` / `milestone` | 按粒度选择 |
| 团队/人员 | `users` | 多人场景 |
| 技术/代码 | `code` / `terminal` | 开发相关 |
| 数据/分析 | `bar-chart` / `pie-chart` / `filter` | 按类型选择 |
| 安全/合规 | `shield` / `key` | 安全相关 |
| 灵感/创新 | `lightbulb` | 替代 💡 |
| 目标/聚焦 | `target` | 替代 🎯 |
| 发布/上线 | `rocket` | 替代 🚀 |
| 速度/性能 | `zap` | 替代 ⚡ |
| AI/机器学习 | `cpu-ai` | AI 主题 |
| 云服务 | `cloud` | 云/部署 |
| 架构/层次 | `layers` | 多层架构 |
| 全局/国际 | `globe` | 国际化 |
| 设置/配置 | `settings` | 配置项 |

---

## 替代 Font Awesome 指南

**禁止使用 Font Awesome CDN**。所有新演示文稿必须使用本图标系统的 inline SVG：

| Font Awesome | 本系统 | 优势 |
|-------------|--------|------|
| `fa-bolt` | `zap` | 无 CDN 依赖 |
| `fa-rocket` | `rocket` | 统一描边风格 |
| `fa-check-circle` | `check-circle` | `currentColor` 自适应 |
| `fa-bullseye` | `target` | 无 Emoji 替代 |
| `fa-lightbulb` | `lightbulb` | 无 Emoji 替代 |
| `fa-chart-bar` | `bar-chart` | 轻量（200B vs 100KB） |
| `fa-users` | `users` | 零网络请求 |
| `fa-code` | `code` | 可精确控制大小和颜色 |
| `fa-play` | `play` | 无字体加载延迟 |
| `fa-terminal` | `terminal` | 无 FOUT 问题 |

**迁移步骤**：
1. 移除 `<link rel="stylesheet" href="...font-awesome...">`
2. 将 `<i class="fas fa-xxx"></i>` 替换为对应的 inline SVG
3. 图标自动继承父元素颜色，无需额外设置

---

## 复杂图标生成指南

当基础线性图标无法满足需求时（如：架构图、流程示意图、组织结构、产品插图），按以下策略处理。

### 策略选择

| 复杂度 | 场景 | 推荐方案 | 示例 |
|--------|------|---------|------|
| **组合级** | 2-3 个基础图标的组合 | SVG 组合 + CSS 布局 | 服务器+箭头+数据库 = 数据流 |
| **图解级** | 流程图、架构图、关系图 | HTML+CSS 构建，不用 SVG 画 | flex/grid 布局 + 连接线 |
| **插图级** | 产品示意图、场景插图 | 外部图片（SVG/PNG）引用 | `data-background` 或 `<img>` |
| **图表级** | 数据可视化（饼图、折线图） | CSS/SVG 手绘或 Reveal.js 插件 | Chart.js、内联 SVG |

### 组合图标（最常用）

将多个基础图标通过 CSS 组合，表达更复杂的含义：

```html
<!-- 数据流：服务器 → 数据库 -->
<div style="display: flex; align-items: center; gap: 8px;">
  <div class="icon-box">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="0.5" fill="currentColor"/><circle cx="6" cy="18" r="0.5" fill="currentColor"/></svg>
  </div>
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none" stroke="var(--c-fg-3)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="0" y1="12" x2="26" y2="12"/><path d="M22 7l5 5-5 5"/></svg>
  <div class="icon-box">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
  </div>
</div>
```

### 图解构建（流程图 / 架构图）

不用 SVG 画整个图解——用 HTML+CSS 布局 + 连接线 SVG 片段：

```html
<!-- 3 层架构图 -->
<div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
  <!-- 层 1 -->
  <div style="width: 60%; padding: 12px 20px; background: oklch(from var(--c-accent) l c h / 0.12);
              border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.85em;">
    <span style="color: var(--c-accent);">前端层</span>
    <span style="color: var(--c-fg-3); font-weight: 400; margin-left: 8px;">React / Vue</span>
  </div>
  <!-- 连接线 -->
  <svg width="2" height="20" viewBox="0 0 2 20" fill="none" stroke="var(--c-fg-3)"
       stroke-width="1.6" stroke-dasharray="4 3" opacity="0.5">
    <line x1="1" y1="0" x2="1" y2="20"/>
  </svg>
  <!-- 层 2 -->
  <div style="width: 70%; padding: 12px 20px; background: oklch(from var(--c-fg) l c h / 0.06);
              border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.85em;">
    <span style="color: var(--c-accent);">服务层</span>
    <span style="color: var(--c-fg-3); font-weight: 400; margin-left: 8px;">API Gateway</span>
  </div>
  <!-- 连接线 -->
  <svg width="2" height="20" viewBox="0 0 2 20" fill="none" stroke="var(--c-fg-3)"
       stroke-width="1.6" stroke-dasharray="4 3" opacity="0.5">
    <line x1="1" y1="0" x2="1" y2="20"/>
  </svg>
  <!-- 层 3 -->
  <div style="width: 50%; padding: 12px 20px; background: oklch(from var(--c-fg) l c h / 0.06);
              border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.85em;">
    <span style="color: var(--c-accent);">数据层</span>
    <span style="color: var(--c-fg-3); font-weight: 400; margin-left: 8px;">PostgreSQL</span>
  </div>
</div>
```

**关键规则**：
- 每层 ≤3 个文字标签（名称 + 技术 + 一句话说明）
- 层数 ≤5 层，超过则拆分或简化
- 连接线用 `stroke-dasharray` 虚线表示异步/可选，实线表示同步/必须

### 插图级图标

当需要产品截图、场景插图、人物插画等复杂图形时：

```html
<!-- 方案 A：外部图片（推荐，支持 CDN） -->
<img src="https://example.com/product-screenshot.png"
     style="max-width: 80%; max-height: 400px; object-fit: contain;
            border: 1px solid var(--border, oklch(80% 0 0)); border-radius: 8px;"
     alt="产品截图">

<!-- 方案 B：全屏背景图 -->
<section data-background="https://picsum.photos/1280/720"
         data-background-size="cover">
  <div style="position: relative; z-index: 1;">
    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: -1;"></div>
    <h1 style="color: #fff;">覆盖在图片上的标题</h1>
  </div>
</section>

<!-- 方案 C：带圆角和阴影的设备框架（适合 App 展示） -->
<div style="display: flex; justify-content: center;">
  <div style="width: 280px; padding: 40px 16px 16px; background: #1a1a1a;
              border-radius: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <img src="screenshot.png" style="width: 100%; border-radius: 4px;"
         alt="App 界面">
  </div>
</div>
```

### 图表级（数据可视化）

简单图表用内联 SVG 手绘，复杂图表用库：

```html
<!-- 简单柱状图（内联 SVG，无需库） -->
<div style="display: flex; align-items: flex-end; gap: 16px; height: 200px; padding: 0 2em;">
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
    <div style="width: 100%; background: var(--c-accent); border-radius: 4px 4px 0 0;
                height: 75%; opacity: 0.85;"></div>
    <span style="font-size: 0.75em; color: var(--c-fg-3);">Q1</span>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
    <div style="width: 100%; background: var(--c-accent); border-radius: 4px 4px 0 0;
                height: 90%;"></div>
    <span style="font-size: 0.75em; color: var(--c-fg-3);">Q2</span>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
    <div style="width: 100%; background: var(--c-accent); border-radius: 4px 4px 0 0;
                height: 60%; opacity: 0.7;"></div>
    <span style="font-size: 0.75em; color: var(--c-fg-3);">Q3</span>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
    <div style="width: 100%; background: var(--c-accent); border-radius: 4px 4px 0 0;
                height: 95%;"></div>
    <span style="font-size: 0.75em; color: var(--c-fg-3);">Q4</span>
  </div>
</div>
```

> **注意**：PPTX 导出时，内联 SVG 图标和 HTML+CSS 构建的图解会作为**静态图片**导出（不可编辑）。如果需要导出后可编辑的文字，请使用纯文本元素而非图形化构建。柱状图等数据可视化建议在 PPTX 导出后用 PowerPoint 的图表功能重新制作。

### 复杂图标生成决策树

```
需要展示什么？
├─ 概念/状态/动作 → 用基础图标库（70 个 SVG）
├─ 多个概念的组合 → 组合图标（icon-box + connector）
├─ 层次/流程/架构 → HTML+CSS 图解（flex/grid + 连接线）
├─ 产品/场景截图 → 外部图片引用（<img> 或 data-background）
├─ 数据可视化 → 内联 CSS 柱状图 / 或提示用户在 PPT 中插入图表
└─ 定制插画/图标 → 用 AI 生图工具生成 SVG，内联嵌入
```
