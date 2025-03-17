const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

class VisionService {
  constructor() {
    this.client = null;
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
        return;
      }

      const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      console.log('Credentials path:', credentialsPath);
      
      if (!fs.existsSync(credentialsPath)) {
        console.warn(`Credentials file not found at: ${credentialsPath}`);
        return;
      }

      this.client = new vision.ImageAnnotatorClient({
        keyFilename: credentialsPath,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });

      console.log('Vision API client initialized successfully');
    } catch (error) {
      console.warn('Vision API initialization error:', error);
      // Don't throw error, just continue without Vision API
    }
  }

  async extractTextFromImage(filePath) {
    try {
      if (!this.client) {
        console.warn('Vision API client not initialized - text extraction unavailable');
        return null;
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
      return null;
    }
  }
}

// Export a single instance
const visionService = new VisionService();
module.exports = { visionService }; 