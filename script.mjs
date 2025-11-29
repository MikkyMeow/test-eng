import { defaultCollectionData } from "./data.mjs";

let collections = [];
let phrases = [];
let currentCollectionIndex = 0;
let currentIndex = 0;
let isPlaying = false;
let currentUtterance = null;
let russianEnabled = true;
let englishRate = 1;
let listenStats = [];

const LISTEN_STATS_KEY = "phraseListenStats";
const STAT_ARRAY_LIMIT = 20;
const THEME_STORAGE_KEY = "phraseTheme";
const totalPhraseCount = defaultCollectionData.reduce(
  (sum, collection) =>
    sum + (Array.isArray(collection.phrases) ? collection.phrases.length : 0),
  0
);
const MAX_LISTENS = totalPhraseCount * STAT_ARRAY_LIMIT;

const engEl = document.getElementById("eng");
const rusEl = document.getElementById("rus");
const prevBtn = document.getElementById("prevBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const ruToggle = document.getElementById("ruToggle");
const collectionSelect = document.getElementById("collectionSelect");
const phraseListEl = document.getElementById("phraseList");
const rateDownBtn = document.getElementById("rateDownBtn");
const rateUpBtn = document.getElementById("rateUpBtn");
const rateDisplay = document.getElementById("rateDisplay");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const progressBarEl = document.getElementById("progressBar");
const progressLabelEl = document.getElementById("progressLabel");

function hasPhrases() {
  return phrases.length > 0;
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === "dark" ? "Light theme" : "Dark theme";
  }
}

function initializeTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  applyTheme(initialTheme);
}

function getTotalListens() {
  return listenStats.reduce((collectionSum, stats = []) => {
    return (
      collectionSum +
      stats.reduce(
        (phraseSum, value) => phraseSum + Math.min(value || 0, STAT_ARRAY_LIMIT),
        0
      )
    );
  }, 0);
}

function updateProgressBar() {
  if (!progressBarEl) {
    return;
  }

  const total = getTotalListens();
  const percent = MAX_LISTENS > 0 ? (total / MAX_LISTENS) * 100 : 0;
  progressBarEl.style.width = `${Math.min(percent, 100)}%`;

  if (progressLabelEl) {
    progressLabelEl.textContent = `Listening progress: ${total} / ${MAX_LISTENS}`;
  }
}

function clonePhraseList(list = []) {
  return list.map((phrase) => ({
    eng: phrase.eng,
    rus: phrase.rus
  }));
}

function initializeCollections() {
  collections = defaultCollectionData.map((collection) => ({
    name: collection.name || "Unnamed collection",
    phrases: clonePhraseList(collection.phrases)
  }));
}

function ensureCollectionStats(index, phraseCount) {
  const existing = Array.isArray(listenStats[index]) ? listenStats[index] : [];
  const normalized = new Array(STAT_ARRAY_LIMIT).fill(0);
  const limit = Math.min(phraseCount, STAT_ARRAY_LIMIT);

  for (let i = 0; i < limit; i++) {
    normalized[i] = Number.isFinite(existing[i]) ? existing[i] : 0;
  }

  listenStats[index] = normalized;
}

function ensureAllCollectionStats() {
  collections.forEach((collection, index) => {
    ensureCollectionStats(index, collection.phrases.length);
  });
}

