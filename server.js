require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const fs = require('fs');
const path = require('path');

app.post('/api/analyze', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Log incoming request
        console.log('\n📋 New counseling request received:');
        console.log(`   Student: ${studentData.name}`);
        console.log(`   Citizenship: ${studentData.citizenship}`);

        // --- 1. Load Scholarship Data ---
        const scholarshipsPath = path.join(__dirname, 'data', 'scholarships.json');
        let allScholarships = [];
        try {
            const data = fs.readFileSync(scholarshipsPath, 'utf8');
            allScholarships = JSON.parse(data);
        } catch (err) {
            console.error("Error loading scholarships:", err);
        }

        // --- 2. Define the Tool (Function) ---
        const getScholarships = (args) => {
            console.log("🛠️ Tool called: getScholarships with args:", args);
            const { target_country, citizenship, name } = args;
            
            return allScholarships.filter(s => {
                if (name && !s.name.toLowerCase().includes(name.toLowerCase())) return false;
                if (target_country && s.target_country.toLowerCase() !== target_country.toLowerCase() && target_country.toLowerCase() !== 'eu') return false;
                if (citizenship) {
                    const eligible = s.eligible_citizenships.map(c => c.toLowerCase());
                    if (!eligible.includes('all') && !eligible.includes(citizenship.toLowerCase())) return false;
                }
                return true;
            });
        };

        // --- 3. Initialize Model with Tools ---
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "get_scholarships",
                        description: "Get a list of scholarships based on the student's citizenship and target country. RETURNS A JSON LIST.",
                        parameters: {
                            type: "object",
                            properties: {
                                citizenship: { type: "string" },
                                target_country: { type: "string" },
                                name: { type: "string" }
                            },
                            required: ["citizenship"]
                        }
                    }
                ]
            }
        ];

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: tools
        });

        // --- 4. Prepare Prompt ---
        const languageInstruction = studentData.language === 'ru' ? 'Respond in Russian.' : studentData.language === 'az' ? 'Respond in Azerbaijani.' : 'Respond in English.';

        const prompt = `
You are ${studentData.name}'s academic counselor.
Student Profile:
- Name: ${studentData.name} ${studentData.surname}
- Age: ${studentData.age}
- Citizenship: ${studentData.citizenship}
- Target Country: ${studentData.targetCountry}
- Major: ${studentData.major}
- GPA: ${studentData.gpa}
- Level: ${studentData.education}
- Institution: ${studentData.institution}
- English Level: ${studentData.englishLevel}
- Preferred Lang: ${studentData.eduLang}

Task: Write a detailed counseling report.
IMPORTANT: CHECK for scholarships first using the \`get_scholarships\` tool!

${languageInstruction}

Report Structure:
1. Profile Assessment
2. University Recommendations
3. Scholarship Opportunities (Use the tool data!)
   - Name
   - Amount
   - Why it fits
4. Action Plan
5. Top 3 Priorities
`;

        // --- 5. Chat Loop (to handle function calling) ---
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        let result = await chat.sendMessage("Start analysis.");
        let response = result.response;
        
        // Handle function calls
        const maxTurns = 5;
        let turn = 0;

        while (turn < maxTurns) {
            const functionCalls = response.functionCalls();
            
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0]; // Simplification: handle first call
                if (call.name === "get_scholarships") {
                    const apiResponse = getScholarships(call.args);
                    result = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: "get_scholarships",
                                response: { scholarships: apiResponse } 
                            }
                        }
                    ]);
                    response = result.response;
                }
            } else {
                break;
            }
            turn++;
        }

        const text = response.text();
        console.log('✅ Response generated successfully');
        res.json({ advice: text });

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        fs.writeFileSync('error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(500).json({ 
            error: 'Failed to generate advice',
            details: error.message 
        });
    }
});

// New endpoint for follow-up chat questions
app.post('/api/chat', async (req, res) => {
    try {
        const { studentProfile, conversationHistory, question, language } = req.body;
        
        // Log incoming chat request
        console.log('\n💬 Follow-up question received:');
        console.log(`   Student: ${studentProfile.name}`);
        console.log(`   Question: ${question}`);
        console.log(`   Language: ${language || 'en'}`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const languageInstruction = language === 'ru' 
            ? 'Respond in Russian (Русский язык).'
            : language === 'az'
            ? 'Respond in Azerbaijani (Azərbaycan dili).'
            : 'Respond in English.';

        // Build conversation context from history
        let conversationContext = `
**Original Student Profile:**
- Name: ${studentProfile.name} ${studentProfile.surname}
- Age: ${studentProfile.age}
- From: ${studentProfile.citizenship}
- Current Education: ${studentProfile.education} (at ${studentProfile.institution})
- Major: ${studentProfile.major}
- GPA: ${studentProfile.gpa}
- Target: ${studentProfile.targetCountry}
- Preferred Study Language: ${studentProfile.eduLang}
- Language Level: ${studentProfile.englishLevel}
`;

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext += `\n\n**Previous Conversation:**\n`;
            conversationHistory.forEach((msg, idx) => {
                if (msg.type === 'user') {
                    conversationContext += `\nStudent asked: "${msg.content}"\n`;
                } else {
                    conversationContext += `\nYou answered: "${msg.content}"\n`;
                }
            });
        }

        const chatPrompt = `
You are ${studentProfile.name}'s personal academic counselor at GlobalGo. You previously provided them with a comprehensive counseling report based on their profile.

${conversationContext}

**New Question from ${studentProfile.name}:**
"${question}"

**Instructions:**
${languageInstruction}

**CRITICAL RULES:**
- Answer SPECIFICALLY based on ${studentProfile.name}'s profile data shown above
- Reference their exact GPA (${studentProfile.gpa}), major (${studentProfile.major}), target country (${studentProfile.targetCountry})
- Be conversational but professional, keep it precise and concise, but of course add the necessary details to make it clear and helpful
- Give actionable, concrete advice with SPECIFIC numbers, names, and deadlines
- If they ask about universities, name SPECIFIC universities and programs
- If they ask about tests, give EXACT score targets
- If they ask about deadlines, provide SPECIFIC dates/months
- Continue using their name (${studentProfile.name}) in your response

Keep your response focused and concise (max 500 words unless they specifically ask for detailed information).

Provide helpful, specific guidance as their personal counselor.
        `;

        console.log(' Calling Gemini API for chat...');
        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Chat response generated successfully\n');
        res.json({ answer: text });

    } catch (error) {
        console.error('❌ Error in chat endpoint:', error);
        
        const errorMessage = error.message || 'Unknown error occurred';
        res.status(500).json({ 
            error: 'Failed to generate chat response',
            details: errorMessage
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
