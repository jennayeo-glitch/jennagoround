/**
 * 관리자 페이지 접근 제어 — 카카오 로그인 + config.js adminKakaoIds
 * (클라이언트 allowlist는 URL 숨김용. PII 보호는 Firestore rules + 서버 검증 권장)
 */
const AdminAuth = {
    getUser() {
        const raw = localStorage.getItem('kakao_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },

    getAdminIds() {
        const cfg = window.APP_CONFIG || {};
        return (cfg.adminKakaoIds || []).map(String).filter(Boolean);
    },

    getAdminNicknames() {
        const cfg = window.APP_CONFIG || {};
        return (cfg.adminKakaoNicknames || []).map(String).filter(Boolean);
    },

    isLocalDev() {
        const h = location.hostname;
        return h === 'localhost' || h === '127.0.0.1';
    },

    /** adminKakaoIds / adminKakaoNicknames 가 모두 비어 있으면 로컬에서만 임시 허용 */
    needsAdminSetup() {
        return this.getAdminIds().length === 0 && this.getAdminNicknames().length === 0;
    },

    isAdmin(user) {
        if (!user || user.id == null) return false;
        if (this.needsAdminSetup() && this.isLocalDev()) return true;
        if (this.getAdminIds().includes(String(user.id))) return true;
        const nick = (user.nickname || '').trim().toLowerCase();
        return this.getAdminNicknames().some((n) => n.toLowerCase() === nick);
    },

    /**
     * @param {{ onReady?: (user) => void, onLoginRequired?: () => void, onDenied?: (user) => void }} handlers
     */
    async init(handlers = {}) {
        const user = this.getUser();

        if (!user) {
            handlers.onLoginRequired?.();
            return false;
        }

        if (!this.isAdmin(user)) {
            handlers.onDenied?.(user);
            return false;
        }

        handlers.onReady?.(user);
        return true;
    },

    renderGate(container, type, user) {
        const messages = {
            login: {
                icon: '🔐',
                title: '관리자 로그인',
                desc: '관리자 페이지는 카카오 로그인 후 이용할 수 있습니다.',
                action: '<button type="button" class="admin-btn admin-btn-kakao" id="gate-login-btn">카카오 로그인</button>'
            },
            denied: {
                icon: '🚫',
                title: '접근 권한 없음',
                desc: `로그인 계정 <strong>${this.escapeHtml(user?.nickname || '알 수 없음')}</strong>은 관리자로 등록되어 있지 않습니다.`,
                action: '<a href="index.html" class="admin-btn admin-btn-outline">메인으로</a>'
            }
        };
        const m = messages[type];
        const idBlock = type === 'denied' && user?.id
            ? `<div class="admin-gate-id">
                    <span class="admin-gate-id-label">내 카카오 ID</span>
                    <code id="admin-kakao-id">${this.escapeHtml(String(user.id))}</code>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-outline" id="copy-kakao-id-btn">복사</button>
               </div>
               <p class="admin-gate-hint"><code>config.js</code> → <code>adminKakaoIds: ["${this.escapeHtml(String(user.id))}"]</code> 추가 후 새로고침</p>`
            : '';

        container.innerHTML = `
            <div class="admin-gate">
                <div class="admin-gate-card">
                    <div class="admin-gate-icon">${m.icon}</div>
                    <h2 class="admin-gate-title">${m.title}</h2>
                    <p class="admin-gate-desc">${m.desc}</p>
                    ${idBlock}
                    ${m.action}
                </div>
            </div>`;

        if (type === 'login') {
            document.getElementById('gate-login-btn')?.addEventListener('click', () => {
                loginWithKakao();
                window.addEventListener('userLoggedIn', () => location.reload(), { once: true });
            });
        }

        document.getElementById('copy-kakao-id-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(String(user.id)).then(() => {
                alert('카카오 ID가 복사되었습니다. config.js의 adminKakaoIds에 붙여넣으세요.');
            });
        });
    },

    renderSetupBanner() {
        if (!this.needsAdminSetup() || !this.isLocalDev()) return '';
        const user = this.getUser();
        const id = user?.id ? String(user.id) : '(로그인 후 표시)';
        return `
            <div class="content-setup-banner" style="background:#fef3c7;border-color:#fcd34d;color:#92400e;">
                <strong>⚙️ 관리자 초기 설정</strong>
                배포 전 <code>config.js</code>에 카카오 ID를 등록하세요.<br>
                <code>adminKakaoIds: ["${this.escapeHtml(id)}"]</code>
            </div>`;
    },

    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
