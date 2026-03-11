// 主JavaScript文件
document.addEventListener('DOMContentLoaded', function() {
    // 移动菜单切换
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
                mobileMenuBtn.innerHTML = '<i class="fas fa-times text-xl"></i>';
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
            }
        });
        
        // 点击菜单项后关闭菜单
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
            });
        });
    }
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 显示当前年份
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // 控制台欢迎信息
    console.log('%c🔧 ToolKit Lab - 免费在线工具集合', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    console.log('%c感谢使用我们的工具！如有问题或建议，请联系我们。', 'color: #666;');
    
    // 检测是否支持某些功能
    if (!window.FileReader) {
        console.warn('您的浏览器不支持FileReader API，部分工具可能无法使用。');
    }
});

// 工具使用统计（匿名）
function trackToolUsage(toolName) {
    // 这里可以添加简单的统计代码
    console.log(`工具使用: ${toolName} - ${new Date().toISOString()}`);
}

// 复制到剪贴板功能
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(() => {
        return true;
    }).catch(err => {
        console.error('复制失败:', err);
        return false;
    });
}

// 显示消息提示
function showToast(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } z-50 transform transition-transform duration-300 translate-y-full`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示
    setTimeout(() => {
        toast.classList.remove('translate-y-full');
    }, 10);
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.add('translate-y-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 导出函数供工具页面使用
if (typeof module === 'undefined') {
    // 浏览器环境
    window.ToolKit = {
        trackToolUsage,
        copyToClipboard,
        showToast
    };
}