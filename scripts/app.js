//region materialize inits
document.addEventListener('DOMContentLoaded', function () {
    M.AutoInit();
})
//endregion

//region news app functionality
const NEWS_API_KEY = env.apiKey;
let newsSources = [];
let currentNewsSourceId = 'techcrunch';
const newsSourcesSelectElement = document.getElementById("news-sources");

function createHtmlFromSource(source) {
    return `
        <option 
            id="source-option-${source.id}" 
            value="${source.id}" 
            ${currentNewsSourceId === source.id ? "selected" : ""}
        >${source.name}
        </option>
    `
}

function invalidateSources() {
    let output = '';
    for (const source of newsSources) {
        output += createHtmlFromSource(source);
    }
    newsSourcesSelectElement.innerHTML = output;
    console.warn("received");
}

async function loadSources() {
    const NEWS_SOURCES_URL = `https://newsapi.org/v2/sources?apiKey=${NEWS_API_KEY}`
    const apiResponse = await fetch(NEWS_SOURCES_URL)
    let responseJson = await apiResponse.json();
    newsSources = responseJson.sources;
    invalidateSources();
}

function initViews() {
    newsSourcesSelectElement.addEventListener('change', function () {
        const newValue = newsSourcesSelectElement.value;
        // if (currentNewsSourceId === newValue) return;
        currentNewsSourceId = newValue;
        updateNews();
    });
}

function createHtmlFromArticle(article) {
    return `
      <div class="card-panel no-padding hoverable">
          <h5 class="no-margin articleName">${article.title}</h5>
          <img src="${article.urlToImage}" class="articleImage">
          <div class="articleContent">
              <p>${article.content}</p>
          </div>
      </div>`;
}

async function updateNews() {
    const NEWS_SOURCE_TOP_HEADLINES = `https://newsapi.org/v2/top-headlines?sources=${currentNewsSourceId}&apiKey=${NEWS_API_KEY}`
    const apiResponse = await fetch(NEWS_SOURCE_TOP_HEADLINES);
    const responseJson = await apiResponse.json();
    const articles = responseJson.articles;
    let output = '';
    for (const article of articles) {
        output += createHtmlFromArticle(article);
    }
    document.getElementById("articles").innerHTML = output;
    window.scrollTo(0, 0);
}

window.addEventListener('load', async function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
    await this.loadSources();
    await this.updateNews();
    initViews();
});
//endregion

