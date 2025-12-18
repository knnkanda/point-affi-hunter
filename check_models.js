const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed
try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // remove quotes if any
            process.env[key] = value;
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env.local");
        return;
    }

    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    try {
        // Correct endpoint for listing models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Models for this API Key:");
            const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            generateModels.forEach(m => {
                console.log(`- ${m.name.replace('models/', '')}`);
            });

            if (generateModels.length === 0) {
                console.warn("\n⚠️ No models support 'generateContent'. This key might be restricted.");
            }
        } else {
            console.error("No models found in response:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
