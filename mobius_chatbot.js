/**
 * Mobius Chatbot - Synappse Official AI
 *
 * @version 7.1 - Vercel Proxy Integration
 * - **Key Improvement**: Rerouted all Gemini API calls through a Vercel serverless function (`/api/gemini-proxy`).
 * - **Security**: Removed the client-side `GEMINI_API_KEY`. The API key is now securely stored as an environment variable on Vercel, protecting it from browser exposure.
 * - **Optimization**: Aligned client-side `fetch` requests with the expected payload and response structure of the new proxy function.
 * - **Follow-up Action**: Maintained the seamless user journey where Mobius offers to navigate after providing information.
 * @author Synappse
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";


document.addEventListener('DOMContentLoaded', () => {
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDNuLjTJWm5z00TLWvaMa8CUUQngPsqqN4", // Firebase API Key (client-side safe)
        authDomain: "mobius-ai-805b9.firebaseapp.com",
        projectId: "mobius-ai-805b9",
        storageBucket: "mobius-ai-805b9.firebasestorage.app",
        messagingSenderId: "192830895272",
        appId: "1:192830895272:web:ced3c55afc174e88c5be9d",
        measurementId: "G-S9DJGFXWPK"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);

    // Cooldown period in milliseconds to prevent API spam
    const COOLDOWN_PERIOD = 3000; // 3 seconds

    // --- Dynamic Interview State Management ---
    let interviewState = null; // Can be null, 'pending_confirmation', or 'active'
    let interviewProgress = 0;
    const interviewQuestionPools = [
        // Pool 1: Passion & Creativity
        [
            {
                question: "To start, if you had to design a 3D model that represents 'innovation,' what would it look like and why?",
                keywords: ['abstract', 'light', 'connect', 'dynamic', 'sleek', 'gears', 'brain', 'network', 'particle']
            },
            {
                question: "Let's talk creativity. Describe a concept for a 'gamified learning' app for a topic you're passionate about.",
                keywords: ['points', 'levels', 'fun', 'reward', 'interactive', 'story', 'challenge', 'progress', 'leaderboard']
            }
        ],
        // Pool 2: Problem Solving & Client Focus
        [
            {
                question: "Great answer. Now for a scenario: a client wants a 'Website Gift' portfolio for a loved one but is unsure of the design. How would you guide them to a concept that feels personal and heartfelt?",
                keywords: ['listen', 'story', 'photos', 'colors', 'feelings', 'collaboration', 'timeline', 'memories', 'ask questions']
            },
            {
                question: "Next question: a startup needs a business logo but has a very abstract idea. How would you translate their vision into a memorable and impactful logo?",
                keywords: ['mood board', 'research', 'sketch', 'iterations', 'feedback', 'meaning', 'simple', 'versatile', 'symbolism']
            }
        ]
    ];
    let currentInterviewQuestions = [];

    const startupDisclaimerMessage = `**Welcome, future Synappse Shaper!** You've found a hidden path to our recruitment process.
    
    Before we dive in, let's talk about life at a startup like SYNAPPSE. It's a dynamic environment with unique pros and cons:

    **🚀 Pros:**
    * **Rapid Growth & Learning:** You'll learn fast and wear many hats, gaining diverse skills.
    * **Direct Impact:** Your work directly contributes to the company's success.
    * **Innovation & Agility:** We move quickly, adapt to new ideas, and aren't tied down by bureaucracy.
    * **Close-Knit Team:** You'll be part of a passionate team, often with direct access to founders.
    * **Opportunity for Ownership:** More chances to take initiative and lead projects.

    **🚧 Cons:**
    * **Hustle & Pace:** It's often fast-paced, demanding, and requires high energy.
    * **Resource Constraints:** Budgets might be tighter than larger companies, requiring creativity.
    * **Unpredictability:** Plans can change rapidly; adaptability is key.
    * **Less Structure:** Roles might be less defined, requiring self-direction and initiative.

    It's a world of both exciting opportunities and unique challenges. Are you ready to embrace both and continue with the interview? (Yes/No)`;

    const finalHiringMessage = `Excellent. You've got the right mindset! 🚀 It seems you've passed the initial screening.

Synappse is a whirlwind of creativity and fast-paced projects. If you're ready for an adventure, we'd be thrilled to see what you've got.

Please send an email to **synpps@gmail.com** with the subject line 'Aspiring Synappse Shaper'. Be sure to include:
✨ Your updated Resume
✨ A link to your Portfolio (show us your magic!)
✨ A brief introduction telling us about your passions and what you'd bring to our team.

We can't wait to potentially welcome you aboard!`;

    // --- Fully Interactive FAQ Map with unique keys ---
    const FAQ = new Map([
        ['hiring_intent', {
            keywords: ['hire', 'hired', 'join', 'job', 'work for', 'career', 'recruiting', 'recruitment', 'interview', 'apply', 'applying', 'employment', 'position', 'opportunity'],
            answer: null, 
            action: () => initiateInterview()
        }],
        ['price_intent', {
            keywords: ['price', 'cost', 'how much'],
            answer: "Thank you for your interest! Pricing varies depending on the project. For a detailed quote, please use the contact form. Let me guide you there.",
            action: () => guideTo('#cta')
        }],
        ['services_general', {
            keywords: ['services', 'what do you do', 'offer'],
            answer: "We craft a wide range of digital assets. I'll take you to the services section now. Feel free to ask me to highlight a specific one!",
            action: () => guideTo('#services')
        }],
        ['philosophy_general', {
            keywords: ['philosophy', 'ethos', 'believe'],
            answer: "Our philosophy is the SYNAPPSE Ethos. I'll guide you to that section so you can see our core principles.",
            action: () => guideTo('#about')
        }],
        ['contact_general', {
            keywords: ['contact', 'get in touch', 'email', 'book', 'request service'],
            answer: "You can get in touch with us using the contact form at the bottom of the page. Let me take you there!",
            action: () => guideTo('#cta')
        }],
        ['achievements_general', {
            keywords: ['achievements', 'credentials', 'badges', 'trustworthy'],
            answer: "Our credentials from Google are a testament to our expertise. Let me show you the achievements section.",
            action: () => guideTo('#achievements')
        }],
        ['show_example_service', {
            keywords: ['show me a service', 'example of a service', 'show service'],
            answer: "Of course! Here is one of our most popular services: Professional Portfolios.",
            action: () => guideTo('.service-card[data-service-id="professional-portfolios"]')
        }],
        ['service_personal_website', { keywords: ['personal website', 'static website'], action: () => guideTo('.service-card[data-service-id="personal-websites"]') }],
        ['service_portfolio', { keywords: ['portfolio'], action: () => guideTo('.service-card[data-service-id="professional-portfolios"]') }],
        ['service_social_media', { keywords: ['social media design'], action: () => guideTo('.service-card[data-service-id="social-media-designs"]') }],
        ['service_birthday_site', { keywords: ['birthday site'], action: () => guideTo('.service-card[data-service-id="birthday-sites"]') }],
        ['service_gamified', { keywords: ['gamified', 'review material'], action: () => guideTo('.service-card[data-service-id="gamified-reviews"]') }],
        ['service_logo', { keywords: ['logo', 'logos'], action: () => guideTo('.service-card[data-service-id="business-logos"]') }],
        ['service_website_gift', { keywords: ['website gift'], action: () => guideTo('.service-card[data-service-id="website-gifts"]') }],
        ['service_3d_model', { keywords: ['3d model', '3d product'], action: () => guideTo('.service-card[data-service-id="3d-models"]') }],
        ['service_group_site', { keywords: ['animated group', 'clan website'], action: () => guideTo('.service-card[data-service-id="animated-group-sites"]') }],
        ['service_countdown', { keywords: ['countdown', 'calendar'], action: () => guideTo('.service-card[data-service-id="countdown-calendars"]') }],
        ['service_ai_integration', { keywords: ['ai integration', 'social media ai'], action: () => guideTo('.service-card[data-service-id="ai-integration"]') }],
        ['service_computer_support', { keywords: ['computer service', 'on-site support'], action: () => guideTo('.service-card[data-service-id="on-site-computer-services"]') }],
        ['service_printing', { keywords: ['printing'], action: () => guideTo('.service-card[data-service-id="materials-printing"]') }],
        ['service_email_management', { keywords: ['email management'], action: () => guideTo('.service-card[data-service-id="email-management"]') }],
        ['service_market_research', { keywords: ['market research'], action: () => guideTo('.service-card[data-service-id="market-research"]') }],
        ['custom_systems', {
            keywords: ['system', 'systems', 'develop systems', 'create systems', 'software development', 'custom software', 'build software', 'software solutions', 'software', 'develop solutions'],
            answer: "Yes, Synappse offers cutting-edge custom system and software development. We architect bespoke solutions tailored precisely to your business needs, optimizing workflows and driving innovation. From concept to deployment, we ensure your software empowers your growth. Please use the 'Get in Touch Now!' button for a detailed consultation to discuss how we can build your next big thing!"
        }],
        ['about_mobius', {
            keywords: ['about you', 'who are you', 'who is it', 'what are you', 'your name', 'who is mobius', 'are you mobius', 'what is mobius', 'tell me about yourself', 'your identity', 'are you google', 'trained by google', 'by google', 'who created you', 'who developed you', 'your origin', 'so you are', 'who makes you', 'who are you?', 'what are you?', 'tell me who you are', 'your identity?', 'who made you', 'who built you', 'what is your purpose', 'what is your function', 'you are', 'you are>', 'who you are', 'your creator', 'who is your creator', 'your background', 'what about you', 'are you an ai', 'are you a bot', 'are you a chatbot', 'are you an artificial intelligence', 'what kind of ai are you', 'who developed this'],
            answer: "I am Mobius, the Synappse Official AI. I'm here to guide you through our services and philosophy. How can I help you explore the site?"
        }]
    ]);

    // Store Firebase FAQs separately
    let firebaseFaqs = new Map();

    // Defined list of actual services offered by Synappse for strict AI prompting
    const synappseServices = ["Professional Portfolios", "Personal Static Websites", "Social Media Designs", "Birthday Sites", "Gamified Review Materials", "Business Logos", "Website Gifts", "3D Product Models", "Animated Group Sites", "Countdown Calendars", "AI Integration", "On-site Computer Services", "Materials Printing", "Email Management", "Market Research", "Custom Systems and Software Development"];

    let lastMessageTimestamp = 0;
    let lastSnappedSide = 'right';

    async function initializeChatbot() {
        injectMetaViewport();
        injectStyles();
        createChatbotHTML();

        setTimeout(() => {
            const launcher = document.getElementById('mobius-launcher');
            if (launcher) {
                launcher.style.display = 'flex';
                launcher.style.opacity = '1';
                launcher.style.visibility = 'visible';
                launcher.style.pointerEvents = 'auto';
                launcher.style.transition = 'none';
                snapElementToNearestEdge(launcher, 'right', false);
                void launcher.offsetWidth;
                launcher.style.transition = '';
                attachEventListeners();
            } else {
                console.error("Mobius Chatbot: ERROR - Launcher element not found after HTML injection.");
            }
        }, 50);

        listenToFirebaseFaqs();
    }

    function injectMetaViewport() {
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewportMetaTag = document.createElement('meta');
            viewportMetaTag.name = 'viewport';
            viewportMetaTag.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewportMetaTag);
        }
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --mobius-primary: #6A0DAD;
                --mobius-secondary: #0a0a0a;
                --mobius-accent: #FFD700;
                --mobius-text: #f0f0f0;
                --mobius-user-bg: #333;
            }
            #mobius-launcher {
                position: fixed; z-index: 10000; cursor: grab; user-select: none; pointer-events: auto;
                background: var(--mobius-accent); display: flex; justify-content: center; align-items: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                transition: left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
                width: 70px; height: 70px; border-radius: 50%;
            }
            #mobius-launcher i { color: #f6f5f7; font-size: 28px; transition: transform 0.3s ease; pointer-events: none; }
            #mobius-launcher.snapped { width: 50px; height: 70px; }
            #mobius-launcher.snapped-left { border-radius: 0 35px 35px 0; }
            #mobius-launcher.snapped-right { border-radius: 35px 0 0 35px; }
            #mobius-container {
                position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                transform: scale(0.8) translateY(20px); opacity: 0; visibility: hidden;
                transform-origin: bottom right; transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s;
            }
            #mobius-container.open { transform: scale(1) translateY(0); opacity: 1; visibility: visible; }
            #mobius-widget { width: 350px; max-width: 90vw; height: 500px; max-height: 80vh; background-color: var(--mobius-secondary); border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden; }
            #mobius-header { padding: 15px; background: linear-gradient(45deg, var(--mobius-primary), #4B0082); color: var(--mobius-text); position: relative; display: flex; justify-content: space-between; align-items: center; border-radius: 15px 15px 0 0; }
            #mobius-header h3 { margin: 0; font-size: 1.2em; color: white; }
            #mobius-header p { margin: 0; font-size: 0.8em; opacity: 0.8; }
            #mobius-close-btn { position: absolute; top: 10px; right: 15px; background: none; border: none; color: var(--mobius-text); font-size: 2em; cursor: pointer; }
            #mobius-faq-btn { background: rgba(255,255,255,0.1); border: none; color: white; padding: 5px 10px; border-radius: 8px; cursor: pointer; font-size: 0.9em; transition: background 0.2s ease; margin-right: 20px; }
            #mobius-faq-btn:hover { background: rgba(255,255,255,0.2); }
            #firebase-status { display: flex; align-items: center; gap: 5px; font-size: 0.75em; color: rgba(255,255,255,0.7); margin-left: 10px; }
            #firebase-status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: grey; }
            #firebase-status-dot.connected { background-color: #4CAF50; }
            #firebase-status-dot.error { background-color: #F44336; }
            #mobius-messages { flex-grow: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; }
            #mobius-messages::-webkit-scrollbar { width: 5px; }
            #mobius-messages::-webkit-scrollbar-thumb { background: var(--mobius-primary); border-radius: 5px; }
            .mobius-message { max-width: 80%; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px; line-height: 1.4; animation: fadeIn 0.3s ease; white-space: pre-wrap; word-wrap: break-word; }
            .mobius-message.user { background-color: var(--mobius-user-bg); color: var(--mobius-text); align-self: flex-end; border-bottom-right-radius: 3px; }
            .mobius-message.bot { background-color: #222; color: var(--mobius-text); align-self: flex-start; border-bottom-left-radius: 3px; }
            .mobius-message b, .mobius-message strong { color: var(--mobius-accent); }
            .mobius-message.bot.typing-indicator span { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: var(--mobius-accent); animation: typing 1s infinite; }
            .mobius-message.bot.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .mobius-message.bot.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            .mobius-message-options { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
            .mobius-message-options button { background-color: var(--mobius-primary); color: var(--mobius-text); border: none; padding: 8px 12px; border-radius: 20px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s ease; }
            .mobius-message-options button:hover:not(:disabled) { background-color: #8a2be2; }
            .mobius-message-options button:disabled { background-color: #555; opacity: 0.7; cursor: not-allowed; }
            #mobius-input-area { padding: 15px; border-top: 1px solid #333; display: flex; }
            #mobius-input { flex-grow: 1; background-color: #333; border: 1px solid #444; border-radius: 20px; padding: 10px 15px; color: var(--mobius-text); outline: none; font-size: 16px; }
            #mobius-input:focus { border-color: var(--mobius-primary); }
            #mobius-send-btn { background: none; border: none; color: var(--mobius-primary); font-size: 2em; margin-left: 10px; padding: 5px 10px; cursor: pointer; transition: color 0.3s; border-radius: 20px; min-width: 40px; display: flex; justify-content: center; align-items: center; }
            #mobius-send-btn:hover, #mobius-send-btn:disabled { color: var(--mobius-accent); }
            #mobius-send-btn:disabled { cursor: not-allowed; opacity: 0.5; }
            #mobius-faq-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--mobius-secondary); border-radius: 15px; display: flex; flex-direction: column; visibility: hidden; opacity: 0; transition: opacity 0.3s ease, visibility 0.3s ease; }
            #mobius-faq-overlay.open { visibility: visible; opacity: 1; }
            #mobius-faq-header { padding: 15px; background: #222; color: var(--mobius-text); display: flex; align-items: center; gap: 10px; border-radius: 15px 15px 0 0; position: relative; }
            #mobius-faq-header h4 { margin: 0; font-size: 1.1em; color: white; }
            #mobius-back-btn { background: none; border: none; color: var(--mobius-text); font-size: 1.5em; cursor: pointer; padding: 0 5px; }
            #mobius-faq-list { flex-grow: 1; padding: 15px; overflow-y: auto; }
            #mobius-faq-list .realtime-indicator-container { text-align: center; margin-bottom: 15px; color: #aaa; font-size: 0.75em; }
            #mobius-faq-list .realtime-indicator-container .realtime-dot { display: inline-block; width: 6px; height: 6px; background-color: #4CAF50; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
            .mobius-faq-item { background-color: #222; color: var(--mobius-text); padding: 12px 15px; margin-bottom: 10px; border-radius: 10px; cursor: pointer; transition: background-color 0.2s ease; }
            .mobius-faq-item:hover { background-color: #333; }
            .mobius-text-highlight { background-color: rgba(255, 215, 0, 0.4); padding: 0.1em 0.2em; border-radius: 4px; box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
        `;
        document.head.appendChild(style);
    }

    function createChatbotHTML() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fontAwesomeLink = document.createElement('link');
            fontAwesomeLink.rel = 'stylesheet';
            fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
            document.head.appendChild(fontAwesomeLink);
        }
        const launcherHTML = `<div id="mobius-launcher"><i class="fas fa-robot"></i></div>`;
        const widgetContainerHTML = `
            <div id="mobius-container">
                <div id="mobius-widget">
                    <div id="mobius-header">
                        <div><h3>Mobius</h3><p>Synappse Official AI</p></div>
                        <div id="firebase-status"><span id="firebase-status-dot"></span><span id="firebase-status-text"></span></div>
                        <button id="mobius-faq-btn">FAQs</button>
                        <button id="mobius-close-btn">&times;</button>
                    </div>
                    <div id="mobius-messages"><div class="mobius-message bot">Hello! I'm Mobius. How can I help you explore our digital craft today?</div></div>
                    <div id="mobius-input-area">
                        <input type="text" id="mobius-input" placeholder="Ask about a service..."><button id="mobius-send-btn"><i class="fas fa-paper-plane"></i></button>
                    </div>
                    <div id="mobius-faq-overlay">
                        <div id="mobius-faq-header"><button id="mobius-back-btn"><i class="fas fa-arrow-left"></i></button><h4>Frequently Asked Questions</h4></div>
                        <div id="mobius-faq-list"></div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', launcherHTML);
        document.body.insertAdjacentHTML('beforeend', widgetContainerHTML);
    }

    function handleSendMessage() {
        const input = document.getElementById('mobius-input');
        const message = input.value.trim();
        if (message === '') return;
        const now = Date.now();
        if (now - lastMessageTimestamp < COOLDOWN_PERIOD) {
            addMessage('bot', 'Please wait a moment before sending another message.');
            return;
        }
        lastMessageTimestamp = now;
        addMessage('user', message);
        input.value = '';
        processMessage(message);
    }

    async function processMessage(message) {
        const sendBtn = document.getElementById('mobius-send-btn');
        if (sendBtn) sendBtn.disabled = true;
        addTypingIndicator();

        const lowerCaseMessage = typeof message === 'string' ? message.toLowerCase() : '';

        // --- Intent Detection & State Handling ---
        const hiringIntentKeywords = FAQ.get('hiring_intent').keywords;
        const isHiringQuery = hiringIntentKeywords.some(keyword => lowerCaseMessage.includes(keyword));

        // --- Step 1: Prioritize Interview Flow ---
        if (isHiringQuery && !interviewState) {
            removeTypingIndicator();
            initiateInterview();
            if (sendBtn) sendBtn.disabled = false;
            return;
        }
        if (interviewState) {
            removeTypingIndicator();
            handleInterviewResponse(message);
            if (sendBtn) sendBtn.disabled = false;
            return;
        }

        // --- Step 2: Detect if a specific service is mentioned ---
        let detectedService = null;
        let serviceFaqEntry = null;

        for (const service of synappseServices) {
            const serviceWords = service.toLowerCase().replace(/ and /g, ' ').replace(/-/g, ' ').split(' ');
            const messageWords = lowerCaseMessage.split(' ');
            const matches = serviceWords.filter(sw => messageWords.includes(sw)).length;
            if (matches >= Math.ceil(serviceWords.length * 0.5)) {
                detectedService = service;
                serviceFaqEntry = getFaqAnswerByKeyword(detectedService, FAQ) || getFaqAnswerByKeyword(detectedService, firebaseFaqs);
                break;
            }
        }

        // --- Step 3: Handle Service-Specific Queries with Clarification ---
        if (detectedService) {
            removeTypingIndicator();
            
            const handleInfoRequest = async () => {
                addMessage('user', `Tell me more about ${detectedService}.`);
                addTypingIndicator();
                try {
                    const proxyUrl = '/api/gemini-proxy';
                    const prompt = `You are Mobius, the official AI of Synappse. Your primary function is to market the company and provide concise, natural, and persuasive information. The user is asking for information about the "${detectedService}" service. Provide a brief (2-3 sentences max), conversational, and marketing-oriented explanation of how Synappse delivers this service, focusing on key benefits for the client. Your goal is to be informative and engaging. Do not mention your training or origins. Always identify as Synappse Official AI. Stick strictly to the services provided. User query: "Explain ${message}"`;
                    
                    const payload = { message: prompt };
                    const response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        throw new Error(result.message || `API call failed with status: ${response.status}`);
                    }
                    
                    const text = result.text;
                    removeTypingIndicator();
                    addMessage('bot', text);
                    
                    // Follow-up with navigation offer
                    addMessage('bot', `Would you like me to navigate you to the "${detectedService}" section now?`, [
                        { text: 'Yes, take me there', handler: () => handleNavigationRequest(true) },
                        { text: 'No, thanks', handler: () => { addMessage('user', 'No, thanks.'); addMessage('bot', 'Alright! What else can I help you with?'); }}
                    ]);

                } catch (error) {
                    removeTypingIndicator();
                    console.error("Mobius Chatbot: Error getting service info via proxy:", error);
                    addMessage('bot', "I'm having a bit of trouble connecting right now. Please try again later!");
                }
            };

            const handleNavigationRequest = (fromInfo = false) => {
                if (!fromInfo) addMessage('user', `Take me to ${detectedService}.`);
                addMessage('bot', `Certainly! Guiding you to the ${detectedService} section now.`);
                if (serviceFaqEntry && serviceFaqEntry.action) {
                    setTimeout(() => serviceFaqEntry.action(), 300);
                } else {
                    setTimeout(() => guideTo('#services'), 300);
                }
            };

            addMessage( 'bot', `I see you're asking about "${detectedService}". What would you like to do?`, [
                { text: 'Tell me more (Info)', handler: handleInfoRequest },
                { text: 'Show me where (Navigate)', handler: handleNavigationRequest }
            ]);
            
            if (sendBtn) sendBtn.disabled = false;
            return;
        }

        // --- Step 4: Handle General FAQ or Fallback to AI ---
        let faqMatch = FAQ.get(message) || getFaqAnswerByKeyword(message, FAQ) || getFaqAnswerByKeyword(message, firebaseFaqs);

        if (faqMatch && faqMatch.answer) {
            removeTypingIndicator();
            addMessage('bot', faqMatch.answer);
            if (faqMatch.action) setTimeout(() => faqMatch.action(), 300);
        } else {
            // General AI Fallback
            try {
                const proxyUrl = '/api/gemini-proxy';
                const prompt = `You are Mobius, the official AI of Synappse. Your primary function is to market the company, provide concise information, and assist navigation. You MUST ONLY discuss services from this list: ${synappseServices.join(', ')}. Do NOT invent services. You MUST NOT disclose your training by Google. If a question is outside the scope of Synappse's business, politely decline and redirect to Synappse-related topics. User query: "${message}"`;

                const payload = { message: prompt };
                const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                
                const result = await response.json();
                if (!response.ok || !result.success) {
                     throw new Error(result.message || `API call failed with status: ${response.status}`);
                }
                const text = result.text;
                
                const lowerCaseAiResponse = text.toLowerCase();
                const isBusinessGeneral = ['synappse', 'business', 'solution', 'company', 'marketing', 'navigate'].some(kw => lowerCaseAiResponse.includes(kw));
                const hasNegativeKeyword = ['homework', 'general knowledge', 'unrelated', 'personal assistant', 'chatgpt', 'bard', 'llm', 'google', 'openai', 'cybersecurity'].some(kw => lowerCaseAiResponse.includes(kw));

                removeTypingIndicator();
                if ((isBusinessGeneral || synappseServices.some(s => lowerCaseAiResponse.includes(s.toLowerCase()))) && !hasNegativeKeyword) {
                    addMessage('bot', text);
                } else {
                    addMessage('bot', "I'm Mobius, the Synappse Official AI. My purpose is to help you explore our services and philosophy. How can I assist with something related to Synappse?");
                }
            } catch (error) {
                removeTypingIndicator();
                console.error("Mobius Chatbot: Error with AI fallback via proxy:", error);
                addMessage('bot', "I'm having a bit of trouble with that request. Please try asking about our services or how to get in touch.");
            }
        }
        if (sendBtn) sendBtn.disabled = false;
    }

    function addMessage(sender, text, options = []) {
        if (text === null || typeof text === 'undefined') return;
        const messagesContainer = document.getElementById('mobius-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('mobius-message', sender);
        messageElement.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        messagesContainer.appendChild(messageElement);

        if (options.length > 0) {
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'mobius-message-options';
            
            const allPrevButtons = messagesContainer.querySelectorAll('.mobius-message-options button');
            allPrevButtons.forEach(btn => btn.disabled = true);

            options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option.text;
                button.onclick = () => {
                    optionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
                    option.handler();
                };
                optionsContainer.appendChild(button);
            });
            messageElement.appendChild(optionsContainer);
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- All other helper functions (getFaqAnswerByKeyword, guideTo, interview logic, UI handlers, etc.) remain below ---

    function getFaqAnswerByKeyword(message, faqMap) {
        const lowerCaseMessage = message.toLowerCase();
        for (const [key, response] of faqMap.entries()) {
            if (key !== 'hiring_intent' && response.keywords && response.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
                return response;
            }
        }
        return null;
    }

    function guideTo(targetSelector, textToFind = null) {
        closeChatWindow();
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('mobius-guide', { detail: { targetSelector, textToFind } }));
        }, 300);
    }

    function initiateInterview() {
        interviewState = 'pending_confirmation';
        addTypingIndicator();
        setTimeout(() => { removeTypingIndicator(); addMessage('bot', startupDisclaimerMessage); }, 800);
    }

    function startInterview() {
        interviewState = 'active';
        interviewProgress = 0;
        currentInterviewQuestions = [];
        interviewQuestionPools.forEach(pool => {
            currentInterviewQuestions.push(pool[Math.floor(Math.random() * pool.length)]);
        });
        addTypingIndicator();
        setTimeout(() => { removeTypingIndicator(); addMessage('bot', "Great! Let's begin. \n\n" + currentInterviewQuestions[0].question); }, 800);
    }

    function handleInterviewResponse(message) {
        const lowerCaseMessage = message.toLowerCase();
        if (interviewState === 'pending_confirmation') {
            if (lowerCaseMessage.includes('yes')) {
                startInterview();
            } else {
                addTypingIndicator();
                setTimeout(() => { removeTypingIndicator(); addMessage('bot', "No problem at all. Feel free to explore our services!"); interviewState = null; }, 800);
            }
            return;
        }
        if (interviewState === 'active') {
            const currentQuestion = currentInterviewQuestions[interviewProgress];
            const hasKeyword = currentQuestion.keywords.some(kw => lowerCaseMessage.includes(kw));
            if (hasKeyword) {
                interviewProgress++;
                if (interviewProgress < currentInterviewQuestions.length) {
                    addTypingIndicator();
                    setTimeout(() => { removeTypingIndicator(); addMessage('bot', currentInterviewQuestions[interviewProgress].question); }, 800);
                } else {
                    endInterview(true);
                }
            } else {
                endInterview(false);
            }
        }
    }

    function endInterview(isSuccessful) {
        addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            if (isSuccessful) {
                addMessage('bot', finalHiringMessage);
            } else {
                addMessage('bot', "Thank you for your interest. At this time, it doesn't seem like the right fit. We encourage you to explore our services!");
            }
            interviewState = null;
        }, 1000);
    }

    function addTypingIndicator() {
        const messagesContainer = document.getElementById('mobius-messages');
        if (!messagesContainer || document.getElementById('typing-indicator')) return;
        messagesContainer.insertAdjacentHTML('beforeend', `<div class="mobius-message bot typing-indicator" id="typing-indicator"><span></span><span></span><span></span></div>`);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function closeChatWindow() {
        const container = document.getElementById('mobius-container');
        const launcher = document.getElementById('mobius-launcher');
        if (!container || !launcher) return;
        container.classList.remove('open');
        document.getElementById('mobius-faq-overlay').classList.remove('open');
        document.getElementById('mobius-messages').style.display = 'flex';
        document.getElementById('mobius-input-area').style.display = 'flex';
        launcher.style.opacity = '1';
        launcher.style.visibility = 'visible';
        launcher.style.pointerEvents = 'auto';
        launcher.style.transform = 'scale(1)';
        void launcher.offsetWidth;
        snapElementToNearestEdge(launcher, lastSnappedSide);
    }

    function attachEventListeners() {
        const launcher = document.getElementById('mobius-launcher');
        const closeBtn = document.getElementById('mobius-close-btn');
        const sendBtn = document.getElementById('mobius-send-btn');
        const input = document.getElementById('mobius-input');
        const faqBtn = document.getElementById('mobius-faq-btn');
        const backBtn = document.getElementById('mobius-back-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeChatWindow);
        if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
        if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });
        if (faqBtn) faqBtn.addEventListener('click', showFaqOverlay);
        if (backBtn) backBtn.addEventListener('click', hideFaqOverlay);
        if (launcher) makeLauncherDraggable(launcher);
    }

    function showFaqOverlay() {
        document.getElementById('mobius-messages').style.display = 'none';
        document.getElementById('mobius-input-area').style.display = 'none';
        document.getElementById('mobius-faq-overlay').classList.add('open');
        populateFaqList();
    }

    function hideFaqOverlay() {
        document.getElementById('mobius-faq-overlay').classList.remove('open');
        document.getElementById('mobius-messages').style.display = 'flex';
        document.getElementById('mobius-input-area').style.display = 'flex';
    }

    function populateFaqList() {
        const faqList = document.getElementById('mobius-faq-list');
        if (!faqList) return;
        faqList.innerHTML = `<div class="realtime-indicator-container"><span class="realtime-dot"></span> Questions updated in Real-Time</div>`;
        const specificFaqs = [
            { question: "Can you show me an example service?", key: 'show_example_service' },
            { question: "What is your company philosophy?", key: 'philosophy_general' },
            { question: "How can I see your credentials?", key: 'achievements_general' },
            { question: "How do I get in touch or ask for a price?", key: 'contact_general' },
        ];
        specificFaqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'mobius-faq-item';
            faqItem.textContent = faq.question;
            faqItem.onclick = () => { hideFaqOverlay(); addMessage('user', faq.question); processMessage(faq.key); };
            faqList.appendChild(faqItem);
        });
        const sortedFirebaseFaqs = Array.from(firebaseFaqs.values()).sort((a, b) => a.question.localeCompare(b.question));
        sortedFirebaseFaqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'mobius-faq-item';
            faqItem.textContent = faq.question;
            faqItem.onclick = () => { hideFaqOverlay(); addMessage('user', faq.question); processMessage(faq.question); };
            faqList.appendChild(faqItem);
        });
    }

    async function listenToFirebaseFaqs() {
        const statusDot = document.getElementById('firebase-status-dot');
        const statusText = document.getElementById('firebase-status-text');
        if (statusText) statusText.textContent = 'Connecting...';
        
        try {
            onSnapshot(query(collection(db, "faqs")), (querySnapshot) => {
                firebaseFaqs.clear();
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.keywords && data.answer && data.question) {
                        firebaseFaqs.set(doc.id, {
                            question: data.question,
                            keywords: data.keywords.map(kw => kw.toLowerCase()),
                            answer: data.answer,
                            action: data.action ? eval(`(() => ${data.action})()`) : null
                        });
                    }
                });
                populateFaqList();
                if (statusDot) statusDot.className = 'firebase-status-dot connected';
                if (statusText) statusText.textContent = 'Online';
            }, (error) => {
                console.error("Firebase listener error:", error);
                if (statusDot) statusDot.className = 'firebase-status-dot error';
                if (statusText) statusText.textContent = 'Offline';
            });
        } catch (error) {
            console.error("Firebase setup error:", error);
            if (statusDot) statusDot.className = 'firebase-status-dot error';
            if (statusText) statusText.textContent = 'Offline';
        }
    }

    function makeLauncherDraggable(element) {
        let isDragging = false, wasDragged = false, startClientX, startClientY, initialOffsetX, initialOffsetY;
        const movementThreshold = 10;
        const startDrag = (e) => {
            isDragging = true; wasDragged = false; element.style.cursor = 'grabbing';
            element.classList.remove('snapped', 'snapped-left', 'snapped-right');
            const rect = element.getBoundingClientRect();
            const event = e.type.includes('mouse') ? e : e.touches[0];
            startClientX = event.clientX; startClientY = event.clientY;
            initialOffsetX = event.clientX - rect.left; initialOffsetY = event.clientY - rect.top;
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        };
        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const event = e.type.includes('mouse') ? e : e.touches[0];
            if (Math.abs(event.clientX - startClientX) > movementThreshold || Math.abs(event.clientY - startClientY) > movementThreshold) { wasDragged = true; }
            let newX = event.clientX - initialOffsetX;
            let newY = event.clientY - initialOffsetY;
            const viewportRect = element.getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, window.innerWidth - viewportRect.width));
            newY = Math.max(0, Math.min(newY, window.innerHeight - viewportRect.height));
            element.style.transition = 'none';
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            void element.offsetWidth; element.style.transition = '';
        };
        const stopDrag = () => {
            if (!isDragging) return; isDragging = false; element.style.cursor = 'grab';
            document.removeEventListener('mousemove', drag); document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchend', stopDrag);
            if (wasDragged) {
                snapElementToNearestEdge(element);
            } else {
                document.getElementById('mobius-container').classList.add('open');
                element.style.opacity = '0'; element.style.visibility = 'hidden';
                element.style.pointerEvents = 'none'; element.style.transform = 'scale(0)';
            }
        };
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: true });
    }

    function snapElementToNearestEdge(element, forceSide = null, animate = true) {
        if (!animate) element.style.transition = 'none';
        const verticalPadding = 30; const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        let targetSide = forceSide || ((centerX < window.innerWidth / 2) ? 'left' : 'right');
        const snappedWidth = 50; const snappedHeight = 70;
        let targetX;
        element.classList.add('snapped');
        if (targetSide === 'left') {
            targetX = 0; element.classList.add('snapped-left'); element.classList.remove('snapped-right');
        } else {
            targetX = window.innerWidth - snappedWidth; element.classList.add('snapped-right'); element.classList.remove('snapped-left');
        }
        let targetY = rect.top + (rect.height / 2) - (snappedHeight / 2);
        targetY = Math.max(verticalPadding, Math.min(targetY, window.innerHeight - snappedHeight - verticalPadding));
        element.style.left = `${targetX}px`; element.style.top = `${targetY}px`;
        lastSnappedSide = targetSide;
        if (!animate) { void element.offsetWidth; element.style.transition = ''; }
    }

    initializeChatbot();
});
