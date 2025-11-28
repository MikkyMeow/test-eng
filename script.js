const phrases = [
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
];

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

function updatePhraseView() {
  const phrase = phrases[currentIndex];
  engEl.textContent = phrase.eng;
  rusEl.textContent = phrase.rus;
}

function updatePlayButton() {
  playPauseBtn.textContent = isPlaying ? "Пауза" : "Говорить";
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  isPlaying = false;
  currentUtterance = null;
  updatePlayButton();
}

function onPhraseComplete() {
  if (!isPlaying) {
    updatePlayButton();
    return;
  }

  currentIndex = (currentIndex + 1) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase();
}

function speakCurrentPhrase() {
  stopSpeech();
  russianEnabled = ruToggle.checked;
  isPlaying = true;
  updatePlayButton();

  const phrase = phrases[currentIndex];
  const engUtter = new SpeechSynthesisUtterance(phrase.eng);
  engUtter.lang = "en-US";
  engUtter.rate = 1; // обычная скорость произношения

  engUtter.onend = () => {
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
  window.speechSynthesis.speak(engUtter);
}

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

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase();
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % phrases.length;
  updatePhraseView();
  speakCurrentPhrase();
});

ruToggle.addEventListener("change", () => {
  russianEnabled = ruToggle.checked;
});

updatePhraseView();
updatePlayButton();
