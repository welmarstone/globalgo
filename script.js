document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LANGUAGE CONFIGURATION ---
  const languages = ["az", "en", "ru"];

  // Helper to load a script dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // --- 2. CHANGE LANGUAGE FUNCTION ---
  async function changeLanguage(lang) {
    if (!languages.includes(lang)) lang = "az";

    // 1. Load the language file if needed
    // We expect the file to populate window.translations[lang]
    try {
      await loadScript(`lang/${lang}.js`);
    } catch (e) {
      console.error(`Failed to load language: ${lang}`, e);
      return; // Stop if we can't load the language
    }

    // 2. Get the dictionary
    const dictionary = window.translations && window.translations[lang];
    if (!dictionary) {
      console.error(`Language loaded but dictionary missing for: ${lang}`);
      return;
    }

    // 3. Update all text on the page
    const elements = document.querySelectorAll("[data-key]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-key");
      if (dictionary[key]) {
        el.innerHTML = dictionary[key];
      }
    });

    // 4. Update the Toggle Button Text
    const toggleBtn = document.getElementById("lang-toggle");
    if (toggleBtn && dictionary.btn_text) {
      toggleBtn.innerText = dictionary.btn_text;
    }

    // 5. Update URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("lang", lang);
    window.history.pushState({}, "", newUrl);

    // 6. Save Preference
    try {
      localStorage.setItem("selectedLang", lang);
    } catch (e) {
      console.warn("LocalStorage access denied", e);
    }

    // 7. Update currentLang variable so the toggle works correctly
    currentLang = lang;

    // 8. Handle AI Counselor Visibility (English Only)
    const aiSection = document.getElementById("ai-counselor");
    if (aiSection) {
      if (lang === "en") {
        aiSection.style.display = "block";
      } else {
        aiSection.style.display = "none";
      }
    }
  }

  // --- 3. INITIALIZE ON LOAD ---
  const urlParams = new URLSearchParams(window.location.search);
  let savedLang = null;
  try {
    savedLang = localStorage.getItem("selectedLang");
  } catch (e) {
    console.warn("LocalStorage access denied", e);
  }

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
      // Calculate next index
      let nextIndex = (index + 1) % languages.length;
      // Set new lang
      let nextLang = languages[nextIndex];
      changeLanguage(nextLang);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    el.classList.add("reveal-pending");
    revealObserver.observe(el);
  });


  // --- 6. AI FORM HANDLING ---
  const aiForm = document.getElementById("ai-form");
  const resultContainer = document.getElementById("ai-result-container");
  const aiLoader = document.getElementById("ai-loader");
  const aiResponse = document.getElementById("ai-response");
  const chatSection = document.getElementById("chat-section");
  const chatHistory = document.getElementById("chat-history");
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const chatLoader = document.getElementById("chat-loader");

  // Store student profile and conversation history
  let studentProfile = null;
  let conversationHistory = [];
  let initialResponse = "";

  if (aiForm) {
    aiForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Show loader
      resultContainer.classList.remove("hidden");
      aiLoader.classList.remove("hidden");
      aiResponse.classList.add("hidden");
      
      chatSection.style.display = "none"; // Reset display
      chatSection.classList.add("hidden");
      
      aiResponse.innerHTML = "";
      chatHistory.innerHTML = "";
      conversationHistory = [];

      // Gather Data
      const formData = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        citizenship: document.getElementById("citizenship").value,
        targetCountry: document.getElementById("target_country").value,
        education: document.getElementById("education").value,
        major: document.getElementById("major").value,
        gpa: document.getElementById("gpa").value,
        englishLevel: document.getElementById("english_level").value,
        language: currentLang // Send current UI language so AI replies in correct language
      };

      // Store student profile for chat
      studentProfile = formData;

      try {
        const response = await fetch("http://localhost:3000/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.advice) {
            // Simple Markdown Parser (Headers, Bold, Lists)
            let html = data.advice
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>') // Naive list
                .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent lists
                .replace(/\n\n/g, '<p></p>'); // Paragraphs

            // Make it safer for naive lists (Block replacement)
            // A better approach for lists without a library:
            const formatList = (text) => {
                const lines = text.split('\n');
                let inList = false;
                let output = '';
                lines.forEach(line => {
                    if (line.trim().startsWith('* ')) {
                        if (!inList) { output += '<ul>'; inList = true; }
                        output += `<li>${line.trim().substring(2)}</li>`;
                    } else {
                        if (inList) { output += '</ul>'; inList = false; }
                        output += line + '\n';
                    }
                });
                if (inList) output += '</ul>';
                return output;
            };
            
            // Re-apply formatting with better list handling
            html = formatList(data.advice)
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');

            aiResponse.innerHTML = html;
            initialResponse = data.advice;

            // Show chat section immediately
            console.log("Showing chat section...");
            chatSection.style.display = "block"; // Force display
            chatSection.classList.remove("hidden");
            
            // Scroll to chat section smoothly
            setTimeout(() => {
                console.log("Scrolling to chat section...");
                chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } else {
            console.error("No advice data received");
            aiResponse.innerHTML = "<p style='color:red'>Error: Could not generate advice.</p>";
        }

      } catch (error) {
        console.error("Error:", error);
        aiResponse.innerHTML = "<p style='color:red'>Server connection failed. Please ensure 'node server.js' is running.</p>";
      } finally {
        aiLoader.classList.add("hidden");
        aiResponse.classList.remove("hidden");
      }
    });
  }

  // --- 7. CHAT FUNCTIONALITY ---
  async function sendChatMessage() {
    const question = chatInput.value.trim();
    if (!question || !studentProfile) return;

    // Add user message to chat history display
    addMessageToChat('user', question);
    
    // Clear input and disable while processing
    chatInput.value = "";
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    chatLoader.classList.remove("hidden");

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentProfile: studentProfile,
          conversationHistory: conversationHistory,
          question: question,
          language: currentLang
        }),
      });

      const data = await response.json();

      if (data.answer) {
        // Add AI response to chat
        addMessageToChat('ai', data.answer);
        
        // Update conversation history
        conversationHistory.push(
          { type: 'user', content: question },
          { type: 'ai', content: data.answer }
        );
      } else {
        addMessageToChat('ai', "Sorry, I couldn't generate a response. Please try again.");
      }

    } catch (error) {
      console.error("Chat error:", error);
      addMessageToChat('ai', "Connection error. Please make sure the server is running.");
    } finally {
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatLoader.classList.add("hidden");
      chatInput.focus();
    }
  }

  function addMessageToChat(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${type}`;
    
    if (type === 'user') {
      messageDiv.innerHTML = `
        <div class="chat-message-header">
          <i class="fas fa-user"></i>
          <strong>You</strong>
        </div>
        <div class="chat-message-content">${content}</div>
      `;
    } else {
      // Format AI response (simple markdown)
      let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      
      messageDiv.innerHTML = `
        <div class="chat-message-header">
          <i class="fas fa-robot"></i>
          <strong>AI Counselor</strong>
        </div>
        <div class="chat-message-content">${formattedContent}</div>
      `;
    }
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // Chat event listeners
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendChatMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
});
