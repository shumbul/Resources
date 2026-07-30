/* Reusable quiz engine.
 *
 * Any page can add interactive, self-scoring quizzes with zero custom JS by
 * writing markup like this:
 *
 *   <div class="quiz" data-quiz-title="Quick check">
 *     <script type="application/json">
 *       [
 *         { "q": "Question text?",
 *           "options": ["A", "B", "C"],
 *           "answer": 1,
 *           "explain": "Why B is correct." }
 *       ]
 *     </script>
 *   </div>
 *
 * Add class "quiz-final" for the end-of-page quiz (slightly stronger styling and
 * a "Final quiz" default title). The engine renders accessible radio groups, a
 * Check button, marks each answer right/wrong, shows explanations, and prints a
 * score like "7 / 10 (70%)" with an encouraging message. Idempotent.
 */

const CSS = `
.quiz{background:var(--bg-primary,#fff);border:1px solid var(--border,#e5e7eb);border-left:4px solid var(--primary,#7c3aed);
    border-radius:14px;padding:1.2rem 1.35rem;margin:1.2rem 0;}
.quiz-final{border-left-width:6px;box-shadow:var(--shadow);}
.quiz__title{font-family:var(--font-display,inherit);font-weight:700;font-size:1.05rem;margin:0 0 .2rem;display:flex;align-items:center;gap:.5rem;}
.quiz__meta{color:var(--text-secondary,#666);font-size:.85rem;margin:0 0 1rem;}
.quiz__q{margin:0 0 1rem;padding:0;border:none;}
.quiz__q legend{font-weight:600;padding:0;margin:0 0 .5rem;color:var(--text-primary,#111);}
.quiz__opt{display:flex;align-items:flex-start;gap:.6rem;padding:.5rem .7rem;border:1px solid var(--border,#e5e7eb);
    border-radius:10px;margin:.35rem 0;cursor:pointer;transition:border-color .15s ease,background .15s ease;}
.quiz__opt:hover{border-color:var(--primary,#7c3aed);}
.quiz__opt input{margin-top:.2rem;flex-shrink:0;accent-color:var(--primary,#7c3aed);}
.quiz__opt.correct{border-color:#047857;background:#e7f6ee;}
.quiz__opt.wrong{border-color:#b3261e;background:#fdecec;}
.quiz__opt .tick{margin-left:auto;font-weight:700;}
.quiz__opt.correct .tick{color:#047857;}
.quiz__opt.wrong .tick{color:#b3261e;}
.quiz__explain{display:none;margin:.4rem 0 0;padding:.6rem .8rem;background:var(--bg-secondary,#f7f8fc);
    border-radius:8px;font-size:.9rem;color:var(--text-secondary,#475569);}
.quiz__explain.show{display:block;}
.quiz__explain b{color:var(--text-primary,#111);}
.quiz__actions{display:flex;flex-wrap:wrap;align-items:center;gap:.8rem;margin-top:.6rem;}
.quiz__btn{border:none;border-radius:999px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-size:.9rem;
    color:#fff;background:linear-gradient(135deg,var(--primary,#7c3aed),var(--secondary,#6d28d9));}
.quiz__btn:hover{filter:brightness(1.05);}
.quiz__btn.reset{background:var(--bg-secondary,#f1f5f9);color:var(--text-secondary,#475569);border:1px solid var(--border,#e5e7eb);}
.quiz__score{font-weight:700;font-variant-numeric:tabular-nums;}
.quiz__score .msg{font-weight:600;color:var(--text-secondary,#475569);margin-left:.4rem;}
.quiz__bar{flex-basis:100%;height:8px;border-radius:999px;background:var(--bg-tertiary,#eef1f8);overflow:hidden;margin-top:.2rem;}
.quiz__bar span{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#047857,#10b981);transition:width .5s ease;}
@media (prefers-reduced-motion: reduce){ .quiz__bar span{transition:none;} }
`;

export function initQuizzes() {
    const quizzes = Array.from(document.querySelectorAll('.quiz'));
    if (!quizzes.length) return;
    injectStyle('fn-quiz-css', CSS);
    quizzes.forEach((el, i) => build(el, i));
}

