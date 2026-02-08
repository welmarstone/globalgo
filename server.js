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
You are an expert academic counselor for GlobalGo, a leading international education consultancy. Analyze the following student profile and provide a detailed, personalized academic roadmap.

**Student Profile:**
- Name: ${studentData.name}
- Age: ${studentData.age}
- Citizenship: ${studentData.citizenship}
- Target Country/Countries: ${studentData.targetCountry}
- Current Education Level: ${studentData.education}
- Major/Field of Interest: ${studentData.major}
- GPA/Academic Performance: ${studentData.gpa}
- English Language Proficiency: ${studentData.englishLevel}

**Instructions:**
${languageInstruction}

Provide your response in well-structured Markdown format with the following sections:

## 1. Profile Assessment
Analyze their academic strengths, current standing, and competitiveness. Be encouraging but realistic.

## 2. Required Standardized Tests
List specific tests they need (IELTS/TOEFL, SAT/ACT, GRE/GMAT) with:
- Minimum required scores
- Target scores for competitive admission
- Recommended preparation timeline

## 3. University Recommendations
Categorize universities in their target countries:

### Reach Schools (Ambitious)
List 3-4 top-tier universities with brief explanations

### Target Schools (Realistic)
List 3-4 universities where they have good chances

### Safety Schools (Strong Backup)
List 2-3 universities where admission is highly likely

For each category, mention programs that align with their major interest.

## 4. Scholarship Opportunities
Suggest 2-3 relevant scholarship programs or funding options available for students from ${studentData.citizenship}.

## 5. Action Plan
Provide a step-by-step roadmap with specific deadlines and actions for the next 6-12 months.

**Tone:** Professional, encouraging, and personalized. Use their name occasionally. Focus on actionable advice.
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
