document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LANGUAGE CONFIGURATION ---
  const languages = ["az", "en", "ru"]; // The order of rotation
  const translations = {
    az: {
      btn_text: "AZ",
      nav_home: "Əsas səhifə",
      nav_about: "Biz kimik?",
      nav_services: "Xidmətlər",
      nav_contact: "Bizimlə əlaqə",
      hero_sub: "Gələcəyinizə ilk addım",
      hero_title: "Sərhədsiz təhsil,<br> <span>GlobalGo</span> ilə.",
      hero_desc:
        "Xaricdə təhsil xəyallarınızı reallaşdırmaq üçün peşəkar dəstək.",
      btn_apply: "Müraciət et",
      section_about: "Biz kimik?",
      about_desc:
        "GlobalGo, tələbələrə beynəlxalq təhsil imkanlarını əlçatan edən platformadır.",
      section_services: "Xidmətlər",
      serv_1: "Universitet Seçimi",
      serv_1_desc: "Akademik göstəricilərinizə uyğun universitetlər.",
      serv_2: "Sənədləşmə",
      serv_2_desc: "Qəbul prosesi üçün sənədlərin hazırlanması.",
      serv_3: "Viza Dəstəyi",
      serv_3_desc: "Viza müraciəti prosesində tam dəstək.",
      serv_4: "Konsultasiya",
      serv_4_desc: "Təhsil və karyera planlaması.",
      contact_title: "Bizimlə əlaqə",
      accent_text: "Növbəti addımı atın",
      contact_sub: "Sualınız var? Bizimlə əlaqə saxlayın.",
      btn_send: "Mesaj göndər",
    },
    en: {
      btn_text: "EN",
      nav_home: "Home",
      nav_about: "About Us",
      nav_services: "Services",
      nav_contact: "Contact",
      hero_sub: "First step to your future",
      hero_title: "Education without borders,<br> with <span>GlobalGo</span>.",
      hero_desc:
        "Professional support to realize your dreams of studying abroad.",
      btn_apply: "Apply Now",
      section_about: "Who We Are?",
      about_desc:
        "GlobalGo is a platform making international education accessible.",
      about_desc_2:
        "With a professional team and a wide network of universities, we guide you every step of the way.",
      section_services: "Services",
      serv_1: "University Selection",
      serv_1_desc: "Best universities based on your metrics.",
      serv_2: "Documentation",
      serv_2_desc: "Preparation of all documents for admission.",
      serv_3: "Visa Support",
      serv_3_desc: "Full support during the visa process.",
      serv_4: "Consultation",
      serv_4_desc: "Education and career planning.",
      contact_title: "Contact Us",
      accent_text: "Take the next step",
      contact_sub: "Have questions? Get in touch with us.",
      btn_send: "Send Message",
    },
    ru: {
      btn_text: "RU",
      nav_home: "Главная",
      nav_about: "О нас",
      nav_services: "Услуги",
      nav_contact: "Контакты",
      hero_sub: "Первый шаг к будущему",
      hero_title: "Образование без границ,<br> с <span>GlobalGo</span>.",
      hero_desc:
        "Профессиональная поддержка для реализации вашей мечты об обучении за рубежом.",
      btn_apply: "Подать заявку",
      section_about: "Кто мы?",
      about_desc:
        "GlobalGo — это платформа, делающая международное образование доступным.",
      about_desc_2:
        "С профессиональной командой и широкой сетью университетов мы сопровождаем вас на каждом этапе пути.",
      section_services: "Услуги",
      serv_1: "Выбор ВУЗа",
      serv_1_desc: "Подбор лучших университетов.",
      serv_2: "Документы",
      serv_2_desc: "Подготовка всех документов для поступления.",
      serv_3: "Визовая поддержка",
      serv_3_desc: "Полная поддержка в процессе получения визы.",
      serv_4: "Консультация",
      serv_4_desc: "Планирование образования и карьеры.",
      contact_title: "Связаться",
      accent_text: "Сделайте следующий шаг",
      contact_sub: "Есть вопросы? Напишите нам.",
      btn_send: "Отправить",
    },
  };

  // --- 2. CHANGE LANGUAGE FUNCTION ---
  function changeLanguage(lang) {
    // Default to AZ if something goes wrong
    if (!translations[lang]) lang = "az";

    // Update all text on the page
    const elements = document.querySelectorAll("[data-key]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-key");
      if (translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    // Update the Toggle Button Text (Show current lang)
    const toggleBtn = document.getElementById("lang-toggle");
    if (toggleBtn) toggleBtn.innerText = translations[lang].btn_text;

    // Update URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("lang", lang);
    window.history.pushState({}, "", newUrl);

    // Save Preference
    localStorage.setItem("selectedLang", lang);
  }

  // --- 3. INITIALIZE ON LOAD ---
  const urlParams = new URLSearchParams(window.location.search);
  const savedLang = localStorage.getItem("selectedLang");
  let currentLang = urlParams.get("lang") || savedLang || "az";

  // Ensure currentLang is valid
  if (!languages.includes(currentLang)) currentLang = "az";

  changeLanguage(currentLang);

  // --- 4. BUTTON CLICK EVENT (The Cycle Logic) ---
  const toggleBtn = document.getElementById("lang-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      // Find current index
      let index = languages.indexOf(currentLang);
      // Calculate next index (loops back to 0 if at the end)
      let nextIndex = (index + 1) % languages.length;
      // Set new lang
      currentLang = languages[nextIndex];
      changeLanguage(currentLang);
    });
  }

  // --- 5. MOBILE MENU & SCROLL EFFECTS ---
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-menu a");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      const icon = mobileToggle.querySelector("i");
      navMenu.classList.contains("active")
        ? (icon.classList.remove("fa-bars"), icon.classList.add("fa-times"))
        : (icon.classList.remove("fa-times"), icon.classList.add("fa-bars"));
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      if (mobileToggle)
        mobileToggle
          .querySelector("i")
          .classList.replace("fa-times", "fa-bars");
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.15 },
  );

  document
    .querySelectorAll(".reveal")
    .forEach((el) => revealObserver.observe(el));
});
