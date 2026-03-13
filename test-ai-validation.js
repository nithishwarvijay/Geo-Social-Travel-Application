// Test script to verify AI validation is working
const path = require('path');
const fs = require('fs');

// Simulate the deepfake service
class DeepfakeService {
  constructor() {
    // Try multiple possible locations for .venv
    const possiblePaths = [
      path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
      path.join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe'),
      path.join(__dirname, '.venv', 'Scripts', 'python.exe'),
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
      console.log('⚠️  Using system Python');
    }
    
    this.scriptPath = path.join(__dirname, 'server', 'ai-service', 'deepfake_detector.py');
    console.log('📄 AI Script path:', this.scriptPath);
    console.log('📁 Script exists:', fs.existsSync(this.scriptPath));
  }

  async detectDeepfake(imagePath) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      console.log('\n🔍 Starting deepfake detection...');
      console.log('   Python:', this.pythonPath);
      console.log('   Script:', this.scriptPath);
      console.log('   Image:', imagePath);
      
      const python = spawn(this.pythonPath, [this.scriptPath, imagePath]);
      
      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
        console.log('📤 Python stdout:', data.toString().trim());
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
        console.log('📤 Python stderr:', data.toString().trim());
      });

      python.on('close', (code) => {
        console.log('🏁 Python process closed with code:', code);
        
        if (code !== 0) {
          console.error('❌ Python script error:', errorString);
          return reject(new Error(`Deepfake detection failed: ${errorString}`));
        }

        try {
          const result = JSON.parse(dataString);
          if (result.error) {
            return reject(new Error(result.error));
          }
          console.log('✅ Detection result:', result);
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse Python output:', dataString);
          reject(new Error('Failed to parse deepfake detection result'));
        }
      });

      python.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error);
        reject(new Error('Failed to start deepfake detection service'));
      });
    });
  }
}

// Run the test
async function test() {
  console.log('🧪 Testing AI Validation Service\n');
  console.log('Current directory:', process.cwd());
  console.log('Script directory:', __dirname);
  
  const service = new DeepfakeService();
  
  // Test with an existing image
  const testImage = path.join(__dirname, 'server', 'uploads', '1772081889614-227647890.png');
  
  if (!fs.existsSync(testImage)) {
    console.error('❌ Test image not found:', testImage);
    console.log('\nAvailable images:');
    const uploadsDir = path.join(__dirname, 'server', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
      files.forEach(f => console.log('  -', f));
      if (files.length > 0) {
        console.log('\nTrying first available image...');
        const firstImage = path.join(uploadsDir, files[0]);
        try {
          const result = await service.detectDeepfake(firstImage);
          console.log('\n✅ AI Validation is working!');
          console.log('Result:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('\n❌ AI Validation failed:', error.message);
        }
      }
    }
    return;
  }
  
  try {
    const result = await service.detectDeepfake(testImage);
    console.log('\n✅ AI Validation is working!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ AI Validation failed:', error.message);
  }
}

test();
