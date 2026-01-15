# VersaTool Hub Standalone

多功能开发者工具集合（独立部署版本），基于 React + Vite 构建，可本地运行，也可作为独立应用部署到任意支持静态资源托管的平台。


![网站预览](pic/PixPin_2026-01-15_16-27-58.png)


#阿里云ESA Pages #阿里云云工开物

本项目是**阿里云 ESA (Edge Security Acceleration) 边缘计算创新大赛**的创意参赛作品。

借助 **阿里云 ESA** 强大的边缘计算能力，我们将这个富交互的静态网站分发到全球节点，确保用户在世界任何角落都能体验到闪电般的加载速度。

## 功能概览

当前项目包含一系列常用的小工具页面，大致分为三大类：

- 文本类
  - 文本大小写转换（Case Converter）
  - Lorem Ipsum 文本生成
  - 文本对比（Text Diff）
  - 字数统计（Word Counter）
  - 词频统计（Word Frequency）
- 开发辅助类
  - Base64 编码/解码
  - JSON 格式化与校验（JSON Formatter）
  - 模拟数据生成（Mock Data Generator）
  - 时间戳转换器（Timestamp Converter）
  - 二维码生成器（QRCode Generator）
- 安全工具类
  - 密码生成器（Password Generator）
  - 对称加解密工具（Symmetric Encryption）

所有工具统一使用顶部工具栏（ToolHeader）和布局（Layout），在普通网页模式和嵌入模式（iframe）下都能正常工作。

## 技术栈

- 构建工具：Vite
- 前端框架：React 19 + React Router
- 语言：TypeScript
- 样式：Tailwind CSS v4（通过 `index.css` 引入）
- 图标：`@fortawesome/fontawesome-free`
- 其他依赖：
  - `qrcode`：二维码生成
  - `crypto-js`：加解密相关能力

## 本地开发

### 环境要求

- Node.js（推荐 18+）
- npm（随 Node.js 安装）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后按终端提示访问本地地址（通常是 http://localhost:5173），即可在浏览器中访问所有工具页面。

### 类型检查

项目启用了 TypeScript 严格类型检查，可单独运行：

```bash
npm run typecheck
```

## 构建与预览

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist/` 目录，可直接上传到静态托管平台（如 GitHub Pages、Vercel、Netlify 等）。

### 本地预览构建产物

```bash
npm run preview
```

该命令会在本地起一个静态服务器，用于模拟生产环境访问效果。

## 嵌入模式说明

本项目支持作为 iframe 被嵌入到其他网站中使用，主要特性包括：

- 通过 URL 查询参数控制嵌入模式：
  - `?embed=1` 或 `?embed=true` 启用嵌入模式
  - `&compact=1` 或 `&compact=true` 启用紧凑布局（在支持的页面中）
- 针对 iframe 中的权限策略限制进行了适配：
  - 剪贴板相关操作会优先使用 `navigator.clipboard`，在受限环境下自动回退到文本区域选中复制
  - 某些在 iframe 中受限的功能（如文件下载）会在嵌入模式下禁用，并给出提示
- 布局会根据嵌入模式自动调整外边距和高度，避免出现双滚动条等问题

如果需要作为第三方工具嵌入到你的站点，可以参考项目中 `Layout`、`ToolHeader` 和 `utils/embedEnv.ts` 的逻辑。

## 目录结构（简要）

仅列出部分与开发关系较大的文件：

- `App.tsx`：路由配置与全局结构
- `components/`
  - `Layout.tsx`：全局布局与嵌入模式适配
  - `ToolHeader.tsx`：统一工具页头部区域
- `pages/`
  - `text/*`：文本相关工具页面
  - `dev/*`：开发辅助工具页面
  - `security/*`：安全工具页面
- `hooks/`
  - `useCopyFeedback.ts`：统一的复制提示逻辑
  - `useQRCode.ts`：二维码生成相关逻辑
- `utils/`
  - `clipboard.ts`：剪贴板封装，含嵌入模式兼容逻辑
  - `embedEnv.ts`：嵌入环境检测与参数解析
  - 其他工具函数文件
- `translations.ts`、`LanguageContext.tsx`：国际化与语言切换
- `ThemeContext.tsx`：主题切换（深色/浅色）
- `tailwind.config.ts`：Tailwind 配置
- `tsconfig.json`：TypeScript 配置

## 部署建议

- 构建完成后，将 `dist/` 目录内容上传至阿里云esa平台即可使用
- 如需配合 iframe 嵌入，请确保目标站点未对本应用域名设置过于严格的 `frame-ancestors` 或 `X-Frame-Options`
- 如需在生产环境中自定义标题、图标或 SEO 元信息，可根据需要修改 `index.html`

## ⚠️ 部署故障排除 (Troubleshooting)

如果你在部署时遇到错误：`code version number exceeds the quota limit`，这意味着你的阿里云 ESA 项目版本数量已达上限。

**解决方案:**
1. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)。
2. 进入你的项目 -> **版本管理 (Versions)** (或边缘程序 Edge Routines)。
3. 删除旧的、不再使用的版本以释放配额。
4. 重新提交部署。

---

## 声明
“本项目由阿里云ESA提供加速、计算和保护”
![Aliyun ESA Pages](pic/aliyunesapages.png)
