// ===================== API CONFIG =====================
// ✅ Auto-detect: Use production URL if deployed, localhost if local
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://rdbhub4u-73od.onrender.com/api';

console.log('🔧 API URL:', API_URL);

let currentPage = 1;
const itemsPerPage = 10;
let allContentData = [];

// ===================== DOM ELEMENTS =====================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const contentModal = document.getElementById('contentModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// ===================== MOBILE MENU =====================
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}

document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active')) {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.replace('fa-times', 'fa-bars');
        }
    }
});

// ===================== SEARCH FEATURE =====================
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return showToast("Please enter a search term", "warning");
    if (query.length < 2) return showToast("Enter at least 2 characters", "warning");
    searchViaAPI(query);
}

async function searchViaAPI(query) {
    try {
        showToast("Searching...", "info");
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        console.log('Search results:', data);
        
        if (data.success && data.contents && data.contents.length > 0) {
            displaySearchResults(data.contents, query);
            showToast(`Found ${data.contents.length} results`, "success");
        } else {
            showNoResults(query);
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast("Search failed. Try again.", "error");
        clientSideSearch(query);
    }
}

function clientSideSearch(query) {
    const grids = [
        document.getElementById('featuredGrid'),
        document.getElementById('trendingGrid'),
        document.getElementById('latestGrid'),
        document.getElementById('contentGrid')
    ];

    let matchedContent = [];

    grids.forEach(grid => {
        if (!grid) return;
        const cards = grid.querySelectorAll('.content-card');

        cards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || "";
            if (title.includes(query)) {
                matchedContent.push({
                    title: card.querySelector('.card-title').textContent,
                    image: card.querySelector('.card-image')?.src || "",
                    type: "movie",
                    rating: "8.0",
                    year: "2024",
                    description: "No description available"
                });
            }
        });
    });

    if (matchedContent.length) displaySearchResults(matchedContent, query);
    else showNoResults(query);
}

function displaySearchResults(contents, query) {
    const grid = document.getElementById("latestGrid") || document.getElementById("contentGrid");
    if (!grid) return;

    grid.innerHTML = "";

    grid.innerHTML += `
        <div style="grid-column:1/-1;text-align:center;padding:20px;color:white">
            Found <b>${contents.length}</b> results for "<b>${query}</b>"
            <br><br>
            <button onclick="clearSearch()" style="padding:10px 20px;background:#e50914;color:white;border:none;border-radius:20px;cursor:pointer;">Clear Search</button>
        </div>
    `;

    contents.forEach(c => grid.appendChild(createContentCard(c)));
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showNoResults(query) {
    const grid = document.getElementById("latestGrid") || document.getElementById("contentGrid");
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:50px;color:#fff">
            <h3>No results found for "${query}"</h3>
            <p style="color:#999;margin:15px 0;">Try different keywords</p>
            <button onclick="clearSearch()" style="padding:10px 20px;background:#e50914;color:white;border:none;border-radius:20px;cursor:pointer;">Show All Content</button>
        </div>
    `;
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.clearSearch = function () {
    if (searchInput) searchInput.value = "";
    loadContent(1);
};

// ===================== TOAST =====================
function showToast(msg, type = "info") {
    const colors = {
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
    };

    const toast = document.createElement("div");
    toast.style.cssText = `
        position:fixed;top:80px;right:20px;background:${colors[type]};
        color:white;padding:15px 25px;border-radius:8px;z-index:9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 500;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===================== LOAD STATS =====================
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();

        console.log('Stats data:', data);

        if (data.movies !== undefined) {
            updateStat("movieCount", data.movies);
            updateStat("animeCount", data.anime);
            updateStat("webseriesCount", data.webseries);
        }
    } catch (error) {
        console.error('Stats error:', error);
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Animate counter
    const start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            el.textContent = value;
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(current);
        }
    }, 16);
}

