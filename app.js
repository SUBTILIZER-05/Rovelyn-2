// Simple subject/chapter/task tracker logic

const STORAGE_KEY = "subjectTrackerSubjects";

// Core data structure
let subjects = {
  physics: [],
  chemistry: [],
  maths: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    ["physics", "chemistry", "maths"].forEach((key) => {
      if (Array.isArray(parsed[key])) {
        subjects[key] = parsed[key].map((chapter) => ({
          name: typeof chapter.name === "string" ? chapter.name : "Untitled chapter",
          tasks: Array.isArray(chapter.tasks)
            ? chapter.tasks.map((task) => ({
                name: typeof task.name === "string" ? task.name : "Task",
                xp: Number(task.xp) || 0,
                completed: Boolean(task.completed),
              }))
            : [],
        }));
      }
    });
  } catch (err) {
    console.error("Failed to load state from localStorage", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch (err) {
    console.error("Failed to save state to localStorage", err);
  }
}

function calculateOverallXp() {
  let earned = 0;
  let max = 0;

  Object.keys(subjects).forEach((subjectKey) => {
    subjects[subjectKey].forEach((chapter) => {
      chapter.tasks.forEach((task) => {
        const xp = Number(task.xp) || 0;
        max += xp;
        if (task.completed) {
          earned += xp;
        }
      });
    });
  });

  return { earned, max };
}

function calculateSubjectXp(subjectKey) {
  let earned = 0;
  let max = 0;

  const chapters = subjects[subjectKey] || [];

  chapters.forEach((chapter) => {
    chapter.tasks.forEach((task) => {
      const xp = Number(task.xp) || 0;
      max += xp;
      if (task.completed) {
        earned += xp;
      }
    });
  });

  return { earned, max };
}

// Public helper with requested name/signature
function calculateSubjectXP(subjectName) {
  return calculateSubjectXp(subjectName);
}

function updateOverallXpText() {
  const overallXpEl = document.getElementById("overall-xp");
  if (!overallXpEl) return;

  const { earned, max } = calculateOverallXp();
  overallXpEl.textContent = `${earned} / ${max}`;
}

function updateSubjectXpDisplays() {
  const containers = document.querySelectorAll(".subject-progress");

  containers.forEach((container) => {
    const subjectKey = container.dataset.subject;
    if (!subjectKey) return;

    const { earned, max } = calculateSubjectXp(subjectKey);

    const textEl = container.querySelector(".subject-progress-text");
    if (textEl) {
      textEl.textContent = `${earned} / ${max} XP`;
    }

    const barEl = container.querySelector(".subject-progress-bar");
    if (barEl) {
      const percent = max > 0 ? (earned / max) * 100 : 0;
      barEl.style.width = `${percent}%`;
    }
  });
}

function updateOverallProgressBar() {
  const bar = document.getElementById("overall-progress-bar");
  if (!bar) return;

  const { earned, max } = calculateOverallXp();
  const percent = max > 0 ? (earned / max) * 100 : 0;
  bar.style.width = `${percent}%`;
}

function renameChapter(subjectKey, chapterIndex) {
  const chapter = subjects[subjectKey] && subjects[subjectKey][chapterIndex];
  if (!chapter) return;

  const newName = window.prompt("Rename chapter:", chapter.name);
  if (!newName) return;

  chapter.name = newName;
  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function deleteChapter(subjectKey, chapterIndex) {
  const chapters = subjects[subjectKey];
  if (!chapters || !chapters[chapterIndex]) return;

  const confirmDelete = window.confirm("Delete this chapter and all its tasks?");
  if (!confirmDelete) return;

  chapters.splice(chapterIndex, 1);
  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function renameTask(subjectKey, chapterIndex, taskIndex) {
  const chapter = subjects[subjectKey] && subjects[subjectKey][chapterIndex];
  if (!chapter || !chapter.tasks[taskIndex]) return;

  const task = chapter.tasks[taskIndex];
  const newName = window.prompt("Rename task:", task.name);
  if (!newName) return;

  task.name = newName;
  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function editTaskXp(subjectKey, chapterIndex, taskIndex) {
  const chapter = subjects[subjectKey] && subjects[subjectKey][chapterIndex];
  if (!chapter || !chapter.tasks[taskIndex]) return;

  const task = chapter.tasks[taskIndex];
  const xpInput = window.prompt("Edit XP for this task:", String(task.xp));
  if (xpInput === null) return;

  const xp = Number(xpInput);
  if (!Number.isFinite(xp) || xp < 0) {
    window.alert("Please enter a valid non-negative number for XP.");
    return;
  }

  task.xp = xp;
  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function editTask(subjectKey, chapterIndex, taskIndex) {
  const chapter = subjects[subjectKey] && subjects[subjectKey][chapterIndex];
  if (!chapter || !chapter.tasks[taskIndex]) return;

  const task = chapter.tasks[taskIndex];

  const newName = window.prompt("Edit task name:", task.name);
  if (newName && newName.trim() !== "") {
    task.name = newName.trim();
  }

  const xpInput = window.prompt("Edit XP for this task:", String(task.xp));
  if (xpInput !== null) {
    const xp = Number(xpInput);
    if (!Number.isFinite(xp) || xp < 0) {
      window.alert("Please enter a valid non-negative number for XP.");
    } else {
      task.xp = xp;
    }
  }

  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function deleteTask(subjectKey, chapterIndex, taskIndex) {
  const chapter = subjects[subjectKey] && subjects[subjectKey][chapterIndex];
  if (!chapter || !chapter.tasks[taskIndex]) return;

  const confirmDelete = window.confirm("Delete this task?");
  if (!confirmDelete) return;

  chapter.tasks.splice(taskIndex, 1);
  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function handleAddTask(subjectKey, chapterIndex) {
  const name = window.prompt("Enter task name:");
  if (!name) return;

  const xpInput = window.prompt("Enter XP for this task:", "0");
  if (xpInput === null) return;

  const xp = Number(xpInput);
  if (!Number.isFinite(xp) || xp < 0) {
    window.alert("Please enter a valid non-negative number for XP.");
    return;
  }

  const chapter = subjects[subjectKey][chapterIndex];
  if (!chapter) return;

  chapter.tasks.push({
    name,
    xp,
    completed: false,
  });

  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

// Ensure only one kebab menu is open at a time
function closeAllKebabMenus(exceptMenuList) {
  const openMenus = document.querySelectorAll(".kebab-menu-list:not([hidden])");
  openMenus.forEach((listEl) => {
    if (listEl === exceptMenuList) return;
    listEl.hidden = true;
    const parentMenu = listEl.parentElement;
    if (!parentMenu) return;
    const btn = parentMenu.querySelector(".kebab-menu-button");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

function createTaskElement(subjectKey, chapterIndex, task, taskIndex) {
  const li = document.createElement("li");
  li.className = "task";

  const label = document.createElement("label");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.completed);

  checkbox.addEventListener("change", () => {
    const chapter = subjects[subjectKey][chapterIndex];
    if (!chapter || !chapter.tasks[taskIndex]) return;

    chapter.tasks[taskIndex].completed = checkbox.checked;
    saveState();
    updateOverallXpText();
    updateOverallProgressBar();
    updateSubjectXpDisplays();
  });

  const text = document.createTextNode(` ${task.name} (XP: ${task.xp})`);

  label.appendChild(checkbox);
  label.appendChild(text);
  li.appendChild(label);

  const controls = document.createElement("div");
  controls.className = "task-controls";

  const menu = document.createElement("div");
  menu.className = "kebab-menu";

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "kebab-menu-button";
  menuButton.setAttribute("aria-haspopup", "true");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  const taskDots = document.createElement("span");
  taskDots.className = "kebab-dots";
  taskDots.setAttribute("aria-hidden", "true");
  [1, 2, 3].forEach(() => {
    const d = document.createElement("span");
    taskDots.appendChild(d);
  });
  menuButton.appendChild(taskDots);

  const menuList = document.createElement("div");
  menuList.className = "kebab-menu-list";
  menuList.hidden = true;

  function closeMenu() {
    menuList.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(event) {
    if (menu.contains(event.target)) return;
    closeMenu();
  }

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = menuList.hidden;
    if (willOpen) {
      closeAllKebabMenus(menuList);
    }
    menuList.hidden = !willOpen;
    menuButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (willOpen) {
      setTimeout(() => document.addEventListener("click", handleOutsideClick), 0);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }
  });

  const renameItem = document.createElement("button");
  renameItem.type = "button";
  renameItem.className = "kebab-menu-item";
  renameItem.textContent = "Rename";
  renameItem.addEventListener("click", () => {
    renameTask(subjectKey, chapterIndex, taskIndex);
    closeMenu();
  });

  const editXpItem = document.createElement("button");
  editXpItem.type = "button";
  editXpItem.className = "kebab-menu-item";
  editXpItem.textContent = "Edit XP";
  editXpItem.addEventListener("click", () => {
    editTaskXp(subjectKey, chapterIndex, taskIndex);
    closeMenu();
  });

  const deleteItem = document.createElement("button");
  deleteItem.type = "button";
  deleteItem.className = "kebab-menu-item";
  deleteItem.textContent = "Delete";
  deleteItem.addEventListener("click", () => {
    deleteTask(subjectKey, chapterIndex, taskIndex);
    closeMenu();
  });

  menuList.appendChild(renameItem);
  menuList.appendChild(editXpItem);
  menuList.appendChild(deleteItem);

  menu.appendChild(menuButton);
  menu.appendChild(menuList);

  controls.appendChild(menu);
  li.appendChild(controls);

  return li;
}

function createChapterElement(subjectKey, chapter, chapterIndex) {
  const article = document.createElement("article");
  article.className = "chapter";

  const header = document.createElement("div");
  header.className = "chapter-header";

  const title = document.createElement("h3");
  title.textContent = chapter.name;

  const chapterActions = document.createElement("div");
  chapterActions.className = "chapter-header-actions";

  const menu = document.createElement("div");
  menu.className = "kebab-menu";

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "kebab-menu-button";
  menuButton.setAttribute("aria-haspopup", "true");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  const chapterDots = document.createElement("span");
  chapterDots.className = "kebab-dots";
  chapterDots.setAttribute("aria-hidden", "true");
  [1, 2, 3].forEach(() => {
    const d = document.createElement("span");
    chapterDots.appendChild(d);
  });
  menuButton.appendChild(chapterDots);

  const menuList = document.createElement("div");
  menuList.className = "kebab-menu-list";
  menuList.hidden = true;

  function closeMenu() {
    menuList.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(event) {
    if (menu.contains(event.target)) return;
    closeMenu();
  }

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = menuList.hidden;
    if (willOpen) {
      closeAllKebabMenus(menuList);
    }
    menuList.hidden = !willOpen;
    menuButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (willOpen) {
      setTimeout(() => document.addEventListener("click", handleOutsideClick), 0);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }
  });

  const renameItem = document.createElement("button");
  renameItem.type = "button";
  renameItem.className = "kebab-menu-item";
  renameItem.textContent = "Rename";
  renameItem.addEventListener("click", () => {
    renameChapter(subjectKey, chapterIndex);
    closeMenu();
  });

  const deleteItem = document.createElement("button");
  deleteItem.type = "button";
  deleteItem.className = "kebab-menu-item";
  deleteItem.textContent = "Delete";
  deleteItem.addEventListener("click", () => {
    deleteChapter(subjectKey, chapterIndex);
    closeMenu();
  });

  menuList.appendChild(renameItem);
  menuList.appendChild(deleteItem);

  menu.appendChild(menuButton);
  menu.appendChild(menuList);

  chapterActions.appendChild(menu);

  header.appendChild(title);
  header.appendChild(chapterActions);

  article.appendChild(header);

  const addTaskBtn = document.createElement("button");
  addTaskBtn.type = "button";
  addTaskBtn.className = "add-task-button";
  addTaskBtn.textContent = "Add Task";
  addTaskBtn.addEventListener("click", () => {
    handleAddTask(subjectKey, chapterIndex);
  });
  article.appendChild(addTaskBtn);

  const taskList = document.createElement("ul");
  taskList.className = "tasks";

  chapter.tasks.forEach((task, taskIndex) => {
    const taskEl = createTaskElement(subjectKey, chapterIndex, task, taskIndex);
    taskList.appendChild(taskEl);
  });

  article.appendChild(taskList);

  return article;
}

function renderSubjects() {
  ["physics", "chemistry", "maths"].forEach((subjectKey) => {
    const container = document.getElementById(`${subjectKey}-chapters`);
    if (!container) return;

    // Clear existing content
    container.textContent = "";

    subjects[subjectKey].forEach((chapter, index) => {
      const chapterEl = createChapterElement(subjectKey, chapter, index);
      container.appendChild(chapterEl);
    });
  });
}

function handleAddChapterClick(event) {
  const subjectKey = event.currentTarget.dataset.subject;
  if (!subjectKey || !subjects[subjectKey]) return;

  const name = window.prompt(`Enter chapter name for ${subjectKey}:`);
  if (!name) return;

  subjects[subjectKey].push({
    name,
    tasks: [],
  });

  saveState();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
}

function bindAddChapterButtons() {
  const buttons = document.querySelectorAll(".add-chapter-button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", handleAddChapterClick);
  });
}

const STOPWATCH_STORAGE_KEY = "stopwatchSessions";

let stopwatchElapsedMs = 0;
let stopwatchStartTime = null;
let stopwatchAnimationId = null;

function stopwatchFormat(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stopwatchTick() {
  if (stopwatchStartTime === null) return;
  stopwatchElapsedMs = Date.now() - stopwatchStartTime;
  const display = document.getElementById("stopwatch-display");
  if (display) display.textContent = stopwatchFormat(stopwatchElapsedMs);
  stopwatchAnimationId = requestAnimationFrame(stopwatchTick);
}

function stopwatchStart() {
  if (stopwatchStartTime !== null) return;
  stopwatchStartTime = Date.now() - stopwatchElapsedMs;
  stopwatchTick();
}

function stopwatchPause() {
  if (stopwatchStartTime === null) return;
  cancelAnimationFrame(stopwatchAnimationId);
  stopwatchStartTime = null;
}

function stopwatchReset() {
  const wasRunning = stopwatchStartTime !== null;
  stopwatchPause();
  if (stopwatchElapsedMs > 0) {
    stopwatchSaveSession(stopwatchElapsedMs);
  }
  stopwatchElapsedMs = 0;
  const display = document.getElementById("stopwatch-display");
  if (display) display.textContent = "00:00";
}

function stopwatchSaveSession(durationMs) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  const session = {
    id: String(Date.now()),
    durationMs,
    date: dateStr,
    time: timeStr,
    timestamp: now.getTime(),
  };
  const list = JSON.parse(localStorage.getItem(STOPWATCH_STORAGE_KEY) || "[]");
  list.unshift(session);
  localStorage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(list));
  stopwatchRenderHistory();
}

function stopwatchGetSessions() {
  return JSON.parse(localStorage.getItem(STOPWATCH_STORAGE_KEY) || "[]");
}

function stopwatchDeleteSession(id) {
  const list = stopwatchGetSessions().filter((s) => s.id !== id);
  localStorage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(list));
  stopwatchRenderHistory();
}

function stopwatchDateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function stopwatchRenderHistory() {
  const listEl = document.getElementById("stopwatch-history-list");
  if (!listEl) return;
  const sessions = stopwatchGetSessions();
  const byDate = {};
  sessions.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  listEl.textContent = "";
  sortedDates.forEach((dateStr) => {
    const groupLabel = document.createElement("li");
    groupLabel.className = "stopwatch-history-group-label";
    groupLabel.textContent = stopwatchDateLabel(dateStr);
    listEl.appendChild(groupLabel);
    byDate[dateStr].forEach((session) => {
      const li = document.createElement("li");
      li.className = "stopwatch-history-item";
      li.dataset.sessionId = session.id;
      const content = document.createElement("div");
      content.className = "stopwatch-history-item-content";
      const duration = document.createElement("div");
      duration.className = "stopwatch-history-item-duration";
      duration.textContent = stopwatchFormat(session.durationMs);
      const meta = document.createElement("div");
      meta.className = "stopwatch-history-item-meta";
      meta.textContent = `${session.date} · ${session.time}`;
      content.appendChild(duration);
      content.appendChild(meta);
      li.appendChild(content);
      const actions = document.createElement("div");
      actions.className = "stopwatch-history-item-actions";
      const menu = document.createElement("div");
      menu.className = "kebab-menu";
      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "kebab-menu-button";
      menuBtn.setAttribute("aria-haspopup", "true");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      const dots = document.createElement("span");
      dots.className = "kebab-dots";
      dots.setAttribute("aria-hidden", "true");
      [1, 2, 3].forEach(() => dots.appendChild(document.createElement("span")));
      menuBtn.appendChild(dots);
      const menuList = document.createElement("div");
      menuList.className = "kebab-menu-list";
      menuList.hidden = true;
      function closeMenu() {
        menuList.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", handleOutside);
      }
      function handleOutside(e) {
        if (menu.contains(e.target)) return;
        closeMenu();
      }
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menuList.hidden;
        document.querySelectorAll(".kebab-menu-list").forEach((el) => {
          if (el !== menuList) el.hidden = true;
        });
        menuList.hidden = !open;
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) setTimeout(() => document.addEventListener("click", handleOutside), 0);
        else document.removeEventListener("click", handleOutside);
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "kebab-menu-item";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        stopwatchDeleteSession(session.id);
        closeMenu();
      });
      menuList.appendChild(deleteBtn);
      menu.appendChild(menuBtn);
      menu.appendChild(menuList);
      actions.appendChild(menu);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  });
}

function initStopwatch() {
  const display = document.getElementById("stopwatch-display");
  if (!display) return;
  display.textContent = stopwatchFormat(stopwatchElapsedMs);
  const startBtn = document.getElementById("stopwatch-start");
  const pauseBtn = document.getElementById("stopwatch-pause");
  const resetBtn = document.getElementById("stopwatch-reset");
  const endBtn = document.getElementById("stopwatch-end-session");
  if (startBtn) startBtn.addEventListener("click", stopwatchStart);
  if (pauseBtn) pauseBtn.addEventListener("click", stopwatchPause);
  if (resetBtn) resetBtn.addEventListener("click", () => { stopwatchReset(); });
  if (endBtn) {
    endBtn.addEventListener("click", () => {
      if (stopwatchStartTime !== null) {
        stopwatchElapsedMs = Date.now() - stopwatchStartTime;
        stopwatchPause();
      }
      if (stopwatchElapsedMs > 0) {
        stopwatchSaveSession(stopwatchElapsedMs);
        stopwatchElapsedMs = 0;
        if (display) display.textContent = "00:00";
      }
    });
  }
  stopwatchRenderHistory();
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  document.getElementById("sidebar").setAttribute("aria-hidden", "false");
  document.getElementById("sidebar-overlay").setAttribute("aria-hidden", "false");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  document.getElementById("sidebar").setAttribute("aria-hidden", "true");
  document.getElementById("sidebar-overlay").setAttribute("aria-hidden", "true");
}

function showSection(sectionId) {
  document.body.setAttribute("data-current-section", sectionId);
}

function initNav() {
  const hamburger = document.getElementById("hamburger");
  const overlay = document.getElementById("sidebar-overlay");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
      const isOpen = document.body.classList.contains("sidebar-open");
      document.getElementById("sidebar").setAttribute("aria-hidden", String(!isOpen));
      document.getElementById("sidebar-overlay").setAttribute("aria-hidden", String(!isOpen));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      if (section) {
        showSection(section);
        closeSidebar();
      }
    });
  });
}

function init() {
  loadState();
  bindAddChapterButtons();
  renderSubjects();
  updateOverallXpText();
  updateOverallProgressBar();
  updateSubjectXpDisplays();
  initNav();
  initStopwatch();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

