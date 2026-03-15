// 时间戳转换工具逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 使用统计
    let usageCount = localStorage.getItem('timestampUsageCount') || 0;
    document.getElementById('usage-count').textContent = usageCount;
    
    // 获取DOM元素
    const timestampInput = document.getElementById('timestamp-input');
    const timezoneSelect = document.getElementById('timezone-select');
    const convertToDateBtn = document.getElementById('convert-to-date');
    const dateResult = document.getElementById('date-result');
    const copyDateBtn = document.getElementById('copy-date');
    
    const datetimeInput = document.getElementById('datetime-input');
    const precisionRadios = document.querySelectorAll('input[name="precision"]');
    const convertToTimestampBtn = document.getElementById('convert-to-timestamp');
    const timestampResult = document.getElementById('timestamp-result');
    const copyTimestampBtn = document.getElementById('copy-timestamp');
    
    const currentTimestamp = document.getElementById('current-timestamp');
    const currentTimestampMs = document.getElementById('current-timestamp-ms');
    const currentDatetime = document.getElementById('current-datetime');
    const refreshTimeBtn = document.getElementById('refresh-time');
    
    // 设置当前时间为默认值
    const now = new Date();
    const localDateTime = now.toISOString().slice(0, 16);
    datetimeInput.value = localDateTime;
    
    // 初始化当前时间显示
    updateCurrentTime();
    
    // 时间戳转日期
    convertToDateBtn.addEventListener('click', function() {
        try {
            const timestampStr = timestampInput.value.trim();
            if (!timestampStr) {
                showError(dateResult, '请输入时间戳');
                return;
            }
            
            let timestamp = parseFloat(timestampStr);
            if (isNaN(timestamp)) {
                showError(dateResult, '无效的时间戳格式');
                return;
            }
            
            // 处理毫秒级时间戳（长度通常为13位）
            if (timestampStr.length >= 13) {
                timestamp = timestamp / 1000;
            }
            
            const timezone = timezoneSelect.value;
            let date;
            
            if (timezone === 'UTC') {
                date = new Date(timestamp * 1000);
                dateResult.innerHTML = `
                    <p><strong>UTC时间</strong>: ${date.toUTCString()}</p>
                    <p><strong>ISO格式</strong>: ${date.toISOString()}</p>
                    <p><strong>本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                `;
            } else if (timezone === 'local') {
                date = new Date(timestamp * 1000);
                dateResult.innerHTML = `
                    <p><strong>本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                    <p><strong>ISO格式</strong>: ${date.toISOString()}</p>
                    <p><strong>UTC时间</strong>: ${date.toUTCString()}</p>
                `;
            } else {
                // 其他时区
                date = new Date(timestamp * 1000);
                try {
                    const formatter = new Intl.DateTimeFormat('zh-CN', {
                        timeZone: timezone,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                    const formatted = formatter.format(date);
                    dateResult.innerHTML = `
                        <p><strong>${getTimezoneName(timezone)}时间</strong>: ${formatted}</p>
                        <p><strong>ISO格式</strong>: ${date.toISOString()}</p>
                        <p><strong>本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                    `;
                } catch (e) {
                    dateResult.innerHTML = `
                        <p><strong>ISO格式</strong>: ${date.toISOString()}</p>
                        <p><strong>本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                        <p><strong>UTC时间</strong>: ${date.toUTCString()}</p>
                    `;
                }
            }
            
            // 增加使用计数
            incrementUsageCount();
            
        } catch (error) {
            showError(dateResult, `转换失败: ${error.message}`);
        }
    });
    
    // 日期转时间戳
    convertToTimestampBtn.addEventListener('click', function() {
        try {
            const datetimeStr = datetimeInput.value;
            if (!datetimeStr) {
                showError(timestampResult, '请选择日期和时间');
                return;
            }
            
            const date = new Date(datetimeStr);
            if (isNaN(date.getTime())) {
                showError(timestampResult, '无效的日期时间格式');
                return;
            }
            
            const selectedPrecision = document.querySelector('input[name="precision"]:checked').value;
            let timestamp;
            
            if (selectedPrecision === 'seconds') {
                timestamp = Math.floor(date.getTime() / 1000);
                timestampResult.innerHTML = `
                    <p><strong>Unix时间戳（秒）</strong>: ${timestamp}</p>
                    <p><strong>对应UTC时间</strong>: ${date.toUTCString()}</p>
                    <p><strong>对应本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                `;
            } else {
                timestamp = date.getTime();
                timestampResult.innerHTML = `
                    <p><strong>Unix时间戳（毫秒）</strong>: ${timestamp}</p>
                    <p><strong>对应UTC时间</strong>: ${date.toUTCString()}</p>
                    <p><strong>对应本地时间</strong>: ${date.toLocaleString('zh-CN')}</p>
                `;
            }
            
            // 增加使用计数
            incrementUsageCount();
            
        } catch (error) {
            showError(timestampResult, `转换失败: ${error.message}`);
        }
    });
    
    // 复制日期结果
    copyDateBtn.addEventListener('click', function() {
        const text = dateResult.innerText || dateResult.textContent;
        if (!text || text.includes('转换结果将显示在这里')) {
            alert('没有内容可复制');
            return;
        }
        
        copyToClipboard(text);
        showCopySuccess(copyDateBtn);
    });
    
    // 复制时间戳结果
    copyTimestampBtn.addEventListener('click', function() {
        const text = timestampResult.innerText || timestampResult.textContent;
        if (!text || text.includes('转换结果将显示在这里')) {
            alert('没有内容可复制');
            return;
        }
        
        copyToClipboard(text);
        showCopySuccess(copyTimestampBtn);
    });
    
    // 刷新当前时间
    refreshTimeBtn.addEventListener('click', updateCurrentTime);
    
    // 自动刷新当前时间（每10秒）
    setInterval(updateCurrentTime, 10000);
    
    // 辅助函数
    function updateCurrentTime() {
        const now = new Date();
        const timestampSeconds = Math.floor(now.getTime() / 1000);
        const timestampMilliseconds = now.getTime();
        
        currentTimestamp.textContent = timestampSeconds;
        currentTimestampMs.textContent = timestampMilliseconds;
        currentDatetime.textContent = now.toLocaleString('zh-CN');
    }
    
    function getTimezoneName(timezone) {
        const names = {
            'Asia/Shanghai': '上海时间 (GMT+8)',
            'America/New_York': '纽约时间 (GMT-5)',
            'Europe/London': '伦敦时间 (GMT+0)',
            'UTC': 'UTC',
            'local': '本地'
        };
        return names[timezone] || timezone;
    }
    
    function showError(element, message) {
        element.innerHTML = `<p style="color: #dc2626;">❌ ${message}</p>`;
    }
    
    function incrementUsageCount() {
        usageCount = parseInt(usageCount) + 1;
        localStorage.setItem('timestampUsageCount', usageCount);
        document.getElementById('usage-count').textContent = usageCount;
    }
    
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    function showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>已复制';
        button.style.backgroundColor = '#10b981';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 2000);
    }
});