// ===================== FEATURED CONTENT =====================
async function loadFeatured() {
    const grid = document.getElementById("featuredGrid");
    if (!grid) return;

    grid.innerHTML = '<div class="loading" style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">Loading featured content...</div>';

    try {
        const type = getContentType();
        const res = await fetch(`${API_URL}/featured?type=${type || ""}`);
        const data = await res.json();

        console.log('Featured data:', data);

        if (data.success && data.contents && data.contents.length > 0) {
            grid.innerHTML = "";
            data.contents.slice(0, 6).forEach(c => grid.appendChild(createContentCard(c)));
        } else {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">No featured content available</div>';
        }
    } catch (error) {
        console.error('Featured error:', error);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#f44;">Error loading featured content</div>';
    }
}

// ===================== TRENDING =====================
async function loadTrending() {
    const grid = document.getElementById("trendingGrid");
    if (!grid) return;

    grid.innerHTML = '<div class="loading" style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">Loading trending content...</div>';

    try {
        const type = getContentType();
        const res = await fetch(`${API_URL}/trending?type=${type || ""}`);
        const data = await res.json();

        console.log('Trending data:', data);

        if (data.success && data.contents && data.contents.length > 0) {
            grid.innerHTML = "";
            data.contents.slice(0, 6).forEach(c => grid.appendChild(createContentCard(c)));
        } else {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">No trending content available</div>';
        }
    } catch (error) {
        console.error('Trending error:', error);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#f44;">Error loading trending content</div>';
    }
}

