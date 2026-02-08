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

app.post('/api/analyze', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Log incoming request for debugging
        console.log('\n📋 New counseling request received:');
        console.log(`   Student: ${studentData.name}`);
        console.log(`   Target: ${studentData.targetCountry}`);
        console.log(`   Education: ${studentData.education}`);
        console.log(`   Language: ${studentData.language || 'en'}`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Enhanced prompt with better structure and language support
        const languageInstruction = studentData.language === 'ru' 
            ? 'Respond in Russian (Русский язык).'
            : studentData.language === 'az'
            ? 'Respond in Azerbaijani (Azərbaycan dili).'
            : 'Respond in English.';

        const prompt = `
You are ${studentData.name}'s personal academic counselor at GlobalGo with 15+ years of experience placing students from ${studentData.citizenship} into top universities. You have just completed a 1-hour consultation with them. Now write your personalized counseling report.

**CRITICAL RULES - AVOID GENERIC ADVICE:**
❌ DO NOT give vague advice like "study hard" or "prepare well"
❌ DO NOT list universities without explaining WHY they fit THIS student
❌ DO NOT give score ranges without SPECIFIC target numbers
❌ DO NOT give generic timelines - provide ACTUAL month-by-month plans
✅ BE EXTREMELY SPECIFIC with names, numbers, dates, and programs
✅ REFERENCE their exact GPA (${studentData.gpa}), age (${studentData.age}), and major (${studentData.major}) in your advice
✅ EXPLAIN your reasoning for every recommendation

**Student Profile:**
- Name: ${studentData.name}
- Age: ${studentData.age} years old
- From: ${studentData.citizenship}
- Wants to study in: ${studentData.targetCountry}
- Current Level: ${studentData.education}
- Interested in: ${studentData.major}
- Current GPA: ${studentData.gpa}
- English Level: ${studentData.englishLevel}

**Language:** ${languageInstruction}

---

## 📊 Profile Assessment - ${studentData.name}

Start with: "Hi ${studentData.name}, based on our consultation..."

Then provide:
- **Specific** analysis of their ${studentData.gpa} GPA for ${studentData.major} programs
- How competitive they are SPECIFICALLY for ${studentData.targetCountry} (use percentages if possible)
- Their EXACT strengths based on their profile
- SPECIFIC areas where they need improvement (with concrete examples)
- Compare them to typical admitted students (e.g., "Students with your profile typically have X% admission rate to...")

## 📝 Required Tests & Target Scores

**DO NOT say "IELTS 6.5-7.0" - That's too vague!**

Instead, provide:

**For English Proficiency (given they are "${studentData.englishLevel}"):**
- Exact test recommendation: IELTS or TOEFL? (Pick ONE and explain why for THIS student)
- MINIMUM score needed: [exact number]
- COMPETITIVE score for ${studentData.major} at top ${studentData.targetCountry} universities: [exact number]
- Your profile suggests you should aim for: [exact target]

**For ${studentData.education} → University Admission:**
- List SPECIFIC tests needed (SAT/ACT/GRE/GMAT/None)
- Give EXACT score targets (e.g., "SAT: 1450+, specifically Math: 750+, Reading: 700+")
- Explain WHY these scores for ${studentData.major}

**Timeline for ${studentData.name}:**
- Month 1-2: [specific preparation actions]
- Month 3: [test date recommendation]
- Month 4-5: [next steps]

## 🎓 University Recommendations for ${studentData.major}

**CRITICAL: Name SPECIFIC universities with SPECIFIC programs!**

### 🚀 Reach Schools (Highly Competitive)
For each university, provide:
1. **[Exact University Name]** - [Specific Program Name]
   - Why it fits ${studentData.name}: [Personal reason based on their ${studentData.major} interest]
   - Admission requirements for ${studentData.citizenship} students: [Specific numbers]
   - What makes you competitive: [Based on their actual profile]
   - What you need to strengthen: [Specific action]

*List 3-4 reach schools following this format*

### 🎯 Target Schools (Good Match)
*Same detailed format for 3-4 target schools*

### ✅ Safety Schools (High Acceptance Probability)
*Same detailed format for 2-3 safety schools*

## 💰 Scholarship Opportunities

**DO NOT list generic scholarships!**

Provide:
1. **[Specific Scholarship Name]** for ${studentData.citizenship} students studying ${studentData.major}
   - Award amount: [exact $ or %]
   - Eligibility for ${studentData.name}: [Why they qualify or what they need]
   - Application deadline: [Month/Year or "Rolling"]
   - Your chances: [Realistic assessment]

*List 3-4 REAL, SPECIFIC scholarships*

## 📅 Month-by-Month Action Plan for ${studentData.name}

**Current Date: February 2026**

Create a CONCRETE timeline:

**February-March 2026:**
- [ ] Week 1: [Specific action]
- [ ] Week 2-3: [Specific action]
- [ ] By End of March: [Specific milestone]

**April-May 2026:**
- [ ] [Specific actions with dates]

**June-July 2026:**
- [ ] [Specific test dates, application prep]

*Continue through at least 12 months with SPECIFIC actions*

## 🎯 Top 3 Priorities for ${studentData.name} THIS MONTH

1. **[Specific Action]** - Why: [Reason based on their profile]
2. **[Specific Action]** - Deadline: [Exact date]
3. **[Specific Action]** - How: [Concrete steps]

---

**Final Note:** Remember, ${studentData.name}, this plan is tailored for your ${studentData.gpa} GPA, ${studentData.englishLevel} English level, and passion for ${studentData.major}. Focus on the "Top 3 Priorities" first, then follow the monthly plan.

**REMEMBER**: Use their name (${studentData.name}) throughout. Be specific, not generic. Reference their actual data points. Give exact numbers, dates, and university names.
        `;

        console.log('🤖 Calling Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Response generated successfully\n');
        res.json({ advice: text });

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        
        // Return more specific error information
        const errorMessage = error.message || 'Unknown error occurred';
        res.status(500).json({ 
            error: 'Failed to generate advice',
            details: errorMessage,
            hint: 'Check your GEMINI_API_KEY in .env file'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