function loadStats() {
  try {
    const stored = window.localStorage.getItem(LISTEN_STATS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    listenStats = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load stats:", error);
    listenStats = [];
  }

  ensureAllCollectionStats();
  updateProgressBar();
}

function saveStats() {
  try {
    window.localStorage.setItem(LISTEN_STATS_KEY, JSON.stringify(listenStats));
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
}

function incrementListenCount(collectionIndex, phraseIndex) {
  if (!listenStats[collectionIndex]) {
    ensureCollectionStats(
      collectionIndex,
      collections[collectionIndex]?.phrases.length || 0
    );
  }

  const stats = listenStats[collectionIndex];
  if (!stats || phraseIndex < 0 || phraseIndex >= STAT_ARRAY_LIMIT) {
    return;
  }

  if (stats[phraseIndex] >= STAT_ARRAY_LIMIT) {
    return;
  }

  stats[phraseIndex] = (stats[phraseIndex] || 0) + 1;
  saveStats();
}

function updateCollectionOptions() {
  collectionSelect.innerHTML = "";
  collections.forEach((collection, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = collection.name;
    collectionSelect.appendChild(option);
  });
  collectionSelect.value = currentCollectionIndex;
}

function updatePhraseView() {
  if (!hasPhrases()) {
    engEl.textContent = "No phrases";
    rusEl.textContent = "Select a collection";
    return;
  }

  if (currentIndex >= phrases.length) {
    currentIndex = 0;
  }

  const phrase = phrases[currentIndex];
  engEl.textContent = phrase.eng;
  rusEl.textContent = phrase.rus;
}

function updatePhraseList() {
  phraseListEl.innerHTML = "";

  if (!hasPhrases()) {
    const placeholder = document.createElement("div");
    placeholder.className = "phrase-placeholder";
    placeholder.textContent = "This collection has no phrases yet.";
    phraseListEl.appendChild(placeholder);
    updateProgressBar();
    return;
  }

  const currentStats = listenStats[currentCollectionIndex] || [];

  phrases.forEach((phrase, index) => {
    const item = document.createElement("div");
    item.className = "phrase-item";

    const textWrapper = document.createElement("div");
    textWrapper.className = "phrase-text";

    const engSpan = document.createElement("strong");
    engSpan.textContent = phrase.eng;

    const rusSpan = document.createElement("span");
    rusSpan.textContent = phrase.rus;

    const statsSpan = document.createElement("span");
    statsSpan.className = "phrase-count";
    const count = currentStats[index] || 0;
    statsSpan.textContent = `Listened: ${count}`;
    const isComplete = count >= STAT_ARRAY_LIMIT;
    textWrapper.classList.toggle("completed", isComplete);
    textWrapper.append(engSpan, rusSpan, statsSpan);
    item.appendChild(textWrapper);
    phraseListEl.appendChild(item);
  });

  updateProgressBar();
}

function updatePlayButton() {
  if (!playPauseBtn) {
    return;
  }

  playPauseBtn.textContent = isPlaying ? "⏸" : "▶";
  playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  playPauseBtn.disabled = !hasPhrases();
}

function updateRateDisplay() {
  rateDisplay.textContent = `${englishRate.toFixed(1)}x`;
}

function adjustRate(delta) {
  const nextRate = Math.round((englishRate + delta) * 10) / 10;
  englishRate = Math.min(2, Math.max(0.5, nextRate));
  updateRateDisplay();
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  isPlaying = false;
  currentUtterance = null;
  updatePlayButton();
}

function setCurrentCollection(index) {
  if (index < 0 || index >= collections.length) {
    return;
  }

  ensureCollectionStats(index, collections[index].phrases.length);

  stopSpeech();
  currentCollectionIndex = index;
  phrases = collections[index].phrases;
  currentIndex = 0;
  updateCollectionOptions();
  updatePhraseView();
  updatePhraseList();
  updatePlayButton();
}

function onPhraseComplete() {
  if (!isPlaying) {
    updatePlayButton();
    return;
  }

  if (!hasPhrases()) {
    isPlaying = false;
    updatePlayButton();
    return;
  }

  currentIndex = (currentIndex + 1) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase({ skipStop: true });
}

function speakCurrentPhrase(options = {}) {
  if (!hasPhrases()) {
    isPlaying = false;
    updatePlayButton();
    return;
  }

  if (!options.skipStop) {
    stopSpeech();
  }

  russianEnabled = ruToggle.checked;
  const phrase = phrases[currentIndex];
  const engUtter = new SpeechSynthesisUtterance(phrase.eng);
  engUtter.lang = "en-US";
  engUtter.rate = englishRate;

  engUtter.onend = () => {
    const pauseUtter = new SpeechSynthesisUtterance(phrase.eng);
    pauseUtter.lang = "en-US";
    pauseUtter.rate = englishRate;
    pauseUtter.volume = 0;

    pauseUtter.onend = () => {
      incrementListenCount(currentCollectionIndex, currentIndex);
      updatePhraseList();

      if (!hasPhrases()) {
        onPhraseComplete();
        return;
      }

      if (!russianEnabled) {
        onPhraseComplete();
        return;
      }

      const ruUtter = new SpeechSynthesisUtterance(phrase.rus);
      ruUtter.lang = "ru-RU";
      ruUtter.rate = 1;
      ruUtter.onend = () => {
        onPhraseComplete();
      };
      currentUtterance = ruUtter;
      window.speechSynthesis.speak(ruUtter);
    };

    currentUtterance = pauseUtter;
    window.speechSynthesis.speak(pauseUtter);
  };

  currentUtterance = engUtter;
  isPlaying = true;
  updatePlayButton();
  window.speechSynthesis.speak(engUtter);
}

prevBtn.addEventListener("click", () => {
  if (!hasPhrases()) {
    return;
  }

  currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase();
});

nextBtn.addEventListener("click", () => {
  if (!hasPhrases()) {
    return;
  }

  currentIndex = (currentIndex + 1) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase();
});

playPauseBtn.addEventListener("click", () => {
  const synth = window.speechSynthesis;

  if (synth.paused && currentUtterance) {
    synth.resume();
    isPlaying = true;
    updatePlayButton();
    return;
  }

  if (isPlaying) {
    synth.pause();
    isPlaying = false;
    updatePlayButton();
    return;
  }

  speakCurrentPhrase();
});

collectionSelect.addEventListener("change", () => {
  const index = Number(collectionSelect.value);
  if (!Number.isNaN(index)) {
    setCurrentCollection(index);
  }
});

ruToggle.addEventListener("change", () => {
  russianEnabled = ruToggle.checked;
});

rateDownBtn.addEventListener("click", () => adjustRate(-0.1));
rateUpBtn.addEventListener("click", () => adjustRate(0.1));

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

initializeTheme();
initializeCollections();
loadStats();
setCurrentCollection(0);
updateRateDisplay();
