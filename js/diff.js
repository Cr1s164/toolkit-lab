/**
 * 文本差异对比器 - ToolKit Lab
 * 基于开源Diff库提供原创功能和用户体验
 * 主要功能：多种对比算法、语法高亮、实时同步滚动
 */

document.addEventListener('DOMContentLoaded', function() {
    // 使用统计
    let usageCount = localStorage.getItem('diffUsageCount') || 0;
    document.getElementById('usage-count').textContent = usageCount;
    
    // 获取DOM元素
    const leftText = document.getElementById('left-text');
    const rightText = document.getElementById('right-text');
    const leftCount = document.getElementById('left-count');
    const rightCount = document.getElementById('right-count');
    const leftLineNumbers = document.getElementById('left-line-numbers');
    const rightLineNumbers = document.getElementById('right-line-numbers');
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-btn');
    const swapBtn = document.getElementById('swap-btn');
    const diffResult = document.getElementById('diff-result');
    const diffPreview = document.getElementById('diff-preview');
    const addedCount = document.getElementById('added-count');
    const removedCount = document.getElementById('removed-count');
    const changedCount = document.getElementById('changed-count');
    const similarity = document.getElementById('similarity');
    const diffAlgorithm = document.getElementById('diff-algorithm');
    const languageSelect = document.getElementById('language-select');
    const showLineNumbers = document.getElementById('show-line-numbers');
    const syncScroll = document.getElementById('sync-scroll');
    const exportHtmlBtn = document.getElementById('export-html-btn');
    const copyDiffBtn = document.getElementById('copy-diff-btn');
    const shareBtn = document.getElementById('share-btn');
    
    // 初始化高亮
    hljs.configure({ languages: ['javascript', 'python', 'html', 'css', 'json'] });
    
    // 字符计数
    function updateCharCount() {
        leftCount.textContent = leftText.value.length;
        rightCount.textContent = rightText.value.length;
        
        // 更新行号显示
        updateLineNumbers();
    }
    
    // 更新行号
    function updateLineNumbers() {
        if (!showLineNumbers.checked) {
            leftLineNumbers.classList.add('hidden');
            rightLineNumbers.classList.add('hidden');
            return;
        }
        
        leftLineNumbers.classList.remove('hidden');
        rightLineNumbers.classList.remove('hidden');
        
        // 计算左侧行数
        const leftLines = leftText.value.split('\n').length;
        let leftNumbers = '';
        for (let i = 1; i <= leftLines; i++) {
            leftNumbers += `<div class="px-2 py-0.5">${i}</div>`;
        }
        leftLineNumbers.innerHTML = leftNumbers;
        
        // 计算右侧行数
        const rightLines = rightText.value.split('\n').length;
        let rightNumbers = '';
        for (let i = 1; i <= rightLines; i++) {
            rightNumbers += `<div class="px-2 py-0.5">${i}</div>`;
        }
        rightLineNumbers.innerHTML = rightNumbers;
        
        // 调整textarea padding
        leftText.style.paddingLeft = showLineNumbers.checked ? '56px' : '16px';
        rightText.style.paddingLeft = showLineNumbers.checked ? '56px' : '16px';
    }
    
    // 同步滚动
    function setupSyncScroll() {
        if (!syncScroll.checked) return;
        
        leftText.addEventListener('scroll', function() {
            const scrollPercent = leftText.scrollTop / (leftText.scrollHeight - leftText.clientHeight);
            rightText.scrollTop = scrollPercent * (rightText.scrollHeight - rightText.clientHeight);
        });
        
        rightText.addEventListener('scroll', function() {
            const scrollPercent = rightText.scrollTop / (rightText.scrollHeight - rightText.clientHeight);
            leftText.scrollTop = scrollPercent * (leftText.scrollHeight - leftText.clientHeight);
        });
    }
    
    // 对比文本
    function compareTexts() {
        const left = leftText.value.trim();
        const right = rightText.value.trim();
        
        if (!left && !right) {
            showToast('请输入要对比的文本', 'error');
            return;
        }
        
        // 使用Diff库进行对比
        let diff;
        const algorithm = diffAlgorithm.value;
        
        switch(algorithm) {
            case 'chars':
                diff = Diff.diffChars(left, right);
                break;
            case 'words':
                diff = Diff.diffWords(left, right);
                break;
            case 'lines':
            default:
                diff = Diff.diffLines(left, right);
                break;
            case 'semantic':
                diff = Diff.diffTrimmedLines(left, right);
                break;
        }
        
        // 统计结果
        let added = 0;
        let removed = 0;
        let changed = 0;
        let total = Math.max(left.length, right.length);
        let common = 0;
        
        diff.forEach(part => {
            if (part.added) added++;
            if (part.removed) removed++;
            if (!part.added && !part.removed) common += part.value.length;
        });
        
        // 计算相似度
        const similarityValue = total > 0 ? Math.round((common / total) * 100) : 100;
        
        // 更新统计显示
        addedCount.textContent = added;
        removedCount.textContent = removed;
        changedCount.textContent = Math.max(0, Math.min(added, removed)); // 简单估算修改行
        similarity.textContent = similarityValue + '%';
        
        // 显示对比结果
        displayDiffResult(diff);
        
        // 显示结果区域
        diffResult.classList.remove('hidden');
        
        // 更新使用统计
        usageCount++;
        document.getElementById('usage-count').textContent = usageCount;
        localStorage.setItem('diffUsageCount', usageCount);
        
        showToast('对比完成！', 'success');
        trackToolUsage('diff-compare');
    }
    
    // 显示对比结果
    function displayDiffResult(diff) {
        const language = languageSelect.value;
        let resultHTML = '';
        
        diff.forEach((part, index) => {
            // 处理文本，分割为行
            const lines = part.value.split('\n');
            
            lines.forEach((line, lineIndex) => {
                if (line === '' && lineIndex === lines.length - 1) return; // 忽略最后一个空行
                
                let lineClass = '';
                let prefix = '';
                
                if (part.added) {
                    lineClass = 'bg-green-900 text-green-100';
                    prefix = '+ ';
                } else if (part.removed) {
                    lineClass = 'bg-red-900 text-red-100'; 
                    prefix = '- ';
                } else {
                    lineClass = 'bg-gray-800 text-gray-300';
                    prefix = '  ';
                }
                
                // 语法高亮
                let highlightedLine = line;
                if (language !== 'plaintext' && line.trim()) {
                    try {
                        highlightedLine = hljs.highlight(line, { language }).value;
                    } catch (e) {
                        highlightedLine = line;
                    }
                }
                
                resultHTML += `
                    <div class="${lineClass} px-4 py-1 font-mono text-sm border-l-4 ${part.added ? 'border-green-500' : part.removed ? 'border-red-500' : 'border-gray-700'}">
                        <span class="opacity-70 select-none mr-4">${prefix}</span>
                        <span class="diff-line">${highlightedLine || ' '}</span>
                    </div>
                `;
            });
        });
        
        diffPreview.innerHTML = resultHTML || `
            <div class="text-gray-500 text-center py-8">
                <i class="fas fa-equals text-3xl mb-3"></i>
                <p>文本完全相同</p>
            </div>
        `;
    }
    
    // 清空内容
    function clearAll() {
        leftText.value = '';
        rightText.value = '';
        updateCharCount();
        diffResult.classList.add('hidden');
        showToast('已清空所有内容', 'info');
    }
    
    // 交换文本
    function swapTexts() {
        const temp = leftText.value;
        leftText.value = rightText.value;
        rightText.value = temp;
        updateCharCount();
        showToast('已交换左右文本', 'info');
    }
    
    // 导出HTML报告
    function exportHtmlReport() {
        const left = leftText.value.trim();
        const right = rightText.value.trim();
        
        if (!left && !right) {
            showToast('没有内容可导出', 'error');
            return;
        }
        
        const report = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>文本差异对比报告 - ToolKit Lab</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .diff-result { background: #f5f5f5; padding: 20px; border-radius: 8px; }
                    .added { background: #d4edda; color: #155724; padding: 2px 4px; }
                    .removed { background: #f8d7da; color: #721c24; padding: 2px 4px; }
                    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .stat-box { text-align: center; padding: 15px; background: white; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>文本差异对比报告</h1>
                    <p>生成时间: ${new Date().toLocaleString()}</p>
                    <p>工具: ToolKit Lab 文本差异对比器</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <h3>新增行</h3>
                        <p>${addedCount.textContent}</p>
                    </div>
                    <div class="stat-box">
                        <h3>删除行</h3>
                        <p>${removedCount.textContent}</p>
                    </div>
                    <div class="stat-box">
                        <h3>修改行</h3>
                        <p>${changedCount.textContent}</p>
                    </div>
                    <div class="stat-box">
                        <h3>相似度</h3>
                        <p>${similarity.textContent}</p>
                    </div>
                </div>
                
                <div class="diff-result">
                    ${diffPreview.innerHTML}
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                    <p>本报告由 ToolKit Lab 文本差异对比器生成</p>
                    <p>工具地址: https://toolkit-site.vercel.app</p>
                    <p>© 2026 ToolKit Lab - 数字工匠文化</p>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([report], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diff-report-${Date.now()}.html`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('HTML报告导出成功！', 'success');
    }
    
    // 复制差异文本
    function copyDiffText() {
        const diffText = diffPreview.innerText;
        
        if (!diffText || diffText.includes('文本完全相同') || diffText.includes('对比后将在这里显示差异')) {
            showToast('没有差异文本可复制', 'error');
            return;
        }
        
        navigator.clipboard.writeText(diffText).then(() => {
            showToast('差异文本已复制到剪贴板', 'success');
        }).catch(() => {
            showToast('复制失败，请手动复制', 'error');
        });
    }
    
    // 分享对比
    function shareComparison() {
        const left = leftText.value;
        const right = rightText.value;
        
        if (!left && !right) {
            showToast('没有内容可分享', 'error');
            return;
        }
        
        // 创建分享数据（编码为Base64避免URL过长问题）
        const shareData = {
            left: btoa(encodeURIComponent(left)),
            right: btoa(encodeURIComponent(right)),
            algorithm: diffAlgorithm.value,
            language: languageSelect.value
        };
        
        const shareString = JSON.stringify(shareData);
        const shareUrl = `${window.location.origin}${window.location.pathname}#share=${btoa(shareString)}`;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('分享链接已复制到剪贴板', 'success');
        }).catch(() => {
            showToast('复制失败，请手动复制URL', 'error');
        });
    }
    
    // 加载示例
    function loadExample(type) {
        let leftExample = '';
        let rightExample = '';
        
        switch(type) {
            case 'code':
                leftExample = `function calculateSum(a, b) {
    return a + b;
}

function greetUser(name) {
    console.log('Hello, ' + name);
}

const numbers = [1, 2, 3, 4, 5];
let total = 0;
for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
}`;
                
                rightExample = `function calculateSum(a, b) {
    // 添加输入验证
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a + b;
}

function greetUser(name) {
    if (!name) {
        name = 'Guest';
    }
    console.log(\`Hello, \${name}!\`);
}

const numbers = [1, 2, 3, 4, 5];
const total = numbers.reduce((sum, num) => sum + num, 0);`;
                break;
                
            case 'config':
                leftExample = `{
    "app": {
        "name": "MyApp",
        "version": "1.0.0"
    },
    "database": {
        "host": "localhost",
        "port": 3306
    },
    "features": {
        "auth": true,
        "logging": false
    }
}`;
                
                rightExample = `{
    "app": {
        "name": "MyApp",
        "version": "1.1.0",
        "description": "Updated application"
    },
    "database": {
        "host": "db.example.com",
        "port": 5432,
        "ssl": true
    },
    "features": {
        "auth": true,
        "logging": true,
        "cache": true
    },
    "security": {
        "https": true
    }
}`;
                break;
        }
        
        leftText.value = leftExample;
        rightText.value = rightExample;
        updateCharCount();
        showToast('示例已加载，点击"开始对比"查看差异', 'info');
    }
    
    // 粘贴到左侧
    window.pasteToLeft = function() {
        navigator.clipboard.readText().then(text => {
            leftText.value = text;
            updateCharCount();
            showToast('已粘贴到左侧', 'success');
        }).catch(() => {
            showToast('无法读取剪贴板内容', 'error');
        });
    };
    
    // 粘贴到右侧
    window.pasteToRight = function() {
        navigator.clipboard.readText().then(text => {
            rightText.value = text;
            updateCharCount();
            showToast('已粘贴到右侧', 'success');
        }).catch(() => {
            showToast('无法读取剪贴板内容', 'error');
        });
    };
    
    // 事件监听
    leftText.addEventListener('input', updateCharCount);
    rightText.addEventListener('input', updateCharCount);
    compareBtn.addEventListener('click', compareTexts);
    clearBtn.addEventListener('click', clearAll);
    swapBtn.addEventListener('click', swapTexts);
    showLineNumbers.addEventListener('change', updateLineNumbers);
    syncScroll.addEventListener('change', setupSyncScroll);
    exportHtmlBtn.addEventListener('click', exportHtmlReport);
    copyDiffBtn.addEventListener('click', copyDiffText);
    shareBtn.addEventListener('click', shareComparison);
    
    // 输入框自动调整高度
    [leftText, rightText].forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
    
    // 初始行号显示
    updateLineNumbers();
    
    // 加载代码示例作为默认内容
    if (!leftText.value && !rightText.value) {
        loadExample('code');
    }
    
    // 跟踪工具加载
    trackToolUsage('diff-tool-loaded');
    
    console.log('文本差异对比器初始化完成！');
    console.log('数字工匠文化：通过工具提升开发效率');
});