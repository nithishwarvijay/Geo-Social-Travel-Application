const { spawn } = require('child_process');
const path = require('path');

class DeepfakeService {
  constructor() {
    // Use .venv Python if available, otherwise fall back to system Python.
    // The .venv lives at the project root:  <project-root>/.venv/
    // This file lives at:                  <project-root>/server/services/deepfakeService.js
    const fs = require('fs');

    // __dirname is always reliable regardless of cwd at server start-up.
    const projectRoot = path.resolve(__dirname, '..', '..');

    const possiblePaths = [
      path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),          // project root (primary)
      path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),        // cwd == project root
      path.join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe'),  // cwd == server/
      path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe'), // also project root
    ];

    let foundPath = null;
    for (const venvPath of possiblePaths) {
      if (fs.existsSync(venvPath)) {
        foundPath = venvPath;
        break;
      }
    }

    if (foundPath) {
      this.pythonPath = foundPath;
      console.log('✅ Using virtual environment Python:', foundPath);
    } else {
      this.pythonPath = 'python';
      console.log('⚠️  Using system Python (virtual environment not found)');
      console.log('   Searched paths:', possiblePaths);
    }

    this.scriptPath = path.join(__dirname, '../ai-service/deepfake_detector.py');
    console.log('📄 AI Script path:', this.scriptPath);
  }

  async detectDeepfake(imagePath) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.scriptPath, imagePath]);

      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log('Python stderr:', data.toString());
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorString);
          return reject(new Error(`Deepfake detection failed: ${errorString}`));
        }

        try {
          const result = JSON.parse(dataString);
          if (result.error) {
            return reject(new Error(result.error));
          }
          resolve(result);
        } catch (error) {
          console.error('Failed to parse Python output:', dataString);
          reject(new Error('Failed to parse deepfake detection result'));
        }
      });

      python.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error('Failed to start deepfake detection service'));
      });
    });
  }

  async validateImage(imagePath) {
    try {
      const result = await this.detectDeepfake(imagePath);
      const method = result.method || 'unknown';
      const aiProb = result.ai_probability !== undefined
        ? result.ai_probability
        : (result.is_real ? 1 - result.confidence : result.confidence);

      return {
        isValid: result.is_real,
        label: result.label,
        confidence: result.confidence,
        aiProbability: aiProb,
        method: method,
        message: result.is_real
          ? `Image verified as real (${(result.confidence * 100).toFixed(1)}% confidence) [${method}]`
          : `Image detected as AI-generated (${(result.confidence * 100).toFixed(1)}% confidence) [${method}]`
      };
    } catch (error) {
      console.error('Image validation error:', error);
      throw error;
    }
  }
}

module.exports = new DeepfakeService();
