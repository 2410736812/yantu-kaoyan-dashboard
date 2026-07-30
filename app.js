(() => {
  "use strict";

  const STORAGE_KEY = "yantu-kaoyan-dashboard-v2";
  const SCHEMA_VERSION = 2;
  const PROGRAM_START = "2026-07-30";
  const SUBJECTS = {
    math: { name: "数学二", short: "数学", color: "#087f6f" },
    english: { name: "英语一", short: "英语", color: "#376d82" },
    politics: { name: "政治", short: "政治", color: "#b54f3e" },
    material: { name: "材料物理化学", short: "专业课", color: "#b97819" },
    general: { name: "综合", short: "综合", color: "#766681" }
  };
  const EXAM_SUBJECTS = ["math", "english", "politics", "material"];
  const PHASES = [
    {
      start: "2026-07-29",
      end: "2026-08-03",
      range: "7.29–8.03",
      title: "启动诊断",
      detail: "稳住 2–3 小时，完成资料与基线测试"
    },
    {
      start: "2026-08-04",
      end: "2026-08-31",
      range: "8 月",
      title: "基础成型",
      detail: "高数基础收口，线代启动，846 建立框架"
    },
    {
      start: "2026-09-01",
      end: "2026-09-30",
      range: "9 月",
      title: "一轮闭环",
      detail: "四科完成首轮，开始稳定限时训练"
    },
    {
      start: "2026-10-01",
      end: "2026-10-31",
      range: "10 月",
      title: "强化真题",
      detail: "真题主导，按错因回补薄弱章节"
    },
    {
      start: "2026-11-01",
      end: "2026-12-18",
      range: "11 月–考前",
      title: "模拟冲刺",
      detail: "整套模拟、背诵回炉与作息定型"
    }
  ];

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const asNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const integer = (value, fallback = 0) => Math.max(0, Math.round(asNumber(value, fallback)));
  function validDateKey(value) {
    const text = String(value || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const [year, month, day] = text.split("-").map(Number);
    if (year < 2000 || year > 2100) return false;
    const parsed = new Date(year, month - 1, day, 12);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDays(key, amount) {
    const date = parseLocalDate(key);
    date.setDate(date.getDate() + amount);
    return localDateKey(date);
  }

  function monthKeyDate(key) {
    const date = parseLocalDate(key);
    return new Date(date.getFullYear(), date.getMonth(), 1, 12);
  }

  function dateDiff(fromKey, toKey) {
    const milliseconds = parseLocalDate(toKey) - parseLocalDate(fromKey);
    return Math.round(milliseconds / 86400000);
  }

  function displayDate(key, includeYear = false) {
    const date = parseLocalDate(key);
    return `${includeYear ? `${date.getFullYear()} 年 ` : ""}${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  function weekdayText(key) {
    return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][parseLocalDate(key).getDay()];
  }

  function relativeDayLabel(key) {
    const difference = dateDiff(localDateKey(), key);
    if (difference === 0) return `今天 · ${weekdayText(key)}`;
    if (difference === 1) return `明天 · ${weekdayText(key)}`;
    if (difference === -1) return `昨天 · ${weekdayText(key)}`;
    return weekdayText(key);
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function seededTasks() {
    return {
      "2026-07-30": [
        {
          id: "seed-0730-math",
          subject: "math",
          title: "高数基础 · 第五章推进",
          detail: "完成当天讲义与例题，独立重做卡住的题并写一句错因",
          plannedMinutes: 90,
          done: false,
          createdAt: "2026-07-29T20:00:00+08:00"
        },
        {
          id: "seed-0730-english",
          subject: "english",
          title: "英语基线 · 核心词汇与长难句",
          detail: "30 个核心词复习，精拆 2 个长难句",
          plannedMinutes: 35,
          done: false,
          createdAt: "2026-07-29T20:00:00+08:00"
        },
        {
          id: "seed-0730-material",
          subject: "material",
          title: "846 资料盘点与目录搭建",
          detail: "列出参考书、考试大纲、真题来源及缺口，不追求当天学完",
          plannedMinutes: 25,
          done: false,
          createdAt: "2026-07-29T20:00:00+08:00"
        },
        {
          id: "seed-0730-review",
          subject: "general",
          title: "晚间复盘与明日收口",
          detail: "23:00 前完成打卡，只确定明天最重要的三件事",
          plannedMinutes: 10,
          done: false,
          createdAt: "2026-07-29T20:00:00+08:00"
        }
      ]
    };
  }

  function createDefaultState(withSeed = true) {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: {
        targetSchool: "清华大学深圳国际研究生院",
        targetProgram: "功能材料与器件",
        examDate: "2026-12-19",
        targetScores: { english: 65, politics: 65, math: 135, material: 135 },
        progress: { math: 28, english: 8, politics: 0, material: 5 }
      },
      tasks: withSeed ? seededTasks() : {},
      logs: {},
      drafts: {},
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastBackupAt: null
      }
    };
  }

  function sanitizeTask(task) {
    if (!task || typeof task !== "object") return null;
    const title = String(task.title || "").trim().slice(0, 60);
    if (!title) return null;
    const subject = Object.prototype.hasOwnProperty.call(SUBJECTS, task.subject) ? task.subject : "general";
    return {
      id: String(task.id || uid()),
      subject,
      title,
      detail: String(task.detail || "").trim().slice(0, 180),
      plannedMinutes: clamp(integer(task.plannedMinutes, 30), 5, 720),
      done: Boolean(task.done),
      createdAt: String(task.createdAt || new Date().toISOString()),
      completedAt: task.completedAt ? String(task.completedAt) : null
    };
  }

  function sanitizeStudyEntry(entry) {
    return {
      minutes: clamp(integer(entry?.minutes, 0), 0, 1440),
      content: String(entry?.content || "").slice(0, 300)
    };
  }

  function sanitizeMetrics(metrics) {
    return {
      mathCorrect: integer(metrics?.mathCorrect),
      mathTotal: integer(metrics?.mathTotal),
      materialCorrect: integer(metrics?.materialCorrect),
      materialTotal: integer(metrics?.materialTotal),
      englishCorrect: integer(metrics?.englishCorrect),
      englishTotal: integer(metrics?.englishTotal),
      politicsTotal: integer(metrics?.politicsTotal)
    };
  }

  function sanitizeLog(log, isDraft = false) {
    if (!log || typeof log !== "object") return null;
    const subjects = {};
    EXAM_SUBJECTS.forEach((subject) => {
      subjects[subject] = sanitizeStudyEntry(log.subjects?.[subject]);
    });
    return {
      sleepStart: String(log.sleepStart || "").slice(0, 5),
      wakeTime: String(log.wakeTime || "").slice(0, 5),
      screenHours: clamp(asNumber(log.screenHours, 0), 0, 24),
      screenRecorded: Boolean(log.screenRecorded ?? (log.screenHours !== "" && log.screenHours != null)),
      subjects,
      metrics: sanitizeMetrics(log.metrics),
      unfinishedReason: String(log.unfinishedReason || "").slice(0, 500),
      note: String(log.note || "").slice(0, 500),
      updatedAt: String(log.updatedAt || new Date().toISOString()),
      ...(isDraft ? { draft: true } : {})
    };
  }

  function sanitizeState(candidate, withSeed = false) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("数据文件不是有效的看板备份");
    }
    const base = createDefaultState(withSeed);
    const settings = candidate.settings && typeof candidate.settings === "object" ? candidate.settings : {};
    const scores = settings.targetScores && typeof settings.targetScores === "object" ? settings.targetScores : {};
    const progress = settings.progress && typeof settings.progress === "object" ? settings.progress : {};

    base.settings.targetSchool = String(settings.targetSchool || base.settings.targetSchool).slice(0, 80);
    base.settings.targetProgram = String(settings.targetProgram || base.settings.targetProgram).slice(0, 80);
    base.settings.examDate = validDateKey(settings.examDate) ? settings.examDate : base.settings.examDate;
    base.settings.targetScores = {
      english: clamp(integer(scores.english, base.settings.targetScores.english), 0, 100),
      politics: clamp(integer(scores.politics, base.settings.targetScores.politics), 0, 100),
      math: clamp(integer(scores.math, base.settings.targetScores.math), 0, 150),
      material: clamp(integer(scores.material, base.settings.targetScores.material), 0, 150)
    };
    base.settings.progress = {
      math: clamp(integer(progress.math, base.settings.progress.math), 0, 100),
      english: clamp(integer(progress.english, base.settings.progress.english), 0, 100),
      politics: clamp(integer(progress.politics, base.settings.progress.politics), 0, 100),
      material: clamp(integer(progress.material, base.settings.progress.material), 0, 100)
    };

    base.tasks = {};
    if (candidate.tasks && typeof candidate.tasks === "object" && !Array.isArray(candidate.tasks)) {
      Object.entries(candidate.tasks).forEach(([date, tasks]) => {
        if (!validDateKey(date) || !Array.isArray(tasks)) return;
        base.tasks[date] = tasks.map(sanitizeTask).filter(Boolean).slice(0, 100);
      });
    }

    base.logs = {};
    if (candidate.logs && typeof candidate.logs === "object" && !Array.isArray(candidate.logs)) {
      Object.entries(candidate.logs).forEach(([date, log]) => {
        if (!validDateKey(date)) return;
        const sanitized = sanitizeLog(log, false);
        if (sanitized) base.logs[date] = sanitized;
      });
    }

    base.drafts = {};
    if (candidate.drafts && typeof candidate.drafts === "object" && !Array.isArray(candidate.drafts)) {
      Object.entries(candidate.drafts).forEach(([date, log]) => {
        if (!validDateKey(date)) return;
        const sanitized = sanitizeLog(log, true);
        if (sanitized) base.drafts[date] = sanitized;
      });
    }

    base.schemaVersion = SCHEMA_VERSION;
    base.meta = {
      createdAt: String(candidate.meta?.createdAt || base.meta.createdAt),
      updatedAt: String(candidate.meta?.updatedAt || base.meta.updatedAt),
      lastBackupAt: candidate.meta?.lastBackupAt ? String(candidate.meta.lastBackupAt) : null
    };
    return base;
  }

  let storageRecovered = false;
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState(true);
      return sanitizeState(JSON.parse(raw), false);
    } catch (error) {
      storageRecovered = true;
      return createDefaultState(true);
    }
  }

  let state = loadState();
  let selectedDate = localDateKey() < PROGRAM_START ? PROGRAM_START : localDateKey();
  let calendarDate = monthKeyDate(selectedDate);
  let calendarSelectedDate = selectedDate;
  let activeTab = "today";
  let toastTimer = 0;
  let draftTimer = 0;
  let formHasPendingDraft = false;
  let deferredInstallPrompt = null;
  const FOCUS_TIMER_KEY = "yantu-kaoyan-focus-timer-v1";
  let focusSeconds = 25 * 60;
  let focusInitialSeconds = 25 * 60;
  let focusEndAt = 0;
  let focusInterval = 0;
  let focusRunning = false;
  let focusDate = selectedDate;

  function saveState() {
    state.meta.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (!syncApplyingRemote) supabaseSync.queuePush();
      return true;
    } catch (error) {
      showToast("浏览器未能保存数据，请先导出备份并检查存储权限");
      return false;
    }
  }

  /*
   * Optional Supabase adapter. Local storage remains the source of truth while
   * offline; a signed-in user gets one RLS-protected row containing the same
   * sanitized state. The adapter is deliberately isolated from render logic so
   * a missing CDN, project, table, or network never breaks the dashboard.
   */
  const SUPABASE_CONFIG_KEY = "yantu-kaoyan-supabase-config-v1";
  const SUPABASE_SYNC_MARKER_KEY = "yantu-kaoyan-supabase-sync-marker-v1";
  const SUPABASE_LOCAL_BACKUP_KEY = "yantu-kaoyan-supabase-pre-sync-backup-v1";
  const SUPABASE_TABLE = "study_states";
  let syncApplyingRemote = false;
  const supabaseSync = (() => {
    let client = null;
    let currentUser = null;
    let config = null;
    let channel = null;
    let authSubscription = null;
    let pushTimer = 0;
    let pollTimer = 0;
    let pushQueued = false;
    let conflict = null;
    let visual = { text: "仅此设备", kind: "local" };

    function readConfig() {
      try {
        const parsed = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || "null");
        if (!parsed || typeof parsed !== "object") return null;
        const url = String(parsed.url || "").trim().replace(/\/$/, "");
        const anonKey = String(parsed.anonKey || "").trim();
        if (!/^https:\/\/[^\s]+$/i.test(url) || anonKey.length < 20) return null;
        return { url, anonKey };
      } catch (error) {
        return null;
      }
    }

    function saveConfig(nextConfig) {
      config = nextConfig;
      try {
        localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(nextConfig));
      } catch (error) {
        // Configuration is optional; a storage failure must not block local use.
      }
    }

    function errorText(error) {
      return String(error?.message || error?.error_description || error || "未知错误").slice(0, 180);
    }

    function timestamp(value) {
      const parsed = Date.parse(value || "");
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function setVisual(text, kind = "local") {
      visual = { text, kind };
      const status = $("#syncStatus");
      if (status) {
        status.textContent = text;
        status.dataset.kind = kind;
      }
      const connection = $("#connectionState");
      if (connection) {
        connection.className = `connection-state ${kind}`;
        connection.innerHTML = "<i></i>";
        connection.append(document.createTextNode(text));
      }
      const badge = $("#storageBadge");
      if (badge) {
        badge.classList.remove("local", "pending", "synced", "error");
        badge.classList.add(kind);
        const label = badge.lastElementChild;
        if (label) label.textContent = text;
      }
      const signOut = $("#syncSignOutButton");
      if (signOut) signOut.hidden = !currentUser;
      renderConflict();
    }

    function render() {
      const urlInput = $("#syncProjectUrl");
      const keyInput = $("#syncAnonKey");
      const emailInput = $("#syncEmail");
      if (urlInput && config) urlInput.value = config.url;
      if (keyInput && config) keyInput.value = config.anonKey;
      if (emailInput && currentUser?.email) emailInput.value = currentUser.email;
      setVisual(visual.text, visual.kind);
    }

    function readSyncMarker() {
      try {
        const marker = JSON.parse(localStorage.getItem(SUPABASE_SYNC_MARKER_KEY) || "null");
        return marker?.userId === currentUser?.id ? marker : null;
      } catch (error) {
        return null;
      }
    }

    function writeSyncMarker(updatedAt) {
      try {
        localStorage.setItem(SUPABASE_SYNC_MARKER_KEY, JSON.stringify({ updatedAt, userId: currentUser?.id || "" }));
      } catch (error) {
        // The marker is only a conflict hint; cloud sync can continue without it.
      }
    }

    function hasMeaningfulLocalState() {
      const baseline = sanitizeState(createDefaultState(true), false);
      const hasLogs = Object.keys(state.logs || {}).length > 0 || Object.keys(state.drafts || {}).length > 0;
      const hasChangedTask = Object.entries(state.tasks || {}).some(([date, tasks]) => tasks.some((task) => {
        const seeded = baseline.tasks[date]?.find((item) => item.id === task.id);
        return !seeded || JSON.stringify(task) !== JSON.stringify(seeded);
      }));
      const settings = state.settings || {};
      const baselineSettings = baseline.settings;
      const settingsChanged = settings.targetSchool !== baselineSettings.targetSchool
        || settings.targetProgram !== baselineSettings.targetProgram
        || settings.examDate !== baselineSettings.examDate
        || JSON.stringify(settings.targetScores) !== JSON.stringify(baselineSettings.targetScores)
        || JSON.stringify(settings.progress) !== JSON.stringify(baselineSettings.progress);
      return hasLogs || hasChangedTask || settingsChanged || Boolean(state.meta?.lastBackupAt);
    }

    function localAndRemoteChangedSinceLastSync(remoteTime) {
      const marker = readSyncMarker();
      if (!marker) return hasMeaningfulLocalState();
      const markerTime = timestamp(marker.updatedAt);
      const localTime = timestamp(state.meta?.updatedAt);
      return localTime > markerTime && remoteTime > markerTime;
    }

    function renderConflict() {
      const box = $("#syncConflict");
      if (!box) return;
      box.hidden = !conflict;
      const text = $("#syncConflictText");
      if (text && conflict) text.textContent = conflict.message;
    }

    function showConflict(remote, local, remoteUpdatedAt) {
      conflict = { remote, local, remoteUpdatedAt, message: "本机已有学习记录，云端也有一份数据。请先选择保留哪一份，避免静默覆盖。" };
      try {
        localStorage.setItem(SUPABASE_LOCAL_BACKUP_KEY, JSON.stringify(local));
      } catch (error) {
        // Keep the in-memory conflict even if the backup cannot be written.
      }
      setVisual("需要选择同步版本", "error");
    }

    function clearConflict() {
      conflict = null;
      renderConflict();
    }

    async function useCloudVersion() {
      if (!conflict) return;
      applyRemote(conflict.remote);
      setVisual("已选择云端版本", "synced");
    }

    async function keepLocalVersion() {
      if (!conflict) return;
      const local = conflict.local;
      clearConflict();
      state = sanitizeState(local, false);
      state.meta.updatedAt = new Date().toISOString();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* cloud copy remains available */ }
      renderEverything();
      pushQueued = true;
      if (await pushNow(true)) setVisual("本机版本已上传", "synced");
    }

    function startPolling() {
      if (pollTimer || !currentUser) return;
      pollTimer = window.setInterval(() => {
        if (document.visibilityState === "visible" && !conflict) pullOrPush().catch(() => undefined);
      }, 60000);
    }

    function stopPolling() {
      window.clearInterval(pollTimer);
      pollTimer = 0;
    }

    function snapshot() {
      return sanitizeState(state, false);
    }

    async function removeChannel() {
      if (!client || !channel) return;
      try {
        await client.removeChannel(channel);
      } catch (error) {
        // A stale realtime channel should not prevent reconnecting.
      }
      channel = null;
    }

    function applyRemote(payload) {
      const remote = sanitizeState(payload, false);
      syncApplyingRemote = true;
      try {
        state = remote;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
          // Keep the in-memory remote state even if storage is full or blocked.
        }
        selectedDate = validDateKey(selectedDate) ? selectedDate : localDateKey();
        calendarSelectedDate = selectedDate;
        calendarDate = monthKeyDate(selectedDate);
        writeSyncMarker(remote.meta.updatedAt);
        clearConflict();
        renderEverything();
      } finally {
        syncApplyingRemote = false;
      }
    }

    async function pushNow(force = false) {
      if (!client || !currentUser || (!pushQueued && !force)) return false;
      pushQueued = false;
      const payload = snapshot();
      const updatedAt = String(payload.meta.updatedAt || new Date().toISOString());
      payload.meta.updatedAt = updatedAt;
      const { error } = await client.from(SUPABASE_TABLE).upsert({
        user_id: currentUser.id,
        payload,
        updated_at: updatedAt
      }, { onConflict: "user_id" });
      if (error) {
        pushQueued = true;
        setVisual("云端暂不可用，已保留本地", "error");
        return false;
      }
      writeSyncMarker(updatedAt);
      clearConflict();
      // A local edit may have happened while the request was in flight.
      if (state.meta.updatedAt !== updatedAt) {
        queuePush();
        return true;
      }
      setVisual("已同步", "synced");
      return true;
    }

    function queuePush() {
      if (syncApplyingRemote || !client || !currentUser) return;
      pushQueued = true;
      window.clearTimeout(pushTimer);
      pushTimer = window.setTimeout(() => {
        pullOrPush().catch(() => setVisual("云端暂不可用，已保留本地", "error"));
      }, 450);
      setVisual("等待同步", "pending");
    }

    async function pullOrPush() {
      if (!client || !currentUser) return;
      setVisual("正在同步…", "pending");
      const { data, error } = await client
        .from(SUPABASE_TABLE)
        .select("payload,updated_at")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (error) {
        setVisual(`云端连接失败：${errorText(error)}`, "error");
        return;
      }
      if (!data?.payload) {
        pushQueued = true;
        if (await pushNow()) setVisual("已创建云端副本", "synced");
        return;
      }
      const remote = sanitizeState(data.payload, false);
      const localTime = timestamp(state.meta.updatedAt);
      const remoteTime = timestamp(remote.meta.updatedAt || data.updated_at);
      if (!readSyncMarker() && !hasMeaningfulLocalState()) {
        applyRemote(remote);
        setVisual("已从云端更新", "synced");
        return;
      }
      if (localAndRemoteChangedSinceLastSync(remoteTime)) {
        showConflict(remote, state, data.updated_at || remote.meta.updatedAt || "");
        return;
      }
      if (remoteTime > localTime) {
        applyRemote(remote);
        setVisual("已从云端更新", "synced");
      } else if (localTime > remoteTime || pushQueued) {
        pushQueued = true;
        await pushNow();
      } else {
        setVisual("已同步", "synced");
      }
    }

    async function subscribeRealtime() {
      await removeChannel();
      if (!client || !currentUser) return;
      channel = client
        .channel(`study-state-${currentUser.id}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: SUPABASE_TABLE,
          filter: `user_id=eq.${currentUser.id}`
        }, (event) => {
          const nextPayload = event?.new?.payload;
          if (!nextPayload || syncApplyingRemote) return;
          try {
            const remote = sanitizeState(nextPayload, false);
            const remoteTime = timestamp(remote.meta.updatedAt || event.new.updated_at);
            const localTime = timestamp(state.meta.updatedAt);
            if (localAndRemoteChangedSinceLastSync(remoteTime)) {
              showConflict(remote, state, event.new.updated_at || remote.meta.updatedAt || "");
              return;
            }
            if (remoteTime > localTime) {
              applyRemote(remote);
              setVisual("已从云端更新", "synced");
            }
          } catch (error) {
            setVisual("收到无法识别的云端数据", "error");
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && !conflict) setVisual("已同步", "synced");
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setVisual("实时同步暂不可用", "error");
        });
    }

    async function handleSession(sessionUser) {
      if (!sessionUser) {
        currentUser = null;
        stopPolling();
        await removeChannel();
        setVisual(config ? "已连接项目，等待登录" : "仅此设备", config ? "pending" : "local");
        render();
        return;
      }
      const changed = currentUser?.id !== sessionUser.id;
      currentUser = sessionUser;
      if (!changed && channel) {
        render();
        return;
      }
      await pullOrPush();
      await subscribeRealtime();
      startPolling();
      render();
    }

    async function configure(url, anonKey) {
      const normalizedUrl = String(url || "").trim().replace(/\/$/, "");
      const normalizedKey = String(anonKey || "").trim();
      if (!/^https:\/\/[^\s]+$/i.test(normalizedUrl)) throw new Error("Supabase 项目地址必须以 https:// 开头");
      if (normalizedKey.length < 20) throw new Error("请填写有效的 anon 公钥");
      if (!window.supabase?.createClient) throw new Error("云端组件尚未加载，请联网后刷新页面");
      await removeChannel();
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
      saveConfig({ url: normalizedUrl, anonKey: normalizedKey });
      client = window.supabase.createClient(normalizedUrl, normalizedKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const authState = client.auth.onAuthStateChange((event, session) => {
        window.setTimeout(() => handleSession(session?.user || null).catch((error) => setVisual(`同步初始化失败：${errorText(error)}`, "error")), 0);
      });
      authSubscription = authState?.data?.subscription || null;
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      await handleSession(data.session?.user || null);
      return Boolean(data.session?.user);
    }

    async function signIn(email, password) {
      if (!client) throw new Error("请先填写项目地址、公钥并连接");
      const { error } = await client.auth.signInWithPassword({ email: String(email || "").trim(), password: String(password || "") });
      if (error) throw error;
    }

    async function signUp(email, password) {
      if (!client) throw new Error("请先填写项目地址、公钥并连接");
      const { data, error } = await client.auth.signUp({ email: String(email || "").trim(), password: String(password || "") });
      if (error) throw error;
      if (!data.session) setVisual("注册成功，请先完成邮箱验证", "pending");
    }

    async function signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
      pushQueued = false;
      stopPolling();
      setVisual("已退出云端，仅此设备", "local");
    }

    async function init() {
      window.addEventListener("online", () => {
        if (currentUser && !conflict) pullOrPush().catch(() => undefined);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && currentUser && !conflict) pullOrPush().catch(() => undefined);
      });
      config = readConfig();
      if (!config) {
        setVisual("仅此设备", "local");
        return;
      }
      try {
        await configure(config.url, config.anonKey);
      } catch (error) {
        setVisual(`云端配置待检查：${errorText(error)}`, "error");
      }
    }

    return {
      init,
      configure,
      signIn,
      signUp,
      signOut,
      useCloudVersion,
      keepLocalVersion,
      queuePush,
      render,
      setStatus: setVisual,
      get currentUser() { return currentUser; },
      get visual() { return visual; }
    };
  })();

  window.YantuSync = supabaseSync;

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function formatFocusClock(seconds) {
    const value = Math.max(0, integer(seconds));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  }

  function persistFocusTimer() {
    try {
      if (!focusRunning) {
        localStorage.removeItem(FOCUS_TIMER_KEY);
        return;
      }
      localStorage.setItem(FOCUS_TIMER_KEY, JSON.stringify({
        subject: $("#focusSubject")?.value || "math",
        date: focusDate,
        initialSeconds: focusInitialSeconds,
        endAt: focusEndAt
      }));
    } catch (error) {
      // The timer can continue in memory when storage is unavailable.
    }
  }

  function renderFocusTimer() {
    const clock = $("#focusClock");
    const start = $("#focusStartButton");
    const status = $("#focusStatus");
    if (clock) clock.textContent = formatFocusClock(focusSeconds);
    if (start) start.textContent = focusRunning ? "暂停" : (focusSeconds === 0 ? "再次专注" : (focusSeconds < focusInitialSeconds ? "继续专注" : "开始专注"));
    if (status) status.textContent = focusRunning ? "专注进行中，完成后会记入当天打卡草稿" : (focusSeconds === 0 ? "本次专注已完成并记录" : (focusSeconds < focusInitialSeconds ? "已暂停" : "准备开始"));
  }

  function recordFocusMinutes() {
    const minutes = Math.max(1, Math.round(focusInitialSeconds / 60));
    const subject = $("#focusSubject")?.value || "math";
    const date = validDateKey(focusDate) ? focusDate : selectedDate;
    const base = state.drafts[date] || state.logs[date] || emptyLog();
    const next = sanitizeLog(base, true);
    next.subjects[subject].minutes = integer(next.subjects[subject].minutes) + minutes;
    next.updatedAt = new Date().toISOString();
    state.drafts[date] = next;
    saveState();
    renderAllDynamic(true);
    showToast(`专注 ${minutes} 分钟已记入${SUBJECTS[subject].short}打卡草稿`);
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  }

  function completeFocusTimer() {
    focusRunning = false;
    window.clearInterval(focusInterval);
    focusInterval = 0;
    focusSeconds = 0;
    persistFocusTimer();
    recordFocusMinutes();
    renderFocusTimer();
  }

  function tickFocusTimer() {
    focusSeconds = Math.max(0, Math.ceil((focusEndAt - Date.now()) / 1000));
    if (focusSeconds <= 0) {
      completeFocusTimer();
      return;
    }
    renderFocusTimer();
  }

  function startFocusTimer() {
    if (focusRunning) {
      focusSeconds = Math.max(0, Math.ceil((focusEndAt - Date.now()) / 1000));
      focusRunning = false;
      window.clearInterval(focusInterval);
      focusInterval = 0;
      persistFocusTimer();
      renderFocusTimer();
      return;
    }
    if (focusSeconds <= 0) resetFocusTimer();
    if (focusSeconds === focusInitialSeconds) focusDate = selectedDate;
    focusRunning = true;
    focusEndAt = Date.now() + focusSeconds * 1000;
    focusInterval = window.setInterval(tickFocusTimer, 500);
    persistFocusTimer();
    renderFocusTimer();
  }

  function resetFocusTimer() {
    focusRunning = false;
    window.clearInterval(focusInterval);
    focusInterval = 0;
    focusInitialSeconds = integer($("#focusPreset")?.value || 25) * 60;
    focusSeconds = focusInitialSeconds;
    persistFocusTimer();
    renderFocusTimer();
  }

  function restoreFocusTimer() {
    try {
      const saved = JSON.parse(localStorage.getItem(FOCUS_TIMER_KEY) || "null");
      if (!saved || !saved.endAt) return;
      if ($("#focusSubject")) $("#focusSubject").value = saved.subject || "math";
      focusDate = validDateKey(saved.date) ? saved.date : selectedDate;
      focusInitialSeconds = integer(saved.initialSeconds, 25 * 60);
      focusEndAt = Number(saved.endAt);
      if (focusEndAt <= Date.now()) {
        focusSeconds = 0;
        try { localStorage.removeItem(FOCUS_TIMER_KEY); } catch (error) { /* best effort */ }
        recordFocusMinutes();
        renderFocusTimer();
        return;
      }
      focusSeconds = Math.max(0, Math.ceil((focusEndAt - Date.now()) / 1000));
      focusRunning = focusSeconds > 0;
      focusInterval = window.setInterval(tickFocusTimer, 500);
    } catch (error) {
      // Ignore a malformed timer snapshot.
    }
    renderFocusTimer();
  }

  function getTasks(date = selectedDate) {
    return state.tasks[date] || [];
  }

  function getLoggedMinutes(date) {
    const log = state.logs[date];
    if (log) {
      return EXAM_SUBJECTS.reduce((sum, subject) => sum + integer(log.subjects?.[subject]?.minutes), 0);
    }
    return getTasks(date)
      .filter((task) => task.done)
      .reduce((sum, task) => sum + integer(task.plannedMinutes), 0);
  }

  function getPlannedMinutes(date) {
    return getTasks(date).reduce((sum, task) => sum + integer(task.plannedMinutes), 0);
  }

  function targetScoreTotal() {
    return EXAM_SUBJECTS.reduce((sum, subject) => sum + integer(state.settings.targetScores[subject]), 0);
  }

  function overallProgressValue() {
    const total = targetScoreTotal() || 1;
    const weighted = EXAM_SUBJECTS.reduce((sum, subject) => {
      return sum + state.settings.progress[subject] * state.settings.targetScores[subject];
    }, 0);
    return Math.round(weighted / total);
  }

  function formatDuration(minutes) {
    const value = integer(minutes);
    if (value < 60) return `${value} 分钟`;
    const hours = Math.floor(value / 60);
    const remainder = value % 60;
    return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`;
  }

  function renderHeader() {
    const today = localDateKey();
    const examDate = state.settings.examDate;
    const difference = dateDiff(today, examDate);
    const daysElement = $("#countdownDays");
    const unitElement = $("#countdownUnit");
    const labelElement = $("#countdownLabel");

    if (difference > 0) {
      daysElement.textContent = String(difference);
      unitElement.textContent = "天";
      labelElement.textContent = "距暂定初试日（不含今天）";
    } else if (difference === 0) {
      daysElement.textContent = "今天";
      unitElement.textContent = "";
      labelElement.textContent = "初试日";
    } else {
      daysElement.textContent = String(Math.abs(difference));
      unitElement.textContent = "天";
      labelElement.textContent = "初试日已过";
    }

    $(".eyebrow").textContent = state.settings.targetSchool;
    $(".hero-copy h1").textContent = `${state.settings.targetProgram} · ${targetScoreTotal()} 分目标`;
  }

  function renderDateHeading() {
    $("#selectedDateWeekday").textContent = relativeDayLabel(selectedDate);
    $("#selectedDateTitle").textContent = displayDate(selectedDate);
  }

  function streakEndingAt(date) {
    let count = 0;
    let cursor = date;
    while (state.logs[cursor]) {
      count += 1;
      cursor = addDays(cursor, -1);
      if (count > 1000) break;
    }
    return count;
  }

  function renderTodayMetrics() {
    const tasks = getTasks();
    const done = tasks.filter((task) => task.done).length;
    const actual = getLoggedMinutes(selectedDate);
    $("#todayCompletion").textContent = `${done} / ${tasks.length}`;
    $("#todayPlanned").textContent = formatDuration(getPlannedMinutes(selectedDate));
    $("#todayActual").textContent = state.logs[selectedDate] || actual > 0 ? formatDuration(actual) : "待打卡";
    $("#streakCount").textContent = `${streakEndingAt(selectedDate)} 天`;
  }

  function renderTasks() {
    const list = $("#taskList");
    const empty = $("#taskEmpty");
    const tasks = getTasks();
    list.replaceChildren();
    empty.hidden = tasks.length > 0;
    list.hidden = tasks.length === 0;

    if (!tasks.length) {
      if (selectedDate === "2026-07-29") {
        $("#taskEmptyTitle").textContent = "计划从明天正式启动";
        $("#taskEmptyText").textContent = "7 月 30 日已有 160 分钟启动计划，今天只需把学习环境准备好。";
      } else {
        $("#taskEmptyTitle").textContent = "这一天还没有计划";
        $("#taskEmptyText").textContent = "生成一份与当前阶段匹配的清单，再按你的状态调整。";
      }
    }

    tasks.forEach((task) => {
      const item = document.createElement("article");
      item.className = `task-item${task.done ? " is-done" : ""}`;
      item.dataset.id = task.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "task-check";
      check.dataset.action = "toggle";
      check.setAttribute("aria-label", task.done ? "撤销完成" : "标记完成");
      check.setAttribute("aria-pressed", String(task.done));
      check.textContent = "✓";

      const copy = document.createElement("div");
      copy.className = "task-copy";
      const top = document.createElement("div");
      top.className = "task-topline";
      const chip = document.createElement("span");
      chip.className = `subject-chip ${task.subject}`;
      chip.textContent = SUBJECTS[task.subject].short;
      const title = document.createElement("strong");
      title.textContent = task.title;
      top.append(chip, title);
      copy.append(top);
      if (task.detail) {
        const detail = document.createElement("p");
        detail.textContent = task.detail;
        copy.append(detail);
      }

      const meta = document.createElement("div");
      meta.className = "task-meta";
      const minutes = document.createElement("span");
      minutes.className = "task-minutes";
      minutes.textContent = `${task.plannedMinutes} 分`;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "task-edit";
      edit.dataset.action = "edit";
      edit.setAttribute("aria-label", `编辑 ${task.title}`);
      edit.title = "编辑任务";
      edit.textContent = "⋯";
      meta.append(minutes, edit);
      item.append(check, copy, meta);
      list.append(item);
    });

    const done = tasks.filter((task) => task.done).length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    $("#planProgressBar").style.width = `${percent}%`;
    $("#planCaption").textContent = tasks.length
      ? done === tasks.length
        ? "今日清单已全部完成。"
        : `已完成 ${done} 项，还剩 ${tasks.length - done} 项。`
      : "完成一项，推进一点。";
  }

  function recommendedTasks(date) {
    if (date <= "2026-08-03") {
      return [
        ["math", "高数基础 · 当日章节", "讲义、例题和错因记录形成闭环", 90],
        ["english", "核心词汇与长难句", "复习 30 个核心词，精拆 2 个长难句", 35],
        ["material", "846 基础框架", "整理一个知识板块的概念与公式", 25],
        ["general", "晚间复盘", "完成 23:00 打卡并确定明日重点", 10]
      ];
    }
    if (date <= "2026-08-10") {
      return [
        ["math", "数学基础主任务", "高数收口或线代起步，练习必须独立落笔", 150],
        ["english", "词汇 + 阅读基础", "词汇复习后完成一组精读", 60],
        ["material", "846 第一轮", "教材阅读、概念整理与基础题", 90],
        ["politics", "政治启动", "听课或阅读后完成少量选择题", 30]
      ];
    }
    if (date < "2026-09-01") {
      return [
        ["math", "数学基础与练习", "当天章节学习 + 独立做题 + 错题回看", 180],
        ["english", "词汇、长难句与阅读", "保持词汇复现，完成精读或真题阅读", 75],
        ["material", "846 第一轮", "建立章节框架并完成对应基础题", 120],
        ["politics", "政治选择题起步", "完成当天内容和对应选择题", 30],
        ["general", "当日复盘", "整理错因与第二天三项重点", 15]
      ];
    }
    return [
      ["math", "数学主任务", "按阶段完成强化或真题，并回补错因", 180],
      ["english", "英语真题链路", "词汇复现、阅读训练与逐句复盘", 90],
      ["material", "846 主任务", "章节强化、真题或背诵输出", 150],
      ["politics", "政治主任务", "知识点学习与选择题训练", 60]
    ];
  }

  function generatePlan() {
    const current = getTasks();
    const existingTitles = new Set(current.map((task) => task.title));
    const additions = recommendedTasks(selectedDate)
      .filter((template) => !existingTitles.has(template[1]))
      .map(([subject, title, detail, plannedMinutes]) => ({
        id: uid(), subject, title, detail, plannedMinutes, done: false, createdAt: new Date().toISOString(), completedAt: null
      }));
    if (!additions.length) {
      showToast("建议任务已经在清单中");
      return;
    }
    state.tasks[selectedDate] = [...current, ...additions];
    if (!saveState()) {
      state.tasks[selectedDate] = current;
      return;
    }
    renderAllDynamic(false);
    $("#checkinOutputWrap").hidden = true;
    showToast(current.length ? `已补充 ${additions.length} 项，原任务没有被覆盖` : `已生成 ${additions.length} 项建议任务`);
  }

  function toggleTask(id) {
    const task = getTasks().find((item) => item.id === id);
    if (!task) return;
    const previousDone = task.done;
    const previousCompletedAt = task.completedAt;
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    if (!saveState()) {
      task.done = previousDone;
      task.completedAt = previousCompletedAt;
      return;
    }
    renderAllDynamic(false);
    $("#checkinOutputWrap").hidden = true;
  }

  function openTaskEditor(id = null) {
    const task = id ? getTasks().find((item) => item.id === id) : null;
    $("#taskDialogTitle").textContent = task ? "编辑任务" : "新增任务";
    $("#taskId").value = task?.id || "";
    $("#taskSubject").value = task?.subject || "math";
    $("#taskMinutes").value = task?.plannedMinutes || 45;
    $("#taskTitle").value = task?.title || "";
    $("#taskDetail").value = task?.detail || "";
    $("#deleteTaskButton").hidden = !task;
    openDialog("taskDialog");
    window.setTimeout(() => $("#taskTitle").focus(), 50);
  }

  function saveTaskFromDialog(event) {
    event.preventDefault();
    const id = $("#taskId").value;
    const taskData = sanitizeTask({
      id: id || uid(),
      subject: $("#taskSubject").value,
      title: $("#taskTitle").value,
      detail: $("#taskDetail").value,
      plannedMinutes: $("#taskMinutes").value,
      done: id ? Boolean(getTasks().find((item) => item.id === id)?.done) : false,
      createdAt: id ? getTasks().find((item) => item.id === id)?.createdAt : new Date().toISOString(),
      completedAt: id ? getTasks().find((item) => item.id === id)?.completedAt : null
    });
    if (!taskData) {
      showToast("请填写任务名称");
      return;
    }
    const previousTasks = getTasks().slice();
    if (!state.tasks[selectedDate]) state.tasks[selectedDate] = [];
    const index = state.tasks[selectedDate].findIndex((item) => item.id === id);
    if (index >= 0) state.tasks[selectedDate][index] = taskData;
    else state.tasks[selectedDate].push(taskData);
    if (!saveState()) {
      state.tasks[selectedDate] = previousTasks;
      return;
    }
    closeDialog("taskDialog");
    renderAllDynamic(false);
    $("#checkinOutputWrap").hidden = true;
    showToast(index >= 0 ? "任务已更新" : "任务已加入清单");
  }

  function deleteCurrentTask() {
    const id = $("#taskId").value;
    const task = getTasks().find((item) => item.id === id);
    if (!task) return;
    if (!window.confirm(`确定删除“${task.title}”吗？`)) return;
    const previousTasks = getTasks();
    state.tasks[selectedDate] = previousTasks.filter((item) => item.id !== id);
    if (!saveState()) {
      state.tasks[selectedDate] = previousTasks;
      return;
    }
    closeDialog("taskDialog");
    renderAllDynamic(false);
    $("#checkinOutputWrap").hidden = true;
    showToast("任务已删除");
  }

  function renderStudyRows() {
    const container = $("#studyLogRows");
    container.replaceChildren();
    EXAM_SUBJECTS.forEach((subject) => {
      const row = document.createElement("div");
      row.className = "study-log-row";
      const name = document.createElement("span");
      name.className = "study-subject";
      name.textContent = SUBJECTS[subject].short;

      const minutesLabel = document.createElement("label");
      const minutesSpan = document.createElement("span");
      minutesSpan.textContent = "分钟";
      const minutesInput = document.createElement("input");
      minutesInput.id = `minutes-${subject}`;
      minutesInput.type = "number";
      minutesInput.min = "0";
      minutesInput.max = "1440";
      minutesInput.inputMode = "numeric";
      minutesInput.placeholder = "0";
      minutesLabel.append(minutesSpan, minutesInput);

      const contentLabel = document.createElement("label");
      const contentSpan = document.createElement("span");
      contentSpan.textContent = "完成内容";
      const contentInput = document.createElement("input");
      contentInput.id = `content-${subject}`;
      contentInput.type = "text";
      contentInput.maxLength = 300;
      contentInput.placeholder = "章节、题目或复盘";
      contentLabel.append(contentSpan, contentInput);
      row.append(name, minutesLabel, contentLabel);
      container.append(row);
    });
  }

  function emptyLog() {
    const subjects = {};
    EXAM_SUBJECTS.forEach((subject) => {
      subjects[subject] = { minutes: 0, content: "" };
    });
    return {
      sleepStart: "",
      wakeTime: "",
      screenHours: 0,
      screenRecorded: false,
      subjects,
      metrics: sanitizeMetrics({}),
      unfinishedReason: "",
      note: "",
      updatedAt: new Date().toISOString()
    };
  }

  function setFormValue(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value ?? "";
  }

  function loadCheckinForm() {
    const source = state.drafts[selectedDate] || state.logs[selectedDate] || emptyLog();
    setFormValue("sleepStart", source.sleepStart);
    setFormValue("wakeTime", source.wakeTime);
    setFormValue("screenHours", source.screenRecorded ? source.screenHours : "");
    EXAM_SUBJECTS.forEach((subject) => {
      setFormValue(`minutes-${subject}`, source.subjects?.[subject]?.minutes || "");
      setFormValue(`content-${subject}`, source.subjects?.[subject]?.content || "");
    });
    Object.entries(source.metrics || {}).forEach(([key, value]) => setFormValue(key, value || ""));
    setFormValue("unfinishedReason", source.unfinishedReason);
    setFormValue("reviewNote", source.note);
    $("#checkinSaveState").textContent = state.drafts[selectedDate]
      ? "草稿已留存"
      : state.logs[selectedDate]
        ? "已保存"
        : "未保存";
    formHasPendingDraft = false;
    $("#checkinOutputWrap").hidden = true;
  }

  function collectCheckinForm() {
    const subjects = {};
    EXAM_SUBJECTS.forEach((subject) => {
      subjects[subject] = {
        minutes: integer($(`#minutes-${subject}`).value),
        content: $(`#content-${subject}`).value.trim()
      };
    });
    return sanitizeLog({
      sleepStart: $("#sleepStart").value,
      wakeTime: $("#wakeTime").value,
      screenHours: $("#screenHours").value,
      screenRecorded: $("#screenHours").value !== "",
      subjects,
      metrics: {
        mathCorrect: $("#mathCorrect").value,
        mathTotal: $("#mathTotal").value,
        materialCorrect: $("#materialCorrect").value,
        materialTotal: $("#materialTotal").value,
        englishCorrect: $("#englishCorrect").value,
        englishTotal: $("#englishTotal").value,
        politicsTotal: $("#politicsTotal").value
      },
      unfinishedReason: $("#unfinishedReason").value.trim(),
      note: $("#reviewNote").value.trim(),
      updatedAt: new Date().toISOString()
    });
  }

  function metricsAreValid(log) {
    const pairs = [
      [log.metrics.mathCorrect, log.metrics.mathTotal, "数学"],
      [log.metrics.materialCorrect, log.metrics.materialTotal, "专业课"],
      [log.metrics.englishCorrect, log.metrics.englishTotal, "英语阅读"]
    ];
    for (const [correct, total, label] of pairs) {
      if (correct > total) {
        showToast(`${label}正确数不能大于总题数`);
        return false;
      }
    }
    return true;
  }

  function checkinInputsAreValid(report = false) {
    const form = $("#checkinForm");
    if (!form.checkValidity()) {
      if (report) form.reportValidity();
      return false;
    }
    const totalMinutes = EXAM_SUBJECTS.reduce((sum, subject) => {
      return sum + integer($(`#minutes-${subject}`).value);
    }, 0);
    if (totalMinutes > 1440) {
      if (report) showToast("四科有效学习合计不能超过 1440 分钟");
      return false;
    }
    return true;
  }

  function saveDraftSoon() {
    window.clearTimeout(draftTimer);
    formHasPendingDraft = true;
    $("#checkinSaveState").textContent = "正在留存草稿…";
    draftTimer = window.setTimeout(() => {
      if (!checkinInputsAreValid(false)) {
        $("#checkinSaveState").textContent = "输入待修正";
        return;
      }
      const draft = collectCheckinForm();
      state.drafts[selectedDate] = { ...draft, draft: true };
      if (saveState()) {
        formHasPendingDraft = false;
        $("#checkinSaveState").textContent = "草稿已留存";
      } else {
        $("#checkinSaveState").textContent = "草稿未保存";
      }
    }, 450);
  }

  function flushPendingDraft() {
    window.clearTimeout(draftTimer);
    if (!formHasPendingDraft) return true;
    if (!checkinInputsAreValid(false)) {
      $("#checkinSaveState").textContent = "输入待修正";
      return false;
    }
    state.drafts[selectedDate] = { ...collectCheckinForm(), draft: true };
    if (!saveState()) {
      $("#checkinSaveState").textContent = "草稿未保存";
      return false;
    }
    formHasPendingDraft = false;
    $("#checkinSaveState").textContent = "草稿已留存";
    return true;
  }

  function saveCheckin(event) {
    event.preventDefault();
    if (!checkinInputsAreValid(true)) return;
    const log = collectCheckinForm();
    if (!metricsAreValid(log)) {
      window.clearTimeout(draftTimer);
      state.drafts[selectedDate] = { ...log, draft: true };
      formHasPendingDraft = false;
      if (saveState()) $("#checkinSaveState").textContent = "草稿已留存";
      else $("#checkinSaveState").textContent = "草稿未保存";
      return;
    }
    window.clearTimeout(draftTimer);
    formHasPendingDraft = false;
    state.logs[selectedDate] = log;
    delete state.drafts[selectedDate];
    if (!saveState()) {
      $("#checkinSaveState").textContent = "保存失败";
      return;
    }
    $("#checkinSaveState").textContent = "已保存";
    renderAllDynamic(false);
    showToast("打卡已保存，进度图与日历已更新");
  }

  function accuracyText(correct, total) {
    const totalValue = integer(total);
    const correctValue = integer(correct);
    if (!totalValue) return "0 题";
    return `${correctValue}/${totalValue}（${Math.round((correctValue / totalValue) * 100)}%）`;
  }

  function sleepDurationText(start, end) {
    if (!start || !end) return "";
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (minutes <= 0) minutes += 24 * 60;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`;
  }

  function buildCheckinText() {
    if (!checkinInputsAreValid(true)) return null;
    const log = collectCheckinForm();
    if (!metricsAreValid(log)) return null;
    const tasks = getTasks();
    const done = tasks.filter((task) => task.done).length;
    const totalMinutes = EXAM_SUBJECTS.reduce((sum, subject) => sum + log.subjects[subject].minutes, 0);
    const subjectLines = EXAM_SUBJECTS.map((subject) => {
      const entry = log.subjects[subject];
      return `- ${SUBJECTS[subject].name}：${formatDuration(entry.minutes)}｜${entry.content || "未填写内容"}`;
    });
    const duration = sleepDurationText(log.sleepStart, log.wakeTime);
    const sleepText = log.sleepStart || log.wakeTime
      ? `${log.sleepStart || "未填"}–${log.wakeTime || "未填"}${duration ? `（${duration}）` : ""}`
      : "未记录";
    return [
      `【27 考研打卡｜${displayDate(selectedDate, true)}】`,
      `睡眠：${sleepText}`,
      `四科有效学习：${formatDuration(totalMinutes)}`,
      ...subjectLines,
      "",
      "做题与正确率：",
      `- 数学：${accuracyText(log.metrics.mathCorrect, log.metrics.mathTotal)}`,
      `- 专业课：${accuracyText(log.metrics.materialCorrect, log.metrics.materialTotal)}`,
      `- 英语阅读：${accuracyText(log.metrics.englishCorrect, log.metrics.englishTotal)}`,
      `- 政治：${log.metrics.politicsTotal} 题`,
      `任务完成：${done}/${tasks.length}`,
      `手机亮屏：${log.screenRecorded ? `${log.screenHours} 小时` : "未记录"}`,
      `未完成原因：${log.unfinishedReason || "无"}`,
      `复盘备注：${log.note || "无"}`
    ].join("\n");
  }

  function generateCheckinText() {
    const text = buildCheckinText();
    if (!text) return;
    $("#checkinOutput").value = text;
    $("#checkinOutputWrap").hidden = false;
    $("#checkinOutputWrap").scrollIntoView({ behavior: "auto", block: "nearest" });
  }

  async function copyCheckinText() {
    const text = $("#checkinOutput").value;
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const output = $("#checkinOutput");
        output.focus();
        output.select();
        const copied = document.execCommand("copy");
        if (!copied) throw new Error("copy failed");
        window.getSelection()?.removeAllRanges();
      }
      showToast("打卡文本已复制");
    } catch (error) {
      showToast("浏览器未允许自动复制，请长按文本复制");
    }
  }

  async function shareCheckinText() {
    const text = $("#checkinOutput").value;
    if (!text) return;
    if (!navigator.share) {
      await copyCheckinText();
      showToast("当前浏览器不支持系统分享，已复制打卡文本");
      return;
    }
    try {
      await navigator.share({ title: "研途考研打卡", text });
    } catch (error) {
      if (error.name !== "AbortError") showToast("系统分享未完成，可改用复制按钮");
    }
  }

  function progressStage(percent) {
    if (percent === 0) return "未启动";
    if (percent < 20) return "启动";
    if (percent < 45) return "基础";
    if (percent < 70) return "强化";
    if (percent < 90) return "真题";
    return "冲刺";
  }

  function renderProgressOverview() {
    const progress = overallProgressValue();
    const ring = $("#overallRing");
    ring.style.setProperty("--progress", `${progress * 3.6}deg`);
    ring.setAttribute("aria-label", `总进度 ${progress}%`);
    $("#overallProgress").textContent = `${progress}%`;
    $("#targetScoreTotal").textContent = targetScoreTotal();
    const scores = state.settings.targetScores;
    $("#targetScoreBreakdown").textContent = `英语 ${scores.english} · 政治 ${scores.politics} · 数学 ${scores.math} · 专业课 ${scores.material}`;

    const today = localDateKey();
    const phase = getCurrentPhase(today);
    const isExamDay = today === state.settings.examDate;
    $("#currentPhase").textContent = isExamDay
      ? "初试当天"
      : phase?.title || (today < PHASES[0].start ? "准备期" : "考试已结束");
    $("#phaseDescription").textContent = isExamDay
      ? "只执行既定节奏，带齐证件与考试用品。"
      : phase?.detail || "根据正式安排更新下一阶段。";
  }

  function renderSubjectProgress() {
    const container = $("#subjectProgressList");
    container.replaceChildren();
    EXAM_SUBJECTS.forEach((subject) => {
      const value = state.settings.progress[subject];
      const row = document.createElement("div");
      row.className = "subject-progress-row";
      row.style.setProperty("--subject-color", SUBJECTS[subject].color);

      const heading = document.createElement("div");
      heading.className = "subject-progress-heading";
      const name = document.createElement("strong");
      name.textContent = SUBJECTS[subject].name;
      const stage = document.createElement("span");
      stage.textContent = `${progressStage(value)}阶段 · 目标 ${state.settings.targetScores[subject]} 分`;
      heading.append(name, stage);

      const track = document.createElement("div");
      track.className = "subject-progress-track";
      const fill = document.createElement("span");
      fill.style.width = `${value}%`;
      track.append(fill);

      const controls = document.createElement("div");
      controls.className = "subject-progress-controls";
      const range = document.createElement("input");
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.step = "1";
      range.value = String(value);
      range.dataset.subject = subject;
      range.setAttribute("aria-label", `${SUBJECTS[subject].name}进度`);
      const output = document.createElement("output");
      output.textContent = `${value}%`;
      controls.append(range, output);
      row.append(heading, track, controls);
      container.append(row);
    });
  }

  function renderHoursChart() {
    const container = $("#hoursChart");
    container.replaceChildren();
    const today = localDateKey();
    const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
    const values = dates.map(getLoggedMinutes);
    const maxValue = Math.max(240, ...values);
    const total = values.reduce((sum, value) => sum + value, 0);
    $("#sevenDayTotal").textContent = `${(total / 60).toFixed(total % 60 ? 1 : 0)}h`;

    dates.forEach((date, index) => {
      const value = values[index];
      const column = document.createElement("div");
      column.className = `bar-column${date === today ? " is-today" : ""}`;
      const valueLabel = document.createElement("span");
      valueLabel.className = "bar-value";
      valueLabel.textContent = value ? `${(value / 60).toFixed(1)}h` : "";
      const well = document.createElement("div");
      well.className = "bar-well";
      const fill = document.createElement("span");
      fill.className = "bar-fill";
      fill.style.height = value ? `${Math.max(4, (value / maxValue) * 100)}%` : "0%";
      well.append(fill);
      const label = document.createElement("span");
      label.className = "bar-label";
      const parsed = parseLocalDate(date);
      label.textContent = `${parsed.getMonth() + 1}/${parsed.getDate()}`;
      column.append(valueLabel, well, label);
      container.append(column);
    });
  }

  function getCurrentPhase(date) {
    return currentPhases().find((phase) => date >= phase.start && date <= phase.end) || null;
  }

  function currentPhases() {
    return PHASES.map((phase, index) => index === PHASES.length - 1
      ? { ...phase, end: addDays(state.settings.examDate, -1) }
      : phase);
  }

  function renderTimeline() {
    const container = $("#phaseTimeline");
    container.replaceChildren();
    const today = localDateKey();
    currentPhases().forEach((phase) => {
      const item = document.createElement("article");
      item.className = "phase-item";
      if (today >= phase.start && today <= phase.end) item.classList.add("is-current");
      if (today > phase.end) item.classList.add("is-past");
      const time = document.createElement("time");
      time.textContent = phase.range;
      const title = document.createElement("strong");
      title.textContent = phase.title;
      const detail = document.createElement("span");
      detail.textContent = phase.detail;
      item.append(time, title, detail);
      container.append(item);
    });
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    $("#calendarTitle").textContent = `${year} 年 ${month + 1} 月`;
    const first = new Date(year, month, 1, 12);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset, 12);
    const container = $("#calendarGrid");
    container.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = localDateKey(date);
      const tasks = getTasks(key);
      const done = tasks.filter((task) => task.done).length;
      const minutes = getLoggedMinutes(key);
      const heatLevel = minutes === 0 ? 0 : minutes < 120 ? 1 : minutes < 300 ? 2 : 3;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `calendar-day heat-level-${heatLevel}`;
      button.dataset.date = key;
      button.setAttribute("aria-label", `${displayDate(key, true)}，学习 ${minutes} 分钟，任务 ${done}/${tasks.length}`);
      if (date.getMonth() !== month) button.classList.add("is-outside");
      if (key === localDateKey()) button.classList.add("is-today");
      if (key === calendarSelectedDate) button.classList.add("is-selected");

      const number = document.createElement("span");
      number.className = "calendar-number";
      number.textContent = date.getDate();
      const meta = document.createElement("span");
      meta.className = "calendar-day-meta";
      const strong = document.createElement("strong");
      strong.textContent = minutes ? `${minutes} 分` : "";
      const taskInfo = document.createElement("span");
      taskInfo.textContent = tasks.length ? `${done}/${tasks.length} 项` : "";
      meta.append(strong, taskInfo);
      const heat = document.createElement("span");
      heat.className = "calendar-heat-bar";
      button.append(number, meta, heat);

      if (key === state.settings.examDate) {
        const marker = document.createElement("i");
        marker.className = "exam-marker";
        marker.title = "初试日";
        button.append(marker);
      }
      container.append(button);
    }
    renderCalendarDetail();
  }

  function renderCalendarDetail() {
    const key = calendarSelectedDate;
    const tasks = getTasks(key);
    const done = tasks.filter((task) => task.done).length;
    const log = state.logs[key];
    $("#calendarDetailWeekday").textContent = relativeDayLabel(key);
    $("#calendarDetailHeading").textContent = displayDate(key);
    $("#calendarDetailMinutes").textContent = formatDuration(getLoggedMinutes(key));
    $("#calendarDetailTasks").textContent = `${done} / ${tasks.length}`;
    $("#calendarDetailScreen").textContent = log?.screenRecorded ? `${log.screenHours} 小时` : "未记录";
  }

  function shiftCalendarMonth(amount) {
    const selected = parseLocalDate(calendarSelectedDate);
    const targetMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + amount, 1, 12);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 12).getDate();
    const targetDay = Math.min(selected.getDate(), lastDay);
    calendarDate = targetMonth;
    calendarSelectedDate = localDateKey(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), targetDay, 12));
    renderCalendar();
  }

  function renderSettings() {
    const settings = state.settings;
    setFormValue("targetSchool", settings.targetSchool);
    setFormValue("targetProgram", settings.targetProgram);
    setFormValue("examDate", settings.examDate);
    setFormValue("targetEnglish", settings.targetScores.english);
    setFormValue("targetPolitics", settings.targetScores.politics);
    setFormValue("targetMath", settings.targetScores.math);
    setFormValue("targetMaterial", settings.targetScores.material);
    setFormValue("targetTotalDisplay", `${targetScoreTotal()} / 500`);
    $("#lastBackup").textContent = state.meta.lastBackupAt
      ? `上次导出：${new Date(state.meta.lastBackupAt).toLocaleString("zh-CN", { hour12: false })}`
      : "尚未导出过备份";
  }

  function saveSettings(event) {
    event.preventDefault();
    flushPendingDraft();
    if (!validDateKey($("#examDate").value)) {
      showToast("请选择有效的初试日期");
      return;
    }
    const previousSettings = JSON.parse(JSON.stringify(state.settings));
    state.settings.targetSchool = ($("#targetSchool").value.trim() || "目标院校").slice(0, 80);
    state.settings.targetProgram = ($("#targetProgram").value.trim() || "目标方向").slice(0, 80);
    state.settings.examDate = $("#examDate").value;
    state.settings.targetScores = {
      english: clamp(integer($("#targetEnglish").value), 0, 100),
      politics: clamp(integer($("#targetPolitics").value), 0, 100),
      math: clamp(integer($("#targetMath").value), 0, 150),
      material: clamp(integer($("#targetMaterial").value), 0, 150)
    };
    const total = targetScoreTotal();
    if (total > 500) {
      showToast("四科目标合计不能超过 500 分");
      return;
    }
    if (!saveState()) {
      state.settings = previousSettings;
      renderSettings();
      return;
    }
    renderEverything();
    showToast(total === 400 ? "目标已保存" : `目标已保存，当前合计 ${total} 分（原目标为 400）`);
  }

  function renderAllDynamic(loadForm = true) {
    renderHeader();
    renderDateHeading();
    renderTodayMetrics();
    renderTasks();
    if (loadForm) loadCheckinForm();
    renderProgressOverview();
    renderSubjectProgress();
    renderHoursChart();
    renderTimeline();
    renderCalendar();
    renderSettings();
    supabaseSync.render();
  }

  function renderEverything() {
    renderAllDynamic(true);
  }

  function switchDate(date) {
    if (!validDateKey(date)) return;
    flushPendingDraft();
    selectedDate = date;
    calendarSelectedDate = date;
    calendarDate = monthKeyDate(date);
    renderEverything();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function activateTab(tab, updateHash = true) {
    if (!["today", "progress", "calendar", "settings"].includes(tab)) return;
    activeTab = tab;
    $$(".tab-button").forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$(".tab-panel").forEach((panel) => {
      const active = panel.dataset.panel === tab;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
    if (updateHash && window.location.hash !== `#${tab}`) {
      history.replaceState(null, "", `#${tab}`);
    }
    if (updateHash) window.scrollTo({ top: 0, behavior: "auto" });
    if (tab === "calendar") renderCalendar();
    if (tab === "progress") {
      renderProgressOverview();
      renderHoursChart();
    }
  }

  function exportData() {
    flushPendingDraft();
    state.meta.lastBackupAt = new Date().toISOString();
    const stored = saveState();
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `研途考研备份-${localDateKey()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    renderSettings();
    showToast(stored ? "全部数据已导出" : "备份已下载，但浏览器本地存储仍不可用");
  }

  async function importData(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("备份文件过大，请确认选择了正确文件");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const imported = sanitizeState(parsed, false);
      if (!window.confirm("导入会替换当前设备上的任务与打卡。已经导出当前数据后再继续更稳妥。确定导入吗？")) return;
      const previousState = state;
      state = imported;
      if (!saveState()) {
        state = previousState;
        return;
      }
      selectedDate = localDateKey();
      calendarSelectedDate = selectedDate;
      calendarDate = monthKeyDate(selectedDate);
      renderEverything();
      showToast("数据已完整导入");
    } catch (error) {
      showToast(error.message || "无法读取这个备份文件");
    } finally {
      $("#importInput").value = "";
    }
  }

  function updateTargetTotalPreview() {
    const total = ["targetEnglish", "targetPolitics", "targetMath", "targetMaterial"]
      .reduce((sum, id) => sum + integer($(`#${id}`).value), 0);
    $("#targetTotalDisplay").value = `${total} / 500`;
  }

  function handleProgressInput(event) {
    const input = event.target.closest("input[type='range'][data-subject]");
    if (!input) return;
    const subject = input.dataset.subject;
    const value = clamp(integer(input.value), 0, 100);
    const previousValue = state.settings.progress[subject];
    state.settings.progress[subject] = value;
    const row = input.closest(".subject-progress-row");
    $("output", row).textContent = `${value}%`;
    $(".subject-progress-track span", row).style.width = `${value}%`;
    $(".subject-progress-heading span", row).textContent = `${progressStage(value)}阶段 · 目标 ${state.settings.targetScores[subject]} 分`;
    if (!saveState()) {
      state.settings.progress[subject] = previousValue;
      renderSubjectProgress();
      renderProgressOverview();
      return;
    }
    renderProgressOverview();
  }

  function drawMicrostructure() {
    const canvas = $("#microstructure");
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const width = Math.max(280, Math.min(620, Math.round(rect.width * 0.72)));
    const height = Math.max(130, Math.min(240, Math.round(rect.height * 0.72)));
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const context = offscreen.getContext("2d", { alpha: false });
    const image = context.createImageData(width, height);
    const palette = [
      [30, 70, 62], [48, 102, 89], [102, 123, 105], [180, 128, 48],
      [204, 177, 112], [85, 88, 77], [55, 111, 104]
    ];
    let seedValue = 271219;
    const random = () => {
      seedValue = (seedValue * 1664525 + 1013904223) >>> 0;
      return seedValue / 4294967296;
    };
    const points = Array.from({ length: 30 }, (_, index) => ({
      x: random() * width,
      y: random() * height,
      color: palette[index % palette.length],
      bias: random() * 900
    }));
    let offset = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let nearest = Infinity;
        let second = Infinity;
        let chosen = points[0];
        for (const point of points) {
          const dx = x - point.x;
          const dy = y - point.y;
          const distance = dx * dx + dy * dy + point.bias;
          if (distance < nearest) {
            second = nearest;
            nearest = distance;
            chosen = point;
          } else if (distance < second) {
            second = distance;
          }
        }
        const boundary = second - nearest < 280;
        const texture = ((x * 17 + y * 31 + ((x * y) % 19)) % 17) - 8;
        const shade = boundary ? 0.34 : 0.93 + texture / 180;
        image.data[offset] = Math.round(chosen.color[0] * shade);
        image.data[offset + 1] = Math.round(chosen.color[1] * shade);
        image.data[offset + 2] = Math.round(chosen.color[2] * shade);
        image.data[offset + 3] = 255;
        offset += 4;
      }
    }
    context.putImageData(image, 0, 0);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const canvasContext = canvas.getContext("2d");
    canvasContext.imageSmoothingEnabled = true;
    canvasContext.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  }

  function setupDialogs() {
    $$('[data-open-dialog]').forEach((button) => {
      button.addEventListener("click", () => openDialog(button.dataset.openDialog));
    });
    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
    });
    $$("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog.id);
      });
    });
  }

  function setupPwa() {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
    const canUsePwa = window.isSecureContext || isLocalhost;
    if (!canUsePwa) {
      $("#installStatus").textContent = "当前是同一 Wi-Fi 临时预览地址，电脑关闭即失效；发布为 HTTPS 后才能安装和离线使用。";
    } else if (isStandalone) {
      $("#installStatus").textContent = "已作为应用运行，可在断网时打开最近保存的数据。";
    } else if (isIos) {
      const button = $("#installButton");
      button.hidden = false;
      button.textContent = "查看安装方法";
      button.addEventListener("click", () => {
        $("#installInstructions").innerHTML = "<ol><li>用 Safari 打开上线后的网页地址。</li><li>点击浏览器底部的分享按钮。</li><li>选择“添加到主屏幕”，再确认添加。</li></ol>";
        openDialog("installDialog");
      });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      if (!canUsePwa) return;
      event.preventDefault();
      deferredInstallPrompt = event;
      const button = $("#installButton");
      button.hidden = false;
      button.textContent = "安装到此设备";
    });

    $("#installButton").addEventListener("click", async () => {
      if (!deferredInstallPrompt || isIos) return;
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      $("#installButton").hidden = true;
      showToast(result.outcome === "accepted" ? "应用已安装" : "已取消安装");
    });

    window.addEventListener("appinstalled", () => {
      $("#installButton").hidden = true;
      $("#installStatus").textContent = "已安装到此设备，可在断网时打开最近保存的数据。";
    });

    if ("serviceWorker" in navigator && canUsePwa) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          $("#installStatus").textContent = "离线组件暂未启用；通过 HTTPS 或本机服务打开后会自动启用。";
        });
      });
    }
  }

  async function connectSyncFromForm() {
    const button = $("#syncConnectButton");
    const url = $("#syncProjectUrl")?.value;
    const anonKey = $("#syncAnonKey")?.value;
    const email = $("#syncEmail")?.value;
    const password = $("#syncPassword")?.value;
    if (button) button.disabled = true;
    try {
      await supabaseSync.configure(url, anonKey);
      if (String(email || "").trim() && password) {
        await supabaseSync.signIn(email, password);
      } else if (!supabaseSync.currentUser) {
        supabaseSync.setStatus("项目已连接，请填写邮箱和密码后再次登录", "pending");
      }
      showToast(supabaseSync.currentUser ? "云端同步已启用" : "项目已连接");
    } catch (error) {
      supabaseSync.setStatus(`连接失败：${String(error?.message || error).slice(0, 160)}`, "error");
      showToast("云端连接失败，请检查项目地址、公钥和账户");
    } finally {
      if (button) button.disabled = false;
      supabaseSync.render();
    }
  }

  async function signUpFromForm() {
    const button = $("#syncSignUpButton");
    const url = $("#syncProjectUrl")?.value;
    const anonKey = $("#syncAnonKey")?.value;
    const email = $("#syncEmail")?.value;
    const password = $("#syncPassword")?.value;
    if (button) button.disabled = true;
    try {
      await supabaseSync.configure(url, anonKey);
      await supabaseSync.signUp(email, password);
      showToast("注册请求已发送，请检查邮箱验证链接");
    } catch (error) {
      supabaseSync.setStatus(`注册失败：${String(error?.message || error).slice(0, 160)}`, "error");
      showToast("注册失败，请检查邮箱和密码");
    } finally {
      if (button) button.disabled = false;
      supabaseSync.render();
    }
  }

  async function signOutFromForm() {
    try {
      await supabaseSync.signOut();
      showToast("已退出云端，仍可继续离线使用");
    } catch (error) {
      showToast("退出登录失败，请稍后重试");
    }
  }

  function bindEvents() {
    $$(".tab-button").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
    window.addEventListener("hashchange", () => activateTab(location.hash.slice(1) || "today", false));
    $(".brand").addEventListener("click", (event) => {
      event.preventDefault();
      activateTab("today");
    });

    $("#previousDay").addEventListener("click", () => switchDate(addDays(selectedDate, -1)));
    $("#nextDay").addEventListener("click", () => switchDate(addDays(selectedDate, 1)));
    $("#todayButton").addEventListener("click", () => switchDate(localDateKey()));
    $("#focusTimerButton").addEventListener("click", () => {
      renderFocusTimer();
      openDialog("focusDialog");
    });
    $("#focusStartButton").addEventListener("click", startFocusTimer);
    $("#focusResetButton").addEventListener("click", resetFocusTimer);
    $("#focusPreset").addEventListener("change", resetFocusTimer);
    $("#addTaskButton").addEventListener("click", () => openTaskEditor());
    $("#generatePlanButton").addEventListener("click", generatePlan);
    $("#taskForm").addEventListener("submit", saveTaskFromDialog);
    $("#deleteTaskButton").addEventListener("click", deleteCurrentTask);
    $("#taskList").addEventListener("click", (event) => {
      const taskElement = event.target.closest(".task-item");
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!taskElement || !action) return;
      if (action === "toggle") toggleTask(taskElement.dataset.id);
      if (action === "edit") openTaskEditor(taskElement.dataset.id);
    });

    $("#checkinForm").addEventListener("submit", saveCheckin);
    $("#checkinForm").addEventListener("input", saveDraftSoon);
    $("#generateCheckinButton").addEventListener("click", generateCheckinText);
    $("#copyCheckinButton").addEventListener("click", copyCheckinText);
    $("#shareCheckinButton").addEventListener("click", shareCheckinText);
    $("#subjectProgressList").addEventListener("input", handleProgressInput);

    $("#previousMonth").addEventListener("click", () => {
      shiftCalendarMonth(-1);
    });
    $("#nextMonth").addEventListener("click", () => {
      shiftCalendarMonth(1);
    });
    $("#currentMonthButton").addEventListener("click", () => {
      calendarDate = monthKeyDate(localDateKey());
      calendarSelectedDate = localDateKey();
      renderCalendar();
    });
    $("#calendarGrid").addEventListener("click", (event) => {
      const day = event.target.closest(".calendar-day");
      if (!day) return;
      calendarSelectedDate = day.dataset.date;
      const selectedMonth = monthKeyDate(calendarSelectedDate);
      if (selectedMonth.getMonth() !== calendarDate.getMonth() || selectedMonth.getFullYear() !== calendarDate.getFullYear()) {
        calendarDate = selectedMonth;
      }
      renderCalendar();
    });
    $("#openSelectedDayButton").addEventListener("click", () => {
      switchDate(calendarSelectedDate);
      activateTab("today");
    });

    $("#settingsForm").addEventListener("submit", saveSettings);
    ["targetEnglish", "targetPolitics", "targetMath", "targetMaterial"].forEach((id) => {
      $(`#${id}`).addEventListener("input", updateTargetTotalPreview);
    });
    $("#exportButton").addEventListener("click", exportData);
    $("#importInput").addEventListener("change", (event) => importData(event.target.files?.[0]));
    $("#syncForm").addEventListener("submit", (event) => {
      event.preventDefault();
      connectSyncFromForm();
    });
    $("#syncSignUpButton").addEventListener("click", signUpFromForm);
    $("#syncSignOutButton").addEventListener("click", signOutFromForm);
    $("#syncUseCloudButton").addEventListener("click", () => {
      supabaseSync.useCloudVersion().catch(() => showToast("云端版本应用失败，请稍后重试"));
    });
    $("#syncKeepLocalButton").addEventListener("click", () => {
      supabaseSync.keepLocalVersion().catch(() => showToast("本机版本上传失败，仍保留本地数据"));
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(drawMicrostructure, 180);
    });
    window.addEventListener("pagehide", flushPendingDraft);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPendingDraft();
    });
  }

  function initialize() {
    renderStudyRows();
    setupDialogs();
    bindEvents();
    setupPwa();
    restoreFocusTimer();
    renderEverything();
    supabaseSync.init();
    activateTab(["today", "progress", "calendar", "settings"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "today", false);
    window.requestAnimationFrame(drawMicrostructure);
    if (storageRecovered) showToast("原本地数据无法读取，已恢复为初始看板；可用备份重新导入");
  }

  initialize();
})();
