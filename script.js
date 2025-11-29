const LOCAL_STORAGE_KEY = "phraseCollections";

const defaultCollectionData = {
  name: "Базовая коллекция",
  phrases: [
    { eng: "I'm here", rus: "Я здесь" },
    { eng: "I'm coming", rus: "Я иду" },
    { eng: "I'm leaving", rus: "Я ухожу" },
    { eng: "I'm ready", rus: "Я готов" },
    { eng: "Not now", rus: "Не сейчас" },
    { eng: "Right now", rus: "Прямо сейчас" },
    { eng: "One second", rus: "Секундочку" },
    { eng: "Wait for me", rus: "Подожди меня" },
    { eng: "Come here", rus: "Иди сюда" },
    { eng: "Go ahead", rus: "Действуй" },
    { eng: "I don't know", rus: "Я не знаю" },
    { eng: "I don't care", rus: "Мне все равно" },
    { eng: "I don't mind", rus: "Я не против" },
    { eng: "I don't understand", rus: "Я не понимаю" },
    { eng: "I got it", rus: "Понял" },
    { eng: "I see", rus: "Понимаю" },
    { eng: "It's fine", rus: "Все в порядке" },
    { eng: "Sounds good", rus: "Хорошо звучит" },
    { eng: "Take it easy", rus: "Не переживай" },
    { eng: "Here you go", rus: "Вот, держи" }
  ]
};

let collections = [];
let phrases = [];
let currentCollectionIndex = 0;
let currentIndex = 0;
let isPlaying = false;
let currentUtterance = null;
let russianEnabled = true;

const engEl = document.getElementById("eng");
const rusEl = document.getElementById("rus");
const prevBtn = document.getElementById("prevBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const ruToggle = document.getElementById("ruToggle");
const collectionSelect = document.getElementById("collectionSelect");
const newCollectionName = document.getElementById("newCollectionName");
const addCollectionBtn = document.getElementById("addCollectionBtn");
const deleteCollectionBtn = document.getElementById("deleteCollectionBtn");
const saveCollectionBtn = document.getElementById("saveCollectionBtn");
const phraseListEl = document.getElementById("phraseList");
const newEngInput = document.getElementById("newEngInput");
const newRusInput = document.getElementById("newRusInput");
const addPhraseBtn = document.getElementById("addPhraseBtn");

function hasPhrases() {
  return phrases.length > 0;
}

function deepCopyPhrases(list) {
  return list.map((phrase) => ({ eng: phrase.eng, rus: phrase.rus }));
}

function loadCollections() {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        collections = parsed.map((collection) => ({
          name: collection.name || "Без названия",
          phrases: Array.isArray(collection.phrases)
            ? deepCopyPhrases(collection.phrases)
            : []
        }));
        return;
      }
    }
  } catch (error) {
    console.error("Не удалось загрузить коллекции:", error);
  }

  collections = [
    {
      name: defaultCollectionData.name,
      phrases: deepCopyPhrases(defaultCollectionData.phrases)
    }
  ];
  saveCollections();
}

function saveCollections() {
  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(collections)
    );
  } catch (error) {
    console.error("Не удалось сохранить коллекции:", error);
  }
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
    engEl.textContent = "Коллекция пуста";
    rusEl.textContent = "Добавьте фразы справа";
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
    const empty = document.createElement("div");
    empty.className = "phrase-item";
    empty.textContent = "В этой коллекции пока нет фраз";
    phraseListEl.appendChild(empty);
    return;
  }

  phrases.forEach((phrase, index) => {
    const item = document.createElement("div");
    item.className = "phrase-item";

    const textWrapper = document.createElement("div");
    textWrapper.className = "phrase-text";
    const engSpan = document.createElement("strong");
    engSpan.textContent = phrase.eng;
    const rusSpan = document.createElement("span");
    rusSpan.textContent = phrase.rus;
    textWrapper.append(engSpan, rusSpan);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => removePhrase(index));

    item.append(textWrapper, deleteButton);
    phraseListEl.appendChild(item);
  });
}

function updatePlayButton() {
  playPauseBtn.textContent = isPlaying ? "Пауза" : "Говорить";
  playPauseBtn.disabled = !hasPhrases();
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
  engUtter.rate = 1;

  engUtter.onend = () => {
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

  currentUtterance = engUtter;
  isPlaying = true;
  updatePlayButton();
  window.speechSynthesis.speak(engUtter);
  engUtter.volume = 0;
  window.SpeechSynthesis.speak(engUtter);
}

function removePhrase(index) {
  if (index < 0 || index >= phrases.length) {
    return;
  }

  phrases.splice(index, 1);
  if (currentIndex >= phrases.length) {
    currentIndex = Math.max(0, phrases.length - 1);
  }

  saveCollections();
  updatePhraseList();
  updatePhraseView();
  if (!hasPhrases()) {
    stopSpeech();
  }
}

function addCollection(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }

  if (collections.some((collection) => collection.name === trimmed)) {
    return;
  }

  const newCollection = {
    name: trimmed,
    phrases: deepCopyPhrases(defaultCollectionData.phrases)
  };

  collections.push(newCollection);
  saveCollections();
  newCollectionName.value = "";
  setCurrentCollection(collections.length - 1);
}

addCollectionBtn.addEventListener("click", () => {
  addCollection(newCollectionName.value);
});

deleteCollectionBtn.addEventListener("click", () => {
  if (collections.length === 1) {
    return;
  }

  collections.splice(currentCollectionIndex, 1);
  currentCollectionIndex = Math.max(0, currentCollectionIndex - 1);
  saveCollections();
  setCurrentCollection(currentCollectionIndex);
});

saveCollectionBtn.addEventListener("click", () => {
  saveCollections();
});

collectionSelect.addEventListener("change", () => {
  const index = Number(collectionSelect.value);
  if (!Number.isNaN(index)) {
    setCurrentCollection(index);
  }
});

addPhraseBtn.addEventListener("click", () => {
  const eng = newEngInput.value.trim();
  const rus = newRusInput.value.trim();
  if (!eng || !rus) {
    return;
  }

  phrases.push({ eng, rus });
  newEngInput.value = "";
  newRusInput.value = "";
  currentIndex = phrases.length - 1;
  saveCollections();
  updatePhraseList();
  updatePhraseView();
});

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

ruToggle.addEventListener("change", () => {
  russianEnabled = ruToggle.checked;
});

loadCollections();
setCurrentCollection(0);
