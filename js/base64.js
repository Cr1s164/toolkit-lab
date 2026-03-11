// Base64 编解码工具逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 使用统计
    let usageCount = localStorage.getItem('base64UsageCount') || 0;
    document.getElementById('usage-count').textContent = usageCount;
    
    // 获取DOM元素
    const encodeInput = document.getElementById('encode-input');
    const encodeOutput = document.getElementById('encode-output');
    const decodeInput = document.getElementById('decode-input');
    const decodeOutput = document.getElementById('decode-output');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const clearEncodeBtn = document.getElementById('clear-encode');
    const clearDecodeBtn = document.getElementById('clear-decode');
    const copyEncodeBtn = document.getElementById('copy-encode');
    const copyDecodeBtn = document.getElementById('copy-decode');
    const fileInput = document.getElementById('file-input');
    const encodeFileBtn = document.getElementById('encode-file-btn');
    const decodeFileBtn = document.getElementById('decode-file-btn');
    const fileOutput = document.getElementById('file-output');
    const fileResult = document.getElementById('file-result');
    const fileDownload = document.getElementById('file-download');
    const downloadLink = document.getElementById('download-link');
    
    // Base64编码函数
    function base64Encode(text) {
        try {
            return btoa(unescape(encodeURIComponent(text)));
        } catch (e) {
            // 如果失败，尝试另一种方法
            return btoa(text);
        }
    }
    
    // Base64解码函数
    function base64Decode(base64) {
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            // 如果失败，尝试另一种方法
            return atob(base64);
        }
    }
    
    // 验证是否为有效的Base64字符串
    function isValidBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (e) {
            return false;
        }
    }
    
    // 编码按钮事件
    encodeBtn.addEventListener('click', function() {
        const text = encodeInput.value.trim();
        if (!text) {
            showToast('请输入要编码的文本', 'error');
            return;
        }
        
        const encoded = base64Encode(text);
        encodeOutput.value = encoded;
        
        // 更新使用统计
        usageCount++;
        document.getElementById('usage-count').textContent = usageCount;
        localStorage.setItem('base64UsageCount', usageCount);
        
        showToast('编码成功！', 'success');
        trackToolUsage('base64-encode');
    });
    
    // 解码按钮事件
    decodeBtn.addEventListener('click', function() {
        const base64Str = decodeInput.value.trim();
        if (!base64Str) {
            showToast('请输入Base64字符串', 'error');
            return;
        }
        
        // 验证Base64格式
        if (!isValidBase64(base64Str)) {
            showToast('无效的Base64格式', 'error');
            return;
        }
        
        try {
            const decoded = base64Decode(base64Str);
            decodeOutput.value = decoded;
            
            // 更新使用统计
            usageCount++;
            document.getElementById('usage-count').textContent = usageCount;
            localStorage.setItem('base64UsageCount', usageCount);
            
            showToast('解码成功！', 'success');
            trackToolUsage('base64-decode');
        } catch (e) {
            showToast('解码失败：' + e.message, 'error');
        }
    });
    
    // 清空按钮事件
    clearEncodeBtn.addEventListener('click', function() {
        encodeInput.value = '';
        encodeOutput.value = '';
        encodeInput.focus();
    });
    
    clearDecodeBtn.addEventListener('click', function() {
        decodeInput.value = '';
        decodeOutput.value = '';
        decodeInput.focus();
    });
    
    // 复制按钮事件
    copyEncodeBtn.addEventListener('click', function() {
        if (!encodeOutput.value) {
            showToast('没有内容可复制', 'error');
            return;
        }
        
        copyToClipboard(encodeOutput.value).then(success => {
            if (success) {
                showToast('已复制到剪贴板', 'success');
            } else {
                showToast('复制失败，请手动复制', 'error');
            }
        });
    });
    
    copyDecodeBtn.addEventListener('click', function() {
        if (!decodeOutput.value) {
            showToast('没有内容可复制', 'error');
            return;
        }
        
        copyToClipboard(decodeOutput.value).then(success => {
            if (success) {
                showToast('已复制到剪贴板', 'success');
            } else {
                showToast('复制失败，请手动复制', 'error');
            }
        });
    });
    
    // 编码文件
    encodeFileBtn.addEventListener('click', function() {
        if (!fileInput.files.length) {
            showToast('请选择文件', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) { // 10MB限制
            showToast('文件过大，请选择小于10MB的文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // 将ArrayBuffer转换为Base64
            const binary = e.target.result;
            const base64 = btoa(new Uint8Array(binary).reduce(
                (data, byte) => data + String.fromCharCode(byte), ''
            ));
            
            fileOutput.value = `data:${file.type};base64,${base64}`;
            fileResult.classList.remove('hidden');
            fileDownload.classList.add('hidden');
            
            // 更新使用统计
            usageCount++;
            document.getElementById('usage-count').textContent = usageCount;
            localStorage.setItem('base64UsageCount', usageCount);
            
            showToast('文件编码成功！', 'success');
            trackToolUsage('base64-file-encode');
        };
        
        reader.onerror = function() {
            showToast('文件读取失败', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    });
    
    // 解码文件
    decodeFileBtn.addEventListener('click', function() {
        const base64Str = fileOutput.value.trim() || decodeInput.value.trim();
        if (!base64Str) {
            showToast('请输入Base64字符串或先编码文件', 'error');
            return;
        }
        
        // 提取Base64数据（可能包含data:前缀）
        let base64Data = base64Str;
        if (base64Str.includes('base64,')) {
            base64Data = base64Str.split('base64,')[1];
        }
        
        if (!isValidBase64(base64Data)) {
            showToast('无效的Base64格式', 'error');
            return;
        }
        
        try {
            // Base64转换为二进制
            const binary = atob(base64Data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            
            // 创建Blob和下载链接
            let mimeType = 'application/octet-stream';
            if (base64Str.includes('data:')) {
                mimeType = base64Str.split('data:')[1].split(';')[0];
            }
            
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = `decoded_${Date.now()}.${mimeType.split('/')[1] || 'bin'}`;
            
            fileResult.classList.remove('hidden');
            fileDownload.classList.remove('hidden');
            
            // 更新使用统计
            usageCount++;
            document.getElementById('usage-count').textContent = usageCount;
            localStorage.setItem('base64UsageCount', usageCount);
            
            showToast('文件解码成功！点击下载按钮保存文件', 'success');
            trackToolUsage('base64-file-decode');
        } catch (e) {
            showToast('解码失败：' + e.message, 'error');
        }
    });
    
    // 输入框自动调整高度
    [encodeInput, encodeOutput, decodeInput, decodeOutput].forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
    
    // 示例文本
    if (!encodeInput.value && !decodeInput.value) {
        encodeInput.placeholder = '例如：Hello, World!';
        decodeInput.placeholder = '例如：SGVsbG8sIFdvcmxkIQ==';
    }
    
    // 文件输入变化
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            showToast(`已选择文件：${this.files[0].name}`, 'info');
        }
    });
    
    // 拖拽上传功能
    const dragDropArea = document.getElementById('drag-drop-area');
    const fileInputFromDrag = document.getElementById('file-input');
    
    if (dragDropArea) {
        // 点击拖拽区域触发文件选择
        dragDropArea.addEventListener('click', () => {
            fileInputFromDrag.click();
        });
        
        // 拖拽事件
        dragDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragDropArea.classList.add('border-blue-500', 'bg-blue-50');
            dragDropArea.classList.remove('border-gray-300');
        });
        
        dragDropArea.addEventListener('dragleave', () => {
            dragDropArea.classList.remove('border-blue-500', 'bg-blue-50');
            dragDropArea.classList.add('border-gray-300');
        });
        
        dragDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDropArea.classList.remove('border-blue-500', 'bg-blue-50');
            dragDropArea.classList.add('border-gray-300');
            
            if (e.dataTransfer.files.length) {
                const files = e.dataTransfer.files;
                // 只处理第一个文件
                if (files[0].size > 10 * 1024 * 1024) {
                    showToast('文件过大，请选择小于10MB的文件', 'error');
                    return;
                }
                
                // 更新文件输入
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[0]);
                fileInputFromDrag.files = dataTransfer.files;
                
                // 触发change事件
                fileInputFromDrag.dispatchEvent(new Event('change'));
                
                showToast(`已拖拽文件：${files[0].name}`, 'success');
            }
        });
    }
    
    // 批量处理功能
    const batchModeToggle = document.getElementById('batch-mode');
    const batchControls = document.getElementById('batch-controls');
    const batchEncodeBtn = document.getElementById('batch-encode-btn');
    const batchDecodeBtn = document.getElementById('batch-decode-btn');
    const clearBatchBtn = document.getElementById('clear-batch-btn');
    const batchFileList = document.getElementById('batch-file-list');
    const batchResult = document.getElementById('batch-result');
    const batchResultContent = document.getElementById('batch-result-content');
    const downloadBatchBtn = document.getElementById('download-batch-btn');
    
    // 批量文件队列
    let batchFiles = [];
    let batchResults = [];
    
    // 批量模式切换
    if (batchModeToggle) {
        batchModeToggle.addEventListener('change', function() {
            const isBatchMode = this.checked;
            batchControls.classList.toggle('hidden', !isBatchMode);
            
            // 更新文件输入multiple属性
            fileInput.multiple = isBatchMode;
            
            if (isBatchMode) {
                showToast('已启用批量模式，可处理多个文件', 'info');
                // 清空单文件结果
                fileResult.classList.add('hidden');
                fileDownload.classList.add('hidden');
                fileOutput.value = '';
            } else {
                showToast('已关闭批量模式', 'info');
                // 清空批量队列
                clearBatchQueue();
            }
        });
    }
    
    // 更新拖拽上传以支持批量模式
    if (dragDropArea) {
        // 修改drop事件以支持多个文件
        dragDropArea.removeEventListener('drop', handleDrop);
        
        function handleDrop(e) {
            e.preventDefault();
            dragDropArea.classList.remove('border-blue-500', 'bg-blue-50');
            dragDropArea.classList.add('border-gray-300');
            
            if (e.dataTransfer.files.length) {
                let files = Array.from(e.dataTransfer.files);
                
                // 检查文件大小
                const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
                if (oversizedFiles.length > 0) {
                    showToast(`${oversizedFiles.length}个文件过大，请选择小于10MB的文件`, 'error');
                    // 只保留合适大小的文件
                    files = files.filter(file => file.size <= 10 * 1024 * 1024);
                }
                
                if (files.length === 0) return;
                
                // 根据模式处理文件
                if (batchModeToggle && batchModeToggle.checked) {
                    // 批量模式：添加到队列
                    addFilesToBatch(files);
                    showToast(`已添加 ${files.length} 个文件到批量队列`, 'success');
                } else {
                    // 单文件模式：只处理第一个文件
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(files[0]);
                    fileInputFromDrag.files = dataTransfer.files;
                    fileInputFromDrag.dispatchEvent(new Event('change'));
                    showToast(`已拖拽文件：${files[0].name}`, 'success');
                }
            }
        }
        
        dragDropArea.addEventListener('drop', handleDrop);
    }
    
    // 文件输入变化事件更新
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            if (batchModeToggle && batchModeToggle.checked) {
                // 批量模式：添加到队列
                const files = Array.from(this.files);
                addFilesToBatch(files);
                showToast(`已添加 ${files.length} 个文件到批量队列`, 'info');
            } else {
                // 单文件模式：显示第一个文件
                showToast(`已选择文件：${this.files[0].name}`, 'info');
            }
        }
    });
    
    // 添加文件到批量队列
    function addFilesToBatch(files) {
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                showToast(`文件 ${file.name} 过大，已跳过`, 'error');
                return;
            }
            
            // 检查是否已存在
            const existingIndex = batchFiles.findIndex(f => f.name === file.name && f.size === file.size);
            if (existingIndex === -1) {
                batchFiles.push(file);
            }
        });
        
        updateBatchFileList();
    }
    
    // 更新批量文件列表显示
    function updateBatchFileList() {
        if (!batchFileList) return;
        
        if (batchFiles.length === 0) {
            batchFileList.innerHTML = '<p class="text-gray-500 text-center py-8">暂无文件，拖拽多个文件或点击上传区域添加</p>';
            return;
        }
        
        let html = '<div class="space-y-2">';
        batchFiles.forEach((file, index) => {
            const size = formatFileSize(file.size);
            html += `
                <div class="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div class="flex items-center">
                        <i class="fas fa-file text-blue-500 mr-3"></i>
                        <div>
                            <p class="font-medium text-gray-800">${file.name}</p>
                            <p class="text-gray-500 text-sm">${size} · ${file.type || '未知类型'}</p>
                        </div>
                    </div>
                    <button class="text-red-500 hover:text-red-700 remove-file-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        batchFileList.innerHTML = html;
        
        // 添加移除按钮事件
        document.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFileFromBatch(index);
            });
        });
    }
    
    // 从批量队列移除文件
    function removeFileFromBatch(index) {
        if (index >= 0 && index < batchFiles.length) {
            const removedFile = batchFiles.splice(index, 1)[0];
            showToast(`已移除文件：${removedFile.name}`, 'info');
            updateBatchFileList();
        }
    }
    
    // 清空批量队列
    function clearBatchQueue() {
        batchFiles = [];
        batchResults = [];
        updateBatchFileList();
        batchResult.classList.add('hidden');
        showToast('已清空批量队列', 'info');
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 批量编码
    if (batchEncodeBtn) {
        batchEncodeBtn.addEventListener('click', async function() {
            if (batchFiles.length === 0) {
                showToast('请先添加文件到批量队列', 'error');
                return;
            }
            
            showToast(`开始批量编码 ${batchFiles.length} 个文件...`, 'info');
            batchResults = [];
            
            // 处理每个文件
            for (let i = 0; i < batchFiles.length; i++) {
                const file = batchFiles[i];
                try {
                    const base64 = await fileToBase64(file);
                    batchResults.push({
                        name: file.name,
                        type: file.type,
                        base64: base64,
                        status: 'success'
                    });
                    
                    // 更新进度
                    if (batchFiles.length > 1) {
                        const progress = Math.round(((i + 1) / batchFiles.length) * 100);
                        showToast(`处理中... ${progress}% (${i + 1}/${batchFiles.length})`, 'info');
                    }
                } catch (error) {
                    batchResults.push({
                        name: file.name,
                        type: file.type,
                        error: error.message,
                        status: 'error'
                    });
                }
            }
            
            // 显示结果
            showBatchResults();
            showToast(`批量编码完成，成功 ${batchResults.filter(r => r.status === 'success').length}/${batchFiles.length} 个文件`, 'success');
            
            // 更新使用统计
            usageCount += batchResults.filter(r => r.status === 'success').length;
            document.getElementById('usage-count').textContent = usageCount;
            localStorage.setItem('base64UsageCount', usageCount);
            
            trackToolUsage('base64-batch-encode');
        });
    }
    
    // 批量解码
    if (batchDecodeBtn) {
        batchDecodeBtn.addEventListener('click', function() {
            // 从文本区域获取多个Base64字符串（每行一个）
            const base64Strings = decodeInput.value.trim().split('\n').filter(str => str.trim());
            
            if (base64Strings.length === 0) {
                showToast('请在解码区域输入多个Base64字符串（每行一个）', 'error');
                return;
            }
            
            showToast(`开始批量解码 ${base64Strings.length} 个字符串...`, 'info');
            batchResults = [];
            
            // 处理每个Base64字符串
            base64Strings.forEach((base64Str, index) => {
                try {
                    // 提取Base64数据
                    let base64Data = base64Str;
                    if (base64Str.includes('base64,')) {
                        base64Data = base64Str.split('base64,')[1];
                    }
                    
                    if (!isValidBase64(base64Data)) {
                        throw new Error('无效的Base64格式');
                    }
                    
                    // 解码
                    const binary = atob(base64Data);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    
                    // 获取MIME类型
                    let mimeType = 'application/octet-stream';
                    let fileName = `decoded_${index + 1}.bin`;
                    if (base64Str.includes('data:')) {
                        mimeType = base64Str.split('data:')[1].split(';')[0];
                        const ext = mimeType.split('/')[1] || 'bin';
                        fileName = `decoded_${index + 1}.${ext}`;
                    }
                    
                    batchResults.push({
                        name: fileName,
                        type: mimeType,
                        data: bytes,
                        status: 'success'
                    });
                    
                } catch (error) {
                    batchResults.push({
                        name: `字符串_${index + 1}`,
                        error: error.message,
                        status: 'error'
                    });
                }
            });
            
            // 显示结果
            showBatchResults();
            showToast(`批量解码完成，成功 ${batchResults.filter(r => r.status === 'success').length}/${base64Strings.length} 个字符串`, 'success');
            
            // 更新使用统计
            usageCount += batchResults.filter(r => r.status === 'success').length;
            document.getElementById('usage-count').textContent = usageCount;
            localStorage.setItem('base64UsageCount', usageCount);
            
            trackToolUsage('base64-batch-decode');
        });
    }
    
    // 文件转Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const binary = e.target.result;
                const base64 = btoa(new Uint8Array(binary).reduce(
                    (data, byte) => data + String.fromCharCode(byte), ''
                ));
                resolve(`data:${file.type};base64,${base64}`);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    // 显示批量处理结果
    function showBatchResults() {
        if (!batchResultContent || !batchResult) return;
        
        if (batchResults.length === 0) {
            batchResultContent.innerHTML = '<p class="text-gray-500 text-center py-4">暂无结果</p>';
            return;
        }
        
        let html = '<div class="space-y-3">';
        batchResults.forEach((result, index) => {
            if (result.status === 'success') {
                html += `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                                <span class="font-medium text-green-800">${result.name}</span>
                            </div>
                            <span class="text-green-600 text-sm">成功</span>
                        </div>
                        <p class="text-green-700 text-sm mt-1">类型: ${result.type}</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-times-circle text-red-500 mr-2"></i>
                                <span class="font-medium text-red-800">${result.name}</span>
                            </div>
                            <span class="text-red-600 text-sm">失败</span>
                        </div>
                        <p class="text-red-700 text-sm mt-1">错误: ${result.error}</p>
                    </div>
                `;
            }
        });
        html += '</div>';
        
        batchResultContent.innerHTML = html;
        batchResult.classList.remove('hidden');
    }
    
    // 下载批量结果
    if (downloadBatchBtn) {
        downloadBatchBtn.addEventListener('click', function() {
            const successfulResults = batchResults.filter(r => r.status === 'success');
            if (successfulResults.length === 0) {
                showToast('没有可下载的成功结果', 'error');
                return;
            }
            
            if (successfulResults.length === 1) {
                // 单个文件：直接下载
                const result = successfulResults[0];
                if (result.data) {
                    // 解码结果：二进制数据
                    const blob = new Blob([result.data], { type: result.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.name;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } else {
                // 多个文件：创建ZIP下载（简化版：提示用户）
                showToast('多个文件下载功能开发中，请分别处理单个文件', 'info');
                // TODO: 实现ZIP打包下载
            }
            
            showToast('下载完成', 'success');
        });
    }
    
    // 清空批量队列按钮
    if (clearBatchBtn) {
        clearBatchBtn.addEventListener('click', clearBatchQueue);
    }
    
    // 初始化使用统计
    trackToolUsage('base64-tool-loaded');
});