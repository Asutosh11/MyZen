/* ============================================================
   Tab Content Loader — fetches each tab HTML partial and injects
   it into the corresponding #tabPanel-* placeholder in index.html
   ============================================================ */
async function loadTabContents() {
    const tabs = [
        { id: "tabPanel-practice", url: "tabs/practice.html" },
        { id: "tabPanel-log",      url: "tabs/log.html"      },
        { id: "tabPanel-progress", url: "tabs/progress.html" },
        { id: "tabPanel-about",    url: "tabs/about.html"    },
    ];
    await Promise.all(tabs.map(async (t) => {
        const el = document.getElementById(t.id);
        if (el) {
            const res = await fetch(t.url);
            el.innerHTML = await res.text();
        }
    }));
}

/* ============================================================
   Config & Constants
   ============================================================ */
const DEFAULT_DATA_URL = "web-app/sessions.json";
const FALLBACK_RAW_URL =
    "https://raw.githubusercontent.com/Asutosh11/myzen/main/web-app/sessions.json";

const LIMBS = [
    {
        key: 1,
        name: "YAMA",
        sub: "Ethical Restraints",
        theory: "Patanjali Yoga Sutra 2.30 — Ahimsa (non-violence), Satya (truthfulness), Asteya (non-stealing), Brahmacharya (moderation), Aparigraha (non-possessiveness).",
        meaning:
            "Five moral rules for how we treat others and the world, including ahimsa (non-violence), satya (truthfulness), asteya (non-stealing), brahmacharya (moderation), and aparigraha (non-possessiveness).",
        sadhakFeels:
            "A profound lightening of the mind before sitting. Without the heavy burden of unresolved conflicts, lies, or ill-will, the heart feels unburdened, peaceful, and ready to turn inward without guilt or mental agitation.",
    },
    {
        key: 2,
        name: "NIYAMA",
        sub: "Inner Disciplines",
        theory: "Patanjali Yoga Sutra 2.32 — Saucha (purity), Santosha (contentment), Tapas (discipline), Svadhyaya (self-study), Ishvarapranidhana (surrender).",
        meaning:
            "Five personal habits for inner growth, including saucha (purity), santosha (contentment), tapas (self-discipline), svadhyaya (self-study), and ishvara pranidhana (surrender).",
        sadhakFeels:
            "A quiet, joyful contentment (Santosha) filling the chest. Instead of sitting out of obligation or restless craving, the Sadhak approaches the meditation mat with eager readiness and a clean, tranquil mind.",
    },
    {
        key: 3,
        name: "ASANA",
        sub: "Steady Posture",
        theory: "Patanjali Yoga Sutra 2.46 — 'Sthira Sukham Asanam' (Posture should be steady and comfortable).",
        meaning:
            "The yoga poses we practice today, meant to make the body strong, stable, and comfortable for long periods of sitting.",
        sadhakFeels:
            "Physical body sensations recede completely. The spine feels effortlessly suspended, muscles relax, and after a few minutes, body-consciousness dissolves—as if sitting in weightless, empty space without physical boundaries.",
    },
    {
        key: 4,
        name: "PRANAYAMA",
        sub: "Breath Integration",
        theory: "Patanjali Yoga Sutra 2.49 — Regulation of incoming and outgoing breath (Prana), bridging body to consciousness.",
        meaning:
            "Managing the breath to calm the nervous system and guide life energy (prana) through the body.",
        sadhakFeels:
            "The breath becomes micro-fine—almost imperceptible, like a delicate thread of silk. Heart rate slows, a deep wave of safety washes over the nervous system, and thoughts quiet down in direct rhythm with the breath.",
    },
    {
        key: 5,
        name: "PRATYAHARA",
        sub: "Starting withdrawal from surroundings",
        theory: "Patanjali Yoga Sutra 2.54 — Sensory organs (Indriyas) detach from external objects and draw inward toward awareness.",
        meaning:
            "Turning our attention away from outside distractions and noise to look inward.",
        sadhakFeels:
            "Like a tortoise drawing its limbs inside its shell. External noises (street sounds, ticking clocks) are still occurring, but feel miles away—like gentle rain outside a warm, cozy room. Sensory pulls vanish.",
    },
    {
        key: 6,
        name: "DHARANA",
        sub: "Trying to attain One-Pointed Focus",
        theory: "Patanjali Yoga Sutra 3.1 — 'Deshabandha Chittasya Dharana' (Binding consciousness to a single point).",
        meaning:
            "Training the mind to focus completely on a single point, object, or thought.",
        sadhakFeels:
            "A continuous battle between attention and the mind wandering off. In early stages, the Sadhak notices the mind has drifted after a delay. With practice, awareness catches the drift within seconds, until reaching an advanced stage where detection is nearly instantaneous—catching and returning focus within just 2, 3, or 5 seconds.",
    },
    {
        key: 7,
        name: "DHYANA",
        sub: "Attained One-Pointed Focus",
        theory: "Patanjali Yoga Sutra 3.2 — 'Tatra Pratyaya Ekatanata Dhyanam' (Unbroken continuous flow of awareness at a point of focus).",
        meaning:
            "An uninterrupted, smooth flow of concentration where the mind stays quiet and aware.",
        sadhakFeels:
            "Complete effortlessness at the point of focus. The Sadhak is no longer 'trying' to meditate; meditation at the point of focus is happening automatically. Awareness flows continuously into stillness like an unbroken stream of oil poured from one vessel to another. Time vanishes.",
    },
    {
        key: 8,
        name: "SAMADHI",
        sub: "Pure Oneness",
        theory: "Patanjali Yoga Sutra 3.3 — 'Tad Eva Arthamatra Nirbhasam Swarupa Shoonyam Iva Samadhih' (Pure luminous absorption).",
        meaning:
            "A profound state of joy, peace, and complete oneness with the universe.",
        sadhakFeels:
            "Luminous, motionless oneness. The distinction between 'I am meditating' and 'the stillness' completely vanishes. There is no individual observer left—only pure, timeless, infinite awareness.",
    },
];
const MAX_DEPTH = LIMBS.length;

/* Global State */
let rawSessions = [];
let parsedSessions = [];
let currentUser = null;
let currentToken = localStorage.getItem("myzen_gh_token") || null;
let currentRepo = localStorage.getItem("myzen_gh_repo") || "myzen";
let currentSHA = null;

let selectedDuration = 15;
let selectedStage = 4;
let editingSessionId = null;

/* Security & String Helpers */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ---------- Input / Data Validators ---------- */
// Allow only UUID-shaped IDs (alphanumeric, hyphens) — blocks injection via data-id
function sanitizeId(id) {
    if (typeof id !== "string") return "";
    return id.replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 64);
}
// Allow only safe GitHub repo names
function sanitizeRepoName(name) {
    if (typeof name !== "string") return "myzen";
    return (
        name.replace(/[^a-zA-Z0-9_\-.]/g, "").slice(0, 100) ||
        "myzen"
    );
}
// Returns a positive integer or the fallback
function validatePositiveInt(val, fallback) {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
// Returns depth clamped to [1, MAX_DEPTH] or 1
function validateDepth(val) {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n >= 1 && n <= MAX_DEPTH ? n : 1;
}
// Returns a safe GitHub CDN avatar URL or empty string
function sanitizeAvatarUrl(url) {
    try {
        const u = new URL(url);
        if (
            (u.hostname === "avatars.githubusercontent.com" ||
                u.hostname.endsWith(".githubusercontent.com")) &&
            u.protocol === "https:"
        )
            return url;
    } catch (_) {}
    return "";
}
// Validate and sanitize a raw session object from JSON
function validateSession(s) {
    if (!s || typeof s !== "object") return null;
    const id = sanitizeId(String(s.id || ""));
    if (!id) return null;
    const duration = validatePositiveInt(s.durationInMinutes, 1);
    if (duration > 1440) return null; // sanity cap: 24 hours
    // statePath must be an array of positive ints
    if (!Array.isArray(s.statePath) || s.statePath.length === 0)
        return null;
    const safePath = s.statePath
        .map((v) => validatePositiveInt(v, 1))
        .filter((v) => v <= MAX_DEPTH);
    if (safePath.length === 0) return null;
    const date =
        typeof s.date === "number" ? s.date : parseFloat(s.date);
    if (!Number.isFinite(date)) return null;
    return {
        id,
        date,
        statePath: safePath,
        durationInMinutes: duration,
    };
}

/* Date Helpers */
function appleToDate(sec) {
    return new Date((sec + 978307200) * 1000);
}
function dateToApple(jsDate) {
    return jsDate.getTime() / 1000 - 978307200;
}
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16).toUpperCase();
        },
    );
}
function depthOf(session) {
    if (
        Array.isArray(session.statePath) &&
        session.statePath.length
    ) {
        return Math.min(MAX_DEPTH, Math.max(...session.statePath));
    }
    return 1;
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), 3000);
}

