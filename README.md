# Reveal.js Presentation Skill

> 生成有设计感的演示文稿，输出为单个 HTML 文件，浏览器打开即用。**无需安装任何东西。**

## 快速开始

```
你：做一个关于 AI 趋势的 PPT，受众是产品经理，8 页
AI：[生成 HTML 文件]
你：[双击 HTML 打开浏览器，方向键演示]
```

就这样。生成的 HTML 通过 CDN 加载 reveal.js、pptxgenjs 和 Google Fonts；图标使用内联 SVG，不依赖 Font Awesome。

- 方向键：翻页
- `S`：演讲者备注
- `F`：全屏

## 导出

| 格式 | 方法 | 需要安装？ |
|------|------|-----------|
| **PPTX** | HTML 内置按钮（左下角），点击即下载；导出脚本默认内联在 HTML 中 | ❌ 不需要 |
| **PDF** | Chrome 打开 `file.html?print-pdf` → 打印为 PDF | ❌ 不需要 |
| **CLI PPTX** | `node scripts/export-pptx.js file.html` | 需要 Node.js |

## 可选安装

如果你需要 CLI 工具（命令行导出、自动验证、本地预览）：

```bash
bash scripts/install-all.sh    # 一键安装所有可选依赖
```

安装内容：

| 工具 | 用途 |
|------|------|
| pptxgenjs + cheerio | CLI PPTX 导出 |
| Playwright | 自动溢出检测和截图验证 |
| http-server | 本地预览 `npm run start` |
| impeccable | 视觉设计增强 |

没有 Node.js？没关系——核心功能（生成 + 查看 + 导出）全在浏览器中完成。

## 模板

| 模板 | 风格 | 适用场景 |
|------|------|---------|
| editorial-serif | 优雅正式 | 学术报告、商务汇报 |
| dark-tech | 高对比技术 | 产品发布、开发者大会 |
| minimal-spatial | 网格空间感 | 解释性内容、架构说明 |
| vibrant-gradient | 大胆活力 | 营销推广、创意展示 |
| nature-fresh | 柔和清新 | 教学、内部分享 |

### 设计语言样例

这些是独立小型 PPT，不是综合图谱；每个文件代表一种不同视觉语言。

| 样例 | 设计语言 | 适用场景 |
|------|----------|----------|
| style-01-consulting-memo | 商务咨询 memo | 战略汇报、复盘、管理层决策 |
| style-02-minimal-keynote | 极简演讲 | CEO keynote、发布会开场 |
| style-03-data-story | 数据叙事 | 经营分析、研究报告 |
| style-04-product-launch | 产品发布 | 新品发布、Demo、版本更新 |
| style-05-education-workshop | 教育培训 | 课程、工作坊、内部培训 |
| style-06-pitch-deck | 融资销售 | 融资、销售、商务提案 |
| style-07-technical-architecture | 技术架构 | 架构评审、技术分享 |
| style-08-editorial-magazine | 编辑杂志 | 品牌、人物、趋势、文化主题 |
| style-09-brutalist-poster | Brutalist 海报 | 先锋观点、活动海报 |
| style-10-luxury-atelier | 奢侈品牌 atelier | 高端品牌、时尚、美妆 |
| style-11-illustrated-workshop | 手绘工作坊 | 轻培训、共创、儿童教育 |
| style-12-retro-memphis | Retro Memphis | 创意活动、Campaign、作品集 |

## 结构

```
revealjs-presentation/
├── SKILL.md              # AI 技能定义（核心文件）
├── README.md             # 本文件
├── package.json          # Node.js 依赖
├── examples/             # 5 个完整模板
├── references/               # 设计参考文档（18 份）
│   ├── layered-architecture.md   # 六层架构 + 概念交叉索引
│   ├── content-budget.md         # 内容预算 / 溢出决策树
│   ├── pin-safety.md             # Pin 安全区规则
│   ├── first-draft-recipes.md    # 首稿配方速查
│   ├── css-skeleton.md           # CSS 骨架
│   ├── design-polish.md          # 设计精致度 / 语法
│   ├── design-principles.md      # 配色 / 字体 / 反模式
│   ├── layout-patterns.md        # 布局模式 / 超框案例
│   ├── icon-system.md            # 85 个 inline SVG 图标
│   ├── diagram-system.md         # 图表系统
│   ├── data-viz.md               # 数据可视化
│   ├── image-system.md           # 图片处理
│   ├── motion-delight.md         # 动效与惊喜
│   ├── technical-specs.md        # CDN / Reveal 配置
│   ├── failure-gates.md          # 13 条失败门禁
│   ├── template-differentiation-audit.md  # 跨模板相似度审计
│   ├── pipeline-phases.md        # 专业模式 Phase Gate
│   ├── launch-grade.md           # 发布会级标准
│   └── impeccable-integration.md # impeccable 集成
└── scripts/              # 工具脚本
    ├── install-all.sh    # 一键安装
    ├── setup.sh          # 环境检查
    ├── lint-design.js    # 设计规则检查
    ├── validate.js       # 溢出检测
    ├── export-pptx.js    # CLI PPTX 导出
    └── ...
```
