// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (menuToggle) menuToggle.classList.remove('active');
                }
                
                // Scroll to the target element
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.padding = '10px 0';
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '20px 0';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Simulate form submission
            alert(`Thank you for your message, ${name}! I'll get back to you soon.`);
            
            // Reset form
            this.reset();
        });
    }

    // Add hover effect to project cards
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.pageYOffset;
            heroSection.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
        });
    }

});

// Reputation Monitor: Simple client-side negativity scoring
(function() {
  if (window.__reputationMonitorInitialized) return;
  window.__reputationMonitorInitialized = true;

  function qs(id) { return document.getElementById(id); }
  const brandInput = qs('rep-brand');
  const textInput = qs('rep-text');
  const analyzeBtn = qs('rep-analyze');
  const scanBtn = qs('rep-scan');
  const webSearchBtn = qs('rep-websearch');
  const demoBtn = qs('rep-demo');
  const clearBtn = qs('rep-clear');
  const summary = document.querySelector('.rep-summary');
  const sentimentBadge = summary ? summary.querySelector('.sentiment-badge') : null;
  const scoreEl = qs('rep-score');
  const countEl = qs('rep-count');
  const listEl = qs('rep-list');

  if (!brandInput || !textInput || !analyzeBtn || !scanBtn || !webSearchBtn || !demoBtn || !clearBtn || !summary || !scoreEl || !countEl || !listEl) {
    return; // section not present
  }

  // Persist last brand
  try {
    const last = localStorage.getItem('rep:lastBrand');
    if (last && !brandInput.value) brandInput.value = last;
  } catch (_) {}

  const negativeLexicon = [
    'scam','fraud','fake','bad','terrible','awful','hate','worst','poor','broken','defective','trash','garbage','rip-off','ripoff','misleading','liar','lying','cheat','cheater','shady','toxic','abusive','harass','harassment','cancelled','boycott','lawsuit','unsafe','unethical','problem','issue','bug','incompetent','late','slow','rude','unprofessional','dangerous','illegal','dirty','offensive','controversy','controversial','backlash'
  ];

  const warningLexicon = [
    'disappoint','not great','not good','meh','underwhelming','concern','worry','questionable','mixed','unclear','lack','missing','decline','down','drop','reduce','less','costly','expensive'
  ];

  function splitSentences(text) {
    return text
      .replace(/\s+/g, ' ')
      .match(/[^.!?\n]+[.!?]?/g) || [];
  }

  function scoreSentence(s, brand) {
    const lower = s.toLowerCase();
    const matches = [];
    let score = 0;
    negativeLexicon.forEach(w => { if (lower.includes(w)) { matches.push(w); score += 3; } });
    warningLexicon.forEach(w => { if (lower.includes(w)) { matches.push(w); score += 1; } });
    // Weight if brand is mentioned
    const mentionsBrand = brand && lower.includes(brand.toLowerCase());
    if (mentionsBrand) score += 1;
    return { score, matches, mentionsBrand };
  }

  function classify(totalScore, flaggedCount) {
    if (flaggedCount === 0) return 'Neutral';
    if (totalScore >= 18 || flaggedCount >= 6) return 'Negative';
    if (totalScore >= 8 || flaggedCount >= 3) return 'Mixed';
    if (totalScore <= 2 && flaggedCount <= 1) return 'Neutral';
    return 'Mixed';
  }

  function analyzeText(text, brand) {
    const sentences = splitSentences(text);
    const results = [];
    let totalScore = 0;
    sentences.forEach(s => {
      const { score, matches, mentionsBrand } = scoreSentence(s, brand);
      const shouldInclude = brand ? mentionsBrand || score > 0 : score > 0;
      if (shouldInclude) {
        results.push({ sentence: s.trim(), score, matches, mentionsBrand });
        totalScore += score;
      }
    });
    const label = classify(totalScore, results.length);
    return { totalScore, results, label };
  }

  function renderResults(out, brand) {
    summary.classList.remove('hidden');
    listEl.classList.remove('hidden');
    scoreEl.textContent = String(out.totalScore);
    countEl.textContent = String(out.results.length);
    sentimentBadge.textContent = out.label;
    sentimentBadge.classList.remove('sentiment-negative','sentiment-mixed','sentiment-neutral','sentiment-positive');
    const cls = out.label === 'Negative' ? 'sentiment-negative'
              : out.label === 'Mixed' ? 'sentiment-mixed'
              : out.label === 'Neutral' ? 'sentiment-neutral'
              : 'sentiment-positive';
    sentimentBadge.classList.add(cls);

    listEl.innerHTML = '';
    out.results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'rep-item';

      // Highlight brand mentions
      const safeSentence = item.sentence
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const highlighted = brand ? safeSentence.replace(new RegExp(brand, 'ig'), m => `<span class="highlight">${m}</span>`) : safeSentence;

      const textHtml = `<div class="rep-text">${highlighted}</div>`;
      const chips = [];
      if (item.score >= 3) chips.push(`<span class="rep-chip bad">Score ${item.score}</span>`);
      else if (item.score > 0) chips.push(`<span class="rep-chip warn">Score ${item.score}</span>`);
      else chips.push(`<span class="rep-chip good">Score ${item.score}</span>`);
      if (item.matches.length) chips.push(`<span class="rep-chip">${item.matches.join(', ')}</span>`);
      if (item.mentionsBrand) chips.push('<span class="rep-chip">mentions brand</span>');

      div.innerHTML = `${textHtml}<div class="rep-meta">${chips.join(' ')}</div>`;
      listEl.appendChild(div);
    });
  }

  async function scanInternet() {
    const brand = (brandInput.value || '').trim();
    if (!brand) {
      alert('Enter a brand or person to scan.');
      return;
    }
    try { localStorage.setItem('rep:lastBrand', brand); } catch (_) {}

    sentimentBadge.textContent = 'Scanning…';
    sentimentBadge.classList.remove('sentiment-negative','sentiment-mixed','sentiment-neutral','sentiment-positive');
    summary.classList.remove('hidden');
    listEl.classList.remove('hidden');
    listEl.innerHTML = '';

    const url = `http://localhost:5501/api/search?brand=${encodeURIComponent(brand)}`;
    let data;
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`API error ${res.status}: ${msg}`);
      }
      data = await res.json();
    } catch (e) {
      console.error('Scan Internet failed:', e);
      sentimentBadge.textContent = 'Backend unreachable';
      sentimentBadge.classList.add('sentiment-mixed');
      scoreEl.textContent = '—';
      countEl.textContent = '0';
      const div = document.createElement('div');
      div.className = 'rep-item';
      div.innerHTML = `<div class="rep-text">Could not reach the backend API at <code>${url}</code>. Ensure it is running.</div>`;
      listEl.appendChild(div);
      return;
    }

    // Compute negativity on title+snippet per item, aggregate totals
    let totalScore = 0;
    const results = [];
    (data.items || []).forEach(item => {
      const text = `${item.title || ''}. ${item.snippet || ''}`.trim();
      const { score, matches, mentionsBrand } = scoreSentence(text, brand);
      totalScore += score;
      results.push({
        sentence: `${item.platform || 'Unknown'}: ${item.title || ''}`.trim(),
        score,
        matches,
        mentionsBrand,
        url: item.url,
        platform: item.platform
      });
    });
    const label = classify(totalScore, results.length);
    scoreEl.textContent = String(totalScore);
    countEl.textContent = String(results.length);
    sentimentBadge.textContent = label;
    const cls = label === 'Negative' ? 'sentiment-negative'
              : label === 'Mixed' ? 'sentiment-mixed'
              : label === 'Neutral' ? 'sentiment-neutral'
              : 'sentiment-positive';
    sentimentBadge.classList.add(cls);

    listEl.innerHTML = '';
    if (!results.length) {
      sentimentBadge.textContent = 'No results';
      sentimentBadge.classList.remove('sentiment-negative','sentiment-mixed','sentiment-positive');
      sentimentBadge.classList.add('sentiment-neutral');
      const div = document.createElement('div');
      div.className = 'rep-item';
      const qGoogle = `https://www.google.com/search?q=${encodeURIComponent(brand + ' negative review scam controversy')}`;
      const qReddit = `https://www.reddit.com/search/?q=${encodeURIComponent(brand)}`;
      const qHN = `https://hn.algolia.com/?q=${encodeURIComponent(brand)}`;
      div.innerHTML = `<div class="rep-text">No public results found for "${brand}" on Reddit, Google News, or Hacker News.</div>
        <div class="rep-meta">
          <a class="rep-chip" href="${qGoogle}" target="_blank" rel="noopener">Google</a>
          <a class="rep-chip" href="${qReddit}" target="_blank" rel="noopener">Reddit</a>
          <a class="rep-chip" href="${qHN}" target="_blank" rel="noopener">Hacker News</a>
        </div>`;
      listEl.appendChild(div);
      return;
    }

    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'rep-item';
      const textHtml = `<div class="rep-text"><strong>${item.platform || 'Source'}</strong> — ${item.sentence}</div>`;
      const chips = [];
      if (item.score >= 3) chips.push(`<span class="rep-chip bad">Score ${item.score}</span>`);
      else if (item.score > 0) chips.push(`<span class="rep-chip warn">Score ${item.score}</span>`);
      else chips.push(`<span class="rep-chip good">Score ${item.score}</span>`);
      if (item.matches.length) chips.push(`<span class="rep-chip">${item.matches.join(', ')}</span>`);
      if (item.url) chips.push(`<a class="rep-chip" href="${item.url}" target="_blank" rel="noopener">Open</a>`);
      div.innerHTML = `${textHtml}<div class="rep-meta">${chips.join(' ')}</div>`;
      listEl.appendChild(div);
    });
  }

  function loadDemo(brand) {
    const demo = [
      `${brand} is a scam and totally fake. Worst experience ever!`,
      `Their support was slow and unprofessional, really disappointing.`,
      `Not great quality. I had an issue with the product being defective.`,
      `There is a lot of controversy around ${brand}, some say it’s misleading.`,
      `I wouldn’t recommend ${brand}. The service was late and rude.`,
      `${brand} faced backlash last week. People worry about unethical practices.`
    ];
    return demo.join(' ');
  }

  function handleAnalyze() {
    const brand = (brandInput.value || '').trim();
    const txt = (textInput.value || '').trim();
    if (!txt) {
      alert('Please paste some text to analyze or load demo data.');
      return;
    }
    try { localStorage.setItem('rep:lastBrand', brand); } catch (_) {}
    const out = analyzeText(txt, brand);
    renderResults(out, brand);
  }

  function handleDemo() {
    const brand = (brandInput.value || 'YourBrand').trim();
    textInput.value = loadDemo(brand);
    const out = analyzeText(textInput.value, brand);
    renderResults(out, brand);
  }

  function handleClear() {
    textInput.value = '';
    summary.classList.add('hidden');
    listEl.classList.add('hidden');
    listEl.innerHTML = '';
    scoreEl.textContent = '0';
    countEl.textContent = '0';
    sentimentBadge.textContent = 'Neutral';
    sentimentBadge.classList.remove('sentiment-negative','sentiment-mixed','sentiment-neutral','sentiment-positive');
    sentimentBadge.classList.add('sentiment-neutral');
  }

  analyzeBtn.addEventListener('click', handleAnalyze);
  scanBtn.addEventListener('click', scanInternet);
  webSearchBtn.addEventListener('click', function() {
    const brand = (brandInput.value || '').trim();
    if (!brand) {
      alert('Enter a brand or person to search.');
      return;
    }
    try { localStorage.setItem('rep:lastBrand', brand); } catch (_) {}

    const queries = [
      { label: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(brand + ' negative review scam controversy')}` },
      { label: 'Google News', url: `https://news.google.com/search?q=${encodeURIComponent(brand)}&hl=en-US&gl=US&ceid=US:en` },
      { label: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(brand + ' negative review scam')}` },
      { label: 'Reddit', url: `https://www.reddit.com/search/?q=${encodeURIComponent(brand)}` },
      { label: 'Hacker News', url: `https://hn.algolia.com/?q=${encodeURIComponent(brand)}` },
      { label: 'X/Twitter', url: `https://twitter.com/search?q=${encodeURIComponent(brand + ' negative')}&src=typed_query` },
      { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(brand + ' review exposed')}` }
    ];

    // Open primary search in a new tab
    window.open(queries[0].url, '_blank');

    // Render clickable links in the results panel
    summary.classList.remove('hidden');
    listEl.classList.remove('hidden');
    sentimentBadge.textContent = 'Opened web search';
    sentimentBadge.classList.remove('sentiment-negative','sentiment-mixed','sentiment-neutral','sentiment-positive');
    sentimentBadge.classList.add('sentiment-neutral');
    scoreEl.textContent = '—';
    countEl.textContent = String(queries.length);

    const container = document.createElement('div');
    container.className = 'rep-item';
    const linksHtml = queries.map(q => `<a class="rep-chip" href="${q.url}" target="_blank" rel="noopener">${q.label}</a>`).join(' ');
    container.innerHTML = `<div class="rep-text"><strong>Quick search links for "${brand}"</strong></div><div class="rep-meta">${linksHtml}</div>`;
    listEl.prepend(container);
  });
  demoBtn.addEventListener('click', handleDemo);
  clearBtn.addEventListener('click', handleClear);
})();