// =========================== 
// متغيرات عامة
// ===========================
let socket;
let currentUserId = document.querySelector('script')?.textContent?.match(/currentUserId = '([^']+)'/)?.[1] || 'user_1';
let extractedLinks = [];

// =========================== 
// تهيئة Socket.IO والتطبيق
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing application...');

    // تهيئة Socket.IO
    initializeSocket();

    // تهيئة النماذج والأحداث
    initializeForms();

    // تهيئة نظام المستخدمين
    initializeUserSystem();

    // تهيئة نظام الانضمام التلقائي
    initializeAutoJoinSystem();

    // تهيئة PWA
    initializePWA();

    // فحص حالة تسجيل الدخول
    checkLoginStatus();

    console.log('✅ Application initialized successfully');
});

// =========================== 
// تهيئة Socket.IO
// ===========================
function initializeSocket() {
    try {
        socket = io({
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: false
        });

        // أحداث الاتصال
        socket.on('connect', function() {
            console.log('✅ Socket.IO connected');
            updateConnectionStatus('connected');
            addLogEntry('🔄 تم الاتصال بالخادم', 'info');
        });

        socket.on('disconnect', function() {
            console.log('❌ Socket.IO disconnected');
            updateConnectionStatus('disconnected');
            addLogEntry('⚠️ انقطع الاتصال بالخادم', 'warning');
        });

        // أحداث السجل والحالة
        socket.on('log_update', function(data) {
            if (data.message) {
                addLogEntry(data.message, getLogType(data.message));
            }
        });

        socket.on('console_log', function(data) {
            addConsoleEntry(data.message);
        });

        socket.on('connection_status', function(data) {
            updateConnectionStatus(data.status);
        });

        socket.on('login_status', function(data) {
            updateLoginStatus(data);
        });

        socket.on('stats_update', function(data) {
            updateStats(data);
        });

        // أحداث المراقبة
        socket.on('monitoring_status', function(data) {
            updateMonitoringButtons(data.is_running);
        });

        socket.on('heartbeat', function(data) {
            updateMonitoringIndicator(data);
        });

        socket.on('new_alert', function(data) {
            showKeywordAlert(data);
        });

        // أحداث المستخدمين
        socket.on('users_list', function(data) {
            currentUserId = data.current_user;
            updateUserTabs(data.current_user);
        });

        socket.on('user_switched', function(data) {
            currentUserId = data.current_user;
            updateUserTabs(data.current_user);
            showNotification(data.message, 'success');
            setTimeout(() => window.location.reload(), 1000);
        });

        socket.on('user_settings', function(settings) {
            updateFormFields(settings);
        });

        // أحداث الانضمام التلقائي
        socket.on('join_progress', function(data) {
            updateJoinProgress(data);
        });

        socket.on('join_stats', function(data) {
            updateJoinStats(data);
        });

        socket.on('auto_join_completed', function(data) {
            handleAutoJoinCompleted(data);
        });

        socket.on('error', function(data) {
            showNotification(data.message || 'حدث خطأ', 'error');
        });

    } catch (error) {
        console.error('❌ Socket.IO initialization error:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
    }
}

// =========================== 
// تهيئة النماذج والأحداث
// ===========================
function initializeForms() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // معالجة رفع الصور
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }

    // زر مسح الصور
    const clearImagesBtn = document.getElementById('clearImages');
    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', clearImages);
    }

    // نموذج التحقق من الكود
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifyCode);
    }

    // نموذج كلمة المرور
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleVerifyPassword);
    }

    // نموذج الإعدادات
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSaveSettings);
    }

    // أزرار التحكم
    const startBtn = document.getElementById('startMonitoringBtn');
    const stopBtn = document.getElementById('stopMonitoringBtn');
    const sendBtn = document.getElementById('sendNowBtn');
    const logoutBtn = document.getElementById('logoutButton');
    const resetBtn = document.getElementById('switchAccountButton');

    if (startBtn) startBtn.addEventListener('click', startMonitoring);
    if (stopBtn) stopBtn.addEventListener('click', stopMonitoring);
    if (sendBtn) sendBtn.addEventListener('click', sendNow);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (resetBtn) resetBtn.addEventListener('click', switchAccount);

    // تغيير نوع الإرسال
    const sendTypeSelect = document.getElementById('sendType');
    if (sendTypeSelect) {
        sendTypeSelect.addEventListener('change', handleSendTypeChange);
    }
}

