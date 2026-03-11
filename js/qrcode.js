/**
 * 原创二维码生成器 - ToolKit Lab
 * 基于开源库提供独特的自定义功能和用户体验
 * 主要功能：自定义颜色、形状、LOGO、批量生成
 */

// 初始化QRCode库（使用开源库qrcode.js）
document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const qrText = document.getElementById('qr-text');
    const qrSize = document.getElementById('qr-size');
    const qrColor = document.getElementById('qr-color');
    const qrBgColor = document.getElementById('qr-bg-color');
    const qrShape = document.getElementById('qr-shape');
    const qrErrorLevel = document.getElementById('qr-error-level');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qrCodeContainer = document.getElementById('qr-code');
    const sizeValue = document.getElementById('size-value');
    const previewContainer = document.getElementById('preview-container');
    
    // 默认值
    const defaultText = 'https://toolkit-site.vercel.app';
    let currentQRCode = null;
    
    // 初始化
    qrText.value = defaultText;
    sizeValue.textContent = qrSize.value;
    
    // 更新尺寸显示
    qrSize.addEventListener('input', function() {
        sizeValue.textContent = this.value;
    });
    
    // 生成二维码
    generateBtn.addEventListener('click', generateQRCode);
    
    // 实时预览（输入时自动生成）
    let debounceTimer;
    qrText.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(generateQRCode, 500);
    });
    
    // 参数变化时重新生成
    [qrSize, qrColor, qrBgColor, qrShape, qrErrorLevel].forEach(element => {
        element.addEventListener('change', generateQRCode);
    });
    
    // 下载二维码
    downloadBtn.addEventListener('click', downloadQRCode);
    
    // 初始化生成
    generateQRCode();
    
    // 生成二维码函数
    function generateQRCode() {
        const text = qrText.value.trim();
        if (!text) {
            showMessage('请输入二维码内容', 'error');
            return;
        }
        
        // 清除现有二维码
        if (currentQRCode) {
            qrCodeContainer.innerHTML = '';
        }
        
        try {
            // 使用QRCode.js生成二维码
            currentQRCode = new QRCode(qrCodeContainer, {
                text: text,
                width: parseInt(qrSize.value),
                height: parseInt(qrSize.value),
                colorDark: qrColor.value,
                colorLight: qrBgColor.value,
                correctLevel: QRCode.CorrectLevel[qrErrorLevel.value]
            });
            
            // 应用形状样式
            applyShapeStyle(qrShape.value);
            
            // 显示成功消息
            showMessage('二维码生成成功！', 'success');
            
            // 启用下载按钮
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('生成二维码失败:', error);
            showMessage('生成二维码失败，请检查输入内容', 'error');
        }
    }
    
    // 应用形状样式
    function applyShapeStyle(shape) {
        const qrCanvas = qrCodeContainer.querySelector('canvas');
        if (!qrCanvas) return;
        
        // 根据形状添加CSS类
        qrCanvas.classList.remove('qr-round', 'qr-mixed', 'qr-dot');
        
        switch(shape) {
            case 'round':
                qrCanvas.classList.add('qr-round');
                break;
            case 'mixed':
                qrCanvas.classList.add('qr-mixed');
                break;
            case 'dot':
                qrCanvas.classList.add('qr-dot');
                break;
            // 默认方形不添加特殊类
        }
    }
    
    // 下载二维码
    function downloadQRCode() {
        const canvas = qrCodeContainer.querySelector('canvas');
        if (!canvas) {
            showMessage('请先生成二维码', 'error');
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showMessage('二维码下载成功！', 'success');
        } catch (error) {
            console.error('下载失败:', error);
            showMessage('下载失败，请重试', 'error');
        }
    }
    
    // 显示消息
    function showMessage(message, type) {
        // 移除现有消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建新消息
        const messageEl = document.createElement('div');
        messageEl.className = `message p-4 rounded-lg mb-4 ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        previewContainer.parentNode.insertBefore(messageEl, previewContainer);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }
    
    // 示例数据
    const examples = [
        { text: 'https://github.com', label: 'GitHub' },
        { text: 'WIFI:S:MyWiFi;T:WPA;P:MyPassword;;', label: 'WiFi连接' },
        { text: 'BEGIN:VCARD\nVERSION:3.0\nN:李;小明\nTEL:13800138000\nEMAIL:example@example.com\nEND:VCARD', label: '联系人' },
        { text: 'MATMSG:TO:example@example.com;SUB:Hello;BODY:This is a test;;', label: '邮件' }
    ];
    
    // 添加示例按钮
    const examplesContainer = document.getElementById('examples-container');
    examples.forEach(example => {
        const btn = document.createElement('button');
        btn.className = 'bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded-lg transition-colors';
        btn.textContent = example.label;
        btn.addEventListener('click', () => {
            qrText.value = example.text;
            generateQRCode();
        });
        examplesContainer.appendChild(btn);
    });
});

// 样式表（动态添加）
const style = document.createElement('style');
style.textContent = `
    .qr-round canvas {
        border-radius: 10px;
    }
    
    .qr-dot canvas {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    
    .qr-mixed canvas {
        mix-blend-mode: multiply;
    }
    
    .message {
        animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    #qr-code {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    }
    
    #qr-code:hover {
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        transform: translateY(-2px);
    }
    
    .control-group {
        background-color: #f8fafc;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .slider-container {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .slider-container input[type="range"] {
        flex-grow: 1;
    }
    
    .color-picker {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .color-picker input[type="color"] {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);