function build(root, index) {
    if (root.getAttribute('data-quiz-ready') === '1') return;
    const dataEl = root.querySelector('script[type="application/json"]');
    if (!dataEl) return;
    let questions;
    try { questions = JSON.parse(dataEl.textContent); } catch { return; }
    if (!Array.isArray(questions) || !questions.length) return;

    const isFinal = root.classList.contains('quiz-final');
    const title = root.getAttribute('data-quiz-title') || (isFinal ? 'Final quiz' : 'Quick quiz');
    const icon = isFinal ? '🏆' : '📝';
    const gid = 'quiz' + index;

    const qHtml = questions.map((q, qi) => {
        const opts = q.options.map((opt, oi) =>
            `<label class="quiz__opt" data-qi="${qi}" data-oi="${oi}">
                <input type="radio" name="${gid}_q${qi}" value="${oi}">
                <span>${opt}</span><span class="tick" aria-hidden="true"></span>
            </label>`).join('');
        return `<fieldset class="quiz__q" data-qi="${qi}">
            <legend>${qi + 1}. ${q.q}</legend>
            ${opts}
            <p class="quiz__explain" id="${gid}_ex${qi}"></p>
        </fieldset>`;
    }).join('');

    root.innerHTML =
        `<p class="quiz__title">${icon} ${title}</p>
        <p class="quiz__meta">${questions.length} question${questions.length > 1 ? 's' : ''} &middot; pick one answer each, then check.</p>
        ${qHtml}
        <div class="quiz__actions">
            <button type="button" class="quiz__btn check">Check answers</button>
            <button type="button" class="quiz__btn reset" hidden>Try again</button>
            <span class="quiz__score" role="status" aria-live="polite"></span>
            <div class="quiz__bar"><span></span></div>
        </div>`;

    const checkBtn = root.querySelector('.check');
    const resetBtn = root.querySelector('.reset');
    const scoreEl = root.querySelector('.quiz__score');
    const barFill = root.querySelector('.quiz__bar span');

    checkBtn.addEventListener('click', () => grade(root, questions, gid, scoreEl, barFill, checkBtn, resetBtn));
    resetBtn.addEventListener('click', () => reset(root, questions, gid, scoreEl, barFill, checkBtn, resetBtn));

    root.setAttribute('data-quiz-ready', '1');
}

function grade(root, questions, gid, scoreEl, barFill, checkBtn, resetBtn) {
    let correct = 0;
    questions.forEach((q, qi) => {
        const chosen = root.querySelector(`input[name="${gid}_q${qi}"]:checked`);
        const ex = root.querySelector(`#${gid}_ex${qi}`);
        root.querySelectorAll(`.quiz__opt[data-qi="${qi}"]`).forEach((opt) => {
            opt.classList.remove('correct', 'wrong');
            const tick = opt.querySelector('.tick');
            if (tick) tick.textContent = '';
            const oi = parseInt(opt.getAttribute('data-oi'), 10);
            if (oi === q.answer) { opt.classList.add('correct'); if (tick) tick.textContent = '✓'; }
        });
        if (chosen) {
            const oi = parseInt(chosen.value, 10);
            if (oi === q.answer) correct++;
            else {
                const optEl = root.querySelector(`.quiz__opt[data-qi="${qi}"][data-oi="${oi}"]`);
                if (optEl) { optEl.classList.add('wrong'); const t = optEl.querySelector('.tick'); if (t) t.textContent = '✕'; }
            }
        }
        if (ex && q.explain) { ex.innerHTML = '<b>Answer:</b> ' + q.explain; ex.classList.add('show'); }
    });

    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    scoreEl.innerHTML = `${correct} / ${total} (${pct}%) <span class="msg">${message(pct)}</span>`;
    barFill.style.width = pct + '%';
    barFill.style.background = pct >= 70
        ? 'linear-gradient(90deg,#047857,#10b981)'
        : (pct >= 40 ? 'linear-gradient(90deg,#b45309,#f59e0b)' : 'linear-gradient(90deg,#b3261e,#ef4444)');
    checkBtn.hidden = true;
    resetBtn.hidden = false;
}

function reset(root, questions, gid, scoreEl, barFill, checkBtn, resetBtn) {
    questions.forEach((q, qi) => {
        root.querySelectorAll(`input[name="${gid}_q${qi}"]`).forEach((r) => { r.checked = false; });
        root.querySelectorAll(`.quiz__opt[data-qi="${qi}"]`).forEach((opt) => {
            opt.classList.remove('correct', 'wrong');
            const tick = opt.querySelector('.tick'); if (tick) tick.textContent = '';
        });
        const ex = root.querySelector(`#${gid}_ex${qi}`);
        if (ex) ex.classList.remove('show');
    });
    scoreEl.textContent = '';
    barFill.style.width = '0';
    checkBtn.hidden = false;
    resetBtn.hidden = true;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function message(pct) {
    if (pct === 100) return 'Perfect! 🎉';
    if (pct >= 70) return 'Solid, you know this.';
    if (pct >= 40) return 'Getting there, review and retry.';
    return 'Reread the section and try again.';
}

function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
}