// ===================== LOAD CONTENT =====================
async function loadContent(page = 1) {
    const grid = document.getElementById("latestGrid") || document.getElementById("contentGrid");
    if (!grid) return;

    grid.innerHTML = '<div class="loading" style="grid-column:1/-1;text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin" style="font-size:40px;margin-bottom:15px;"></i><br>Loading content...</div>';

    try {
        const type = getContentType();
        const category = getCategory();

        let url = `${API_URL}/content?page=${page}&limit=${itemsPerPage}`;
        if (type) url += `&type=${type}`;
        if (category) url += `&category=${category}`;

        console.log('Fetching from:', url);

        const res = await fetch(url);
        const data = await res.json();

        console.log('Content data:', data);

        if (data.success && data.contents && data.contents.length > 0) {
            grid.innerHTML = "";
            data.contents.forEach(c => grid.appendChild(createContentCard(c)));
            updatePagination(data.currentPage, data.totalPages);
        } else {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#999;"><i class="fas fa-film" style="font-size:60px;opacity:0.3;margin-bottom:20px;"></i><br><h3>No content available</h3><p style="margin-top:10px;">Check back later for updates</p></div>';
        }
    } catch (error) {
        console.error('Content error:', error);
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:#f44;">
                <i class="fas fa-exclamation-triangle" style="font-size:60px;margin-bottom:20px;"></i>
                <br>
                <h3>Failed to load content</h3>
                <p style="margin:15px 0;color:#999;">Please check your internet connection</p>
                <button onclick="loadContent(1)" style="padding:10px 25px;background:#e50914;color:white;border:none;border-radius:20px;cursor:pointer;">Retry</button>
            </div>
        `;
    }
}

// ===================== CARD CREATOR =====================
function createContentCard(content) {
    const colors = {
        movie: "#e50914",
        anime: "#4ECDC4",
        webseries: "#FFB200"
    };

    const card = document.createElement("div");
    card.className = "content-card";
    card.onclick = () => showModal(content);
    card.style.cursor = "pointer";

    card.innerHTML = `
        <img src="${content.image || 'https://via.placeholder.com/300x450?text=No+Image'}" 
             class="card-image"
             onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'"
             loading="lazy">
        <span class="card-badge" style="background:${colors[content.type] || "#e50914"}">
            ${(content.type || 'movie').toUpperCase()}
        </span>
        <div class="card-content">
            <h3 class="card-title">${content.title || 'Untitled'}</h3>
            <div class="card-meta">
                <span class="card-rating">
                    <i class="fas fa-star"></i> ${content.rating || 'N/A'}
                </span>
                <span>${content.year || 'N/A'}</span>
            </div>
        </div>
    `;
    return card;
}

// ===================== MODAL =====================
function showModal(content) {
    if (!modalBody || !contentModal) return;
    
    modalBody.innerHTML = `
        <div style="max-width:800px;margin:auto;">
            <img src="${content.image}" style="width:100%;max-height:400px;object-fit:cover;border-radius:10px;margin-bottom:20px;" onerror="this.style.display='none'">
            <h2 style="margin-bottom:15px;">${content.title}</h2>
            <div style="display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap;">
                <span><i class="fas fa-star" style="color:#facc15;"></i> ${content.rating || 'N/A'}</span>
                <span><i class="fas fa-calendar"></i> ${content.year || 'N/A'}</span>
                <span><i class="fas fa-clock"></i> ${content.duration || 'N/A'}</span>
                <span style="background:${content.type === 'movie' ? '#e50914' : content.type === 'anime' ? '#4ECDC4' : '#FFB200'};padding:5px 15px;border-radius:20px;">${(content.type || 'movie').toUpperCase()}</span>
            </div>
            <p style="line-height:1.8;color:#ddd;">${content.description || "No description available."}</p>
        </div>
    `;
    contentModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!contentModal) return;
    contentModal.classList.remove("active");
    document.body.style.overflow = "auto";
}

if (modalClose) modalClose.onclick = closeModal;

// Close modal on outside click
if (contentModal) {
    contentModal.addEventListener('click', (e) => {
        if (e.target === contentModal) closeModal();
    });
}

// ===================== PAGINATION =====================
function updatePagination(current, total) {
    const pag = document.getElementById("pagination");
    if (!pag) return;

    pag.innerHTML = "";

    if (total <= 1) {
        pag.style.display = "none";
        return;
    }

    pag.style.display = "flex";

    // Previous button
    const prevBtn = createPageBtn("« Previous", current === 1, () => loadContent(current - 1));
    prevBtn.style.marginRight = "10px";
    pag.appendChild(prevBtn);

    // Page numbers
    const maxButtons = 5;
    let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
    let endPage = Math.min(total, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === current;
        const btn = createPageBtn(i, false, () => loadContent(i));
        if (isActive) {
            btn.style.background = "#e50914";
            btn.style.color = "#fff";
        }
        pag.appendChild(btn);
    }

    // Next button
    const nextBtn = createPageBtn("Next »", current === total, () => loadContent(current + 1));
    nextBtn.style.marginLeft = "10px";
    pag.appendChild(nextBtn);
}

function createPageBtn(text, disabled, fn) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.disabled = disabled;
    btn.onclick = fn;
    btn.style.cssText = `
        padding: 10px 15px;
        margin: 0 3px;
        background: #1a1d29;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
    `;
    
    if (!disabled) {
        btn.onmouseover = () => btn.style.background = "#e50914";
        btn.onmouseout = () => btn.style.background = "#1a1d29";
    } else {
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
    
    return btn;
}

// ===================== HELPERS =====================
function getContentType() {
    const path = window.location.pathname;
    if (path.includes("movies.html")) return "movie";
    if (path.includes("anime.html")) return "anime";
    if (path.includes("webseries.html")) return "webseries";
    return null;
}

function getCategory() {
    const params = new URLSearchParams(window.location.search);
    return params.get("cat");
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log('🚀 App initialized');
    console.log('📍 Current page:', window.location.pathname);
    
    if (document.getElementById("movieCount")) {
        console.log('📊 Loading stats...');
        loadStats();
    }
    if (document.getElementById("featuredGrid")) {
        console.log('⭐ Loading featured...');
        loadFeatured();
    }
    if (document.getElementById("trendingGrid")) {
        console.log('🔥 Loading trending...');
        loadTrending();
    }
    if (document.getElementById("latestGrid") || document.getElementById("contentGrid")) {
        console.log('📺 Loading content...');
        loadContent(1);
    }
});