/* ============================================================
   Interactive Breathing Pacer
   ============================================================ */
let breathingInterval = null;
let isBreathingActive = false;

function initBreathingPacer() {
    const startBtn = document.getElementById("startBreathingBtn");
    if (!startBtn) return;
    startBtn.addEventListener("click", function () {
        if (isBreathingActive) {
            stopBreathingPacer();
            return;
        }
        startBreathingPacer();
    });
}

function startBreathingPacer() {
    isBreathingActive = true;
    const btn = document.getElementById("startBreathingBtn");
    const ring = document.getElementById("breathingRing");
    const text = document.getElementById("breathingStateText");
    const timerText = document.getElementById("breathingTimerText");
    const innerLabel = document.getElementById("ringInnerLabel");

    btn.textContent = "⏹ Stop Breathing Sit";
    btn.style.background = "rgba(255,107,107,0.2)";
    btn.style.color = "#ff6b6b";

    let totalSecondsLeft = 180; // 3 minutes
    const phases = [
        { name: "Inhale gently...", class: "expand", duration: 4 },
        {
            name: "Hold peacefully...",
            class: "expand",
            duration: 4,
        },
        {
            name: "Exhale slowly...",
            class: "contract",
            duration: 4,
        },
        {
            name: "Rest in stillness...",
            class: "contract",
            duration: 4,
        },
    ];

    let phaseIndex = 0;
    let phaseSec = 0;

    function updateDisplay() {
        const mins = Math.floor(totalSecondsLeft / 60);
        const secs = totalSecondsLeft % 60;
        timerText.textContent = `Time remaining: ${mins}:${secs < 10 ? "0" : ""}${secs}`;

        const currentPhase = phases[phaseIndex];
        text.textContent = currentPhase.name;
        innerLabel.textContent = currentPhase.name.split(" ")[0];

        if (currentPhase.class === "expand") {
            ring.classList.add("expand");
            ring.classList.remove("contract");
        } else {
            ring.classList.add("contract");
            ring.classList.remove("expand");
        }
    }

    updateDisplay();

    breathingInterval = setInterval(() => {
        totalSecondsLeft--;
        phaseSec++;

        if (phaseSec >= phases[phaseIndex].duration) {
            phaseSec = 0;
            phaseIndex = (phaseIndex + 1) % phases.length;
        }

        if (totalSecondsLeft <= 0) {
            stopBreathingPacer();
            showToast(
                "3-Minute Breathing Sit Complete! Rest in peace.",
            );
            if (
                confirm(
                    "Great sit! Would you like to log this 3-minute meditation in your journal now?",
                )
            ) {
                selectedDuration = 3;
                openReflectionModal(null);
            }
            return;
        }

        updateDisplay();
    }, 1000);
}

function stopBreathingPacer() {
    isBreathingActive = false;
    clearInterval(breathingInterval);
    const btn = document.getElementById("startBreathingBtn");
    const ring = document.getElementById("breathingRing");
    const text = document.getElementById("breathingStateText");
    const timerText = document.getElementById("breathingTimerText");
    const innerLabel = document.getElementById("ringInnerLabel");

    btn.textContent = "🧘 Start 3-Minute Breathing Sit";
    btn.style.background = "#ffffff";
    btn.style.color = "#0d1117";
    ring.classList.remove("expand", "contract");
    innerLabel.textContent = "Breathe";
    text.textContent = "Press start to take a 3-minute calm break";
    timerText.textContent =
        "Inhale 4s · Hold 4s · Exhale 4s · Rest 4s";
}

/* ============================================================
   GitHub Authentication & Sync Engine
   ============================================================ */
async function initAuth() {
    const savedUser = localStorage.getItem("myzen_gh_user");
    if (savedUser && currentToken) {
        try {
            currentUser = JSON.parse(savedUser);
            // Await so loadSessions() runs AFTER auth is settled
            const ok = await verifyGitHubToken(
                currentToken,
                currentRepo,
                false,
            );
            if (!ok) {
                // Token invalid — clear stale credentials
                currentUser = null;
                renderAuthUI();
                loadSessions();
            }
            // verifyGitHubToken already calls renderAuthUI + loadSessions on success
            return;
        } catch (e) {
            currentUser = null;
        }
    }
    renderAuthUI();
    loadSessions();
}

async function verifyGitHubToken(
    token,
    repoName,
    showErrors = true,
) {
    const errorEl = document.getElementById("ghAuthError");
    if (errorEl) errorEl.style.display = "none";

    try {
        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
            },
        });
        if (!userRes.ok)
            throw new Error("Invalid GitHub Access Token");
        const user = await userRes.json();

        currentToken = token;
        currentUser = user;
        currentRepo = sanitizeRepoName(repoName || "myzen");
        localStorage.setItem("myzen_gh_token", token);
        localStorage.setItem("myzen_gh_user", JSON.stringify(user));
        localStorage.setItem("myzen_gh_repo", currentRepo);

        renderAuthUI();
        closeGHAuthModal();
        showToast(`Connected to @${user.login}/${currentRepo}`);
        loadSessions();
        return true;
    } catch (err) {
        if (showErrors && errorEl) {
            errorEl.textContent = err.message;
            errorEl.style.display = "block";
        }
        return false;
    }
}

function renderAuthUI() {
    const container = document.getElementById("authPillContainer");
    const statsWrap = document.getElementById("statsWrap");
    const tideWrap = document.getElementById("tideWrap");
    const commitArea = document.getElementById("inlineCommitArea");
    const logStatus = document.getElementById("inlineLogStatus");

    if (currentUser && currentToken) {
        if (statsWrap) statsWrap.classList.remove("disabled");
        if (tideWrap) tideWrap.classList.remove("disabled");
        if (logStatus)
            logStatus.textContent =
                "Logged in as @" + escapeHtml(currentUser.login);
        if (commitArea)
            commitArea.innerHTML = `
                        <div class="action-btn-group" style="margin-top: 14px;">
                            <button class="commit-btn" id="inlineCommitBtn">Commit to Journal</button>
                            <button class="btn-log-secondary" id="inlineShareBtn" type="button">
                                Share Progress Card
                            </button>
                        </div>`;
        const inlineCommitBtn =
            document.getElementById("inlineCommitBtn");
        if (inlineCommitBtn)
            inlineCommitBtn.addEventListener(
                "click",
                commitInlineSession,
            );
        const inlineShareBtn =
            document.getElementById("inlineShareBtn");
        if (inlineShareBtn)
            inlineShareBtn.addEventListener(
                "click",
                shareProgressCard,
            );

        container.innerHTML = `
      <div style="position:relative;">
        <button class="auth-pill" id="userMenuBtn">
          <img class="auth-avatar" src="${escapeHtml(sanitizeAvatarUrl(currentUser.avatar_url))}" alt="${escapeHtml(currentUser.login)}"/>
          <span>@${escapeHtml(currentUser.login)}</span>
        </button>
        <div class="auth-popover" id="userPop">
          <div class="pop-label" style="margin-bottom:4px;">GitHub Account</div>
          <div style="font-size:0.84375rem;color:var(--text);font-weight:500;">${escapeHtml(currentUser.name || currentUser.login)}</div>
          <div style="font-size:0.71875rem;color:var(--text-faint);margin-bottom:12px;">Repo: ${escapeHtml(currentUser.login)}/${escapeHtml(currentRepo)}</div>
          <button id="shareNowBtn" class="btn-log-secondary" style="margin-bottom:8px;padding:8px;font-size:0.75rem;">
            Share progress card
          </button>
          <button id="syncNowBtn" class="btn-log-secondary" style="margin-bottom:8px;padding:8px;font-size:0.75rem;">
            🔄 Sync sessions.json
          </button>
          <button id="signOutBtn" class="btn-log-secondary" style="padding:8px;font-size:0.75rem;color:#ff6b6b;border-color:rgba(255,107,107,0.2);">
            Sign Out
          </button>
        </div>
      </div>
    `;

        document
            .getElementById("userMenuBtn")
            .addEventListener("click", (e) => {
                e.stopPropagation();
                document
                    .getElementById("userPop")
                    .classList.toggle("open");
            });
        document
            .getElementById("signOutBtn")
            .addEventListener("click", () => {
                localStorage.removeItem("myzen_gh_token");
                localStorage.removeItem("myzen_gh_user");
                localStorage.removeItem("myzen_gh_repo");
                currentUser = null;
                currentToken = null;
                renderAuthUI();
                loadSessions();
            });
        document
            .getElementById("syncNowBtn")
            .addEventListener("click", () => {
                document
                    .getElementById("userPop")
                    .classList.remove("open");
                loadSessions();
            });
        const shareNowBtn = document.getElementById("shareNowBtn");
        if (shareNowBtn)
            shareNowBtn.addEventListener(
                "click",
                shareProgressCard,
            );
        updateShareButtonState();
    } else {
        if (statsWrap) statsWrap.classList.add("disabled");
        if (tideWrap) tideWrap.classList.add("disabled");
        if (logStatus) logStatus.textContent = "";
        if (commitArea)
            commitArea.innerHTML = `
                        <div class="inline-widget-auth-bar">
                            <span>Sign in to commit your sessions to GitHub</span>
                            <button onclick="openGHAuthModal()">Sign in with GitHub</button>
                        </div>`;
        const logAuthBadge =
            document.getElementById("logAuthBadge");
        if (logAuthBadge)
            logAuthBadge.style.display = "inline-flex";

        container.innerHTML = `
      <button class="icon-btn" id="ghLoginBtn" style="padding:0 12px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        <span>GitHub Login</span>
      </button>
    `;
        document
            .getElementById("ghLoginBtn")
            .addEventListener("click", openGHAuthModal);
    }
}

