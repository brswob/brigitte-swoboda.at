/**
 * Main JavaScript file for Brigitte Swoboda's website
 * Includes: Header/Footer loading, Navigation, Dark Mode, Cookie Consent, Accordion, Custom Lightbox, Map Placeholder with Consent Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // Load components first, as other setups might depend on elements within them
  loadComponents().then(() => {
      // Run setups that don't depend on loaded components immediately
      setupCookieConsent(); // Needs to run early to potentially block other storage
      setupAccordion();
      setupMapPlaceholders(); // Run after cookie consent is potentially set
      setupCustomLightbox(); // Setup lightbox after DOM is ready
  });
});


/**
 * Loads Header and Footer components and then initializes dependent scripts
 */
async function loadComponents() {
  const headerEl = document.getElementById('header');
  const footerEl = document.getElementById('footer');

  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('components/header.html'),
      fetch('components/footer.html')
    ]);

    if (!headerRes.ok) throw new Error(`Failed to load header: ${headerRes.statusText}`);
    if (!footerRes.ok) throw new Error(`Failed to load footer: ${footerRes.statusText}`);

    const [headerHtml, footerHtml] = await Promise.all([
      headerRes.text(),
      footerRes.text()
    ]);

    if (headerEl) headerEl.innerHTML = headerHtml;
    if (footerEl) footerEl.innerHTML = footerHtml;

    // Setup functionalities that depend on the header/footer elements
    setupNavigation();
    setupDarkMode(); // Dark mode depends on the toggle button in the header

  } catch (error) {
    console.error('Error loading components:', error);
    if(headerEl) headerEl.innerHTML = "<p class='container' style='color: red; padding: 1rem;'>Fehler beim Laden des Headers.</p>";
    if(footerEl) footerEl.innerHTML = "<p class='container' style='color: red; padding: 1rem;'>Fehler beim Laden des Footers.</p>";
  }
}

/**
 * Sets up mobile navigation toggle and active link highlighting
 */
function setupNavigation() {
    // ... Navigation logic remains unchanged ...
    const menuToggle = document.querySelector('.header__mobile-toggle');
      const mainNav = document.querySelector('.header__nav');
      const navLinks = document.querySelectorAll('.header__nav-link');

      if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
          const isActive = mainNav.classList.toggle('active');
          menuToggle.classList.toggle('active');
          menuToggle.setAttribute('aria-expanded', isActive);
        });
      }

      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const currentHash = window.location.hash;

      navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
         // Handle cases where href might be null or undefined
         if (!linkHref) return;

        const linkParts = linkHref.split('#');
        const linkPath = linkParts[0].split('/').pop() || 'index.html';
        const linkHash = linkParts.length > 1 ? `#${linkParts[1]}` : '';

        let isCurrentPage = (currentPage === linkPath);
         if ((currentPage === 'index.html' && (linkPath === '' || linkPath === 'index.html')) || (currentPage === '' && linkPath === 'index.html')) {
            isCurrentPage = true;
         }
        const cleanCurrentPage = currentPage.replace(/\/$/, '');
        const cleanLinkPath = (linkPath === 'index.html' && cleanCurrentPage === '') ? '' : linkPath.replace(/\/$/, '');
         if (cleanCurrentPage === cleanLinkPath) {
             isCurrentPage = true;
         }

        // Reset active class initially
        link.classList.remove('active');

        // Highlight logic
        if (isCurrentPage) {
            if (currentHash && linkHash && currentHash === linkHash) {
                 link.classList.add('active'); // Exact hash match
            } else if (!currentHash && !linkHash) {
                 link.classList.add('active'); // No hash involved on current page
            } else if (currentHash && !linkHash && linkHref.indexOf('#') === -1) {
                 // If URL has hash, but link doesn't, highlight link (e.g. you are on /page#section, highlight /page link)
                 link.classList.add('active');
            } else if (!currentHash && linkHref === 'index.html#philosophie') {
                 // Special case for Philosophie link on index page without hash in URL (don't highlight)
            }
             // Ensure base index.html link is active when on index.html without hash
            else if ((currentPage === 'index.html' || currentPage === '') && !currentHash && linkHref === 'index.html') {
                 link.classList.add('active');
            }
        }


        link.addEventListener('click', () => {
          if (window.innerWidth <= 991 && mainNav && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            if (menuToggle) {
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
          }
        });
      });
}


