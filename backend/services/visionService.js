const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

class VisionService {
  constructor() {
    try {
      const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      console.log('Credentials path:', credentialsPath);
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found at: ${credentialsPath}`);
      }

      this.client = new vision.ImageAnnotatorClient({
        keyFilename: credentialsPath,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });

      console.log('Vision API client initialized successfully');
    } catch (error) {
      console.error('Vision API initialization error:', error);
      throw error;
    }
  }

  async extractTextFromImage(filePath) {
    try {
      if (!this.client) {
        throw new Error('Vision API client not initialized');
      }

      if (!filePath) {
        throw new Error('File path is required');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`Image file not found at: ${filePath}`);
      }

      console.log('Processing image:', filePath);
      const [result] = await this.client.documentTextDetection(filePath);
      
      if (!result || !result.fullTextAnnotation) {
        console.log('No text detected in image');
        return '';
      }

      return result.fullTextAnnotation.text;
    } catch (error) {
      console.error('Text extraction error:', error);
      return '';
    }
  }
}

// Export a single instance
const visionService = new VisionService();
module.exports = { visionService }; 