/* GitHub Auth Modal Handlers */
function openGHAuthModal() {
    document.getElementById("ghTokenInput").value =
        currentToken || "";
    document.getElementById("ghRepoInput").value =
        currentRepo || "myzen";
    document.getElementById("ghAuthError").style.display = "none";
    document.getElementById("ghAuthOverlay").classList.add("open");
}
window.openGHAuthModal = openGHAuthModal;

function closeGHAuthModal() {
    document.getElementById("ghAuthOverlay").classList.remove("open");
}

function initGHAuthModal() {
    const ghAuthOverlay = document.getElementById("ghAuthOverlay");

    document
        .getElementById("ghAuthClose")
        .addEventListener("click", closeGHAuthModal);
    ghAuthOverlay.addEventListener("click", (e) => {
        if (e.target === ghAuthOverlay) closeGHAuthModal();
    });

    document
        .getElementById("toggleTokenVisibility")
        .addEventListener("click", function () {
            const inp = document.getElementById("ghTokenInput");
            if (inp.type === "password") {
                inp.type = "text";
                this.textContent = "Hide";
            } else {
                inp.type = "password";
                this.textContent = "Show";
            }
        });

    document
        .getElementById("saveGHAuthBtn")
        .addEventListener("click", async () => {
            const token = document
                .getElementById("ghTokenInput")
                .value.trim();
            const repo =
                document.getElementById("ghRepoInput").value.trim() ||
                "myzen";
            if (!token) {
                const errorEl = document.getElementById("ghAuthError");
                errorEl.textContent =
                    "Please enter a valid GitHub Personal Access Token.";
                errorEl.style.display = "block";
                return;
            }
            await verifyGitHubToken(token, repo, true);
        });
}

/* ============================================================
   Base64 ↔ UTF-8 helpers (handles emoji, Devanagari, etc.)
   ============================================================ */
