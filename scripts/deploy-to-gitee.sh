#!/bin/bash

# 部署脚本：将ToolKit Lab部署到Gitee Pages实现国内免翻墙访问

set -e  # 遇到错误时退出脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ToolKit Lab 国内部署脚本 ===${NC}"

# 检查必要命令
check_commands() {
    local commands=("git" "curl")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            echo -e "${RED}错误：未找到命令 $cmd${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}✓ 必要命令检查通过${NC}"
}

# 加载配置
load_config() {
    local config_file="../deploy-config.json"
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}错误：配置文件 $config_file 不存在${NC}"
        exit 1
    fi
    
    # 解析配置（简化版，实际应使用jq）
    GITEE_USERNAME=$(grep -o '"username": *"[^"]*"' "$config_file" | cut -d'"' -f4 || echo "")
    GITEE_REPO=$(grep -o '"repository": *"[^"]*"' "$config_file" | cut -d'"' -f4 || echo "")
    
    if [ -z "$GITEE_USERNAME" ] || [ -z "$GITEE_REPO" ]; then
        echo -e "${YELLOW}警告：配置文件中缺少Gitee用户名或仓库信息${NC}"
        echo "请编辑 deploy-config.json 文件，填写正确的Gitee配置"
        read -p "请输入Gitee用户名: " GITEE_USERNAME
        read -p "请输入Gitee仓库名（建议: toolkit-lab）: " REPO_NAME
        GITEE_REPO="https://gitee.com/$GITEE_USERNAME/$REPO_NAME"
    fi
    
    echo -e "${GREEN}✓ 配置加载完成${NC}"
    echo "Gitee用户名: $GITEE_USERNAME"
    echo "仓库地址: $GITEE_REPO"
}

# 检查Gitee认证
check_gitee_auth() {
    echo -e "\n${YELLOW}=== Gitee认证检查 ===${NC}"
    
    # 检查是否已有Gitee远程仓库配置
    if git remote | grep -q "gitee"; then
        echo -e "${GREEN}✓ 已配置Gitee远程仓库${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}未找到Gitee远程仓库配置${NC}"
    echo "需要设置Gitee认证才能继续"
    echo ""
    echo "有两种认证方式："
    echo "1. HTTPS方式（需要输入用户名和密码/令牌）"
    echo "2. SSH方式（需要配置SSH密钥）"
    echo ""
    read -p "请选择认证方式 (1/2，默认1): " AUTH_METHOD
    AUTH_METHOD=${AUTH_METHOD:-1}
    
    if [ "$AUTH_METHOD" = "1" ]; then
        setup_https_auth
    else
        setup_ssh_auth
    fi
}

# 设置HTTPS认证
setup_https_auth() {
    echo -e "\n${YELLOW}=== 设置HTTPS认证 ===${NC}"
    echo "注意：Gitee推荐使用个人访问令牌（Token）而不是密码"
    echo "可以在 Gitee -> 设置 -> 私人令牌 中生成令牌"
    echo ""
    
    read -p "请输入Gitee用户名 ($GITEE_USERNAME): " INPUT_USERNAME
    GITEE_USERNAME=${INPUT_USERNAME:-$GITEE_USERNAME}
    
    echo -e "${YELLOW}请输入Gitee密码或访问令牌（输入不会显示）:${NC}"
    read -s GITEE_TOKEN
    
    if [ -z "$GITEE_TOKEN" ]; then
        echo -e "${RED}错误：令牌不能为空${NC}"
        exit 1
    fi
    
    # 将认证信息保存到git配置（临时）
    git config --local credential.helper 'store --file=.git/gitee-credentials'
    echo "https://$GITEE_USERNAME:$GITEE_TOKEN@gitee.com" > .git/gitee-credentials
    
    echo -e "${GREEN}✓ HTTPS认证配置完成${NC}"
}

