#!/bin/bash

# 国内访问测试脚本
# 定期测试ToolKit Lab在国内的访问状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
CONFIG_FILE="../deploy-config.json"
LOG_FILE="../logs/access-test.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

log_success() {
    log "✅ $1"
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    log "⚠️  $1"
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    log "❌ $1"
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令
check_commands() {
    for cmd in curl grep; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "未找到命令: $cmd"
            exit 1
        fi
    done
}

# 解析配置
parse_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_warning "配置文件不存在: $CONFIG_FILE"
        # 使用默认值
        DOMESTIC_URL="https://{username}.gitee.io/toolkit-lab"
        INTERNATIONAL_URL="https://toolkit-site.vercel.app"
        return
    fi
    
    # 简单解析JSON（实际应该使用jq，但这里保持简单）
    DOMESTIC_URL=$(grep -o '"url": *"[^"]*"' "$CONFIG_FILE" | grep "gitee" | head -1 | cut -d'"' -f4 || echo "")
    INTERNATIONAL_URL=$(grep -o '"url": *"[^"]*"' "$CONFIG_FILE" | grep "vercel" | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -z "$DOMESTIC_URL" ]; then
        DOMESTIC_URL="https://{username}.gitee.io/toolkit-lab"
    fi
    
    if [ -z "$INTERNATIONAL_URL" ]; then
        INTERNATIONAL_URL="https://toolkit-site.vercel.app"
    fi
}

# 测试单个URL
test_url() {
    local url=$1
    local name=$2
    local timeout=15
    
    log "测试 $name: $url"
    
    # 使用curl测试
    local start_time=$(date +%s%N)
    
    # 尝试获取HTTP状态码和响应时间
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" --connect-timeout 10 --max-time "$timeout" "$url" 2>/dev/null || echo "000|0")
    
    local end_time=$(date +%s%N)
    local http_code=$(echo "$response" | cut -d'|' -f1)
    local response_time=$(echo "$response" | cut -d'|' -f2)
    
    # 计算总时间（毫秒）
    local total_time_ms=$(( (end_time - start_time) / 1000000 ))
    
    # 判断结果
    if [[ "$http_code" =~ ^[23][0-9]{2}$ ]]; then
        log_success "$name 访问正常 - HTTP $http_code, 响应时间: ${response_time}s (总时间: ${total_time_ms}ms)"
        return 0
    elif [ "$http_code" = "000" ]; then
        log_error "$name 连接失败 - 超时或网络错误 (总时间: ${total_time_ms}ms)"
        return 1
    else
        log_warning "$name 访问异常 - HTTP $http_code, 响应时间: ${response_time}s (总时间: ${total_time_ms}ms)"
        return 2
    fi
}

# 测试页面内容
test_page_content() {
    local url=$1
    local name=$2
    local timeout=20
    
    log "测试 $name 页面内容..."
    
    # 下载页面内容（前10KB）
    local content
    content=$(curl -s --connect-timeout 10 --max-time "$timeout" "$url" 2>/dev/null | head -c 10240)
    
    if [ -z "$content" ]; then
        log_warning "$name 页面内容为空"
        return 1
    fi
    
    # 检查关键内容
    local checks=("ToolKit Lab" "Base64" "二维码" "工具集合")
    local found_count=0
    
    for check in "${checks[@]}"; do
        if echo "$content" | grep -q "$check"; then
            found_count=$((found_count + 1))
        fi
    done
    
    if [ "$found_count" -ge 2 ]; then
        log_success "$name 页面内容正常 (找到 $found_count/4 个关键词)"
        return 0
    else
        log_warning "$name 页面内容异常 (只找到 $found_count/4 个关键词)"
        return 2
    fi
}

# 比较国内外访问
compare_access() {
    log "=== 比较国内外访问性能 ==="
    
    # 测试国外访问
    local intl_start=$(date +%s%N)
    test_url "$INTERNATIONAL_URL" "国外(Vercel)"
    local intl_result=$?
    local intl_end=$(date +%s%N)
    
    # 等待一下，避免请求太密集
    sleep 2
    
    # 测试国内访问
    local domestic_start=$(date +%s%N)
    test_url "$DOMESTIC_URL" "国内(Gitee)"
    local domestic_result=$?
    local domestic_end=$(date +%s%N)
    
    # 计算时间
    local intl_time_ms=$(( (intl_end - intl_start) / 1000000 ))
    local domestic_time_ms=$(( (domestic_end - domestic_start) / 1000000 ))
    
    log "访问时间对比:"
    log "  国外(Vercel): ${intl_time_ms}ms"
    log "  国内(Gitee):  ${domestic_time_ms}ms"
    
    if [ "$domestic_result" -eq 0 ] && [ "$intl_result" -ne 0 ]; then
        log_success "✅ 国内访问优于国外访问"
        return 0
    elif [ "$domestic_result" -eq 0 ] && [ "$intl_result" -eq 0 ]; then
        if [ "$domestic_time_ms" -lt "$intl_time_ms" ]; then
            log_success "✅ 国内访问更快 (快 $((intl_time_ms - domestic_time_ms))ms)"
        else
            log_warning "⚠️  国内访问比国外慢 $((domestic_time_ms - intl_time_ms))ms"
        fi
        return 0
    else
        log_error "❌ 国内访问测试失败"
        return 1
    fi
}

# 生成报告
generate_report() {
    local report_file="../logs/access-report-$(date '+%Y%m%d').txt"
    
    cat > "$report_file" << EOF
ToolKit Lab 访问测试报告
生成时间: $TIMESTAMP

=== 测试配置 ===
国内地址: $DOMESTIC_URL
国外地址: $INTERNATIONAL_URL

=== 测试结果 ===
$(tail -20 "$LOG_FILE")

=== 建议 ===
EOF
    
    # 根据日志添加建议
    if grep -q "❌" "$LOG_FILE"; then
        cat >> "$report_file" << EOF
1. 国内访问存在问题，需要检查：
   - Gitee Pages 是否正常启用
   - 仓库构建是否成功
   - 网络连接是否正常
EOF
    elif grep -q "⚠️" "$LOG_FILE"; then
        cat >> "$report_file" << EOF
1. 国内访问有警告，建议：
   - 监控访问性能
   - 考虑优化页面加载速度
   - 定期测试确保可用性
EOF
    else
        cat >> "$report_file" << EOF
1. 国内访问正常，继续保持
2. 建议定期测试监控
3. 考虑添加更多监控指标
EOF
    fi
    
    log "报告已生成: $report_file"
    cat "$report_file"
}

# 主函数
main() {
    echo -e "${GREEN}=== ToolKit Lab 国内访问测试 ===${NC}"
    echo "测试时间: $TIMESTAMP"
    echo ""
    
    check_commands
    parse_config
    
    log "开始测试..."
    
    # 测试国外访问
    test_url "$INTERNATIONAL_URL" "国外(Vercel)"
    test_page_content "$INTERNATIONAL_URL" "国外(Vercel)"
    
    # 测试国内访问  
    test_url "$DOMESTIC_URL" "国内(Gitee)"
    test_page_content "$DOMESTIC_URL" "国内(Gitee)"
    
    # 比较访问
    compare_access
    
    # 生成报告
    generate_report
    
    echo -e "\n${GREEN}测试完成！${NC}"
    echo "详细日志: $LOG_FILE"
}

# 运行主函数
main "$@"