// =========================== 
// دوال التنبيهات والإشعارات
// ===========================
function showNotification(message, type = 'info', duration = 5000) {
    try {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 80px; right: 20px; z-index: 1060; max-width: 400px; min-width: 300px;';

        notification.innerHTML = `
            <strong>${getNotificationIcon(type)}</strong>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // إزالة تلقائية
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // إشعار PWA إن أمكن
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('مركز سرعة انجاز', {
                body: message,
                icon: '/static/icons/icon-192x192.png'
            });
        }

    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

function getBootstrapAlertClass(type) {
    const classes = {
        'success': 'success',
        'error': 'danger', 
        'warning': 'warning',
        'info': 'info'
    };
    return classes[type] || 'info';
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

// =========================== 
// دوال تسجيل الدخول
// ===========================
function handleLogin(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!phone) {
        showNotification('يرجى إدخال رقم الهاتف', 'warning');
        return;
    }

    const submitBtn = document.getElementById('loginBtn');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري تسجيل الدخول...';

    fetch('/api/save_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            phone: phone,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (data.success) {
            showNotification(data.message, 'success');

            if (data.code_required) {
                showVerificationForm();
            } else {
                updateLoginStatus({
                    logged_in: true,
                    connected: true,
                    awaiting_code: false,
                    awaiting_password: false,
                    is_running: false
                });
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showNotification('خطأ في الاتصال بالخادم', 'error');
    });
}

function handleVerifyCode(e) {
    e.preventDefault();

    const code = document.getElementById('verificationCode').value.trim();

    if (!code) {
        showNotification('يرجى إدخال كود التحقق', 'warning');
        return;
    }

    fetch('/api/verify_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');

            if (data.password_required) {
                showPasswordForm();
            } else {
                hideVerificationForms();
                updateLoginStatus({
                    logged_in: true,
                    connected: true,
                    awaiting_code: false,
                    awaiting_password: false,
                    is_running: false
                });
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Code verification error:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
    });
}

function handleVerifyPassword(e) {
    e.preventDefault();

    const password = document.getElementById('twoFactorPassword').value.trim();

    if (!password) {
        showNotification('يرجى إدخال كلمة المرور', 'warning');
        return;
    }

    fetch('/api/verify_code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            hideVerificationForms();
            updateLoginStatus({
                logged_in: true,
                connected: true,
                awaiting_code: false,
                awaiting_password: false,
                is_running: false
            });
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Password verification error:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
    });
}

// =========================== 
// دوال واجهة المستخدم
// ===========================
function showVerificationForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('verifyForm').style.display = 'block';
    document.getElementById('passwordForm').style.display = 'none';
}

function showPasswordForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'block';
}

function hideVerificationForms() {
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function updateLoginStatus(data) {
    const sessionControls = document.getElementById('sessionControls');
    const loginButtonContainer = document.getElementById('loginButtonContainer');

    if (data.logged_in) {
        if (sessionControls) sessionControls.style.display = 'block';
        if (loginButtonContainer) loginButtonContainer.className = 'col-md-6 mb-2';
    } else {
        if (sessionControls) sessionControls.style.display = 'none';
        if (loginButtonContainer) loginButtonContainer.className = 'col-md-6 mb-2';
    }

    // تحديث مؤشر الحالة
    updateConnectionStatus(data.connected ? 'connected' : 'disconnected');

    // تحديث أزرار المراقبة
    updateMonitoringButtons(data.is_running || false);
}

function updateConnectionStatus(status) {
    const statusElements = document.querySelectorAll('#connectionStatus, #connectionStatusHeader');
    const isConnected = status === 'connected';

    statusElements.forEach(element => {
        if (element) {
            element.className = `badge ${isConnected ? 'bg-success' : 'bg-danger'}`;
            element.innerHTML = `<i class="fas fa-circle"></i> ${isConnected ? 'متصل' : 'غير متصل'}`;
        }
    });
}

function updateMonitoringButtons(isRunning) {
    const startBtn = document.getElementById('startMonitoringBtn');
    const stopBtn = document.getElementById('stopMonitoringBtn');

    if (startBtn && stopBtn) {
        if (isRunning) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        }
    }
}

function updateMonitoringIndicator(data) {
    const indicator = document.getElementById('monitoringIndicator');
    if (indicator && data.status) {
        if (data.status === 'active') {
            indicator.className = 'badge bg-success';
            indicator.innerHTML = '<i class="fas fa-circle"></i> نشط';
        } else {
            indicator.className = 'badge bg-secondary';  
            indicator.innerHTML = '<i class="fas fa-circle"></i> غير نشط';
        }
    }
}

// =========================== 
// دوال السجلات
// ===========================
function addLogEntry(message, type = 'info') {
    const logContainer = document.getElementById('operationsLog');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;

    const timestamp = new Date().toLocaleTimeString('ar-SA');
    entry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        ${message}
    `;

    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;

    // الاحتفاظ بآخر 100 رسالة فقط
    const entries = logContainer.children;
    if (entries.length > 100) {
        logContainer.removeChild(entries[0]);
    }
}

function addConsoleEntry(message) {
    const consoleContainer = document.getElementById('consoleLog');
    if (!consoleContainer) return;

    const entry = document.createElement('div');
    entry.className = 'console-line';
    entry.textContent = message;

    consoleContainer.appendChild(entry);
    consoleContainer.scrollTop = consoleContainer.scrollHeight;

    // الاحتفاظ بآخر 50 رسالة فقط
    const entries = consoleContainer.children;
    if (entries.length > 50) {
        consoleContainer.removeChild(entries[0]);
    }
}

function getLogType(message) {
    if (message.includes('✅') || message.includes('نجح')) return 'success';
    if (message.includes('❌') || message.includes('خطأ') || message.includes('فشل')) return 'error';
    if (message.includes('⚠️') || message.includes('تحذير')) return 'warning';
    return 'info';
}

// =========================== 
// دوال رفع ومعالجة الصور
// ===========================
let selectedImages = [];

function handleImageUpload(e) {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
        return;
    }

    // التحقق من حجم وأنواع الملفات
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    files.forEach(file => {
        if (!validTypes.includes(file.type)) {
            showNotification(`نوع الملف غير مدعوم: ${file.name}`, 'warning');
            return;
        }

        if (file.size > maxSize) {
            showNotification(`حجم الملف كبير جداً: ${file.name} (الحد الأقصى 10MB)`, 'warning');
            return;
        }

        validFiles.push(file);
    });

    if (validFiles.length > 0) {
        selectedImages = [...selectedImages, ...validFiles];
        displayImagePreview();
        showNotification(`تم اختيار ${validFiles.length} صورة`, 'success');
    }
}

