require('dotenv').config();
const { visionService } = require('./services/visionService');
const path = require('path');

async function testVisionAPI() {
  try {
    console.log('Testing Vision API setup...');
    console.log('Environment:', {
      PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
      CREDENTIALS_PATH: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    // Test with a sample image
    const testImagePath = path.join(__dirname, 'test-image.png');
    console.log('Test image path:', testImagePath);

    const result = await visionService.extractTextFromImage(testImagePath);
    console.log('Extraction result:', result ? 'Success' : 'No text found');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVisionAPI(); 