# 设置SSH认证
setup_ssh_auth() {
    echo -e "\n${YELLOW}=== 设置SSH认证 ===${NC}"
    
    # 检查是否有SSH密钥
    if [ -f ~/.ssh/id_rsa.pub ]; then
        echo -e "${GREEN}发现现有的SSH公钥:${NC}"
        cat ~/.ssh/id_rsa.pub
        echo ""
        read -p "是否使用此密钥？(y/n，默认y): " USE_EXISTING
        USE_EXISTING=${USE_EXISTING:-y}
        
        if [[ "$USE_EXISTING" =~ ^[Yy]$ ]]; then
            SSH_PUB_KEY=$(cat ~/.ssh/id_rsa.pub)
        fi
    fi
    
    if [ -z "$SSH_PUB_KEY" ]; then
        echo -e "${YELLOW}未找到SSH密钥，正在生成新的密钥对...${NC}"
        read -p "请输入邮箱地址（用于密钥标识）: " SSH_EMAIL
        
        if [ -z "$SSH_EMAIL" ]; then
            SSH_EMAIL="$GITEE_USERNAME@gitee.com"
        fi
        
        ssh-keygen -t rsa -b 4096 -C "$SSH_EMAIL" -f ~/.ssh/id_rsa_gitee -N ""
        SSH_PUB_KEY=$(cat ~/.ssh/id_rsa_gitee.pub)
        
        echo -e "${GREEN}✓ SSH密钥生成完成${NC}"
        echo -e "${YELLOW}请将以下公钥添加到Gitee:${NC}"
        echo "1. 登录 Gitee"
        echo "2. 进入 设置 -> SSH公钥"
        echo "3. 粘贴以下公钥："
        echo ""
        echo "$SSH_PUB_KEY"
        echo ""
        read -p "按回车键继续..." </dev/tty
    fi
    
    # 配置SSH
    if [ -f ~/.ssh/id_rsa_gitee ]; then
        ssh-add ~/.ssh/id_rsa_gitee 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ SSH认证配置完成${NC}"
}

# 初始化Gitee仓库
init_gitee_repo() {
    echo -e "\n${YELLOW}=== 初始化Gitee仓库 ===${NC}"
    
    # 检查本地是否有.git目录
    if [ ! -d ".git" ]; then
        echo -e "${RED}错误：当前目录不是git仓库${NC}"
        echo "请先初始化git仓库：git init"
        exit 1
    fi
    
    # 添加Gitee远程仓库
    if ! git remote | grep -q "gitee"; then
        echo "添加Gitee远程仓库: $GITEE_REPO"
        git remote add gitee "$GITEE_REPO"
    fi
    
    # 检查远程仓库是否存在
    echo "检查远程仓库是否存在..."
    if git ls-remote --exit-code "gitee" &>/dev/null; then
        echo -e "${GREEN}✓ 远程仓库已存在${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}远程仓库不存在，需要创建${NC}"
    echo "请先在Gitee上创建仓库: $GITEE_REPO"
    echo ""
    echo "创建步骤："
    echo "1. 登录 Gitee"
    echo "2. 点击右上角 + 号 -> 新建仓库"
    echo "3. 仓库名称: toolkit-lab"
    echo "4. 仓库介绍: 完全免费的开发者工具集合网站"
    echo "5. 选择公开仓库"
    echo "6. 不勾选初始化README（我们会推送现有代码）"
    echo "7. 点击创建"
    echo ""
    read -p "创建完成后按回车键继续..." </dev/tty
    
    # 再次检查
    if git ls-remote --exit-code "gitee" &>/dev/null; then
        echo -e "${GREEN}✓ 远程仓库已创建${NC}"
    else
        echo -e "${RED}错误：无法访问远程仓库，请检查网络和权限${NC}"
        exit 1
    fi
}