function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
}
function base64ToUtf8(b64) {
    const cleaned = b64.replace(/\n/g, "");
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

/* ============================================================
   Data Loading & GitHub API Sync
   ============================================================ */
   async function loadSessions() {
       renderLimbGrid(0);

       if (currentUser && currentToken) {
           try {
               const owner = currentUser.login;
               const repo = currentRepo;

               const url =
                   `https://api.github.com/repos/${encodeURIComponent(owner)}` +
                   `/${encodeURIComponent(repo)}/contents/web-app/sessions.json`;

               const res = await fetch(url, {
                   headers: {
                       Authorization: `Bearer ${currentToken}`,
                       Accept: "application/vnd.github+json",
                   },
                   cache: "no-store",
               });

               if (!res.ok) {
                   const err = await res.json().catch(() => ({}));

                   console.error(
                       "Failed to load sessions.json:",
                       res.status,
                       err
                   );

                   throw new Error(
                       `GitHub sessions.json request failed: ${res.status} ${
                           err.message || ""
                       }`
                   );
               }

               const data = await res.json();

               // Save SHA so future PUT operations can update the
               // same GitHub file without a conflict.
               currentSHA = data.sha || null;

               if (!data.content) {
                   throw new Error(
                       "GitHub returned sessions.json without content."
                   );
               }

               const jsonText = base64ToUtf8(data.content);

               const sessions = JSON.parse(jsonText);

               if (!Array.isArray(sessions)) {
                   throw new Error(
                       "sessions.json does not contain a JSON array."
                   );
               }

               rawSessions = sessions
                   .map(validateSession)
                   .filter(Boolean);

               console.log(
                   `Loaded ${rawSessions.length} sessions from ` +
                   `${owner}/${repo}/web-app/sessions.json`
               );

               processAndRenderSessions();

               return;
           } catch (err) {
               console.error("Session loading error:", err);

               // Do NOT silently show an empty account.
               showToast(
                   `Could not load your GitHub sessions: ${err.message}`
               );

               rawSessions = [];
               parsedSessions = [];

               render([]);
               return;
           }
       }

       // Not logged in → use locally stored sessions if available.
       try {
           const local = localStorage.getItem("myzen_local_sessions");

           if (local) {
               const sessions = JSON.parse(local);

               rawSessions = Array.isArray(sessions)
                   ? sessions.map(validateSession).filter(Boolean)
                   : [];
           } else {
               rawSessions = [];
           }
       } catch (err) {
           console.error("Local session loading error:", err);
           rawSessions = [];
       }

       processAndRenderSessions();
   }

function processAndRenderSessions() {
    parsedSessions = rawSessions
        .map((s) => ({
            ...s,
            jsDate: appleToDate(s.date),
            depth: depthOf(s),
        }))
        .sort((a, b) => a.jsDate - b.jsDate);
    render(parsedSessions);
}

async function saveSessionsToGitHub(updatedRawSessions) {
    rawSessions = updatedRawSessions;
    processAndRenderSessions();

    if (!currentUser || !currentToken) {
        showToast(
            "Session saved locally. Log in to sync with GitHub.",
        );
        localStorage.setItem(
            "myzen_local_sessions",
            JSON.stringify(rawSessions),
        );
        return;
    }

    try {
        const owner = currentUser.login;
        const repo = currentRepo;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/web-app/sessions.json`;

        if (!currentSHA) {
            const getRes = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                    Accept: "application/vnd.github+json",
                },
            });
            if (getRes.ok) {
                const getJson = await getRes.json();
                currentSHA = getJson.sha;
            }
        }

        const jsonStr = JSON.stringify(rawSessions, null, 2);
        const base64Content = utf8ToBase64(jsonStr);

        const putBody = {
            message: "Log meditation session via MyZen Web App",
            content: base64Content,
        };
        if (currentSHA) putBody.sha = currentSHA;

        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${currentToken}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(putBody),
        });

        if (putRes.ok) {
            const result = await putRes.json();
            currentSHA = result.content
                ? result.content.sha
                : currentSHA;
            showToast("Synced to sessions.json on GitHub!");
        } else {
            const errJson = await putRes.json().catch(() => ({}));
            console.error(
                "GitHub upload failed",
                putRes.status,
                errJson,
            );
            showToast(
                `GitHub sync failed (${putRes.status}). Saved locally.`,
            );
        }
    } catch (err) {
        console.error("Sync error:", err);
        showToast("Sync error. Session saved in browser.");
    }
}

/* ============================================================
   Inline Log Session Widget
   ============================================================ */
let selectedInlineDuration = 15;
let selectedInlineStage = 4;

function renderInlineDepthGrid() {
    const grid = document.getElementById("inlineDepthGrid");
    if (!grid) return;
    grid.innerHTML = LIMBS.map(
        (l) => `
                    <div class="depth-opt-card ${l.key === selectedInlineStage ? "selected" : ""}" data-stage="${l.key}">
                        <div class="depth-opt-num">${l.key}</div>
                        <div>
                            <div class="depth-opt-title">${l.name}</div>
                            <div class="depth-opt-sub">${l.sub}</div>
                        </div>
                    </div>`,
    ).join("");
    grid.querySelectorAll(".depth-opt-card").forEach((card) => {
        card.addEventListener("click", () => {
            selectedInlineStage = parseInt(card.dataset.stage);
            updateInlineStageView();
        });
    });
}

function updateInlineStageView() {
    renderInlineDepthGrid();
    const limb = LIMBS[selectedInlineStage - 1];
    const titleEl = document.getElementById("inlineDepthTitle");
    const descEl = document.getElementById("inlineDepthDesc");
    if (titleEl)
        titleEl.textContent = `STAGE ${selectedInlineStage}: ${limb.name} (${limb.sub})`;
    if (descEl)
        descEl.innerHTML = `
                    <div style="margin-bottom:4px;"><strong style="color:var(--accent-strong);">📜 Theory:</strong> ${limb.theory}</div>
                    <div style="margin-bottom:4px;"><strong style="color:var(--text);">💡 What It Means:</strong> ${limb.meaning}</div>
                    <div><strong style="color:var(--accent);">🧘 How a Sadhak Feels:</strong> "${limb.sadhakFeels}"</div>`;
}

function initInlineWidget() {
    const inlineSlider = document.getElementById(
        "inlineDurationSlider",
    );
    const inlineValEl = document.getElementById("inlineDurationVal");
    if (inlineSlider) {
        inlineSlider.addEventListener("input", (e) => {
            selectedInlineDuration = parseInt(e.target.value);
            if (inlineValEl)
                inlineValEl.textContent = formatInlineDuration(
                    selectedInlineDuration,
                );
        });
    }

    const inlineCustomBtn =
        document.getElementById("inlineCustomDurBtn");
    if (inlineCustomBtn) {
        inlineCustomBtn.addEventListener("click", () => {
            const val = prompt(
                "Enter duration in minutes:",
                selectedInlineDuration,
            );
            if (val && !isNaN(val) && val > 0) {
                selectedInlineDuration = parseInt(val);
                if (inlineSlider)
                    inlineSlider.value = Math.min(
                        180,
                        selectedInlineDuration,
                    );
                if (inlineValEl)
                    inlineValEl.textContent = formatInlineDuration(
                        selectedInlineDuration,
                    );
            }
        });
    }

    updateInlineStageView();
}

function formatInlineDuration(mins) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60),
            m = mins % 60;
        return m > 0 ? `"${h} h ${m} m"` : `"${h} h"`;
    }
    return `"${mins} m"`;
}

async function commitInlineSession() {
    if (!currentUser || !currentToken) {
        openGHAuthModal();
        return;
    }
    const newSession = {
        id: generateUUID(),
        date: dateToApple(new Date()),
        statePath: Array.from(
            { length: selectedInlineStage },
            (_, i) => i + 1,
        ),
        durationInMinutes: selectedInlineDuration,
    };
    rawSessions.push(newSession);
    showToast("Session committed! Syncing to GitHub…");
    await saveSessionsToGitHub(rawSessions);
}
window.commitInlineSession = commitInlineSession;

/* ============================================================
   Reflection Sheet Modal (Matching iOS App Design)
   ============================================================ */
function renderDepthSelectGrid() {
    const grid = document.getElementById("depthSelectGrid");
    grid.innerHTML = LIMBS.map(
        (l) => `
    <div class="depth-opt-card ${l.key === selectedStage ? "selected" : ""}" data-stage="${l.key}">
      <div class="depth-opt-num">${l.key}</div>
      <div>
        <div class="depth-opt-title">${l.name}</div>
        <div class="depth-opt-sub">${l.sub}</div>
      </div>
    </div>
  `,
    ).join("");

    grid.querySelectorAll(".depth-opt-card").forEach((card) => {
        card.addEventListener("click", () => {
            selectedStage = parseInt(card.dataset.stage);
            updateSheetStageView();
        });
    });
}

function updateSheetStageView() {
    renderDepthSelectGrid();
    const limb = LIMBS[selectedStage - 1];
    document.getElementById("depthSummaryTitle").textContent =
        `STAGE ${selectedStage}: ${limb.name} (${limb.sub})`;
    document.getElementById("depthSummaryDesc").innerHTML = `
    <div style="margin-bottom:4px;"><strong style="color:var(--accent-strong);">📜 Theory:</strong> ${limb.theory}</div>
    <div style="margin-bottom:4px;"><strong style="color:var(--text);">💡 What It Means:</strong> ${limb.meaning}</div>
    <div><strong style="color:var(--accent);">🧘 How a Sadhak Feels in Reality:</strong> "${limb.sadhakFeels}"</div>
  `;
}

function formatDuration(mins) {
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `"${h} h ${m} m"` : `"${h} h"`;
    }
    return `"${mins} m"`;
}

function openReflectionModal(sessionToEdit = null) {
    if (!currentUser && !currentToken) {
        openGHAuthModal();
        return;
    }

    const durationSlider = document.getElementById("durationSlider");
    const durationVal = document.getElementById("durationVal");

    if (sessionToEdit) {
        editingSessionId = sessionToEdit.id;
        selectedDuration = Math.round(
            sessionToEdit.durationInMinutes,
        );
        selectedStage = sessionToEdit.depth;
        document.getElementById(
            "reflectionModalTitle",
        ).textContent = "Edit Journey Entry";
        document.getElementById("commitReflectionBtn").textContent =
            "Update Entry";
        document.getElementById(
            "deleteReflectionBtn",
        ).style.display = "block";
    } else {
        editingSessionId = null;
        selectedDuration = selectedDuration || 15;
        selectedStage = 4;
        document.getElementById(
            "reflectionModalTitle",
        ).textContent = "Log Reflection";
        document.getElementById("commitReflectionBtn").textContent =
            "Commit to Journal";
        document.getElementById(
            "deleteReflectionBtn",
        ).style.display = "none";
    }

    durationSlider.value = Math.min(180, selectedDuration);
    durationVal.textContent = formatDuration(selectedDuration);
    updateSheetStageView();
    document.getElementById("reflectionOverlay").classList.add("open");
}

function closeReflectionModal() {
    document.getElementById("reflectionOverlay").classList.remove("open");
}

function initReflectionModal() {
    const durationSlider = document.getElementById("durationSlider");
    const durationVal = document.getElementById("durationVal");

    durationSlider.addEventListener("input", (e) => {
        selectedDuration = parseInt(e.target.value);
        durationVal.textContent = formatDuration(selectedDuration);
    });

    document
        .getElementById("customDurBtn")
        .addEventListener("click", () => {
            const val = prompt(
                "Enter duration in minutes:",
                selectedDuration,
            );
            if (val && !isNaN(val) && val > 0) {
                selectedDuration = parseInt(val);
                durationSlider.value = Math.min(180, selectedDuration);
                durationVal.textContent =
                    formatDuration(selectedDuration);
            }
        });

    document
        .getElementById("reflectionCancelBtn")
        .addEventListener("click", closeReflectionModal);

    const logReflBtnEl = document.getElementById("logReflectionBtn");
    if (logReflBtnEl)
        logReflBtnEl.addEventListener("click", () =>
            openReflectionModal(null),
        );

    const editLastBtnEl = document.getElementById("editLastBtn");
    if (editLastBtnEl)
        editLastBtnEl.addEventListener("click", () => {
            if (parsedSessions.length) {
                openReflectionModal(
                    parsedSessions[parsedSessions.length - 1],
                );
            } else {
                openReflectionModal(null);
            }
        });

    document
        .getElementById("sheetDepthInfoBtn")
        .addEventListener("click", () => openLimbsDetailModal());

    document
        .getElementById("commitReflectionBtn")
        .addEventListener("click", async () => {
            const statePathArray = Array.from(
                { length: selectedStage },
                (_, i) => i + 1,
            );

            if (editingSessionId) {
                const idx = rawSessions.findIndex(
                    (s) => s.id === editingSessionId,
                );
                if (idx !== -1) {
                    rawSessions[idx].durationInMinutes =
                        selectedDuration;
                    rawSessions[idx].statePath = statePathArray;
                }
            } else {
                const newSession = {
                    id: generateUUID(),
                    date: dateToApple(new Date()),
                    statePath: statePathArray,
                    durationInMinutes: selectedDuration,
                };
                rawSessions.push(newSession);
            }

            closeReflectionModal();
            await saveSessionsToGitHub(rawSessions);
        });

    document
        .getElementById("deleteReflectionBtn")
        .addEventListener("click", async () => {
            if (
                editingSessionId &&
                confirm(
                    "Are you sure you want to delete this meditation entry?",
                )
            ) {
                rawSessions = rawSessions.filter(
                    (s) => s.id !== editingSessionId,
                );
                closeReflectionModal();
                await saveSessionsToGitHub(rawSessions);
            }
        });
}

/* ============================================================
   Standard Info Modal & Controls
   ============================================================ */
function openModal(title, bodyHtml) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = bodyHtml;
    document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
    document.getElementById("modalOverlay").classList.remove("open");
}

function openLimbsDetailModal() {
    openModal(
        "Patanjali's 8 Limbs of Yoga",
        `
                    <div style="background: var(--bg-card-2); border: 1px solid var(--border-soft); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;">
                        <p style="font-size:0.84375rem; color:var(--text); line-height:1.6; margin:0 0 10px 0;">
                            Tracking sit time is fine, but <strong>depth means far more in meditation than time length</strong>. Patanjali's 8 Limbs serve as a subjective internal ruler for attention depth. Each limb includes its <strong>Theory</strong> (Sutra background), <strong>What It Means</strong> (practical definition), and <strong>How a Sadhak Feels in Reality</strong>.
                        </p>
                        <div style="font-size:0.8125rem; color:var(--text-dim); line-height:1.5; background:var(--accent-soft); border-left:3px solid var(--accent); padding:8px 12px; border-radius:4px;">
                            <strong style="color:var(--accent-strong);">Note:</strong> These are 8 limbs (interconnected branches of a single tree), not linear sequential stages—all limbs grow together in daily practice.
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:14px;">
                        ${LIMBS.map(
                            (l) => `
                            <div style="background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 12px; padding: 16px;">
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                    <div style="width:28px; height:28px; border-radius:50%; background:var(--accent-soft); color:var(--accent-strong); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.84375rem; flex-shrink:0;">${l.key}</div>
                                    <div>
                                        <div style="font-size:0.9375rem; font-weight:600; color:var(--text);">${l.name}</div>
                                        <div style="font-size:0.75rem; color:var(--text-faint); font-weight:400;">${l.sub}</div>
                                    </div>
                                </div>
                                <div style="font-size:0.8125rem; color:var(--text-dim); line-height:1.6; display:flex; flex-direction:column; gap:6px;">
                                    <div><strong style="color:var(--accent-strong);">📜 Theory:</strong> ${l.theory}</div>
                                    <div><strong style="color:var(--text);">💡 What It Means:</strong> ${l.meaning}</div>
                                    <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; margin-top:2px;">
                                        <strong style="color:var(--accent);">🧘 How a Sadhak Feels in Reality:</strong> "${l.sadhakFeels}"
                                    </div>
                                </div>
                            </div>
                        `,
                        ).join("")}
                    </div>
                    `,
    );
}
window.openLimbsDetailModal = openLimbsDetailModal;

function initInfoModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    document
        .getElementById("modalClose")
        .addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.getElementById("helpBtn").addEventListener("click", () => {
        openModal(
            "How This Site Works",
            `
    <p>Everything here is pulled straight from your meditation journal on GitHub. Every time a session is logged — its duration and the depth reached — it syncs to <code>sessions.json</code>, and this page reads that journal live.</p>
    <p>Depth isn't measured on a rigid ladder. It's the single highest point of stillness touched during a sit, scored against Patanjali's eight limbs.</p>
  `,
        );
    });

    const depthToggleBtn = document.getElementById("depthToggle");
    if (depthToggleBtn)
        depthToggleBtn.addEventListener("click", () =>
            openLimbsDetailModal(),
        );
}

/* ============================================================
   Tab Navigation
   ============================================================ */
function initTabs() {
    const btns = Array.from(document.querySelectorAll(".tab-btn"));
    const panels = {
        practice: document.getElementById("tabPanel-practice"),
        log: document.getElementById("tabPanel-log"),
        progress: document.getElementById("tabPanel-progress"),
        about: document.getElementById("tabPanel-about"),
    };
    function showTab(name, persist) {
        if (!panels[name]) return;
        Object.keys(panels).forEach((key) => {
            panels[key].classList.toggle("active", key === name);
        });
        btns.forEach((b) => {
            b.classList.toggle("active", b.dataset.tab === name);
        });
        window.scrollTo({
            top: 0,
            behavior: "instant" in window ? "instant" : "auto",
        });
        if (persist !== false) {
            try {
                localStorage.setItem("myzenActiveTab", name);
            } catch (e) {}
        }
    }
    btns.forEach((b) => {
        b.addEventListener("click", () => showTab(b.dataset.tab));
    });
    let initial = "practice";
    try {
        const saved = localStorage.getItem("myzenActiveTab");
        if (saved && panels[saved]) initial = saved;
    } catch (e) {}
    showTab(initial, false);
    window.myZenShowTab = showTab;
}

/* Theme Picker */
function initTheme() {
    const themeBtn = document.getElementById("themeBtn");
    const themePop = document.getElementById("themePop");
    const savedTheme = localStorage.getItem("myzen_theme") || "abyssal";

    document.documentElement.setAttribute("data-theme", savedTheme);
    themePop.querySelectorAll(".theme-opt").forEach((o) => {
        o.classList.toggle(
            "active",
            o.dataset.themeChoice === savedTheme,
        );
    });

    themeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        themePop.classList.toggle("open");
    });

    document.addEventListener("click", () => {
        themePop.classList.remove("open");
        const uPop = document.getElementById("userPop");
        if (uPop) uPop.classList.remove("open");
    });

    themePop.querySelectorAll(".theme-opt").forEach((opt) => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const t = opt.dataset.themeChoice;
            document.documentElement.setAttribute("data-theme", t);
            localStorage.setItem("myzen_theme", t);
            themePop
                .querySelectorAll(".theme-opt")
                .forEach((o) =>
                    o.classList.toggle("active", o === opt),
                );
            themePop.classList.remove("open");
            showToast(`Theme saved: ${opt.textContent.trim()}`);
        });
    });
}

/* Text Size */
function initTextSize() {
    const sizeSteps = ["16px", "18px", "20px"];
    let sizeIndex = 0;
    document.getElementById("sizeBtn").addEventListener("click", () => {
        sizeIndex = (sizeIndex + 1) % sizeSteps.length;
        document.documentElement.style.fontSize = sizeSteps[sizeIndex];
    });
}

/* ============================================================
   Rendering Dashboard Components
   ============================================================ */
function renderLimbGrid(peakDepth) {
    const grid = document.getElementById("limbGrid");
    if (!grid) return;
    grid.innerHTML = LIMBS.map(
        (l) => `
    <div class="limb-card ${peakDepth && l.key <= peakDepth ? "reached" : ""}">
      <div class="num">${l.key}</div>
      <div style="flex:1;">
        <div class="name">${l.name} <span style="font-size:0.75rem;color:var(--text-faint);font-weight:300;">— ${l.sub}</span></div>
        <div class="desc" style="margin-top:8px;line-height:1.6;">
          <div style="margin-bottom:5px;color:var(--text-dim);"><strong style="color:var(--accent-strong);">📜 Theory:</strong> ${l.theory}</div>
          <div style="margin-bottom:5px;color:var(--text);">💡 What It Means:</strong> ${l.meaning}</div>
          <div style="color:var(--text);"><strong style="color:var(--accent);">🧘 How a Sadhak Feels:</strong> "${l.sadhakFeels}"</div>
        </div>
      </div>
    </div>`,
    ).join("");
}

function renderEmpty() {
    const hoursEl = document.getElementById("statHours");
    const streakEl = document.getElementById("statStreak");
    const depthEl = document.getElementById("statDepth");
    const lsTitle = document.getElementById("lsTitle");
    const lsStage = document.getElementById("lsStage");
    const lsDate = document.getElementById("lsDate");

    if (hoursEl) hoursEl.textContent = "0";
    if (streakEl) streakEl.textContent = "0";
    if (depthEl) depthEl.textContent = "—";
    if (lsTitle) lsTitle.textContent = "No sessions yet";
    if (lsStage)
        lsStage.textContent = "The first dive is still ahead";
    if (lsDate) lsDate.textContent = "";

    renderCalendar([]);

    // Show demo preview: blurred sample rows + sign-in CTA
    document.getElementById("logHolder").innerHTML = `
                    <div style="position:relative;">
                        <table class="log-table" style="filter:blur(3.5px);opacity:0.45;pointer-events:none;user-select:none;">
                            <thead><tr><th>Date</th><th>Depth Reached</th><th>Duration</th></tr></thead>
                            <tbody>
                                <tr><td class="col-date">04 Aug 2026</td><td class="col-depth">6/8 &middot; Dharana</td><td>27 min</td></tr>
                                <tr><td class="col-date">03 Aug 2026</td><td class="col-depth">5/8 &middot; Pratyahara</td><td>45 min</td></tr>
                                <tr><td class="col-date">02 Aug 2026</td><td class="col-depth">7/8 &middot; Dhyana</td><td>30 min</td></tr>
                                <tr><td class="col-date">01 Aug 2026</td><td class="col-depth">4/8 &middot; Pranayama</td><td>20 min</td></tr>
                                <tr><td class="col-date">31 Jul 2026</td><td class="col-depth">5/8 &middot; Pratyahara</td><td>40 min</td></tr>
                                <tr><td class="col-date">30 Jul 2026</td><td class="col-depth">6/8 &middot; Dharana</td><td>25 min</td></tr>
                                <tr><td class="col-date">29 Jul 2026</td><td class="col-depth">3/8 &middot; Asana</td><td>15 min</td></tr>
                                <tr><td class="col-date">28 Jul 2026</td><td class="col-depth">5/8 &middot; Pratyahara</td><td>35 min</td></tr>
                            </tbody>
                        </table>
                        <div style="
                            position:absolute;inset:0;
                            display:flex;flex-direction:column;
                            align-items:center;justify-content:center;
                            gap:10px;
                            background: linear-gradient(to bottom, transparent 0%, var(--bg) 60%);
                        ">
                            <div style="font-size:1.5rem;">&#128274;</div>
                            <div style="font-size:0.84375rem;font-weight:500;color:var(--text);">
                                Your session log will appear here
                            </div>
                            <div style="font-size:0.78125rem;color:var(--text-dim);text-align:center;max-width:280px;line-height:1.5;">
                                Sign in with GitHub to load your personal journal and start logging.
                            </div>
                            <button
                                onclick="openGHAuthModal()"
                                style="
                                    margin-top:4px;
                                    padding:9px 22px;
                                    background:var(--accent-soft);
                                    border:1px solid var(--accent);
                                    color:var(--accent-strong);
                                    border-radius:10px;
                                    cursor:pointer;
                                    font-size:0.84375rem;
                                    font-weight:600;
                                    font-family:inherit;
                                    transition:all 0.2s;
                                "
                                onmouseover="this.style.background='var(--accent)';this.style.color='#0c120c';"
                                onmouseout="this.style.background='var(--accent-soft)';this.style.color='var(--accent-strong)';"
                            >Sign in with GitHub</button>
                        </div>
                    </div>`;
}

function render(sessions) {
    if (!sessions.length) {
        // Logged-in users with 0 sessions → friendly empty (not blurred demo)
        if (currentUser && currentToken) {
            renderLoggedInEmpty();
        } else {
            renderEmpty();
        }
        return;
    }
    renderStats(sessions);
    renderLastSession(sessions);
    renderCalendar(sessions);
    renderLog(sessions);
    const peak = Math.max(...sessions.map((s) => s.depth));
    renderLimbGrid(peak);
    updateShareButtonState();
}

function renderLoggedInEmpty() {
    const hoursEl = document.getElementById("statHours");
    const streakEl = document.getElementById("statStreak");
    const depthEl = document.getElementById("statDepth");
    const lsTitle = document.getElementById("lsTitle");
    const lsStage = document.getElementById("lsStage");
    const lsDate = document.getElementById("lsDate");

    if (hoursEl) hoursEl.textContent = "0";
    if (streakEl) streakEl.textContent = "0";
    if (depthEl) depthEl.textContent = "—";
    if (lsTitle) lsTitle.textContent = "No sessions yet";
    if (lsStage) lsStage.textContent = "Your first dive awaits";
    if (lsDate) lsDate.textContent = "";

    renderCalendar([]);
    renderLimbGrid(0);
    document.getElementById("logHolder").innerHTML = `
                    <div style="
                        display:flex;flex-direction:column;align-items:center;
                        justify-content:center;gap:14px;padding:48px 24px;
                        text-align:center;
                    ">
                        <div style="font-size:2.5rem;">🧘</div>
                        <div style="font-size:1rem;font-weight:600;color:var(--text);">
                            Welcome, @${escapeHtml(currentUser ? currentUser.login : "")}!
                        </div>
                        <div style="font-size:0.84375rem;color:var(--text-dim);max-width:280px;line-height:1.6;">
                            Your session journal is empty. Log your first meditation above
                            using the <strong>Commit to Journal</strong> button — it will be
                            saved to <code>${escapeHtml(currentUser ? currentUser.login : "")}/${escapeHtml(currentRepo)}/sessions.json</code> on GitHub.
                        </div>
                    </div>`;
    updateShareButtonState();
}

function renderStats(sessions) {
    const totalMinutes = sessions.reduce(
        (sum, s) => sum + s.durationInMinutes,
        0,
    );
    const hours = totalMinutes / 60;
    const hoursEl = document.getElementById("statHours");
    const streakEl = document.getElementById("statStreak");
    const depthEl = document.getElementById("statDepth");
    const deepest = Math.max(...sessions.map((s) => s.depth));
    if (hoursEl)
        hoursEl.textContent =
            hours >= 100 ? Math.round(hours) : hours.toFixed(1);
    if (streakEl) streakEl.textContent = computeStreak(sessions);
    if (depthEl) depthEl.textContent = deepest + "/" + MAX_DEPTH;
}

function dayKey(d) {
    return (
        d.getFullYear() +
        "-" +
        (d.getMonth() + 1) +
        "-" +
        d.getDate()
    );
}
function stripTime(d) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
}

function computeStreak(sessions) {
    const days = new Set(sessions.map((s) => dayKey(s.jsDate)));
    let streak = 0;
    let cursor = new Date();
    if (!days.has(dayKey(cursor))) {
        const lastSession = sessions[sessions.length - 1].jsDate;
        const diffDays = Math.floor(
            (stripTime(new Date()) - stripTime(lastSession)) /
                86400000,
        );
        if (diffDays > 1) return 0;
        cursor = lastSession;
    }
    while (days.has(dayKey(cursor))) {
        streak++;
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function updateShareButtonState() {
    const hasSessions =
        Array.isArray(parsedSessions) && parsedSessions.length > 0;
    const inlineShareBtn =
        document.getElementById("inlineShareBtn");
    const popoverShareBtn = document.getElementById("shareNowBtn");
    [inlineShareBtn, popoverShareBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = !hasSessions;
        btn.title = hasSessions
            ? "Generate a share card from your meditation progress"
            : "Log at least one session to share your progress";
    });
}

function escapeSvgText(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
}

function buildProgressShareData() {
    const sessions = Array.isArray(parsedSessions)
        ? parsedSessions
        : [];
    const totalMinutes = sessions.reduce(
        (sum, s) => sum + s.durationInMinutes,
        0,
    );
    const totalHours = totalMinutes / 60;
    const streak = sessions.length ? computeStreak(sessions) : 0;
    const deepest = sessions.length
        ? Math.max(...sessions.map((s) => s.depth))
        : 0;
    const latest = sessions.length
        ? sessions[sessions.length - 1]
        : null;
    return {
        sessions,
        totalMinutes,
        totalHours,
        streak,
        deepest,
        latest,
    };
}

function getShareTheme() {
    const themeName =
        document.documentElement.getAttribute("data-theme") ||
        "abyssal";
    const root = getComputedStyle(document.documentElement);
    const paletteByTheme = {
        abyssal: {
            bgTop: "#171c29",
            bgBottom: "#0a0d14",
        },
        forest: {
            bgTop: "#243029",
            bgBottom: "#0f1714",
        },
        cocoa: {
            bgTop: "#261c17",
            bgBottom: "#140d0a",
        },
        dark: {
            bgTop: "#050505",
            bgBottom: "#000000",
        },
        light: {
            bgTop: "#f5f4f0",
            bgBottom: "#e8e5da",
        },
    };
    const palette =
        paletteByTheme[themeName] || paletteByTheme.abyssal;
    return {
        bgTop: palette.bgTop,
        bgBottom: palette.bgBottom,
        panel: "rgba(0,0,0,0.32)",
        border: (
            root.getPropertyValue("--border") ||
            "rgba(255,255,255,0.14)"
        ).trim(),
        borderSoft: (
            root.getPropertyValue("--border-soft") ||
            "rgba(255,255,255,0.08)"
        ).trim(),
        text: (root.getPropertyValue("--text") || "#eef1f5").trim(),
        textDim: (
            root.getPropertyValue("--text-dim") || "#a8b4c4"
        ).trim(),
        textFaint: (
            root.getPropertyValue("--text-faint") || "#7a8898"
        ).trim(),
        accent: (
            root.getPropertyValue("--accent") || "#7ed3bf"
        ).trim(),
        accentStrong: (
            root.getPropertyValue("--accent-strong") || "#a3e6d4"
        ).trim(),
    };
}

function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
    roundRectPath(ctx, x, y, w, h, r);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
}

function drawTrackedText(ctx, text, x, y, letterSpacing = 0) {
    const chars = Array.from(String(text));
    if (!letterSpacing) {
        ctx.fillText(text, x, y);
        return;
    }
    const totalWidth =
        chars.reduce(
            (sum, ch) => sum + ctx.measureText(ch).width,
            0,
        ) +
        letterSpacing * Math.max(0, chars.length - 1);
    const prevAlign = ctx.textAlign;
    let startX = x;
    if (prevAlign === "center") {
        startX = x - totalWidth / 2;
    } else if (prevAlign === "right") {
        startX = x - totalWidth;
    }
    ctx.textAlign = "left";
    let cursor = startX;
    for (const ch of chars) {
        ctx.fillText(ch, cursor, y);
        cursor += ctx.measureText(ch).width + letterSpacing;
    }
    ctx.textAlign = prevAlign;
}

function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function drawCenteredLines(
    ctx,
    lines,
    centerX,
    startY,
    lineHeight,
) {
    lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
    });
}

function getShareInnerSelfDepthLabel(level) {
    switch (level) {
        case 1:
            return "Experienced total social ease, empty of grudges, filled with kindness for all.";
        case 2:
            return "Touched a state of clarity; feeling balanced, clean, and ready for silence.";
        case 3:
            return "Settled into a perfectly still and easy posture.";
        case 4:
            return "Breath slowed down, bringing the nervous system to total ease.";
        case 5:
            return "Starting to withdraw from surroundings, where the external world faded away into inner space.";
        case 6:
            return "Saw mind achieving focus on one point, also ocassions of drifting away with thoughts";
        case 7:
            return "Entered a deep, effortless meditative flow where focus streamed automatically.";
        case 8:
            return "Finally touched absolute oneness, where individual boundaries completely melted away.";
        default:
            return "";
    }
}

async function renderProgressShareCanvasIos(data) {
    const width = 420;
    const height = 420;
    const scale = 4;
    const theme = getShareTheme();
    const latest = data.latest;
    const latestLimb = latest
        ? LIMBS[(latest.depth || 1) - 1] || LIMBS[0]
        : LIMBS[0];
    const latestDate = latest
        ? latest.jsDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "No session yet";
    const latestTime = latest
        ? `${Math.trunc(latest.durationInMinutes)} mins`
        : "-";
    const stageLabel = latest
        ? `STAGE ${latest.depth}: ${latestLimb.name}`
        : "NO SESSION YET";
    const quoteText = latest
        ? `"${getShareInnerSelfDepthLabel(latest.depth)}"`
        : "A quiet sit is still a meaningful sit.";
    const shareTeal = "#73b8b3";
    const shareHeaderName = "MyZen Web";
    const shareHeaderUser = currentUser
        ? `@${currentUser.login}`
        : "@myzen";

    await (document.fonts?.ready || Promise.resolve());

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.scale(scale, scale);
    ctx.textBaseline = "alphabetic";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.textAlign = "center";

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, theme.bgTop);
    bgGrad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const alpha = (value) =>
        `${Math.round(Math.max(0, Math.min(1, value)) * 255)
            .toString(16)
            .padStart(2, "00")}`;
    const ink = theme.text;

    ctx.save();
    ctx.translate(0, 40);
    {
        const geoW = width;
        const geoH = 120;
        const centerX = geoW * 0.5;
        const treeScaleWidth = Math.min(geoW, geoH * 1.15);
        const ax = (fraction) =>
            centerX + (fraction - 0.5) * treeScaleWidth;

        ctx.strokeStyle = `${ink}${alpha(0.4)}`;
        ctx.lineWidth = 1.15;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(40, geoH * 0.83);
        ctx.quadraticCurveTo(
            geoW * 0.5,
            geoH * 0.79,
            geoW - 40,
            geoH * 0.85,
        );
        ctx.stroke();

        ctx.strokeStyle = `${ink}${alpha(0.75)}`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(ax(0.5), geoH * 0.8);
        ctx.bezierCurveTo(
            ax(0.49),
            geoH * 0.69,
            ax(0.47),
            geoH * 0.56,
            ax(0.5),
            geoH * 0.45,
        );
        ctx.lineTo(ax(0.56), geoH * 0.41);
        ctx.moveTo(ax(0.5), geoH * 0.45);
        ctx.lineTo(ax(0.45), geoH * 0.39);
        ctx.moveTo(ax(0.53), geoH * 0.8);
        ctx.bezierCurveTo(
            ax(0.53),
            geoH * 0.69,
            ax(0.52),
            geoH * 0.56,
            ax(0.51),
            geoH * 0.48,
        );
        ctx.moveTo(ax(0.5), geoH * 0.76);
        ctx.lineTo(ax(0.49), geoH * 0.56);
        ctx.stroke();

        const canopy = [
            [-28, -20, 13, 0.35],
            [-16, -30, 13, 0.32],
            [0, -29, 14, 0.38],
            [16, -29, 13, 0.32],
            [30, -18, 13, 0.34],
            [-40, -6, 12, 0.34],
            [-20, -7, 13, 0.3],
            [0, -7, 14, 0.28],
            [21, -7, 13, 0.3],
        ];
        canopy.forEach(([dx, dy, r, op]) => {
            ctx.strokeStyle = `${ink}${alpha(op)}`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.arc(
                ax(0.49) + dx,
                geoH * 0.44 + dy,
                r,
                0,
                Math.PI * 2,
            );
            ctx.stroke();
        });

        for (let idx = 0; idx < 6; idx++) {
            ctx.strokeStyle = `${ink}${alpha(0.42)}`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            const driftX = ax(0.68) + idx * 6;
            const driftY = geoH * 0.32 + (idx % 2) * 7;
            ctx.moveTo(driftX, driftY);
            ctx.quadraticCurveTo(
                driftX + 1.2,
                driftY - 3,
                driftX + 2.5,
                driftY - 2,
            );
            ctx.stroke();
        }
    }
    ctx.restore();

    const shareFont =
        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = `700 11px ${shareFont}`;
    ctx.fillText(shareHeaderName, 28, 28);
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.font = `300 9px ${shareFont}`;
    ctx.fillText(shareHeaderUser, 28, 42);
    ctx.restore();

    ctx.fillStyle = shareTeal;
    ctx.font = `700 10px ${shareFont}`;
    drawTrackedText(
        ctx,
        "TODAY'S MEDITATION QUALITY",
        210,
        175,
        3.0,
    );
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `300 10px ${shareFont}`;
    drawTrackedText(
        ctx,
        "DEPTH & ALIGNMENT PROFILE",
        210,
        191,
        2.0,
    );

    drawRoundedRect(
        ctx,
        24,
        214,
        372,
        156,
        16,
        theme.panel,
        "rgba(255,255,255,0.08)",
    );

    ctx.fillStyle = "rgba(255,255,255,0.98)";
    ctx.font = `240 56px ${shareFont}`;
    ctx.fillText(String("∞"), 210, 274);

    ctx.fillStyle = shareTeal;
    ctx.font = `700 11px ${shareFont}`;
    drawTrackedText(ctx, stageLabel, 210, 289, 2.2);
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = `600 8px ${shareFont}`;
    drawTrackedText(ctx, "MAXIMUM DEPTH ACHIEVED", 210, 303, 1.2);
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.font = `500 8px ${shareFont}`;
    drawTrackedText(
        ctx,
        "AS PER PATANJALI'S 8 LIMBS",
        210,
        316,
        1.1,
    );

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(58, 329);
    ctx.lineTo(362, 329);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = `600 8px ${shareFont}`;
    drawTrackedText(ctx, "DURATION", 150, 347, 1.0);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `300 13px ${shareFont}`;
    ctx.fillText(`"${latestTime}"`, 150, 364);

    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = `600 8px ${shareFont}`;
    drawTrackedText(ctx, "DATE", 270, 347, 1.0);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `300 13px ${shareFont}`;
    ctx.fillText(latestDate, 270, 364);

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `italic 300 11px ${shareFont}`;
    const quoteLines = wrapText(ctx, quoteText, 306);
    drawCenteredLines(ctx, quoteLines.slice(0, 3), 210, 391, 13);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("PNG export failed"));
        }, "image/png");
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareProgressCard() {
    if (
        !Array.isArray(parsedSessions) ||
        parsedSessions.length === 0
    ) {
        showToast("Log at least one session before sharing.");
        return;
    }

    const data = buildProgressShareData();
    const filename = `myzen-progress-${dayKey(new Date())}.png`;
    const caption = `MyZen meditation progress: ${data.totalHours >= 100 ? Math.round(data.totalHours) : data.totalHours.toFixed(1)} total hours, ${data.streak} day streak, peak depth ${data.deepest}/${MAX_DEPTH}. Measured with Patanjali's 8 Limbs.`;

    try {
        const pngBlob = await renderProgressShareCanvasIos(data);
        const file = new File([pngBlob], filename, {
            type: "image/png",
        });
        if (
            navigator.share &&
            (!navigator.canShare ||
                navigator.canShare({ files: [file] }))
        ) {
            try {
                await navigator.share({
                    title: "MyZen Progress Card",
                    text: caption,
                    files: [file],
                });
                showToast("Progress card ready to share.");
                return;
            } catch (err) {
                if (err && err.name === "AbortError") return;
            }
        }

        downloadBlob(pngBlob, filename);
        try {
            await navigator.clipboard.writeText(
                `${caption} ${location.href}`,
            );
            showToast("Card downloaded and caption copied.");
        } catch (_) {
            showToast("Card downloaded.");
        }
    } catch (err) {
        console.error("Share card generation failed:", err);
        showToast("Could not create the share card right now.");
    }
}
window.shareProgressCard = shareProgressCard;

function renderLastSession(sessions) {
    if (!sessions || sessions.length === 0) return;
    const last = sessions[sessions.length - 1];
    const limb = LIMBS[(last.depth || 1) - 1] || LIMBS[0];
    const dateStr = last.jsDate
        ? last.jsDate.toLocaleString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : "";

    // Populate hidden compatibility divs (used by other parts of the page)
    const lsTitle = document.getElementById("lsTitle");
    const lsStage = document.getElementById("lsStage");
    const lsDate = document.getElementById("lsDate");
    if (lsTitle)
        lsTitle.textContent = `"${last.durationInMinutes} Minute Session"`;
    if (lsStage)
        lsStage.textContent = `Stage ${last.depth}: ${limb.name}`;
    if (lsDate) lsDate.textContent = dateStr;

    // Build the last-session card inside the holder
    const holder = document.getElementById("lastSessionHolder");
    if (!holder) return;
    holder.innerHTML = `
                    <div class="depth-circle">
                        <span class="n">${last.depth || "—"}</span>
                        <span class="of">/${MAX_DEPTH}</span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:0.95rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${last.durationInMinutes} min · ${escapeHtml(limb.name)}
                        </div>
                        <div style="font-size:0.78rem;color:var(--text-dim);margin-top:2px;">${dateStr}</div>
                    </div>`;
}

function renderCalendar(sessions) {
    const minutesByDay = {};
    sessions.forEach((s) => {
        const k = dayKey(s.jsDate);
        minutesByDay[k] =
            (minutesByDay[k] || 0) + s.durationInMinutes;
    });
    const today = stripTime(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - 167);
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    const maxMin = Math.max(1, ...Object.values(minutesByDay));
    const grid = document.getElementById("calGrid");
    grid.innerHTML = "";
    let cursor = new Date(start);
    while (cursor <= today) {
        const k = dayKey(cursor);
        const mins = minutesByDay[k] || 0;
        const cell = document.createElement("div");
        cell.className = "cal-cell";
        cell.title =
            cursor.toDateString() +
            (mins ? ` — ${mins} min` : " — no session");
        if (mins > 0) {
            const t = Math.min(1, mins / maxMin);
            const alpha = 0.2 + t * 0.8;
            cell.style.background = `var(--accent)`;
            cell.style.opacity = alpha.toFixed(2);
            cell.style.borderColor = "var(--accent)";
        }
        grid.appendChild(cell);
        cursor.setDate(cursor.getDate() + 1);
    }
}

function renderLog(sessions) {
    const showActions = currentUser && currentToken;
    const rows = [...sessions]
        .reverse()
        .slice(0, 10)
        .map((s) => {
            const safeId = sanitizeId(s.id);
            const safeDepth = validateDepth(s.depth);
            const safeDur = validatePositiveInt(
                s.durationInMinutes,
                1,
            );
            const limbName = escapeHtml(
                LIMBS[safeDepth - 1]?.name || "",
            );
            const dateStr = escapeHtml(
                s.jsDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
            );
            return `
    <tr>
      <td class="col-date">${dateStr}</td>
      <td class="col-depth">${safeDepth}/${MAX_DEPTH} &middot; ${limbName}</td>
      <td>${safeDur} min</td>
      ${
          showActions
              ? `
        <td style="text-align:right;">
          <button class="table-act-btn edit-row-btn" data-id="${escapeHtml(safeId)}" title="Edit session">✏️</button>
          <button class="table-act-btn table-del-btn del-row-btn" data-id="${escapeHtml(safeId)}" title="Delete session">🗑️</button>
        </td>`
              : ""
      }
    </tr>`;
        })
        .join("");

    document.getElementById("logHolder").innerHTML = `
    <table class="log-table">
      <thead><tr><th>Date</th><th>Depth Reached</th><th>Duration</th>${showActions ? '<th style="text-align:right;">Actions</th>' : ""}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    if (showActions) {
        document
            .querySelectorAll(".edit-row-btn")
            .forEach((btn) => {
                btn.addEventListener("click", () => {
                    const safeId = sanitizeId(btn.dataset.id);
                    const s = parsedSessions.find(
                        (item) => sanitizeId(item.id) === safeId,
                    );
                    if (s) openReflectionModal(s);
                });
            });
        document.querySelectorAll(".del-row-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (confirm("Delete this meditation entry?")) {
                    const safeId = sanitizeId(btn.dataset.id);
                    rawSessions = rawSessions.filter(
                        (item) => sanitizeId(item.id) !== safeId,
                    );
                    await saveSessionsToGitHub(rawSessions);
                }
            });
        });
    }
}

/* ============================================================
   Main Entry Point — DOMContentLoaded
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    // Apply saved theme early (before tabs load) to avoid flash
    const savedTheme = localStorage.getItem("myzen_theme") || "abyssal";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Load all 4 tab HTML partials into their placeholder containers
    await loadTabContents();

    // Now that all DOM nodes exist, initialize everything
    initTabs();
    initTheme();
    initTextSize();
    initInfoModal();
    initGHAuthModal();
    initBreathingPacer();
    initReflectionModal();
    initInlineWidget();

    // Initialize — loadSessions() is called inside initAuth() after auth settles
    await initAuth();
});
