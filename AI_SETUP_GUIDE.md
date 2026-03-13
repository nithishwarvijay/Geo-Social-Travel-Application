# AI Image Validation Setup Guide

The application includes optional AI-powered deepfake detection to ensure only authentic travel photos are posted.

## Current Status

**AI Validation is currently DISABLED** - The app works normally without it.

## To Enable AI Validation

### Step 1: Install Python Dependencies

#### Windows:
```bash
cd server/ai-service
python -m pip install transformers torch torchvision Pillow
```

#### Linux/Mac:
```bash
cd server/ai-service
pip3 install transformers torch torchvision Pillow
```

Or use the provided setup scripts:
- Windows: `setup.bat`
- Linux/Mac: `./setup.sh`

### Step 2: Test the AI Service

```bash
cd server/ai-service
python deepfake_detector.py ../uploads/test-image.jpg
```

Expected output:
```json
{
  "label": "Real",
  "prediction": 1,
  "confidence": 0.95,
  "is_real": true
}
```

### Step 3: Enable in Configuration

Edit `server/.env` and change:
```env
ENABLE_AI_VALIDATION=false
```
to:
```env
ENABLE_AI_VALIDATION=true
```

### Step 4: Restart Server

```bash
cd server
npm run dev
```

## How It Works

When enabled:
1. User uploads an image
2. Backend calls Python AI service
3. AI model analyzes the image (2-5 seconds)
4. If **Real**: Post is created ✅
5. If **Fake**: Upload is rejected ❌

## System Requirements

- **Python**: 3.8 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 1GB (for model download)
- **Internet**: Required for first-time model download

## Troubleshooting

### "Image validation service unavailable"
- AI validation is disabled (this is normal)
- Or Python dependencies are not installed
- Check server logs for detailed error messages

### Model download fails
- Ensure stable internet connection
- Model size: ~350MB
- Download happens automatically on first use

### Slow validation
- First validation takes longer (model loading)
- Subsequent validations are faster
- Consider using GPU for better performance

## Without AI Validation

The app works perfectly fine without AI validation:
- All features work normally
- Images are uploaded directly
- No Python dependencies needed
- Faster upload times

## Performance Impact

| Mode | Upload Time | Requirements |
|------|-------------|--------------|
| Without AI | < 1 second | None |
| With AI (CPU) | 2-5 seconds | Python + 2GB RAM |
| With AI (GPU) | 0.5-1 second | Python + GPU |

## Recommendation

- **Development**: Keep AI validation disabled for faster testing
- **Production**: Enable AI validation for content quality control