# 推送代码到Gitee
push_to_gitee() {
    echo -e "\n${YELLOW}=== 推送代码到Gitee ===${NC}"
    
    # 确保所有更改已提交
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}发现未提交的更改，正在提交...${NC}"
        git add .
        git commit -m "部署更新: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # 推送到Gitee
    echo "正在推送到Gitee..."
    if git push -u gitee main --force; then
        echo -e "${GREEN}✓ 代码推送成功${NC}"
    else
        echo -e "${RED}错误：推送失败${NC}"
        echo "请检查网络连接和认证信息"
        exit 1
    fi
}

# 配置Gitee Pages
setup_gitee_pages() {
    echo -e "\n${YELLOW}=== 配置Gitee Pages ===${NC}"
    
    echo "Gitee Pages 配置："
    echo "1. 访问仓库页面: $GITEE_REPO"
    echo "2. 点击 服务 -> Gitee Pages"
    echo "3. 选择部署分支: main"
    echo "4. 部署目录: / (根目录)"
    echo "5. 点击 启动"
    echo ""
    echo "注意：首次部署可能需要几分钟时间"
    echo ""
    
    # 尝试自动检测Pages是否已启用
    PAGES_URL="https://$GITEE_USERNAME.gitee.io/toolkit-lab"
    echo "检测Pages状态..."
    
    if curl -s --head "$PAGES_URL" | grep -q "HTTP.*200\|HTTP.*30[0-9]"; then
        echo -e "${GREEN}✓ Gitee Pages 已启用${NC}"
        echo "访问地址: $PAGES_URL"
    else
        echo -e "${YELLOW}Gitee Pages 尚未启用或正在构建中${NC}"
        echo "请按上述步骤手动启用Gitee Pages"
        read -p "启用完成后按回车键继续..." </dev/tty
    fi
}

# 测试国内访问
test_domestic_access() {
    echo -e "\n${YELLOW}=== 测试国内访问 ===${NC}"
    
    PAGES_URL="https://$GITEE_USERNAME.gitee.io/toolkit-lab"
    echo "测试访问: $PAGES_URL"
    
    # 简单HTTP测试
    if curl -s --connect-timeout 10 --max-time 20 "$PAGES_URL" | grep -q "ToolKit Lab"; then
        echo -e "${GREEN}✓ 国内访问测试通过${NC}"
        echo "网站可以在国内免翻墙访问了！"
    else
        echo -e "${YELLOW}⚠ 访问测试可能失败或超时${NC}"
        echo "可能原因："
        echo "1. Pages 正在构建中（请等待几分钟后重试）"
        echo "2. 网络问题"
        echo "3. 页面内容不匹配"
        echo ""
        echo "建议："
        echo "1. 等待5-10分钟后刷新页面"
        echo "2. 检查 Gitee Pages 构建状态"
    fi
}

# 主函数
main() {
    echo "开始部署ToolKit Lab到国内平台（Gitee Pages）"
    echo "目标：实现国内免翻墙访问"
    echo ""
    
    # 切换到脚本所在目录的父目录（项目根目录）
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/.." || exit 1
    
    # 执行部署步骤
    check_commands
    load_config
    check_gitee_auth
    init_gitee_repo
    push_to_gitee
    setup_gitee_pages
    test_domestic_access
    
    echo -e "\n${GREEN}🎉 部署流程完成！${NC}"
    echo ""
    echo "部署总结："
    echo "1. 代码已推送到Gitee仓库"
    echo "2. Gitee Pages 已配置（可能需要手动启用）"
    echo "3. 国内访问地址: https://$GITEE_USERNAME.gitee.io/toolkit-lab"
    echo "4. 海外访问地址: https://toolkit-site.vercel.app"
    echo ""
    echo "下一步："
    echo "1. 测试国内访问是否正常"
    echo "2. 更新项目文档中的访问地址"
    echo "3. 将国内地址添加到推广内容中"
    echo "4. 设置自动同步机制"
}

# 运行主函数
main "$@"