/**
 * Sets up Dark Mode toggle functionality, respecting consent
 */
function setupDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const rootElement = document.documentElement;
  const consentKey = 'consentChoice';

  if (!darkModeToggle) return;

  // Function to APPLY the theme visually and update the icon
  const applyVisualTheme = (theme) => {
      rootElement.setAttribute('data-theme', theme);
      updateDarkModeIcon(theme === 'dark');
  };

  // Function to SAVE theme preference IF consent allows
  const saveThemePreference = (theme) => {
      // Only save if user accepted all cookies/storage
      if (localStorage.getItem(consentKey) === 'accepted') {
          localStorage.setItem('theme', theme);
      }
  };

  const updateDarkModeIcon = (isDark) => {
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-sun', isDark);
      icon.classList.toggle('fa-moon', !isDark);
      darkModeToggle.setAttribute('aria-label', isDark ? "Light Mode aktivieren" : "Dark Mode aktivieren");
    }
  };

  // Determine initial theme
  let initialTheme;
  const savedTheme = (localStorage.getItem(consentKey) === 'accepted') ? localStorage.getItem('theme') : null; // Only read saved theme if accepted
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyVisualTheme(initialTheme); // Apply the determined theme visually

  // Toggle dark/light mode on click
  darkModeToggle.addEventListener('click', () => {
    const currentTheme = rootElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyVisualTheme(newTheme); // Update visuals immediately
    saveThemePreference(newTheme); // Try to save (respects consent)
  });

  // Listen for system preference changes only if NO preference is actively saved (respecting consent)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const consentGiven = localStorage.getItem(consentKey) === 'accepted';
      const themeSaved = localStorage.getItem('theme');
      // Change theme based on system ONLY if consent is given AND no specific theme was previously chosen,
      // OR if consent was declined (in which case it should always follow system/default)
      if ((consentGiven && !themeSaved) || !consentGiven) {
          const newSystemTheme = e.matches ? 'dark' : 'light';
          applyVisualTheme(newSystemTheme);
      }
  });
}

/**
 * Handles the display and dismissal of the cookie consent banner with two choices
 */
function setupCookieConsent() {
  const cookieConsent = document.getElementById('cookie-consent');
  const acceptAllBtn = document.getElementById('accept-cookies-all');
  const acceptNecessaryBtn = document.getElementById('accept-cookies-necessary');
  const consentKey = 'consentChoice'; // Key to store the user's choice

  if (!cookieConsent || !acceptAllBtn || !acceptNecessaryBtn) return;

  const consentValue = localStorage.getItem(consentKey);

  // Show banner only if no choice has been made yet
  if (!consentValue) {
    setTimeout(() => {
        cookieConsent.classList.add('show');
    }, 500);
  } else {
      // Optional: Re-apply necessary changes if consent was 'accepted' previously
      // For example, trigger map load if map consent was also given
      if(consentValue === 'accepted') {
         // Potentially trigger actions that depend on 'accepted' state here
         // setupMapPlaceholders() already handles checking this state.
      }
  }

  // Handler function to close banner and store choice
  const handleConsent = (choice) => {
    localStorage.setItem(consentKey, choice);
    cookieConsent.classList.remove('show');
    cookieConsent.addEventListener('transitionend', () => {
         if (!cookieConsent.classList.contains('show')) {
             // cookieConsent.style.display = 'none'; // Optional: Hide completely
         }
     }, { once: true });

     // If accepted, maybe trigger immediate actions like map loading check
     if(choice === 'accepted') {
        // Re-run map check in case it depends on this consent
        setupMapPlaceholders();
        // Re-apply theme based on potentially now readable preference
        setupDarkMode();
     }
  };

  acceptAllBtn.addEventListener('click', () => handleConsent('accepted'));
  acceptNecessaryBtn.addEventListener('click', () => handleConsent('declined'));
}


/**
 * Initializes accordion functionality for FAQ page
 */
