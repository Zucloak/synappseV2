/**
 * Mobius Chatbot - Synappse Official AI
 *
 * This single file contains all the necessary HTML, CSS, and JavaScript
 * to run the Mobius chatbot on a webpage.
 *
 * @version 2.18 - **Trustworthiness Assurance**: Added a new FAQ entry to address user queries about the website's
 * trustworthiness and security, providing an assuring response instead of a polite decline.
 * Retained FAQ feature, service updates, snapping logic, and animation from v2.17.
 * @author Synappse
 */

document.addEventListener('DOMContentLoaded', () => {
    const GEMINI_API_KEY = "AIzaSyCQr7i4SDL--5FZPxDmV9uZlGXK7e7WGTU";

    // Cooldown period in milliseconds to prevent API spam
    const COOLDOWN_PERIOD = 5000; // 5 seconds

    // Pre-defined questions and answers to save on API calls.
    // MODIFIED: Reordered FAQ entries to prioritize more specific questions first.
    // This resolves the issue where "services" keyword in a pricing question
    // would incorrectly trigger the general services FAQ.
    const FAQ = new Map([
        [['price', 'cost', 'how much'], "Thank you for your interest! Pricing varies depending on the project's scope and complexity. For a detailed quote, please click and book your meeting in the 'Get in Touch Now!' button on our website down below."],
        [['services', 'what do you do', 'offer'], "We craft a wide range of digital assets, including personal websites, professional portfolios, social media designs, 3D product models, and even offer AI integration services. You can see a full list in the 'What We Craft' section."],
        [['philosophy', 'ethos', 'believe'], "Our philosophy, the SYNAPPSE Ethos, is built on elegance in simplicity, engineered efficiency, creating emotionally compelling experiences, and ensuring uncompromising usability. We focus on visual storytelling and building adaptive, future-proof assets."],
        [['contact', 'get in touch', 'email', 'book', 'request service'], "For booking a service or requesting a service, please click the 'Get in Touch Now!' button at the bottom of the page. We look forward to hearing from you!"],
        [['about you', 'who are you'], "I am Mobius, the Synappse Official AI. I'm here to assist you with any questions you have about Synappse's services and philosophy."],
        // NEW FAQ entry for system development
        [['system', 'systems', 'develop systems', 'create systems', 'software development'], "Yes, Synappse also offers system development services, creating custom software solutions. While this isn't explicitly detailed on our public website, we are fully capable of undertaking such projects. Please contact us via email or 'Get in Touch Now!' button for more information!"],
        // NEW FAQ entry for trustworthiness
        [['trusted', 'secure', 'safe', 'reliable', 'trustworthy'], "Synappse is committed to providing reliable and secure services. Your trust is very important to us. If you have any specific security concerns, please feel free to contact us directly through the contact form via 'Get in Touch Now!' button on our website."]
    ]);

    // This context helps the AI stay on topic.
    const WEBSITE_CONTEXT = `
        Synappse offers the following services: Personal Static Websites, Professional Portfolios, Social Media Posting Designs (even video editings), Customized Birthday Sites, Gamified Review Materials, Business Logos, "Website Gift" Portfolios, 3D Product Models, Animated Group Websites, Countdown Calendars, Social Media AI-Integration, On-Site Computer Services, Materials Printing, Email Management, Market Research for Startups, and **System Development (custom software solutions, though not explicitly displayed on our website)**.
        Synappse's philosophy includes: Elegance in Simplicity, Engineered for Efficiency, Emotionally Compelling design, Uncompromising Usability, Visual Storytelling, and creating Adaptive & Future-Proof assets.
    `;


    // -----------------------------------------------------------------------------
    // ---------------------------- CHATBOT LOGIC ----------------------------------
    // -----------------------------------------------------------------------------
    // (You shouldn't need to edit anything below this line)
    // -----------------------------------------------------------------------------

    let lastMessageTimestamp = 0;
    let chatHistory = [];
    // Global variable to store the last side the launcher was snapped to
    let lastSnappedSide = 'right'; // Initialize to default right side

    // --- 1. INITIALIZATION ---

    function initializeChatbot() {
        injectMetaViewport(); // Inject viewport meta tag for mobile responsiveness
        injectStyles();       // Inject dynamic CSS styles
        createChatbotHTML();  // Create the chatbot's HTML structure
        attachEventListeners(); // Attach all necessary event listeners
        // Use a timeout to ensure the element is in the DOM before snapping
        setTimeout(() => {
            const launcher = document.getElementById('mobius-launcher');
            if (launcher) {
                // Manually position launcher initially to prevent a flash at the top-left
                launcher.style.transition = 'none'; // Disable animation for initial placement
                launcher.style.opacity = '0'; // Start hidden
                snapElementToNearestEdge(launcher, 'right');
                // Force browser to apply styles before making it visible
                void launcher.offsetWidth;
                launcher.style.transition = ''; // Re-enable animations from CSS
                launcher.style.opacity = '1'; // Fade it in
            }
        }, 100);
    }

    // --- Inject Meta Viewport for Mobile Responsiveness ---
    function injectMetaViewport() {
        let viewportMetaTag = document.querySelector('meta[name="viewport"]');
        if (!viewportMetaTag) {
            viewportMetaTag = document.createElement('meta');
            viewportMetaTag.name = 'viewport';
            document.head.appendChild(viewportMetaTag);
        }
        viewportMetaTag.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    }

    // --- 2. DYNAMICALLY CREATE HTML & CSS ---

    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Ensure basic body/html styles don't prevent overall page scrolling */
            html, body {
                margin: 0;
                padding: 0;
            }
            :root {
                --mobius-primary: #6A0DAD;
                --mobius-secondary: #0a0a0a;
                --mobius-accent: #debc04;
                --mobius-text: #f0f0f0;
                --mobius-user-bg: #333;
            }

            /* --- Draggable Launcher Styles --- */
            #mobius-launcher {
                position: fixed;
                /* MODIFIED: Unified transition for smooth snapping. Uses 'left' instead of 'transform'. */
                /* A sophisticated ease-out curve for a fluid feel. */
                transition: left 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                            top 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                            width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                            height 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                            border-radius 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
                            opacity 0.3s ease;
                z-index: 10000;
                user-select: none;
                opacity: 1;
                pointer-events: auto;
                background: #debc04;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: grab;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                /* Default/drag state starts as a circle */
                width: 70px;
                height: 70px;
                border-radius: 50%;
            }

            /* REMOVED .snapped-right and .snapped-left CSS rules. */
            /* All snapping styles are now applied directly via JavaScript. */
            /* This fixes the animation bug and simplifies the logic. */

            /* Icon inside the launcher - Changed to white */
            #mobius-launcher i {
                color: white;
                font-size: 28px;
                transition: transform 0.3s ease;
                pointer-events: none;
            }

            /* --- Main Chat Widget Container Styles --- */
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
            /* State when the chat widget is open */
            #mobius-container.open {
                transform: scale(1) translateY(0);
                opacity: 1;
                visibility: visible;
            }
            /* Inner widget styling */
            #mobius-widget {
                width: 350px;
                max-width: 90vw;
                height: 500px;
                max-height: 80vh;
                background-color: var(--mobius-secondary);
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            /* Chat header styling */
            #mobius-header {
                padding: 15px;
                background: linear-gradient(45deg, var(--mobius-primary), #4B0082);
                color: var(--mobius-text);
                position: relative;
                display: flex; /* Added for FAQ button */
                justify-content: space-between; /* Added for FAQ button */
                align-items: center; /* Added for FAQ button */
            }
            #mobius-header h3 { margin: 0; font-size: 1.2em; color: white; }
            #mobius-header p { margin: 0; font-size: 0.8em; opacity: 0.8; }
            #mobius-close-btn {
                position: absolute;
                top: 5px;
                right: 10px;
                background: none;
                border: none;
                color: var(--mobius-text);
                font-size: 2em;
                cursor: pointer;
            }

            /* NEW: FAQ Button Styles */
            #mobius-faq-btn {
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background 0.2s ease;
            }
            #mobius-faq-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            /* Main Chat Messages Area */
            #mobius-messages {
                flex-grow: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            #mobius-messages::-webkit-scrollbar { width: 5px; }
            #mobius-messages::-webkit-scrollbar-thumb { background: var(--mobius-primary); border-radius: 5px; }
            .mobius-message {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 15px;
                margin-bottom: 10px;
                line-height: 1.4;
                animation: fadeIn 0.3s ease;
            }
            .mobius-message.user {
                background-color: var(--mobius-user-bg);
                color: var(--mobius-text);
                align-self: flex-end;
                border-bottom-right-radius: 3px;
            }
            .mobius-message.bot {
                background-color: #222;
                color: var(--mobius-text);
                align-self: flex-start;
                border-bottom-left-radius: 3px;
            }
            .mobius-message.bot.typing-indicator span {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: var(--mobius-accent);
                animation: typing 1s infinite;
            }
            .mobius-message.bot.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .mobius-message.bot.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            #mobius-input-area {
                padding: 15px;
                border-top: 1px solid #333;
                display: flex;
            }
            #mobius-input {
                flex-grow: 1;
                background-color: #333;
                border: 1px solid #444;
                border-radius: 20px;
                padding: 10px 15px;
                color: var(--mobius-text);
                outline: none;
                font-size: 16px;
            }
            #mobius-input:focus { border-color: var(--mobius-primary); }
            #mobius-send-btn {
                background: none;
                border: none;
                color: var(--mobius-primary);
                font-size: 2em;
                margin-left: 10px;
                padding: 5px 10px;
                cursor: pointer;
                transition: color 0.3s;
                border-radius: 20px;
                min-width: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #mobius-send-btn:hover, #mobius-send-btn:disabled { color: var(--mobius-accent); }
            #mobius-send-btn:disabled { cursor: not-allowed; opacity: 0.5; }

            /* NEW: FAQ Overlay Styles */
            #mobius-faq-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: var(--mobius-secondary);
                display: flex;
                flex-direction: column;
                visibility: hidden; /* Hidden by default */
                opacity: 0;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            #mobius-faq-overlay.open {
                visibility: visible;
                opacity: 1;
            }
            #mobius-faq-header {
                padding: 15px;
                background: linear-gradient(45deg, var(--mobius-primary), #4B0082);
                color: var(--mobius-text);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            #mobius-faq-header h4 {
                margin: 0;
                font-size: 1.1em;
                color: white;
            }
            #mobius-back-btn {
                background: none;
                border: none;
                color: var(--mobius-text);
                font-size: 1.5em;
                cursor: pointer;
                padding: 0 5px;
            }
            #mobius-faq-list {
                flex-grow: 1;
                padding: 15px;
                overflow-y: auto;
            }
            .mobius-faq-item {
                background-color: #222;
                color: var(--mobius-text);
                padding: 12px 15px;
                margin-bottom: 10px;
                border-radius: 10px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            .mobius-faq-item:hover {
                background-color: #333;
            }


            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes typing {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }
        `;
        document.head.appendChild(style);
    }

    // --- 3. HTML Structure Creation ---
    function createChatbotHTML() {
        // MODIFIED: Launcher no longer needs an initial class for positioning.
        // JS will handle its initial placement to prevent a flash of unstyled content.
        const launcherHTML = `
            <div id="mobius-launcher">
                <i class="fas fa-robot"></i>
            </div>
        `;
        const widgetContainerHTML = `
            <div id="mobius-container">
                <div id="mobius-widget">
                    <div id="mobius-header">
                        <div>
                            <h3>Mobius</h3>
                            <p>Synappse Official AI</p>
                        </div>
                        <button id="mobius-faq-btn">FAQs</button>
                        <button id="mobius-close-btn">&times;</button>
                    </div>
                    <div id="mobius-messages">
                       <div class="mobius-message bot">Hello! I'm Mobius. How can I help you with Synappse's services today?</div>
                    </div>
                    <div id="mobius-input-area">
                        <input type="text" id="mobius-input" placeholder="Ask a question...">
                        <button id="mobius-send-btn"><i class="fas fa-paper-plane"></i></button>
                    </div>
                    <!-- NEW: FAQ Overlay -->
                    <div id="mobius-faq-overlay">
                        <div id="mobius-faq-header">
                            <button id="mobius-back-btn"><i class="fas fa-arrow-left"></i></button>
                            <h4>Frequently Asked Questions</h4>
                        </div>
                        <div id="mobius-faq-list">
                            <!-- FAQ items will be populated here by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', launcherHTML);
        document.body.insertAdjacentHTML('beforeend', widgetContainerHTML);
    }

    // --- 4. Event Handling ---
    function attachEventListeners() {
        const container = document.getElementById('mobius-container');
        const launcher = document.getElementById('mobius-launcher');
        const closeBtn = document.getElementById('mobius-close-btn');
        const sendBtn = document.getElementById('mobius-send-btn');
        const input = document.getElementById('mobius-input');
        const faqBtn = document.getElementById('mobius-faq-btn'); // NEW
        const backBtn = document.getElementById('mobius-back-btn'); // NEW

        closeBtn.addEventListener('click', () => {
            container.classList.remove('open');
            // Hide FAQ overlay if it's open when closing the main chat
            document.getElementById('mobius-faq-overlay').classList.remove('open');
            document.getElementById('mobius-messages').style.display = 'flex';
            document.getElementById('mobius-input-area').style.display = 'flex';

            launcher.style.opacity = '1';
            launcher.style.transform = 'scale(1)'; // Use transform for scaling open/close
            launcher.style.pointerEvents = 'auto';
            snapElementToNearestEdge(launcher, lastSnappedSide); // Snap back correctly
        });

        sendBtn.addEventListener('click', handleSendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });

        // NEW: FAQ button event listener
        faqBtn.addEventListener('click', showFaqOverlay);
        // NEW: Back button event listener
        backBtn.addEventListener('click', hideFaqOverlay);

        makeLauncherDraggable(launcher);
    }

    // NEW: Function to show FAQ overlay
    function showFaqOverlay() {
        const messagesContainer = document.getElementById('mobius-messages');
        const inputArea = document.getElementById('mobius-input-area');
        const faqOverlay = document.getElementById('mobius-faq-overlay');
        const faqList = document.getElementById('mobius-faq-list');

        // Hide chat UI
        messagesContainer.style.display = 'none';
        inputArea.style.display = 'none';

        // Show FAQ overlay
        faqOverlay.classList.add('open');
        populateFaqList(); // Populate the list with specific FAQs
    }

    // NEW: Function to hide FAQ overlay
    function hideFaqOverlay() {
        const messagesContainer = document.getElementById('mobius-messages');
        const inputArea = document.getElementById('mobius-input-area');
        const faqOverlay = document.getElementById('mobius-faq-overlay');

        // Hide FAQ overlay
        faqOverlay.classList.remove('open');

        // Show chat UI
        messagesContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
    }

    // NEW: Function to populate the FAQ list
    function populateFaqList() {
        const faqList = document.getElementById('mobius-faq-list');
        faqList.innerHTML = ''; // Clear previous items

        // Manually select the specific FAQs to display
        const specificFaqs = [
            { question: "How much do your services cost?", keywords: ['price'] },
            { question: "How can I book a service or get in touch?", keywords: ['contact'] },
            { question: "Do you also develop software systems?", keywords: ['system'] } // Added new FAQ for system development
        ];

        specificFaqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.classList.add('mobius-faq-item');
            faqItem.textContent = faq.question;
            faqItem.addEventListener('click', () => {
                // Simulate sending this question as a user message
                hideFaqOverlay(); // Hide FAQ overlay first
                document.getElementById('mobius-input').value = faq.question; // Pre-fill input
                handleSendMessage(); // Send the message
            });
            faqList.appendChild(faqItem);
        });
    }


    // Function to handle sending a message (Unchanged)
    function handleSendMessage() {
        const input = document.getElementById('mobius-input');
        const sendBtn = document.getElementById('mobius-send-btn');
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
        sendBtn.disabled = true;
        processMessage(message);
    }

    // Function to process user message via Gemini API or FAQ (Unchanged)
    async function processMessage(message) {
        const faqAnswer = getFaqAnswer(message);
        if (faqAnswer) {
            setTimeout(() => addMessage('bot', faqAnswer), 500);
            const sendBtn = document.getElementById('mobius-send-btn');
            sendBtn.disabled = false; // Re-enable send button after FAQ
            return;
        }
        addTypingIndicator();
        try {
            if (!GEMINI_API_KEY) {
                 console.warn("GEMINI_API_KEY is not set. Please provide a valid API key for Gemini API calls.");
            }
            // MODIFIED: Updated prompt for more human-like, simple, and persuasive communication
            const prompt = `You are Mobius, a friendly, approachable, and highly helpful AI assistant for Synappse. Your primary goal is to assist users with questions about Synappse's services and philosophy, subtly guiding them towards understanding how Synappse can meet their needs and encourage them to explore further or engage with us.
            **Communication Style:**
            1.  **Human-like & Simple:** Use natural, conversational language. Be warm, empathetic, and easy to understand. Avoid jargon or overly technical terms.
            2.  **Concise:** Get straight to the point but maintain a friendly tone.
            3.  **Persuasive (Subtle):** When answering about services or solutions, gently highlight the benefits and value Synappse offers. Frame our offerings as effective solutions to their needs or desires. Encourage taking the next step (e.g., "learn more in our 'What We Craft' section," "feel free to reach out via the contact form").
            **Rules:**
            1.  **Stay On-Topic:** Only answer questions about Synappse's services, philosophy, or how to contact them.
            2.  **Politely Decline:** If the user asks an unrelated question (e.g., about the weather, politics, coding help, personal opinions, who created you), you MUST politely decline and steer the conversation back to Synappse. For example: "I can only assist with questions about Synappse. How can I help you with their services?"
            3.  **Use Context:** Base your answers on the provided website context.
            4.  **Do Not Reveal Your Identity:** Do not mention "AI", "language model", "Gemini", or any internal workings. You are "Mobius".

            **Website Context:** ${WEBSITE_CONTEXT}
            **Conversation History:** ${JSON.stringify(chatHistory)}
            **User's New Question:** "${message}"`;

            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Mobius AI API Error Response:", errorData);
                throw new Error(`API Error: ${response.statusText} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
            }
            const result = await response.json();
            if (result && result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const aiResponse = result.candidates[0].content.parts[0].text;
                removeTypingIndicator();
                addMessage('bot', aiResponse);
                chatHistory.push({ user: message, bot: aiResponse });
                if(chatHistory.length > 4) chatHistory.shift();
            } else {
                console.error("Mobius AI Error: Unexpected API response structure", result);
                removeTypingIndicator();
                addMessage('bot', "I received an unexpected response. Please try again or check the API configuration.");
            }
        } catch (error) {
            console.error("Mobius AI Error:", error);
            removeTypingIndicator();
            addMessage('bot', "I seem to be having trouble connecting. Please try again in a moment. If the problem persists, ensure the API key is correctly configured.");
        } finally {
            const sendBtn = document.getElementById('mobius-send-btn');
            sendBtn.disabled = false; // Ensure send button is re-enabled even on error
        }
    }

    // Function to check if message matches a pre-defined FAQ (Unchanged)
    function getFaqAnswer(message) {
        const lowerCaseMessage = message.toLowerCase();
        for (const [keywords, answer] of FAQ.entries()) {
            if (keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
                return answer;
            }
        }
        return null;
    }

    // --- 5. UI & Utility Functions ---

    // Function to add a message to the chat display (Unchanged)
    function addMessage(sender, text) {
        const messagesContainer = document.getElementById('mobius-messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('mobius-message', sender);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // The send button is re-enabled in processMessage's finally block or after FAQ lookup
    }

    // Function to add/remove the typing indicator (Unchanged)
    function addTypingIndicator() {
        const messagesContainer = document.getElementById('mobius-messages');
        const typingIndicator = `<div class="mobius-message bot typing-indicator" id="typing-indicator"><span></span><span></span><span></span></div>`;
        messagesContainer.insertAdjacentHTML('beforeend', typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    // --- REFACTORED Draggable and Snapping Logic ---

    // Function to make the launcher draggable (Logic remains similar, but calls the new snap function)
    function makeLauncherDraggable(element) {
        let isDragging = false;
        let wasDragged = false;
        let startClientX, startClientY;
        let initialOffsetX, initialOffsetY;
        const movementThreshold = 20;

        const startDrag = (e) => {
            isDragging = true;
            wasDragged = false;
            element.style.cursor = 'grabbing';
            element.style.transition = 'none'; // Disable transition for smooth dragging

            const rect = element.getBoundingClientRect();
            // Revert to circular drag-state appearance
            element.style.width = '70px';
            element.style.height = '70px';
            element.style.borderRadius = '50%';

            const event = e.type.includes('mouse') ? e : e.touches[0];
            startClientX = event.clientX;
            startClientY = event.clientY;
            initialOffsetX = event.clientX - rect.left;
            initialOffsetY = event.clientY - rect.top;

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const event = e.type.includes('mouse') ? e : e.touches[0];
            let currentX = event.clientX;
            let currentY = event.clientY;

            if (Math.abs(currentX - startClientX) > movementThreshold || Math.abs(currentY - startClientY) > movementThreshold) {
                wasDragged = true;
            }

            let newX = currentX - initialOffsetX;
            let newY = currentY - initialOffsetY;

            const rect = element.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        };

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            element.style.cursor = 'grab';
            // Re-enable CSS transitions for the snap animation
            element.style.transition = '';

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);

            if (wasDragged) {
                snapElementToNearestEdge(element);
            } else {
                const container = document.getElementById('mobius-container');
                const launcher = document.getElementById('mobius-launcher');
                container.classList.add('open');
                launcher.style.opacity = '0';
                launcher.style.transform = 'scale(0)';
                launcher.style.pointerEvents = 'none';
            }
        };

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: true });
    }

    /**
     * REFACTORED snap function.
     * This function now exclusively uses inline styles (`left`, `top`, `width`, etc.)
     * to control the launcher's state. This provides a single source of truth for positioning
     * and guarantees a smooth animation, fixing the right-side snap bug.
     */
    function snapElementToNearestEdge(element, forceSide = null) {
        const verticalPadding = 30;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let targetSide = forceSide;
        if (!targetSide) {
            // Correctly determine which side is closer
            targetSide = (centerX < viewportWidth / 2) ? 'left' : 'right';
        }

        // Define target snapping properties
        const snappedWidth = 50;
        const snappedHeight = 70;
        let targetX, targetBorderRadius;

        if (targetSide === 'left') {
            targetX = 0; // Snap flush to the left edge
            targetBorderRadius = '0 35px 35px 0';
        } else { // 'right'
            targetX = viewportWidth - snappedWidth; // Snap flush to the right edge
            targetBorderRadius = '35px 0 0 35px';
        }

        // Calculate the target vertical position, clamped within the viewport
        let targetY = rect.top + (rect.height / 2) - (snappedHeight / 2);
        targetY = Math.max(verticalPadding, Math.min(targetY, viewportHeight - snappedHeight - verticalPadding));

        // Explicitly set all target styles. The CSS transition will animate these properties.
        element.style.left = `${targetX}px`;
        element.style.top = `${targetY}px`;
        element.style.width = `${snappedWidth}px`;
        element.style.height = `${snappedHeight}px`;
        element.style.borderRadius = targetBorderRadius;

        // Store the side it snapped to for future reference (e.g., when closing the chat)
        lastSnappedSide = targetSide;
    }


    // --- Initialization Call ---
    initializeChatbot();
});
