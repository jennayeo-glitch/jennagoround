// Kakao Login Configuration
const KAKAO_JS_KEY = 'b658fdd1927d83926c7705981b65b081';

// Initialize Kakao SDK
if (typeof Kakao !== 'undefined') {
    Kakao.init(KAKAO_JS_KEY);
}

// Check login status on page load
function checkLoginStatus() {
    const userInfo = localStorage.getItem('kakao_user');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        showUserInfo(user);
    } else {
        showLoginButton();
    }
}

// Show login button
function showLoginButton() {
    const loginBtn = document.getElementById('kakao-login-btn');
    const userInfoDiv = document.getElementById('user-info');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfoDiv) userInfoDiv.style.display = 'none';
}

// Show user info
function showUserInfo(user) {
    const loginBtn = document.getElementById('kakao-login-btn');
    const userInfoDiv = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfoDiv) userInfoDiv.style.display = 'flex';
    if (userName) userName.textContent = user.nickname || '사용자';
}

// Kakao Login
function loginWithKakao() {
    if (typeof Kakao === 'undefined') {
        alert('카카오 SDK가 로드되지 않았습니다. 카카오 JavaScript 키를 확인해주세요.');
        return;
    }

    if (!Kakao.isInitialized()) {
        alert('카카오 SDK가 초기화되지 않았습니다. 카카오 JavaScript 키를 설정해주세요.');
        return;
    }

    Kakao.Auth.login({
        success: function(authObj) {
            // Get user info
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(res) {
                    console.log('=== 카카오 API 전체 응답 ===');
                    console.log(JSON.stringify(res, null, 2));
                    
                    // 안전하게 사용자 정보 추출
                    let nickname = '사용자';
                    let profileImage = '';
                    let email = '';
                    let gender = '';
                    let birthyear = '';
                    
                    // 닉네임 가져오기 - 여러 경로 시도
                    if (res.kakao_account && res.kakao_account.profile) {
                        nickname = res.kakao_account.profile.nickname || nickname;
                        profileImage = res.kakao_account.profile.profile_image_url || 
                                      res.kakao_account.profile.thumbnail_image_url || '';
                    }
                    
                    // properties에서도 시도
                    if (res.properties && res.properties.nickname) {
                        nickname = res.properties.nickname;
                    }
                    
                    // 이메일 가져오기
                    if (res.kakao_account && res.kakao_account.email) {
                        email = res.kakao_account.email;
                    }

                    if (res.kakao_account && res.kakao_account.gender) {
                        gender = res.kakao_account.gender;
                    }

                    if (res.kakao_account && res.kakao_account.birthyear) {
                        birthyear = String(res.kakao_account.birthyear);
                    }
                    
                    const user = {
                        id: res.id,
                        nickname: nickname,
                        profile_image: profileImage,
                        email: email,
                        gender: gender,
                        birthyear: birthyear
                    };
                    
                    console.log('=== 추출된 사용자 정보 ===');
                    console.log(user);
                    
                    // Save to localStorage
                    localStorage.setItem('kakao_user', JSON.stringify(user));
                    localStorage.setItem('kakao_access_token', authObj.access_token);
                    
                    // Show user info (로그아웃 버튼으로 변경)
                    showUserInfo(user);
                    
                    // Reload page if on event detail page to update participation button
                    if (window.location.pathname.includes('event-detail.html')) {
                        window.location.reload();
                    }
                    
                    if (nickname === '사용자') {
                        console.warn('⚠️ 닉네임을 가져오지 못했습니다. 카카오 개발자 콘솔에서 동의 항목을 확인하세요.');
                    }
                },
                fail: function(err) {
                    console.error('=== 사용자 정보 가져오기 실패 ===');
                    console.error(JSON.stringify(err, null, 2));
                    
                    // 에러가 발생해도 기본 정보로 로그인 처리
                    const user = {
                        id: authObj.id || 'unknown',
                        nickname: '사용자',
                        profile_image: '',
                        email: '',
                        gender: '',
                        birthyear: ''
                    };
                    
                    localStorage.setItem('kakao_user', JSON.stringify(user));
                    localStorage.setItem('kakao_access_token', authObj.access_token);
                    showUserInfo(user);
                    
                    // Reload page if on event detail page to update participation button
                    if (window.location.pathname.includes('event-detail.html')) {
                        window.location.reload();
                    }
                    
                    alert('사용자 정보를 가져오는데 실패했습니다.\n콘솔(F12)을 확인하거나 카카오 개발자 콘솔에서 동의 항목(닉네임)을 확인해주세요.');
                }
            });
        },
        fail: function(err) {
            console.error('카카오 로그인 실패:', err);
            alert('카카오 로그인에 실패했습니다.');
        }
    });
}

// Logout
function logout() {
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        Kakao.Auth.logout(function() {
            console.log('카카오 로그아웃 완료');
        });
    }
    
    // Clear localStorage
    localStorage.removeItem('kakao_user');
    localStorage.removeItem('kakao_access_token');
    
    // Show login button
    showLoginButton();
    
    // Reload page to update participation button state
    if (window.location.pathname.includes('event-detail.html')) {
        window.location.reload();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check login status
    checkLoginStatus();
    
    // Login button event
    const loginBtn = document.getElementById('kakao-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', loginWithKakao);
    }
    
    // Logout button event
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