function setupAccordion() {
    // ... Accordion logic remains unchanged ...
    const accordionHeaders = document.querySelectorAll('.accordion__header');

      if (accordionHeaders.length > 0) {
        accordionHeaders.forEach(header => {
            const content = header.nextElementSibling;
            if (header.classList.contains('active') && content) {
                 content.classList.add('show');
            } else if (content) {
                content.classList.remove('show');
            }
            header.setAttribute('aria-expanded', header.classList.contains('active'));
        });


        accordionHeaders.forEach(header => {
          header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            if (!content) return;

            const isActive = this.classList.contains('active');

            accordionHeaders.forEach(otherHeader => {
              if (otherHeader !== this) {
                otherHeader.classList.remove('active');
                 const otherContent = otherHeader.nextElementSibling;
                 if (otherContent) {
                    otherContent.classList.remove('show');
                 }
                otherHeader.setAttribute('aria-expanded', 'false');
              }
            });

            this.classList.toggle('active', !isActive);
            content.classList.toggle('show', !isActive);
            this.setAttribute('aria-expanded', !isActive);
          });
        });
      }
}

/**
 * Sets up the custom lightbox functionality for the gallery page
 */
function setupCustomLightbox() {
    // ... Lightbox logic remains unchanged ...
     const galleryLinks = document.querySelectorAll('.gallery__link');
      if (galleryLinks.length === 0) return;

      let lightboxEl, lightboxImage, lightboxPrevBtn, lightboxNextBtn, lightboxCloseBtn;
      let currentIndex = 0;
      const images = Array.from(galleryLinks).map(link => ({
        src: link.href,
        alt: link.querySelector('img')?.alt || 'Galeriebild'
      }));

      function createLightboxDOM() {
        lightboxEl = document.createElement('div');
        lightboxEl.className = 'lightbox';
        lightboxEl.setAttribute('role', 'dialog');
        lightboxEl.setAttribute('aria-modal', 'true');
        lightboxEl.setAttribute('aria-label', 'Bildansicht');
        lightboxEl.innerHTML = `
          <div class="lightbox__content">
            <img class="lightbox__image" src="" alt="">
            <button class="lightbox__button lightbox__button--prev" aria-label="Voriges Bild">❮</button>
            <button class="lightbox__button lightbox__button--next" aria-label="Nächstes Bild">❯</button>
            <button class="lightbox__button lightbox__button--close" aria-label="Schließen">×</button>
          </div>
        `;
        document.body.appendChild(lightboxEl);

        lightboxImage = lightboxEl.querySelector('.lightbox__image');
        lightboxPrevBtn = lightboxEl.querySelector('.lightbox__button--prev');
        lightboxNextBtn = lightboxEl.querySelector('.lightbox__button--next');
        lightboxCloseBtn = lightboxEl.querySelector('.lightbox__button--close');

        addLightboxEventListeners();
      }

      function openLightbox(index) {
        if (!lightboxEl) createLightboxDOM();

        currentIndex = index;
        updateLightboxContent();
        requestAnimationFrame(() => {
            lightboxEl.classList.add('active');
        });
        document.body.style.overflow = 'hidden';
        lightboxCloseBtn.focus();

        lightboxEl.setAttribute('data-single-image', images.length <= 1);
      }

      function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('active');
        document.body.style.overflow = '';
        if (galleryLinks[currentIndex]) {
            galleryLinks[currentIndex].focus();
        }
      }

      function updateLightboxContent() {
        if (!lightboxEl) return;
        const image = images[currentIndex];
        const img = new Image();
        img.onload = () => {
            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;
        }
        img.onerror = () => {
            console.error(`Failed to load image: ${image.src}`);
            lightboxImage.alt = "Bild konnte nicht geladen werden";
        }
        img.src = image.src;
        lightboxImage.src = "";
        lightboxImage.alt = "Lade Bild...";
      }

      function showPrevImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent();
      }

      function showNextImage() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent();
      }

      function handleKeydown(e) {
        if (!lightboxEl || !lightboxEl.classList.contains('active')) return;

        switch (e.key) {
          case 'Escape':
            closeLightbox();
            break;
          case 'ArrowLeft':
            if (images.length > 1) showPrevImage();
            break;
          case 'ArrowRight':
            if (images.length > 1) showNextImage();
            break;
           case 'Tab':
             const buttons = [lightboxPrevBtn, lightboxNextBtn, lightboxCloseBtn].filter(btn => btn.style.display !== 'none' && btn.offsetParent !== null);
             const focusableElements = [lightboxImage, ...buttons];
             const focusedIndex = focusableElements.indexOf(document.activeElement);

             if (focusableElements.length > 0) {
                 e.preventDefault();
                 let nextIndex;
                 if (e.shiftKey) {
                     nextIndex = (focusedIndex - 1 + focusableElements.length) % focusableElements.length;
                 } else {
                     nextIndex = (focusedIndex + 1) % focusableElements.length;
                 }
                 focusableElements[nextIndex]?.focus();
             }
             break;
        }
      }

      function addLightboxEventListeners() {
        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl) {
                closeLightbox();
            }
        });
        lightboxCloseBtn.addEventListener('click', closeLightbox);
        lightboxPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrevImage();
        });
        lightboxNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });
        document.addEventListener('keydown', handleKeydown);

        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50;

        lightboxEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && !e.target.closest('.lightbox__button')) {
                touchStartX = e.touches[0].clientX;
            } else {
                touchStartX = 0;
            }
        }, { passive: true });

        lightboxEl.addEventListener('touchend', (e) => {
            if (touchStartX === 0 || e.changedTouches.length !== 1) {
                return;
            }
            touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > swipeThreshold && images.length > 1) {
                if (deltaX > 0) {
                    showPrevImage();
                } else {
                    showNextImage();
                }
            }
            touchStartX = 0;
        }, { passive: true });
      }


      galleryLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openLightbox(index);
        });
      });
}


