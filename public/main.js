// ---- particle background ----
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.1
    });
  }
}

function drawParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 165, 0, ${p.alpha})`;
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  }
  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});
resizeCanvas();
initParticles();
drawParticles();

// ---- typewriter effect ----
const roles = ["Marine Engineer.", "Content Creator.", "Website Builder."];
let idx = 0;
let charIdx = 0;
let isDeleting = false;
const typeEl = document.getElementById("typewriter-text");

function typeEffect() {
  const current = roles[idx];
  if (isDeleting) {
    typeEl.innerText = current.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      isDeleting = false;
      idx = (idx + 1) % roles.length;
      setTimeout(typeEffect, 400);
      return;
    }
    setTimeout(typeEffect, 70);
  } else {
    typeEl.innerText = current.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      isDeleting = true;
      setTimeout(typeEffect, 2000);
      return;
    }
    setTimeout(typeEffect, 120);
  }
}
typeEffect();

// ---- Intersection Observer for skill bars & stat counters ----
const skillBars = document.querySelectorAll('.skill-bar-fill');
const statNumbers = document.querySelectorAll('.stat-number');
let skillsAnimated = false, statsAnimated = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains('skill-bar-fill') && !skillsAnimated) {
        skillBars.forEach(bar => {
          let w = bar.getAttribute('data-width');
          bar.style.width = w + '%';
        });
        skillsAnimated = true;
      }
      if (entry.target.classList.contains('stat-number') && !statsAnimated) {
        statNumbers.forEach(counter => {
          const target = parseFloat(counter.getAttribute('data-target'));
          let current = 0;
          const increment = target / 50;
          const updateCounter = () => {
            current += increment;
            if (current < target) {
              counter.innerText = Math.floor(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              counter.innerText = target.toString().includes('.') ? target : Math.floor(target).toLocaleString();
            }
          };
          updateCounter();
        });
        statsAnimated = true;
      }
    }
  });
}, { threshold: 0.3 });

skillBars.forEach(bar => observer.observe(bar));
statNumbers.forEach(stat => observer.observe(stat));

// ========== VIDEO TESTIMONIALS (FIXED) ==========
const testimonialsData = [
  {
    name: "Captain Elena R.",
    quote: "onXmariners saved our vessel retrofit. Plus the website he built is stellar!",
    videoId: "9lPDnJz8vsA"   // Your YouTube Short ID
  },
  {
    name: "Sarah J. (Content Agency)",
    quote: "The storytelling workshop boosted engagement by 200%. True creator mindset.",
    videoId: "9lPDnJz8vsA"   // Replace with another video ID if you have
  }
];

function buildTestimonials() {
  const track = document.getElementById('testimonialTrack');
  console.log('Testimonial track element:', track);  // Debug: check if element exists
  if (!track) {
    console.error('Element with id "testimonialTrack" not found!');
    return;
  }
  let cardsHTML = '';
  // Duplicate for infinite scroll (smooth animation)
  for (let set = 0; set < 2; set++) {
    testimonialsData.forEach(t => {
      cardsHTML += `
        <div class="testimonial-card">
          <div class="video-thumb">
            <iframe width="100%" height="200" 
                    src="https://www.youtube.com/embed/${t.videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
          </div>
          <div class="client-name">${t.name}</div>
          <div class="testimonial-quote">“${t.quote}”</div>
        </div>
      `;
    });
  }
  track.innerHTML = cardsHTML;
  console.log('Testimonials built successfully. Number of cards:', testimonialsData.length * 2);
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
  buildTestimonials();
});

// ---- sticky nav background ----
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) nav.style.background = "rgba(0,0,0,0.95)";
  else nav.style.background = "rgba(0,0,0,0.85)";
});

// ========== MOBILE MENU TOGGLE (FIXED) ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
  });
  
  // Close menu when a link is clicked
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// ---- smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href').slice(1);
    if (targetId === "") return;
    const target = document.getElementById(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Also close mobile menu if open
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    }
  });
});

// Contact form submission (with budget field)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form elements
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const projectType = document.getElementById('projectTypeSelect').value;
    const budget = document.getElementById('budgetSelect').value;
    const message = document.getElementById('contactMessage').value.trim();
    
    // Get the submit button inside the form
    const submitBtn = contactForm.querySelector('.submit-btn');

    // Validation
    if (!name || !email || !projectType || !budget || !message) {
      alert('⚠️ Please fill in all fields including budget.');
      return;
    }

    // Disable button and show sending state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('https://onxmariners-backend.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, projectType, budget, message })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Message sent! I’ll reply within 24 hours.');
        contactForm.reset();
      } else {
        alert(`❌ Error: ${data.error || 'Something went wrong.'}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('❌ Network error. Please try again later.');
    } finally {
      // Re-enable button and restore text
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND MY BRIEF ✨';
    }
  });
}

// ========== YouTube Stats ==========
const YOUTUBE_CHANNEL_ID = 'UCg7hy6daMldzXczSxChBx3g';
const YOUTUBE_API_KEY = 'AIzaSyC8cIe1dTLiULLcC2YrS5FybPkOsWnNhwY';

async function fetchYouTubeStats() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        if (data.items && data.items[0]) {
            const stats = data.items[0].statistics;
            const youtubeSubsElement = document.querySelector('.stat-item:first-child .stat-number');
            if (youtubeSubsElement) {
                const subscriberCount = (stats.subscriberCount / 1000).toFixed(1);
                youtubeSubsElement.textContent = subscriberCount;
            }
        }
    } catch (error) {
        console.error('Error fetching YouTube stats:', error);
    }
}

fetchYouTubeStats();
setInterval(fetchYouTubeStats, 3600000);

// ========== Instagram Stats (placeholder – requires valid token) ==========
const INSTAGRAM_BUSINESS_ACCOUNT_ID = 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID';
const INSTAGRAM_ACCESS_TOKEN = 'YOUR_INSTAGRAM_ACCESS_TOKEN';

async function fetchInstagramStats() {
    if (!INSTAGRAM_ACCESS_TOKEN || INSTAGRAM_ACCESS_TOKEN === 'YOUR_INSTAGRAM_ACCESS_TOKEN') {
        console.warn('Instagram access token not configured.');
        return;
    }
    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}?fields=followers_count&access_token=${INSTAGRAM_ACCESS_TOKEN}`);
        const data = await response.json();
        if (data.followers_count) {
            const instaFollowersElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
            if (instaFollowersElement) {
                const followerCount = (data.followers_count / 1000000).toFixed(1);
                instaFollowersElement.textContent = followerCount;
            }
        }
    } catch (error) {
        console.error('Error fetching Instagram stats:', error);
    }
}

fetchInstagramStats();
setInterval(fetchInstagramStats, 3600000);