const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key first 5 chars:", apiKey ? apiKey.substring(0, 5) + "..." : "No key found");

// First, list available models
async function testApiKey() {
  try {
    console.log("Testing API key by listing models...");
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    console.log("Available models:");
    console.log(response.data.models.map(m => m.name));
    
    // If models are available, try a simple generation
    if (response.data.models.length > 0) {
      const modelName = response.data.models[0].name.split('/').pop();
      console.log(`Testing generation with model: ${modelName}`);
      
      try {
        const genResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: "Hello, what can you do?" }] }]
          }
        );
        
        console.log("Generation successful!");
        console.log("Response:", genResponse.data.candidates[0].content.parts[0].text.substring(0, 100) + "...");
      } catch (genError) {
        console.error("Generation failed:", genError.response?.data || genError.message);
      }
    }
  } catch (error) {
    console.error("API key test failed:", error.response?.data || error.message);
  }
}

testApiKey();