/**
 * Sets up Google Maps placeholders, respecting user consent choice for loading and persistence.
 */
function setupMapPlaceholders() {
    const mapContainers = document.querySelectorAll('.contact-section__map, .contact-details__map');
    const mapSrc = "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10638.219829943311!2d16.2869364!3d48.1959257!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x41574f56b97d8bc!2sBrigitte+Swoboda+-+Klavierunterricht+1140+Wien!5e0!3m2!1sde!2sat!4v1565792002575!5m2!1sde!2sat";
    const generalConsentKey = 'consentChoice';
    const mapConsentKey = 'mapConsentGiven';

    // Function to load the map iframe
    function loadMap(mapContainer, placeholder) {
        if (mapContainer.querySelector('iframe')) {
            if(placeholder) placeholder.classList.add('hidden');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', mapSrc);
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.setAttribute('title', 'Kartenansicht Standort Klavierunterricht Brigitte Swoboda');
        iframe.style.opacity = '0';
        iframe.style.visibility = 'hidden';

        iframe.onload = () => {
            iframe.style.opacity = '1';
            iframe.style.visibility = 'visible';
            if (placeholder) {
                 placeholder.classList.add('hidden');
            }
        };
        iframe.onerror = () => {
            console.error("Google Maps iframe could not be loaded.");
            if (placeholder) {
                placeholder.querySelector('.map-placeholder__overlay').innerHTML = '<p style="color: red;">Karte konnte nicht geladen werden.</p>';
            }
        };
        mapContainer.prepend(iframe);
    }

    // Check general consent status
    const generalConsent = localStorage.getItem(generalConsentKey);

    mapContainers.forEach(container => {
        const placeholder = container.querySelector('.map-placeholder');
        const existingIframe = container.querySelector('iframe');

        if (generalConsent === 'accepted') {
            // User accepted all, check if map consent was also given previously
            const mapConsentGiven = localStorage.getItem(mapConsentKey) === 'true';
            if (mapConsentGiven) {
                loadMap(container, placeholder); // Load automatically
            } else {
                // Show placeholder, but save consent on click
                if(existingIframe) existingIframe.remove(); // Remove iframe if consent revoked implicitly
                if (placeholder) {
                    placeholder.classList.remove('hidden');
                    const loadButton = placeholder.querySelector('.map-placeholder__button');
                    if (loadButton) {
                        loadButton.addEventListener('click', () => {
                            loadMap(container, placeholder);
                            localStorage.setItem(mapConsentKey, 'true'); // Save map specific consent
                        }, { once: true });
                    }
                }
            }
        } else { // Includes 'declined' or null (no choice made yet)
            // User declined or hasn't chosen: Show placeholder, load ONLY on click, DO NOT save map consent
            if(existingIframe) existingIframe.remove(); // Ensure no map is loaded initially
            if (placeholder) {
                 placeholder.classList.remove('hidden'); // Make sure placeholder is visible
                const loadButton = placeholder.querySelector('.map-placeholder__button');
                if (loadButton) {
                    loadButton.addEventListener('click', () => {
                        loadMap(container, placeholder);
                        // DO NOT save mapConsentGiven here if general consent was declined/null
                    }, { once: true });
                }
            }
        }
    });
}