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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Act as an expert academic counselor for GlobalGo. Analyze the following student profile and provide a detailed, personalized roadmap.
        
        Student Profile:
        ${JSON.stringify(studentData, null, 2)}

        Please provide a response in Markdown format with the following sections:
        1.  **Assessment**: A brief analysis of their profile (highlight strengths/weaknesses).
        2.  **Recommended Tests**: Which exams should they take (IELTS/TOEFL, SAT/GRE/GMAT) and target scores?
        3.  **University Recommendations**: 
            *   **Reach**: Ambitious schools.
            *   **Target**: Realistic options.
            *   **Safety**: Good backup options.
            (Focus on universities in their preferred countries).
        4.  **Action Plan**: immediate next steps.
        
        Keep the tone encouraging, professional, and personalized.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ advice: text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate advice' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
