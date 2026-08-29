/* ==========================================================================
   Suriya N Portfolio Script
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------------------------
    // 1. TYPING ANIMATION (Typed.js)
    // ----------------------------------------------------------------------
    const typingElement = document.getElementById("typing");
    if (typingElement && typeof Typed !== "undefined") {
        new Typed("#typing", {
            strings: [
                "Full Stack Developer",
                "Python Developer",
                "Web Developer",
                "Database Enthusiast"
            ],
            typeSpeed: 70,
            backSpeed: 45,
            backDelay: 1400,
            loop: true
        });
    }

    // ----------------------------------------------------------------------
    // 2. EDUCATION ACCORDION
    // ----------------------------------------------------------------------
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    accordionHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            const isActive = item.classList.contains("active");

            // Close all other accordions
            document.querySelectorAll(".accordion-item").forEach(otherItem => {
                otherItem.classList.remove("active");
                if (otherItem.querySelector(".accordion-content")) {
                    otherItem.querySelector(".accordion-content").style.maxHeight = null;
                }
            });

            // Toggle clicked item
            if (!isActive) {
                item.classList.add("active");
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // ----------------------------------------------------------------------
    // 3. THEME TOGGLE (Dark / Light Mode)
    // ----------------------------------------------------------------------
    const themeToggleBtn = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;

    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem("portfolio-theme") || "dark";
    htmlElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const currentTheme = htmlElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            
            htmlElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("portfolio-theme", newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector("i");
        if (theme === "light") {
            icon.className = "fas fa-sun";
            themeToggleBtn.setAttribute("title", "Switch to Dark Mode");
        } else {
            icon.className = "fas fa-moon";
            themeToggleBtn.setAttribute("title", "Switch to Light Mode");
        }
    }

    // ----------------------------------------------------------------------
    // 4. MOBILE HAMBURGER MENU
    // ----------------------------------------------------------------------
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("show");
            const icon = hamburger.querySelector("i");
            if (navLinks.classList.contains("show")) {
                icon.className = "fas fa-times";
            } else {
                icon.className = "fas fa-bars";
            }
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("show");
                if (hamburger.querySelector("i")) {
                    hamburger.querySelector("i").className = "fas fa-bars";
                }
            });
        });
    }

    // ----------------------------------------------------------------------
    // 5. SCROLLSPY ACTIVE NAVIGATION & BACK TO TOP BUTTON
    // ----------------------------------------------------------------------
    const sections = document.querySelectorAll("section[id]");
    const navItems = document.querySelectorAll(".nav-links a");
    const backToTopBtn = document.getElementById("backToTop");

    window.addEventListener("scroll", () => {
        const scrollY = window.pageYOffset;

        // Scrollspy
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute("id");

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove("active");
                    if (item.getAttribute("href") === `#${sectionId}`) {
                        item.classList.add("active");
                    }
                });
            }
        });

        // Back to top visibility
        if (backToTopBtn) {
            if (scrollY > 400) {
                backToTopBtn.classList.add("show");
            } else {
                backToTopBtn.classList.remove("show");
            }
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // ----------------------------------------------------------------------
    // 6. CONTACT FORM SUBMISSION HANDLER (Sends to suriyachandru2006@gmail.com)
    // ----------------------------------------------------------------------
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector("button[type='submit']");
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const subject = document.getElementById("subject").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !subject || !message) {
                formStatus.className = "form-status error";
                formStatus.textContent = "Please fill in all fields.";
                return;
            }

            // Disable submit button during request
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.querySelector("span").textContent = "Sending...";
            }
            formStatus.className = "form-status";
            formStatus.textContent = "Sending your message...";

            try {
                const response = await fetch("https://formsubmit.co/ajax/suriyachandru2006@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        _subject: `[Portfolio Inquiry] ${subject}`,
                        message: message
                    })
                });

                const result = await response.json();

                if (response.ok || result.success === "true") {
                    formStatus.className = "form-status success";
                    formStatus.textContent = `Thank you, ${name}! Your message has been sent to suriyachandru2006@gmail.com.`;
                    contactForm.reset();
                } else {
                    throw new Error("Failed to deliver message.");
                }
            } catch (err) {
                console.error("Form error:", err);
                formStatus.className = "form-status error";
                formStatus.textContent = "Unable to send message automatically. You can email directly to suriyachandru2006@gmail.com.";
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.querySelector("span").textContent = "Send Message";
                }
                setTimeout(() => {
                    if (formStatus.className.includes("success")) {
                        formStatus.textContent = "";
                    }
                }, 7000);
            }
        });
    }
});

// --------------------------------------------------------------------------
// 7. LOADER SCREEN CONTROLLER
// --------------------------------------------------------------------------
window.addEventListener("load", () => {
    const circle = document.querySelector(".progress-ring");
    const percentage = document.getElementById("percentage");
    const loader = document.getElementById("loader");

    if (!circle || !percentage || !loader) return;

    const radius = 95;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    document.body.style.overflow = "hidden";

    let count = 0;

    function updateLoader() {
        count++;
        percentage.innerHTML = count + "%";

        const offset = circumference - (count / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        let speed = count < 70 ? 15 : count < 90 ? 35 : 70;

        if (count < 100) {
            setTimeout(updateLoader, speed);
        } else {
            setTimeout(() => {
                loader.style.transition = "opacity 0.8s ease";
                loader.style.opacity = "0";
                setTimeout(() => {
                    loader.style.display = "none";
                    document.body.style.overflow = "auto";
                }, 800);
            }, 300);
        }
    }

    updateLoader();
});