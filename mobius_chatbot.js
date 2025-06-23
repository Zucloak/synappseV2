/**
 * Mobius Chatbot - Synappse Official AI
 *
 * @version 5.0 - The Fluidity & Layout Fix Update
 * - **Fix (Fluid Animation)**: Reworked the launcher's drag and snap logic. It now uses CSS classes and transitions for a fluid animation between a circle (while dragging) and a half-pill (when snapped to the screen edge).
 * - **Fix (Services Layout)**: Adjusted the padding on the services grid to prevent cards from being partially obscured by the fade-out gradient overlays on desktop views.
 * - **Refactor**: Simplified launcher animation logic by removing direct style manipulation in favor of a cleaner, class-based CSS approach.
 * @author Synappse
 */

document.addEventListener('DOMContentLoaded', () => {
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

    const startupDisclaimerMessage = `Just a heads-up: SYNAPPSE is a dynamic startup. This means an environment full of rapid growth, learning, and direct impact, but it also comes with the classic startup hustle.

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
            keywords: ['hire', 'hired', 'join', 'job', 'work for', 'career', 'recruiting', 'recruitment', 'interview', 'apply', 'applying'],
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
        ['service_personal_website', {
            keywords: ['personal website', 'static website'],
            answer: "Absolutely! We create elegant personal static websites. I'll show you that service right now.",
            action: () => guideTo('.service-card[data-service-id="personal-websites"]')
        }],
        ['service_portfolio', {
            keywords: ['portfolio'],
            answer: "Of course. A professional portfolio is one of our specialties. Let me highlight that for you.",
            action: () => guideTo('.service-card[data-service-id="professional-portfolios"]')
        }],
        ['service_social_media', {
            keywords: ['social media design'],
            answer: "We create visually striking graphics for social media. Highlighting that now.",
            action: () => guideTo('.service-card[data-service-id="social-media-designs"]')
        }],
        ['service_birthday_site', {
            keywords: ['birthday site'],
            answer: "A unique digital experience for a special day! Let me show you.",
            action: () => guideTo('.service-card[data-service-id="birthday-sites"]')
        }],
        ['service_gamified', {
            keywords: ['gamified', 'review material'],
            answer: "Indeed! We make learning fun with gamified review materials. Let me point it out.",
            action: () => guideTo('.service-card[data-service-id="gamified-reviews"]')
        }],
        ['service_logo', {
            keywords: ['logo', 'logos'],
            answer: "Yes, we craft memorable business logos. I'll take you there now.",
            action: () => guideTo('.service-card[data-service-id="business-logos"]')
        }],
        ['service_website_gift', {
            keywords: ['website gift'],
            answer: "A unique and heartfelt digital gift. Let me guide you to it.",
            action: () => guideTo('.service-card[data-service-id="website-gifts"]')
        }],
        ['service_3d_model', {
            keywords: ['3d model', '3d product'],
            answer: "We create immersive 3D product models. Showing you where that is.",
            action: () => guideTo('.service-card[data-service-id="3d-models"]')
        }],
        ['service_group_site', {
            keywords: ['animated group', 'clan website'],
            answer: "Dynamic sites for online communities are a specialty. Highlighting it for you.",
            action: () => guideTo('.service-card[data-service-id="animated-group-sites"]')
        }],
        ['service_countdown', {
            keywords: ['countdown', 'calendar'],
            answer: "Elegant countdowns for any occasion. Let me show you.",
            action: () => guideTo('.service-card[data-service-id="countdown-calendars"]')
        }],
        ['service_ai_integration', {
            keywords: ['ai integration', 'social media ai'],
            answer: "AI integration is one of our advanced services. Highlighting it now!",
            action: () => guideTo('.service-card[data-service-id="ai-integration"]')
        }],
        ['service_computer_support', {
            keywords: ['computer service', 'on-site support'],
            answer: "We offer expert local technical support. Let me point you to that service.",
            action: () => guideTo('.service-card[data-service-id="on-site-computer-services"]')
        }],
        ['service_printing', {
            keywords: ['printing'],
            answer: "Yes, we offer high-quality printing services. I'll guide you there.",
            action: () => guideTo('.service-card[data-service-id="materials-printing"]')
        }],
        ['service_email_management', {
            keywords: ['email management'],
            answer: "We can help streamline your communications with expert email management. Let me show you.",
            action: () => guideTo('.service-card[data-service-id="email-management"]')
        }],
        ['service_market_research', {
            keywords: ['market research'],
            answer: "We help startups gain a competitive edge with in-depth market research. Highlighting it now.",
            action: () => guideTo('.service-card[data-service-id="market-research"]')
        }],
        ['about_mobius', {
            keywords: ['about you', 'who are you'],
            answer: "I am Mobius, the Synappse Official AI. I'm here to guide you through our services and philosophy. How can I help you explore the site?"
        }],
        ['custom_systems', {
            keywords: ['system', 'systems', 'develop systems', 'create systems', 'software development'],
            answer: "Yes, Synappse offers custom system and software development. While not listed as a main service, we are fully capable. Please use the 'Get in Touch Now!' button for a detailed consultation!"
        }]
    ]);


    // -----------------------------------------------------------------------------
    // ---------------------------- CHATBOT LOGIC ----------------------------------
    // -----------------------------------------------------------------------------
    let lastMessageTimestamp = 0;
    let lastSnappedSide = 'right';

    function initializeChatbot() {
        injectMetaViewport();
        injectStyles();
        createChatbotHTML();
        attachEventListeners();
        setTimeout(() => {
            const launcher = document.getElementById('mobius-launcher');
            if (launcher) {
                // Start in a snapped state without initial animation
                launcher.style.transition = 'none';
                snapElementToNearestEdge(launcher, 'right', false); // No animation on init
                void launcher.offsetWidth; // Force reflow
                launcher.style.transition = ''; // Re-enable transitions for future interactions
                launcher.classList.add('visible');
            }
        }, 100);
    }

    function injectMetaViewport() {
        let viewportMetaTag = document.querySelector('meta[name="viewport"]');
        if (!viewportMetaTag) {
            viewportMetaTag = document.createElement('meta');
            viewportMetaTag.name = 'viewport';
            document.head.appendChild(viewportMetaTag);
        }
        viewportMetaTag.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --mobius-primary: #6A0DAD;
                --mobius-secondary: #0a0a0a;
                --mobius-accent: #e0be07; /* Gold */
                --mobius-text: #f0f0f0;
                --mobius-user-bg: #333;
            }
            #mobius-launcher {
                position: fixed;
                z-index: 10000;
                cursor: grab;
                user-select: none;
                pointer-events: auto;
                background: var(--mobius-accent);
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                opacity: 0;
                
                /* FIX: Centralized transition for fluid animation */
                transition: left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                            top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                            width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                            height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                            border-radius 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
                            opacity 0.3s ease,
                            transform 0.3s ease;

                /* Default state: Circle (for dragging) */
                width: 70px;
                height: 70px;
                border-radius: 50%;
            }
            #mobius-launcher.visible {
                opacity: 1;
            }
             #mobius-launcher i {
                color: #f6f5f7;
                font-size: 28px;
                transition: transform 0.3s ease;
                pointer-events: none;
            }
            /* FIX: Class for the snapped (pill) state */
            #mobius-launcher.snapped {
                width: 50px;
                height: 70px;
            }
            #mobius-launcher.snapped-left {
                border-radius: 0 35px 35px 0;
            }
            #mobius-launcher.snapped-right {
                border-radius: 35px 0 0 35px;
            }

            #mobius-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                transform: scale(0.8) translateY(20px);
                opacity: 0;
                visibility: hidden;
                transform-origin: bottom right;
                transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s;
            }
            #mobius-container.open {
                transform: scale(1) translateY(0);
                opacity: 1;
                visibility: visible;
            }
            #mobius-widget {
                width: 350px; max-width: 90vw; height: 500px; max-height: 80vh;
                background-color: var(--mobius-secondary); border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                display: flex; flex-direction: column; overflow: hidden;
            }
            #mobius-header {
                padding: 15px; background: linear-gradient(45deg, var(--mobius-primary), #4B0082);
                color: var(--mobius-text); position: relative;
                display: flex; justify-content: space-between; align-items: center;
            }
            #mobius-header h3 { margin: 0; font-size: 1.2em; color: white; }
            #mobius-header p { margin: 0; font-size: 0.8em; opacity: 0.8; }
            #mobius-close-btn {
                position: absolute; top: 5px; right: 10px; background: none; border: none;
                color: var(--mobius-text); font-size: 2em; cursor: pointer;
            }
            #mobius-faq-btn {
                background: rgba(255,255,255,0.1); border: none; color: white;
                padding: 5px 10px; border-radius: 8px; cursor: pointer;
                font-size: 0.9em; transition: background 0.2s ease;
            }
            #mobius-faq-btn:hover { background: rgba(255,255,255,0.2); }
            #mobius-messages {
                flex-grow: 1; padding: 15px; overflow-y: auto;
                display: flex; flex-direction: column;
            }
            #mobius-messages::-webkit-scrollbar { width: 5px; }
            #mobius-messages::-webkit-scrollbar-thumb { background: var(--mobius-primary); border-radius: 5px; }
            .mobius-message {
                max-width: 80%; padding: 10px 15px; border-radius: 15px; margin-bottom: 10px;
                line-height: 1.4; animation: fadeIn 0.3s ease;
                white-space: pre-wrap; word-wrap: break-word;
            }
            .mobius-message.user {
                background-color: var(--mobius-user-bg); color: var(--mobius-text);
                align-self: flex-end; border-bottom-right-radius: 3px;
            }
            .mobius-message.bot {
                background-color: #222; color: var(--mobius-text);
                align-self: flex-start; border-bottom-left-radius: 3px;
            }
            .mobius-message b, .mobius-message strong { color: var(--mobius-accent); }
            .mobius-message.bot.typing-indicator span {
                display: inline-block; width: 8px; height: 8px; border-radius: 50%;
                background-color: var(--mobius-accent); animation: typing 1s infinite;
            }
            .mobius-message.bot.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .mobius-message.bot.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            #mobius-input-area { padding: 15px; border-top: 1px solid #333; display: flex; }
            #mobius-input {
                flex-grow: 1; background-color: #333; border: 1px solid #444; border-radius: 20px;
                padding: 10px 15px; color: var(--mobius-text); outline: none; font-size: 16px;
            }
            #mobius-input:focus { border-color: var(--mobius-primary); }
            #mobius-send-btn {
                background: none; border: none; color: var(--mobius-primary); font-size: 2em;
                margin-left: 10px; padding: 5px 10px; cursor: pointer; transition: color 0.3s;
                border-radius: 20px; min-width: 40px; display: flex; justify-content: center; align-items: center;
            }
            #mobius-send-btn:hover, #mobius-send-btn:disabled { color: var(--mobius-accent); }
            #mobius-send-btn:disabled { cursor: not-allowed; opacity: 0.5; }
            #mobius-faq-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background-color: var(--mobius-secondary); display: flex; flex-direction: column;
                visibility: hidden; opacity: 0; transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            #mobius-faq-overlay.open { visibility: visible; opacity: 1; }
            #mobius-faq-header {
                padding: 15px; background: linear-gradient(45deg, var(--mobius-primary), #4B0082);
                color: var(--mobius-text); display: flex; align-items: center; gap: 10px;
            }
            #mobius-faq-header h4 { margin: 0; font-size: 1.1em; color: white; }
            #mobius-back-btn { background: none; border: none; color: var(--mobius-text); font-size: 1.5em; cursor: pointer; padding: 0 5px; }
            #mobius-faq-list { flex-grow: 1; padding: 15px; overflow-y: auto; }
            .mobius-faq-item {
                background-color: #222; color: var(--mobius-text); padding: 12px 15px;
                margin-bottom: 10px; border-radius: 10px; cursor: pointer; transition: background-color 0.2s ease;
            }
            .mobius-faq-item:hover { background-color: #333; }
            .mobius-text-highlight {
                background-color: rgba(255, 215, 0, 0.4);
                padding: 0.1em 0.2em;
                border-radius: 4px;
                box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
            }
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
                        <button id="mobius-faq-btn">FAQs</button>
                        <button id="mobius-close-btn">&times;</button>
                    </div>
                    <div id="mobius-messages">
                       <div class="mobius-message bot">Hello! I'm Mobius. How can I help you explore our digital craft today?</div>
                    </div>
                    <div id="mobius-input-area">
                        <input type="text" id="mobius-input" placeholder="Ask about a service...">
                        <button id="mobius-send-btn"><i class="fas fa-paper-plane"></i></button>
                    </div>
                    <div id="mobius-faq-overlay">
                        <div id="mobius-faq-header">
                            <button id="mobius-back-btn"><i class="fas fa-arrow-left"></i></button>
                            <h4>Frequently Asked Questions</h4>
                        </div>
                        <div id="mobius-faq-list"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', launcherHTML);
        document.body.insertAdjacentHTML('beforeend', widgetContainerHTML);
    }

    function attachEventListeners() {
        const container = document.getElementById('mobius-container');
        const launcher = document.getElementById('mobius-launcher');
        const closeBtn = document.getElementById('mobius-close-btn');
        const sendBtn = document.getElementById('mobius-send-btn');
        const input = document.getElementById('mobius-input');
        const faqBtn = document.getElementById('mobius-faq-btn');
        const backBtn = document.getElementById('mobius-back-btn');

        closeBtn.addEventListener('click', () => {
            container.classList.remove('open');
            document.getElementById('mobius-faq-overlay').classList.remove('open');
            document.getElementById('mobius-messages').style.display = 'flex';
            document.getElementById('mobius-input-area').style.display = 'flex';
            launcher.classList.add('visible');
            launcher.style.transform = 'scale(1)';
            launcher.style.pointerEvents = 'auto';
            snapElementToNearestEdge(launcher, lastSnappedSide);
        });

        sendBtn.addEventListener('click', handleSendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });

        faqBtn.addEventListener('click', showFaqOverlay);
        backBtn.addEventListener('click', hideFaqOverlay);
        makeLauncherDraggable(launcher);
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
        faqList.innerHTML = '';
        const specificFaqs = [
            { question: "Can you show me an example service?", key: 'show_example_service' },
            { question: "What is your company philosophy?", key: 'philosophy_general' },
            { question: "How can I see your credentials?", key: 'achievements_general' },
            { question: "How do I get in touch or ask for a price?", key: 'contact_general' },
        ];
        specificFaqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.classList.add('mobius-faq-item');
            faqItem.textContent = faq.question;
            faqItem.addEventListener('click', () => {
                hideFaqOverlay();
                addMessage('user', faq.question);
                processMessage(faq.key);
            });
            faqList.appendChild(faqItem);
        });
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
        sendBtn.disabled = true;

        const lowerCaseMessage = typeof message === 'string' ? message.toLowerCase() : '';
        const hiringIntent = FAQ.get('hiring_intent');
        const isHiringQuery = hiringIntent.keywords.some(keyword => lowerCaseMessage.includes(keyword));

        if (isHiringQuery && !interviewState) {
            initiateInterview();
            sendBtn.disabled = false;
            return;
        }

        if (interviewState) {
            handleInterviewResponse(message);
            sendBtn.disabled = false;
            return;
        }

        let faqMatch = FAQ.get(message) || getFaqAnswerByKeyword(message);

        if (faqMatch) {
            addTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                if (faqMatch.answer) {
                    addMessage('bot', faqMatch.answer);
                }
                if (faqMatch.action) {
                    setTimeout(faqMatch.action, 300);
                }
                sendBtn.disabled = false;
            }, 800);
        } else {
             addTypingIndicator();
             setTimeout(() => {
                removeTypingIndicator();
                addMessage('bot', "I'm designed to help with questions about Synappse. Could you ask me something about our services, philosophy, or how to get in touch?");
                sendBtn.disabled = false;
             }, 1200);
        }
    }

    function getFaqAnswerByKeyword(message) {
        const lowerCaseMessage = message.toLowerCase();
        for (const [key, response] of FAQ.entries()) {
            if (key !== 'hiring_intent' && response.keywords && response.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
                return response;
            }
        }
        return null;
    }

    function guideTo(targetSelector, textToFind = null) {
        console.log(`Mobius: Dispatching guide event for selector: '${targetSelector}', text: '${textToFind}'`);
        document.dispatchEvent(new CustomEvent('mobius-guide', {
            detail: { targetSelector, textToFind }
        }));
    }

    function initiateInterview() {
        interviewState = 'pending_confirmation';
        addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', startupDisclaimerMessage);
        }, 800);
    }

    function startInterview() {
        interviewState = 'active';
        interviewProgress = 0;
        currentInterviewQuestions = [];
        interviewQuestionPools.forEach(pool => {
            currentInterviewQuestions.push(pool[Math.floor(Math.random() * pool.length)]);
        });

        addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', "Great! Let's begin. \n\n" + currentInterviewQuestions[0].question);
        }, 800);
    }

    function handleInterviewResponse(message) {
        const lowerCaseMessage = message.toLowerCase();

        if (interviewState === 'pending_confirmation') {
            if (lowerCaseMessage.includes('yes')) {
                startInterview();
            } else {
                addTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage('bot', "No problem at all. Feel free to explore our services or ask me anything else!");
                    interviewState = null;
                }, 800);
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
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage('bot', currentInterviewQuestions[interviewProgress].question);
                    }, 800);
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
                addMessage('bot', "Thank you for your interest. At this time, it doesn't seem like the right fit. We encourage you to explore our services to see what we're all about!");
            }
            interviewState = null;
            interviewProgress = 0;
        }, 1000);
    }

    function addMessage(sender, text) {
        if (text === null || typeof text === 'undefined') return;
        const messagesContainer = document.getElementById('mobius-messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('mobius-message', sender);
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        messageElement.innerHTML = formattedText;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addTypingIndicator() {
        const messagesContainer = document.getElementById('mobius-messages');
        if (document.getElementById('typing-indicator')) return;
        const typingIndicator = `<div class="mobius-message bot typing-indicator" id="typing-indicator"><span></span><span></span><span></span></div>`;
        messagesContainer.insertAdjacentHTML('beforeend', typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function makeLauncherDraggable(element) {
        let isDragging = false, wasDragged = false, startClientX, startClientY, initialOffsetX, initialOffsetY;
        const movementThreshold = 10;

        const startDrag = (e) => {
            isDragging = true; wasDragged = false;
            element.style.cursor = 'grabbing';
            // FIX: Remove snapping classes to animate to a circle
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
            if (Math.abs(event.clientX - startClientX) > movementThreshold || Math.abs(event.clientY - startClientY) > movementThreshold) {
                wasDragged = true;
            }
            let newX = event.clientX - initialOffsetX;
            let newY = event.clientY - initialOffsetY;
            const viewportRect = element.getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, window.innerWidth - viewportRect.width));
            newY = Math.max(0, Math.min(newY, window.innerHeight - viewportRect.height));
            
            // Apply position directly without transition for smooth dragging
            element.style.transition = 'none';
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            void element.offsetWidth; // force reflow
            element.style.transition = '';
        };

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false; 
            element.style.cursor = 'grab';
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
            
            if (wasDragged) {
                snapElementToNearestEdge(element);
            } else {
                document.getElementById('mobius-container').classList.add('open');
                element.classList.remove('visible');
                element.style.transform = 'scale(0)';
                element.style.pointerEvents = 'none';
            }
        };
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: true });
    }

    function snapElementToNearestEdge(element, forceSide = null, animate = true) {
        if (!animate) {
            element.style.transition = 'none';
        }

        const verticalPadding = 30;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        let targetSide = forceSide || ((centerX < window.innerWidth / 2) ? 'left' : 'right');
        
        const snappedWidth = 50;
        const snappedHeight = 70;

        let targetX;
        element.classList.add('snapped');
        if (targetSide === 'left') {
            targetX = 0;
            element.classList.add('snapped-left');
            element.classList.remove('snapped-right');
        } else {
            targetX = window.innerWidth - snappedWidth;
            element.classList.add('snapped-right');
            element.classList.remove('snapped-left');
        }
        
        let targetY = rect.top + (rect.height / 2) - (snappedHeight / 2);
        targetY = Math.max(verticalPadding, Math.min(targetY, window.innerHeight - snappedHeight - verticalPadding));
        
        element.style.left = `${targetX}px`;
        element.style.top = `${targetY}px`;
        
        lastSnappedSide = targetSide;

        if (!animate) {
            void element.offsetWidth; // force reflow
            element.style.transition = '';
        }
    }

    initializeChatbot();
});
