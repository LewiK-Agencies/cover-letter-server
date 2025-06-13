require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Added
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'https://lewik-agencies.github.io' // Allow requests from your frontend
}));
app.use(express.json());

// Gemini config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Endpoint to generate cover letter
app.post('/generate-cover-letter', async (req, res) => {
  try {
    const { full_name, email, phone_number, county, advertised_job, company_name, work_experience, education, skills } = req.body;

    const workExpText = work_experience.map(exp => `${exp.job_title} at ${exp.company_name}`).join('; ');
    const eduText = education.map(edu => `${edu.degree} from ${edu.school}`).join('; ');
    const skillsText = skills.join(', ');

    const prompt = `
    Generate a highly professional and persuasive cover letter.

    Candidate Info:
    Full Name: ${full_name}
    Email: ${email}
    Phone: ${phone_number}
    County: ${county}

    Job Applying For: ${advertised_job}
    Company: ${company_name}

    Work Experience: ${workExpText}
    Education Background: ${eduText}
    Key Skills: ${skillsText}

    Use a convincing and formal tone. Include a subject line (RE:...), a body with 3–4 paragraphs, and a sign-off with the candidate’s name and contact details. Output ONLY the letter.
    `;

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    res.status(200).json({ success: true, letter: output });
  } catch (err) {
    console.error('Error generating cover letter:', err);
    res.status(500).json({ success: false, error: 'Failed to generate cover letter' });
  }
});

// Endpoint for ATS analysis
app.post('/analyze-ats', async (req, res) => {
  try {
    const { content, jobTitle } = req.body;
    const prompt = `Analyze the following resume content for ATS compatibility with a ${jobTitle} role. Provide a score out of 100 and detailed feedback on keyword usage, structure, and potential improvements: ${content}`;
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    const scoreMatch = output.match(/Score: (\d+)/i);
    const feedbackMatch = output.match(/Feedback:([\s\S]*)/i);
    res.status(200).json({
      success: true,
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : 'No feedback available.'
    });
  } catch (err) {
    console.error('Error analyzing ATS compatibility:', err);
    res.status(500).json({ success: false, error: 'Failed to analyze content' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