function displayImagePreview() {
    const preview = document.getElementById('imagePreview');
    const container = document.getElementById('imagePreviewContainer');

    if (selectedImages.length === 0) {
        preview.style.display = 'none';
        return;
    }

    preview.style.display = 'block';
    container.innerHTML = '';

    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'position-relative';
            imageDiv.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail" 
                     style="width: 100px; height: 100px; object-fit: cover;">
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" 
                        onclick="removeImage(${index})" style="font-size: 0.7rem; padding: 2px 6px;">
                    <i class="fas fa-times"></i>
                </button>
                <small class="d-block text-center mt-1">${file.name}</small>
            `;
            container.appendChild(imageDiv);
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    displayImagePreview();
    showNotification('تم حذف الصورة', 'info');
}

function clearImages() {
    selectedImages = [];
    document.getElementById('imageUpload').value = '';
    displayImagePreview();
    showNotification('تم مسح جميع الصور', 'info');
}

async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// =========================== 
// دوال الإعدادات والإرسال
// ===========================
function handleSaveSettings(e) {
    e.preventDefault();

    const formData = {
        message: document.getElementById('message').value.trim(),
        groups: document.getElementById('groups').value.trim(),
        watch_words: document.getElementById('watchWords').value.trim(),
        send_type: document.getElementById('sendType').value,
        interval_seconds: parseInt(document.getElementById('intervalSeconds').value) || 3600,
        scheduled_time: document.getElementById('scheduledTime').value
    };

    fetch('/api/save_settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Settings save error:', error);
        showNotification('خطأ في حفظ الإعدادات', 'error');
    });
}

async function sendNow() {
    const message = document.getElementById('message').value.trim();
    const groups = document.getElementById('groups').value.trim();

    if (!message && selectedImages.length === 0) {
        showNotification('يرجى كتابة رسالة أو اختيار صورة للإرسال', 'warning');
        return;
    }

    if (!groups) {
        showNotification('يرجى تحديد المجموعات للإرسال إليها', 'warning');
        return;
    }

    const sendBtn = document.getElementById('sendNowBtn');
    const originalText = sendBtn.innerHTML;

    try {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإرسال...';

        // تحضير بيانات الإرسال
        const sendData = {
            message: message,
            groups: groups,
            images: []
        };

        // تحويل الصور إلى Base64 إذا وجدت
        if (selectedImages.length > 0) {
            showNotification(`جاري تحضير ${selectedImages.length} صورة...`, 'info');

            for (let i = 0; i < selectedImages.length; i++) {
                const file = selectedImages[i];
                try {
                    const base64 = await convertImageToBase64(file);
                    sendData.images.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: base64
                    });
                } catch (error) {
                    console.error(`Error converting image ${file.name}:`, error);
                    showNotification(`خطأ في تحضير الصورة: ${file.name}`, 'warning');
                }
            }
        }

        const response = await fetch('/api/send_now', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            // مسح الصور بعد الإرسال الناجح
            if (selectedImages.length > 0) {
                clearImages();
            }
        } else {
            showNotification(data.message, 'error');
        }

    } catch (error) {
        console.error('Send now error:', error);
        showNotification('خطأ في الإرسال', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

function handleSendTypeChange() {
    const sendType = document.getElementById('sendType').value;
    const intervalDiv = document.getElementById('intervalDiv');
    const scheduledTimeDiv = document.getElementById('scheduledTimeDiv');

    if (sendType === 'scheduled') {
        if (intervalDiv) intervalDiv.style.display = 'block';
        if (scheduledTimeDiv) scheduledTimeDiv.style.display = 'block';
    } else {
        if (intervalDiv) intervalDiv.style.display = 'none';
        if (scheduledTimeDiv) scheduledTimeDiv.style.display = 'none';
    }
}

// =========================== 
// دوال المراقبة
// ===========================
function startMonitoring() {
    fetch('/api/start_monitoring', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            updateMonitoringButtons(true);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Start monitoring error:', error);
        showNotification('خطأ في بدء المراقبة', 'error');
    });
}

function stopMonitoring() {
    fetch('/api/stop_monitoring', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            updateMonitoringButtons(false);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Stop monitoring error:', error);
        showNotification('خطأ في إيقاف المراقبة', 'error');
    });
}

// =========================== 
// دوال إدارة الجلسة
// ===========================
function logout() {
    if (!confirm('هل أنت متأكد من تسجيل الخروج؟ سيتم إنهاء جلسة التليجرام نهائياً.')) {
        return;
    }

    fetch('/api/user_logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        showNotification('خطأ في تسجيل الخروج', 'error');
    });
}

function switchAccount() {
    if (!confirm('هل تريد تبديل الحساب؟ سيتم إنشاء جلسة جديدة.')) {
        return;
    }

    fetch('/api/reset_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Switch account error:', error);
        showNotification('خطأ في تبديل الحساب', 'error');
    });
}

// =========================== 
// دوال الإحصائيات
// ===========================
function updateStats(data) {
    const sentCount = document.getElementById('sentCount');
    const errorCount = document.getElementById('errorCount');

    if (sentCount) sentCount.textContent = data.sent || 0;
    if (errorCount) errorCount.textContent = data.errors || 0;
}

function checkLoginStatus() {
    fetch('/api/get_login_status')
        .then(response => response.json())
        .then(data => {
            updateLoginStatus(data);
        })
        .catch(error => {
            console.error('Check login status error:', error);
        });
}

// =========================== 
// نظام المستخدمين المتعددين
// ===========================
function initializeUserSystem() {
    const userTabs = document.querySelectorAll('.user-tab');

    userTabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();

            const newUserId = this.getAttribute('data-user-id');

            if (newUserId === currentUserId) {
                showNotification('أنت بالفعل في حساب ' + this.textContent.trim(), 'info');
                return;
            }

            switchToUser(newUserId);
        });
    });
}

function switchToUser(userId) {
    const tab = document.querySelector(`[data-user-id="${userId}"]`);
    if (!tab) {
        showNotification('مستخدم غير صحيح', 'error');
        return;
    }

    // تعطيل جميع الأزرار مؤقتاً
    const allTabs = document.querySelectorAll('.user-tab');
    allTabs.forEach(t => t.disabled = true);

    showNotification('جاري التبديل إلى ' + tab.textContent.trim() + '...', 'info');

    // إرسال طلب التبديل عبر Socket.IO
    if (socket) {
        socket.emit('switch_user', {
            user_id: userId
        });
    }
}

function updateUserTabs(activeUserId) {
    const userTabs = document.querySelectorAll('.user-tab');

    userTabs.forEach(function(tab) {
        const userId = tab.getAttribute('data-user-id');

        if (userId === activeUserId) {
            tab.classList.add('active');
            tab.disabled = false;
        } else {
            tab.classList.remove('active');
            tab.disabled = false;
        }
    });
}

function updateFormFields(settings) {
    try {
        // تحديث حقول النموذج بإعدادات المستخدم
        const fields = {
            'phone': settings.phone,
            'message': settings.message,
            'groups': settings.groups?.join('\n'),
            'watchWords': settings.watch_words?.join('\n'),
            'sendType': settings.send_type,
            'intervalSeconds': settings.interval_seconds
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        }

    } catch (error) {
        console.error('Error updating form fields:', error);
    }
}

// =========================== 
// نظام الانضمام التلقائي
// ===========================
function initializeAutoJoinSystem() {
    const autoJoinForm = document.getElementById('autoJoinForm');
    const startAutoJoinBtn = document.getElementById('startAutoJoinBtn');

    if (autoJoinForm) {
        autoJoinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            extractLinks();
        });
    }

    if (startAutoJoinBtn) {
        startAutoJoinBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startAutoJoin();
        });
    }
}

function extractLinks() {
    const text = document.getElementById('groupLinks').value.trim();

    if (!text) {
        showNotification('يرجى إدخال روابط المجموعات أولاً', 'warning');
        return;
    }

    showNotification('جاري استخراج الروابط...', 'info');

    fetch('/api/extract_group_links', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            extractedLinks = data.links || [];
            displayExtractedLinks(extractedLinks);

            if (extractedLinks.length > 0) {
                document.getElementById('startAutoJoinBtn').disabled = false;
                showNotification(`تم استخراج ${extractedLinks.length} رابط`, 'success');
            } else {
                showNotification('لم يتم العثور على روابط صالحة', 'warning');
            }
        } else {
            showNotification(data.message || 'خطأ في استخراج الروابط', 'error');
        }
    })
    .catch(error => {
        console.error('Error extracting links:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
    });
}

function displayExtractedLinks(links) {
    const container = document.getElementById('extractedLinksContainer');
    const list = document.getElementById('extractedLinksList');

    if (links.length === 0) {
        container.style.display = 'none';
        return;
    }

    let html = `<strong>تم العثور على ${links.length} رابط:</strong><br><br>`;

    links.forEach((link, index) => {
        const icon = link.type === 'invite' ? '🔗' : '📢';
        html += `
            <div class="d-flex align-items-center mb-2">
                <span class="badge bg-secondary me-2">${index + 1}</span>
                <span class="me-2">${icon}</span>
                <code class="text-break">${link.url}</code>
                <small class="text-muted ms-2">(${link.username})</small>
            </div>
        `;
    });

    list.innerHTML = html;
    container.style.display = 'block';
}

function startAutoJoin() {
    if (extractedLinks.length === 0) {
        showNotification('يرجى استخراج الروابط أولاً', 'warning');
        return;
    }

    // تعطيل الزر لمنع النقر المتكرر
    const startBtn = document.getElementById('startAutoJoinBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري الانضمام...';

    // إظهار حالة الانضمام
    document.getElementById('joinStatusContainer').style.display = 'block';
    document.getElementById('joinStatusText').textContent = 'بدء الانضمام التلقائي...';

    showNotification(`بدء الانضمام التلقائي لـ ${extractedLinks.length} مجموعة...`, 'info');

    fetch('/api/start_auto_join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            links: extractedLinks,
            delay: 3
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message || 'خطأ في بدء الانضمام التلقائي', 'error');
            resetAutoJoinButton();
        }
    })
    .catch(error => {
        console.error('Error starting auto join:', error);
        showNotification('خطأ في الاتصال بالخادم', 'error');
        resetAutoJoinButton();
    });
}

function resetAutoJoinButton() {
    const startBtn = document.getElementById('startAutoJoinBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play me-2"></i>بدء الانضمام التلقائي';
    }

    const statusContainer = document.getElementById('joinStatusContainer');
    if (statusContainer) {
        statusContainer.style.display = 'none';
    }
}

function updateJoinProgress(data) {
    const statusText = document.getElementById('joinStatusText');
    if (statusText) {
        statusText.textContent = `جاري الانضمام ${data.current}/${data.total}: ${data.link}`;
    }
}

function updateJoinStats(data) {
    document.getElementById('joinSuccessCount').textContent = data.success || 0;
    document.getElementById('joinFailCount').textContent = data.fail || 0;
    document.getElementById('alreadyJoinedCount').textContent = data.already_joined || 0;
}

function handleAutoJoinCompleted(data) {
    resetAutoJoinButton();

    showNotification(
        `تم الانتهاء! النجح: ${data.success}, فشل: ${data.fail}, منضم مسبقاً: ${data.already_joined}`,
        'info'
    );

    if (data.success > 0) {
        showNotification(`🎉 تم الانضمام بنجاح لـ ${data.success} مجموعة جديدة!`, 'success');
    }
}

// =========================== 
// نظام PWA
// ===========================
function initializePWA() {
    // تسجيل Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/static/sw.js')
                .then(function(registration) {
                    console.log('✅ Service Worker registered successfully:', registration.scope);
                })
                .catch(function(err) {
                    console.error('❌ Service Worker registration failed:', err);
                });
        });
    }

    // معالجة حدث التثبيت
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        // deferredPrompt = e; // This line was removed as it was a duplicate declaration

        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) {
            installBtn.style.display = 'inline-block';
            installBtn.addEventListener('click', installApp);
        }
    });
}

function installApp() {
    // This function relies on the deferredPrompt variable which is now declared only once in initializePWA
    if (!deferredPrompt) {
        showNotification('التطبيق مثبت بالفعل أو غير متاح للتثبيت', 'info');
        return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
        if (choiceResult.outcome === 'accepted') {
            showNotification('🎉 تم تثبيت التطبيق بنجاح!', 'success');
        }
        deferredPrompt = null;
    });
}

// =========================== 
// دوال مساعدة
// ===========================
function showKeywordAlert(data) {
    // إنشاء نافذة تنبيه للكلمات المفتاحية
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-popup keyword-alert';
    alertDiv.innerHTML = `
        <h5><i class="fas fa-bell"></i> تنبيه كلمة مفتاحية</h5>
        <p><strong>الكلمة:</strong> ${data.keyword}</p>
        <p><strong>المجموعة:</strong> ${data.group}</p>
        <p><strong>الوقت:</strong> ${data.timestamp}</p>
        <p><strong>المرسل:</strong> ${data.sender}</p>
        <p><strong>الرسالة:</strong> ${data.message}</p>
        <button type="button" class="btn btn-sm btn-secondary" onclick="this.parentElement.remove()">إغلاق</button>
    `;

    document.getElementById('alertContainer').appendChild(alertDiv);

    // إزالة تلقائية بعد 10 ثوان
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 10000);
}

console.log('✅ App.js loaded successfully');