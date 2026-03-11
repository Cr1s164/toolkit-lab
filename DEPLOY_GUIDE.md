# ToolKit Lab 部署指南

## 多种部署方案选择

### 方案一：Vercel（推荐，最简单）
**特点**：免费、快速、自动SSL、全球CDN
**步骤**：
1. 访问 [vercel.com](https://vercel.com) 注册账号（GitHub账号可直接登录）
2. 点击 "New Project"
3. 导入GitHub仓库或直接拖拽上传文件夹
4. 自动部署完成，获得 `*.vercel.app` 域名
5. 可绑定自定义域名（可选）

**命令行部署**（如果已安装Vercel CLI）：
```bash
npm install -g vercel
cd toolkit-site
vercel --prod
```

### 方案二：GitHub Pages（完全免费）
**特点**：免费、稳定、与GitHub集成
**步骤**：
1. 在GitHub创建新仓库，如 `toolkit-lab`
2. 上传所有文件到仓库
3. 仓库设置 → Pages → 选择分支（如main）→ 保存
4. 访问 `https://[用户名].github.io/toolkit-lab`
5. 如需自定义域名，在Pages设置中添加

**快速命令**：
```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit"

# 连接到GitHub仓库
git remote add origin https://github.com/[用户名]/toolkit-lab.git
git push -u origin main
```

### 方案三：Netlify（类似Vercel）
**特点**：免费、功能丰富、支持表单等
**步骤**：
1. 访问 [netlify.com](https://netlify.com) 注册
2. 拖拽文件夹到部署区域
3. 自动获得 `*.netlify.app` 域名
4. 可配置重定向、表单等功能

### 方案四：Cloudflare Pages
**特点**：免费、快速、与Cloudflare生态集成
**步骤**：
1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 连接Git仓库或直接上传
3. 自动部署，获得 `*.pages.dev` 域名

## 域名绑定（可选）

### 购买域名建议
- **国内**：阿里云、腾讯云
- **国外**：Namecheap、GoDaddy
- **推荐域名**：`toolkit.fun`、`toolkitlab.dev`、`toolsfree.cn`

### 绑定步骤
1. 在域名注册商处添加CNAME记录
2. 指向Vercel/GitHub Pages提供的地址
3. 在托管平台添加自定义域名
4. 等待DNS生效（通常几分钟到几小时）

## 环境配置

### 必需文件
- `index.html` - 网站首页
- `sitemap.xml` - 搜索引擎地图
- `robots.txt` - 爬虫规则
- `images/wechat-qr.jpg` - 收款码图片

### 推荐配置
1. **开启HTTPS**：所有托管平台自动提供
2. **设置404页面**：可自定义错误页面
3. **配置重定向**：确保所有链接正确
4. **启用缓存**：提高访问速度

## 监控与维护

### 部署后检查清单
- [ ] 网站可正常访问
- [ ] 所有工具功能正常
- [ ] 移动端适配良好
- [ ] 收款码显示清晰
- [ ] SSL证书有效
- [ ] 搜索引擎可收录

### 日常维护
1. **定期备份**：代码和内容定期备份
2. **更新工具**：每周新增或改进工具
3. **监控访问**：使用Google Analytics或类似工具
4. **安全更新**：及时更新依赖库

## 问题排查

### 常见问题
1. **部署失败**：检查文件结构，确保有index.html
2. **图片不显示**：检查路径和文件权限
3. **工具不工作**：检查JavaScript控制台错误
4. **域名不生效**：等待DNS传播，检查CNAME配置

### 技术支持
- 项目GitHub仓库提交Issue
- Vercel/Netlify官方文档
- 在线社区和技术论坛

## 自动化部署（高级）

### GitHub Actions自动部署
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### 本地开发工作流
1. 修改代码 → 测试本地 → 提交到Git → 自动部署
2. 使用预览功能测试变更
3. 确认无误后发布到生产环境

---
**最后更新**：2026-03-10  
**部署状态**：待部署  
**首选方案**：Vercel自动部署（正在尝试）