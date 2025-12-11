const apiUrl = "https://newsdata.io/api/1/latest?q=";
const apiKey = "Enter Your APi KEy";

// --- DOM ELEMENTS ---
const sidebar = document.querySelector(".sidebar");

const sidebarMenu = document.querySelector(".sidebar-menu");
const hamburgerMenu = document.querySelector(".hamburger-menu");
const closeMenu = document.querySelector(".close");
const newsCards = document.querySelectorAll(".main-card");
const loadMoreBtn = document.querySelector(".load-more a");
const loadMoreContainer = document.querySelector(".load-more");

const langEnBtn = document.querySelector(".language-selection .english");
const langHiBtn = document.querySelector(".language-selection .hindi");
const langMarathiBtn = document.querySelector(".language-selection .marathi");

// --- STATE MANAGEMENT ---
let currentQuery = "";
let currentLanguage = "en";
let baseQuery = "India";
let nextPageToken = null;
const shownArticles = new Set();

//loader
const loadingPage = document.querySelector(".loading-page");

function showLoader() {
  loadingPage.style.display = "flex";
}
function hideLoader() {
  loadingPage.style.display = "none";
}

// --- SIDEBAR ---
function showsidebar() {
  sidebar.style.display = "block";
  hamburgerMenu.style.display = "none";
  closeMenu.style.display = "block";
}
function closesidebar() {
  sidebar.style.display = "none";
  hamburgerMenu.style.display = "block";
  closeMenu.style.display = "none";
}

// --- FETCH NEWS (Single Language) ---
async function fetchNews(query, language = "en", pageToken = null) {
  newsCards.forEach(
    (card) => (card.querySelector(".card-loader").style.display = "flex")
  );

  try {
    let url = `${apiUrl}${encodeURIComponent(
      query
    )}&language=${language}&apiKey=${apiKey}`;
    if (pageToken) url += `&page=${pageToken}`;

    const response = await fetch(url);
    const data = await response.json();

    currentQuery = query;
    currentLanguage = language;
    nextPageToken = data.nextPage || null;

    if (!pageToken) {
      shownArticles.clear();
      clearOldNews(); // This function will be slightly modified
    }

    bindData(data.results || []);
    newsCards.forEach(
      (card) => (card.querySelector(".card-loader").style.display = "none")
    );
  } catch (error) {
    console.error("Error fetching the news:", error);
    bindData([]);
    // Hide all loaders on error
    newsCards.forEach(
      (card) => (card.querySelector(".card-loader").style.display = "none")
    );
  }
}

