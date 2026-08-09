// CSV Google Sheets URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPJnCPB9Y0jj85Pbc_X-dqRug4jh6gYN2OsWsDps5XaJbGtV7edqPruJe88nkYSmYuPoG6xZjCD4PN/pub?output=csv';

// Fetch and parse CSV
async function loadCantiques() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        const cantiques = parseCSV(csvText);
        displayCantiques(cantiques);
        setupSearch(cantiques);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        displayError();
    }
}

// Parse CSV text
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const cantiques = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const cells = parseCSVLine(lines[i]);
        const canticle = {};
        headers.forEach((header, index) => {
            canticle[header] = cells[index] ? cells[index].trim() : '';
        });
        cantiques.push(canticle);
    }
    return cantiques;
}

// Parse CSV line respecting quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Display cantiques
function displayCantiques(cantiques, filtered = null) {
    const grid = document.getElementById('cantiques-grid');
    const toDisplay = filtered || cantiques;

    if (toDisplay.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 2rem;">Aucun cantique trouvé.</p>';
        return;
    }

    grid.innerHTML = toDisplay.map(canticle => createCanticleCard(canticle)).join('');
    updateResultsCount(toDisplay.length, cantiques.length);
}

// Update results count
function updateResultsCount(displayed, total) {
    const countElement = document.getElementById('results-count');
    if (displayed === total) {
        countElement.textContent = `${total} cantique${total > 1 ? 's' : ''}`;
    } else {
        countElement.textContent = `${displayed} résultat${displayed > 1 ? 's' : ''} sur ${total}`;
    }
}

// Create canticle card HTML
function createCanticleCard(canticle) {
    // Map new column names
    const title = canticle.title || 'Sans titre';
    const author = canticle.author || 'Inconnu';
    const year = canticle.year || '2026';
    const style = canticle.style || '';
    const description = canticle.description || '';
    const youtube = canticle.youtube || '';
    const stems = canticle.stems || '';

    // Parse style/tags
    const stylesList = style ? style.split(',').map(t => t.trim()).filter(t => t) : [];

    // Build links
    const linksHTML = [];
    if (youtube) {
        linksHTML.push(`<a href="${escapeHtml(youtube)}" target="_blank" class="link-external">🎬 YouTube</a>`);
    }
    if (stems) {
        linksHTML.push(`<a href="${escapeHtml(stems)}" target="_blank" class="link-external">🎵 Stems</a>`);
    }

    const stylesHTML = stylesList.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('');

    return `
        <div class="canticle-card">
            <div class="card-header">
                <div>
                    <h3>${escapeHtml(title)}</h3>
                    <div class="artist">👤 ${escapeHtml(author)}</div>
                </div>
                <div class="year">© ${escapeHtml(year)}</div>
            </div>
            ${description ? `<p>${escapeHtml(description)}</p>` : ''}
            ${stylesHTML ? `<div class="tags">${stylesHTML}</div>` : ''}
            <div class="links">
                <a href="#" class="link-download">⬇️ Télécharger</a>
                ${linksHTML.join('')}
            </div>
        </div>
    `;
}

// Setup search functionality
function setupSearch(cantiques) {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = cantiques.filter(canticle => {
            const title = (canticle.title || '').toLowerCase();
            const author = (canticle.author || '').toLowerCase();
            const description = (canticle.description || '').toLowerCase();
            const style = (canticle.style || '').toLowerCase();
            return title.includes(query) || author.includes(query) || description.includes(query) || style.includes(query);
        });
        displayCantiques(cantiques, filtered);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display error message
function displayError() {
    const grid = document.getElementById('cantiques-grid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #fee2e2; border-radius: 10px; color: #991b1b;">
            <p>❌ Erreur lors du chargement des cantiques. Veuillez vérifier votre connexion et réessayer.</p>
        </div>
    `;
}

// Load cantiques on page load
document.addEventListener('DOMContentLoaded', loadCantiques);

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.href !== '#') {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});
