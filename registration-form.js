/**
 * Smore-style 참가 신청서 — full-screen step quiz UX
 */
const RegistrationForm = (() => {
    let shell = null;
    let mainEl = null;
    let footerEl = null;
    let nextBtn = null;
    let backBtn = null;
    let progressBar = null;

    let event = null;
    let user = null;
    let onSubmit = null;
    let stepIndex = 0;
    let steps = [];
    let answers = {};
    let fieldError = '';

    function ageGroupFromBirthYear(birthYear) {
        const y = parseInt(String(birthYear), 10);
        if (isNaN(y)) return '미입력';
        const age = new Date().getFullYear() - y;
        if (age < 30) return '20대';
        if (age < 40) return '30대';
        if (age < 50) return '40대';
        return '50대+';
    }

    function buildSteps(ev) {
        const list = [
            { type: 'start', nextLabel: '1분만에 참가 신청하기' },
            {
                type: 'choice',
                field: 'gender',
                title: '본인의 성별을 클릭해주세요.',
                options: [
                    { value: 'female', label: '여성' },
                    { value: 'male', label: '남성' }
                ],
                autoAdvance: true,
                nextLabel: '다음 문제'
            },
            {
                type: 'input',
                field: 'realName',
                inputType: 'text',
                title: '실명을 입력해주세요.',
                placeholder: '이름',
                nextLabel: '다음 질문'
            },
            {
                type: 'input',
                field: 'birthYear',
                inputType: 'number',
                title: '출생년도를 입력해주세요.',
                subtitle: '입장시 신분증 확인',
                placeholder: '숫자를 입력해 주세요.',
                nextLabel: '다음 문제'
            },
            {
                type: 'input',
                field: 'phone',
                inputType: 'tel',
                title: '전화번호를 입력해주세요.',
                placeholder: '전화번호 입력',
                nextLabel: '다음 질문'
            },
            {
                type: 'input',
                field: 'message',
                inputType: 'text',
                title: '전하고 싶은 말 (선택)',
                subtitle: '호스트에게 전달할 내용이 있으면 적어 주세요',
                placeholder: '메시지 입력',
                optional: true,
                nextLabel: '다음 문제'
            },
            {
                type: 'info',
                title: '참가 안내',
                nextLabel: '확인했습니다'
            },
            {
                type: 'consent',
                field: 'consent',
                title: '개인정보 수집·이용 동의',
                subtitle: '아래 내용을 확인하고 동의해 주세요',
                nextLabel: '신청 완료'
            },
            { type: 'success', nextLabel: '닫기' }
        ];
        return list;
    }

    function progressSteps() {
        return steps.filter((s) => s.type !== 'start' && s.type !== 'success');
    }

    function updateProgress() {
        const trackable = progressSteps();
        const current = steps[stepIndex];
        if (!current || current.type === 'start' || current.type === 'success') {
            progressBar.style.width = current?.type === 'success' ? '100%' : '0%';
            return;
        }
        const idx = trackable.indexOf(current);
        const pct = trackable.length ? ((idx + 1) / trackable.length) * 100 : 0;
        progressBar.style.width = `${pct}%`;
    }

    function ensureShell() {
        if (shell) return shell;

        shell = document.createElement('div');
        shell.className = 'quiz-shell';
        shell.innerHTML = `
            <div class="quiz-topbar">
                <button type="button" class="quiz-back" aria-label="이전">&lsaquo;</button>
                <div class="quiz-progress-wrap"><div class="quiz-progress-bar"></div></div>
                <button type="button" class="quiz-close" aria-label="닫기">&times;</button>
            </div>
            <div class="quiz-main"></div>
            <div class="quiz-footer">
                <div class="quiz-footer-inner">
                    <button type="button" class="quiz-next">
                        <span class="quiz-next-text"></span>
                        <span class="quiz-next-icon" aria-hidden="true">&rsaquo;</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(shell);

        mainEl = shell.querySelector('.quiz-main');
        footerEl = shell.querySelector('.quiz-footer');
        nextBtn = shell.querySelector('.quiz-next');
        backBtn = shell.querySelector('.quiz-back');
        progressBar = shell.querySelector('.quiz-progress-bar');

        backBtn.addEventListener('click', goBack);
        shell.querySelector('.quiz-close').addEventListener('click', close);
        nextBtn.addEventListener('click', goNext);

        document.addEventListener('keydown', (e) => {
            if (!shell.classList.contains('is-open')) return;
            if (e.key === 'Escape') close();
        });

        return shell;
    }

    function buildInfoContent(ev) {
        const lines = [
            '❤️ 제출완료 화면이 떠야 신청완료',
            '',
            `📅 ${ev.displayDate}`,
            `📍 ${ev.location}`,
            `👥 모집 ${ev.capacity.total}명`
        ];
        if (ev.fee) lines.push('', `❗️ 참가비 ❗️`, ev.fee);
        if (ev.preparation) lines.push('', `🎒 준비물`, ev.preparation);
        lines.push(
            '',
            '☺︎ 계좌번호 143-910365-73407 하나',
            '입금 완료 확인되면 안내 문자 발송됩니다!',
            '',
            '입금은 1번으로 기입하신 성함(또는 닉네임)으로 부탁드립니다.',
            '',
            '❗️ 스크롤 내려서 아래사항 모두 확인 ❗️',
            '',
            '✨ 신청하시면 확인 후 연락드려요',
            '✨ 신청은 선착순으로 완료됩니다',
            '✨ 모임 1일 전부터 환불 불가',
            '(환불 불가 기간에는 날짜 연기도 불가)'
        );
        return lines.join('\n');
    }

    function renderStart(step) {
        const img = event.detailImage || event.image;
        return `
            <div class="quiz-step quiz-step--start">
                ${img ? `<img class="quiz-start-hero" src="${img}" alt="">` : ''}
                <div class="quiz-start-body">
                    <h1 class="quiz-start-title">${escapeHtml(event.title)}</h1>
                    <p class="quiz-start-desc">참가 신청서</p>
                    <p class="quiz-start-meta">${escapeHtml(event.displayDate)} · ${escapeHtml(event.location)}</p>
                </div>
            </div>
        `;
    }

    function renderChoice(step) {
        const selected = answers[step.field];
        const opts = step.options.map((o) => `
            <button type="button" class="quiz-choice${selected === o.value ? ' is-selected' : ''}"
                data-value="${o.value}">${escapeHtml(o.label)}</button>
        `).join('');
        return `
            <div class="quiz-step">
                <h2 class="quiz-q-title">${escapeHtml(step.title)}</h2>
                <div class="quiz-choices">${opts}</div>
                <p class="quiz-field-error">${escapeHtml(fieldError)}</p>
            </div>
        `;
    }

    function renderInput(step) {
        const val = answers[step.field] || '';
        return `
            <div class="quiz-step">
                <h2 class="quiz-q-title">${escapeHtml(step.title)}</h2>
                ${step.subtitle ? `<p class="quiz-q-sub">${escapeHtml(step.subtitle)}</p>` : ''}
                <div class="quiz-input-wrap">
                    <input class="quiz-input${fieldError ? ' quiz-input--error' : ''}"
                        type="${step.inputType}"
                        placeholder="${escapeHtml(step.placeholder)}"
                        value="${escapeHtml(val)}"
                        data-field="${step.field}"
                        ${step.inputType === 'number' ? 'inputmode="numeric"' : ''}
                        autocomplete="${step.field === 'phone' ? 'tel' : 'off'}">
                </div>
                <p class="quiz-field-error">${escapeHtml(fieldError)}</p>
            </div>
        `;
    }

    function renderInfo(step) {
        return `
            <div class="quiz-step">
                <h2 class="quiz-q-title">${escapeHtml(step.title)}</h2>
                <div class="quiz-info-box">${formatInfoText(buildInfoContent(event))}</div>
            </div>
        `;
    }

    function renderConsent(step) {
        const checked = answers.consent ? 'checked' : '';
        return `
            <div class="quiz-step">
                <h2 class="quiz-q-title">${escapeHtml(step.title)}</h2>
                ${step.subtitle ? `<p class="quiz-q-sub">${escapeHtml(step.subtitle)}</p>` : ''}
                <div class="quiz-consent-box">
                    <label class="quiz-consent-label">
                        <input type="checkbox" id="quiz-consent-check" ${checked}>
                        <span>개인정보(실명, 연락처, 출생년도) 수집·이용에 동의합니다.</span>
                    </label>
                    <p class="quiz-consent-detail">수집 항목: 실명, 출생년도, 전화번호, 성별<br>이용 목적: 이벤트 참가 확인 및 운영<br>보유 기간: 이벤트 종료 후 1년</p>
                </div>
                <p class="quiz-field-error">${escapeHtml(fieldError)}</p>
            </div>
        `;
    }

    function renderSuccess() {
        return `
            <div class="quiz-step quiz-success">
                <div class="quiz-success-icon">✓</div>
                <h2 class="quiz-success-title">신청 완료</h2>
                <p class="quiz-success-desc">참가 신청이 접수되었습니다.<br>확인 후 연락드릴게요.</p>
                <p class="quiz-success-desc">${escapeHtml(event.title)}<br>${escapeHtml(event.displayDate)}</p>
            </div>
        `;
    }

    function formatInfoText(text) {
        return escapeHtml(text)
            .replace(/❤️[^\n]*/g, (m) => `<strong>${m}</strong>`)
            .replace(/❗️[^\n]*/g, (m) => `<span class="quiz-info-highlight">${m}</span>`)
            .replace(/\n/g, '<br>');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function bindStepEvents(step) {
        if (step.type === 'choice') {
            mainEl.querySelectorAll('.quiz-choice').forEach((btn) => {
                btn.addEventListener('click', () => {
                    answers[step.field] = btn.dataset.value;
                    fieldError = '';
                    render();
                    if (step.autoAdvance) {
                        setTimeout(() => goNext(), 280);
                    }
                });
            });
        }

        if (step.type === 'input') {
            const input = mainEl.querySelector('.quiz-input');
            if (input) {
                input.focus();
                input.addEventListener('input', () => {
                    answers[step.field] = input.value;
                    fieldError = '';
                    input.classList.remove('quiz-input--error');
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        goNext();
                    }
                });
            }
        }

        if (step.type === 'consent') {
            const cb = mainEl.querySelector('#quiz-consent-check');
            if (cb) {
                cb.addEventListener('change', () => {
                    answers.consent = cb.checked;
                    fieldError = '';
                });
            }
        }
    }

    function validateStep(step) {
        fieldError = '';
        if (step.type === 'choice') {
            if (!answers[step.field]) {
                fieldError = '선택해 주세요.';
                return false;
            }
        }
        if (step.type === 'input' && !step.optional) {
            const val = (answers[step.field] || '').trim();
            if (!val) {
                fieldError = '입력해 주세요.';
                return false;
            }
            if (step.field === 'birthYear') {
                const y = parseInt(val, 10);
                const now = new Date().getFullYear();
                if (isNaN(y) || y < 1940 || y > now - 10) {
                    fieldError = '올바른 출생년도를 입력해 주세요.';
                    return false;
                }
            }
            if (step.field === 'phone') {
                const digits = val.replace(/\D/g, '');
                if (digits.length < 10 || digits.length > 11) {
                    fieldError = '올바른 전화번호를 입력해 주세요.';
                    return false;
                }
            }
        }
        if (step.type === 'consent') {
            const cb = mainEl.querySelector('#quiz-consent-check');
            answers.consent = cb ? cb.checked : false;
            if (!answers.consent) {
                fieldError = '동의가 필요합니다.';
                return false;
            }
        }
        return true;
    }

    function render() {
        const step = steps[stepIndex];
        if (!step) return;

        fieldError = '';

        if (step.type === 'start') mainEl.innerHTML = renderStart(step);
        else if (step.type === 'choice') mainEl.innerHTML = renderChoice(step);
        else if (step.type === 'input') mainEl.innerHTML = renderInput(step);
        else if (step.type === 'info') mainEl.innerHTML = renderInfo(step);
        else if (step.type === 'consent') mainEl.innerHTML = renderConsent(step);
        else if (step.type === 'success') mainEl.innerHTML = renderSuccess();

        bindStepEvents(step);

        backBtn.hidden = stepIndex === 0;

        const nextText = nextBtn.querySelector('.quiz-next-text');
        const nextIcon = nextBtn.querySelector('.quiz-next-icon');
        nextText.textContent = step.nextLabel || '다음 문제';
        nextIcon.style.display = step.type === 'success' ? 'none' : '';

        if (step.type === 'start') {
            footerEl.hidden = false;
            nextBtn.classList.remove('quiz-next--ghost');
        } else if (step.type === 'success') {
            footerEl.hidden = false;
            nextBtn.classList.add('quiz-next--ghost');
        } else {
            footerEl.hidden = false;
            nextBtn.classList.remove('quiz-next--ghost');
        }

        updateProgress();
        mainEl.scrollTop = 0;
    }

    async function goNext() {
        const step = steps[stepIndex];
        if (!step) return;

        if (step.type === 'start') {
            stepIndex++;
            if (answers.gender && steps[stepIndex]?.field === 'gender') {
                stepIndex++;
            }
            render();
            return;
        }

        if (step.type === 'success') {
            close();
            return;
        }

        if (step.type !== 'info' && !validateStep(step)) {
            render();
            return;
        }

        if (step.type === 'consent') {
            nextBtn.disabled = true;
            const nextTextEl = nextBtn.querySelector('.quiz-next-text');
            const prevLabel = nextTextEl.textContent;
            nextTextEl.textContent = '제출 중...';
            try {
                const data = {
                    gender: answers.gender,
                    realName: (answers.realName || '').trim(),
                    birthYear: (answers.birthYear || '').trim(),
                    phone: (answers.phone || '').trim(),
                    companionName: (answers.companionName || '').trim(),
                    message: (answers.message || '').trim(),
                    consent: true,
                    ageGroup: ageGroupFromBirthYear(answers.birthYear)
                };
                if (onSubmit) await onSubmit(data);
                stepIndex++;
                render();
            } catch (err) {
                fieldError = err.message || '신청 중 오류가 발생했습니다.';
                render();
            } finally {
                nextBtn.disabled = false;
                nextBtn.querySelector('.quiz-next-text').textContent = prevLabel;
            }
            return;
        }

        if (stepIndex < steps.length - 1) {
            stepIndex++;
            render();
            const nextStep = steps[stepIndex];
            if (nextStep?.type === 'input') {
                setTimeout(() => {
                    const input = mainEl.querySelector('.quiz-input');
                    if (input) input.focus();
                }, 100);
            }
        }
    }

    function goBack() {
        if (stepIndex > 0) {
            stepIndex--;
            fieldError = '';
            render();
        }
    }

    function open({ event: ev, user: u, onSubmit: submitFn }) {
        ensureShell();
        event = ev;
        user = u;
        onSubmit = submitFn;
        stepIndex = 0;
        answers = {};

        if (u.gender === 'female' || u.gender === 'male') {
            answers.gender = u.gender;
        }
        if (u.birthyear) {
            answers.birthYear = u.birthyear;
        }

        steps = buildSteps(ev);
        shell.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        render();
    }

    function close() {
        if (!shell) return;
        shell.classList.remove('is-open');
        document.body.style.overflow = '';
        onSubmit = null;
    }

    return { open, close, ageGroupFromBirthYear };
})();