// --- FETCH NEWS (MIXED LANGUAGES) ---
async function fetchMixedLanguageNews(query) {
  newsCards.forEach(
    (card) => (card.querySelector(".card-loader").style.display = "flex")
  );

  try {
    const languages = ["en", "hi", "mr"];
    const promises = languages.map((lang) =>
      fetch(
        `${apiUrl}${encodeURIComponent(
          query
        )}&language=${lang}&apiKey=${apiKey}`
      )
        .then((res) => res.json())
        .catch((err) => {
          console.error(`Failed to fetch ${lang} news`, err);
          return { results: [] };
        })
    );

    const allResults = await Promise.all(promises);
    let combinedArticles = allResults.flatMap((result) => result.results || []);

    // Remove duplicates
    const seen = new Set();
    combinedArticles = combinedArticles.filter((article) => {
      const key = `${article.title}-${article.link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Shuffle
    combinedArticles.sort(() => 0.5 - Math.random());

    shownArticles.clear();
    clearOldNews();

    bindData(combinedArticles);
    // Hide all loaders after data is bound
    newsCards.forEach(
      (card) => (card.querySelector(".card-loader").style.display = "none")
    );

    if (loadMoreContainer) loadMoreContainer.style.display = "none";
  } catch (error) {
    console.error("Error fetching mixed language news:", error);
    bindData([]);
    // Hide all loaders on error
    newsCards.forEach(
      (card) => (card.querySelector(".card-loader").style.display = "none")
    );
  }
}

// --- CLEAR OLD NEWS ---
function clearOldNews() {
  newsCards.forEach((card) => {
    card.style.display = "none";
  });
}

// --- BIND DATA TO CARDS ---
function bindData(articles) {
  for (let i = 0; i < newsCards.length; i++) {
    const card = newsCards[i];
    const article = articles[i];

    if (article && article.image_url && article.title && article.description) {
      fillCardContent(card, article);
      card.style.display = "flex";
      // Hide the loader for this specific card
      card.querySelector(".card-loader").style.display = "none";
    } else {
      card.style.display = "none";
      // Hide the loader for this specific card
      card.querySelector(".card-loader").style.display = "none";
    }
  }

  // Toggle Load More
  loadMoreContainer.style.display = nextPageToken ? "flex" : "none";
}

// --- FILL CARD CONTENT ---
function fillCardContent(cardElement, article) {
  const imageElement = cardElement.querySelector(".content-img");
  const titleLink = cardElement.querySelector(".article-text a");
  const authorSpan = cardElement.querySelector(".author a");
  const timeSpan = cardElement.querySelector(".time");
  const dateSpan = cardElement.querySelector(".date");
  const descriptionParagraph = cardElement.querySelector(".about-article p a");

  const imageUrl = article.image_url || "assets/img/default.jpg";
  const title = article.title || "No Title";
  const url = article.link || "#";
  const author = article.creator?.[0] || "Unknown";
  const publishedAt = article.pubDate || new Date().toISOString();
  const description = article.description || "No description available.";

  const formattedDate = new Date(publishedAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const formattedTime = new Date(publishedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  imageElement.src = imageUrl;
  titleLink.href = url;
  titleLink.textContent = title;
  authorSpan.textContent = author;
  timeSpan.textContent = formattedTime;
  dateSpan.textContent = formattedDate;
  descriptionParagraph.textContent = description;
}

// --- INITIALIZE SIDEBAR LINKS ---
function initializeSidebar() {
  const links = document.querySelectorAll(".sidebar-menu .sidebar-item a");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const query = event.target.textContent.trim();
      fetchNews(query, currentLanguage);
      closesidebar();
    });
  });
}

// --- EVENT LISTENERS ---
window.addEventListener("load", () => {
  initializeSidebar();

  langEnBtn.classList.remove("active");
  langHiBtn.classList.remove("active");
  langMarathiBtn.classList.remove("active");

  fetchMixedLanguageNews("India");
});

hamburgerMenu.addEventListener("click", showsidebar);
closeMenu.addEventListener("click", closesidebar);

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentQuery && nextPageToken) {
      fetchNews(currentQuery, currentLanguage, nextPageToken);
    }
  });
}

langEnBtn.addEventListener("click", (e) => {
  e.preventDefault();
  langEnBtn.classList.add("active");
  langHiBtn.classList.remove("active");
  langMarathiBtn.classList.remove("active");
  fetchNews(baseQuery, "en");
});

langHiBtn.addEventListener("click", (e) => {
  e.preventDefault();
  langEnBtn.classList.remove("active");
  langHiBtn.classList.add("active");
  langMarathiBtn.classList.remove("active");

  const queryForHindi =
    baseQuery.toLowerCase() === "india" ? "भारत" : baseQuery;
  fetchNews(queryForHindi, "hi");
});

langMarathiBtn.addEventListener("click", (e) => {
  e.preventDefault();
  langEnBtn.classList.remove("active");
  langHiBtn.classList.remove("active");
  langMarathiBtn.classList.add("active");

  const queryForMarathi =
    baseQuery.toLowerCase() === "india" ? "भारत" : baseQuery;
  fetchNews(queryForMarathi, "mr");
});

// --- TEXT TO SPEECH ---
async function readText(button) {
  const textElement = button
    .closest(".about-article")
    .querySelector(".clamped-text a");
  const text = textElement?.textContent.trim();
  if (!text) return;

  const mood = button.getAttribute("data-mood") || "neutral";

  let lang = "en-US";
  if (/[अ-ह]/.test(text)) {
    lang = /माझ्या|आपले|स्वागत/.test(text) ? "mr-IN" : "hi-IN";
  }

  let voiceConfig = {
    languageCode: lang,
    ssmlGender: "FEMALE",
  };
  let audioConfig = {
    audioEncoding: "MP3",
    pitch: 0,
    speakingRate: 1,
  };

  switch (mood) {
    case "happy":
      audioConfig.pitch = 1;
      audioConfig.speakingRate = 1.1;
      voiceConfig.ssmlGender = "FEMALE";
      break;
    case "sad":
      audioConfig.pitch = -5;
      audioConfig.speakingRate = 0.7;
      voiceConfig.ssmlGender = "FEMALE";
      break;
    case "angry":
      audioConfig.pitch = -4;
      audioConfig.speakingRate = 1.1;
      voiceConfig.ssmlGender = "FEMALE";
      break;
    case "calm":
      audioConfig.pitch = 0;
      audioConfig.speakingRate = 0.95;
      voiceConfig.ssmlGender = "FEMALE";
      break;
    default:
      // neutral/default
      audioConfig.pitch = 0;
      audioConfig.speakingRate = 1.0;
      voiceConfig.ssmlGender = "FEMALE";
  }

  try {
    const response = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=#",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: voiceConfig,
          audioConfig: audioConfig,
        }),
      }
    );

    const data = await response.json();
    if (data.audioContent) {
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      audio.play();
    } else {
      console.error("No audio returned", data);
    }
  } catch (error) {
    console.error("Error during TTS fetch:", error);
  }
}


