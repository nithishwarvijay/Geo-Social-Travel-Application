# AI Validation Installation Guide

Follow these steps to enable AI-powered deepfake detection in your Geo Social Travel app.

## Step 1: Install Python

### Download Python:
1. Go to: https://www.python.org/downloads/
2. Download Python 3.11 or 3.10 (recommended for Windows)
3. Run the installer

### IMPORTANT During Installation:
✅ **CHECK "Add Python to PATH"** (very important!)
✅ Check "Install pip"
✅ Click "Install Now"

### Verify Installation:
Open a NEW command prompt and run:
```bash
python --version
```
You should see: `Python 3.11.x` or similar

## Step 2: Install AI Dependencies

Open Command Prompt in your project folder and run:

```bash
cd server\ai-service
pip install transformers torch torchvision Pillow
```

This will take 5-10 minutes and download ~2GB of files.

### What Gets Installed:
- **transformers**: Hugging Face library for AI models
- **torch**: PyTorch deep learning framework
- **torchvision**: Computer vision utilities
- **Pillow**: Image processing library

## Step 3: Test the AI Service

After installation completes, test it:

```bash
# Still in server/ai-service folder
python deepfake_detector.py ../uploads/1772081889614-227647890.png
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

If you see this, the AI service is working! ✅

## Step 4: Enable AI Validation

1. Open `server/.env` file
2. Find this line:
   ```env
   ENABLE_AI_VALIDATION=false
   ```
3. Change it to:
   ```env
   ENABLE_AI_VALIDATION=true
   ```
4. Save the file

## Step 5: Restart the Server

1. Stop the current server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   cd server
   npm run dev
   ```

## Step 6: Test Image Upload

1. Go to http://localhost:3000/create
2. Upload a real photo
3. You should see: "🔍 Verifying image authenticity with AI..."
4. If the image is real, post will be created
5. If the image is AI-generated, you'll get an error

## Troubleshooting

### "Python was not found"
- Restart your computer after installing Python
- Make sure you checked "Add Python to PATH" during installation
- Try `python3` instead of `python`

### "pip is not recognized"
- Python wasn't added to PATH
- Reinstall Python and check "Add Python to PATH"

### Installation takes too long
- This is normal! PyTorch is large (~2GB)
- Make sure you have stable internet
- Don't close the terminal

### "Module not found" error
- Run: `pip list` to see installed packages
- Reinstall: `pip install transformers torch torchvision Pillow --upgrade`

### Out of memory
- Close other applications
- The AI model needs ~2GB RAM
- Consider using a smaller model (contact support)

## System Requirements

- **OS**: Windows 10/11, Linux, or macOS
- **Python**: 3.8 - 3.11 (3.11 recommended)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 3GB free space
- **Internet**: Required for initial download

## Performance

### First Upload:
- Takes 10-30 seconds (model loading)
- Model downloads automatically (~350MB)

### Subsequent Uploads:
- Takes 2-5 seconds per image
- Model stays in memory

### With GPU (Optional):
- Install CUDA-enabled PyTorch
- Validation takes < 1 second
- Requires NVIDIA GPU

## What Happens When Enabled

### Real Image:
✅ "Image verified as real (95.3% confidence)"
✅ Post created successfully

### Fake/AI Image:
❌ "Image validation failed: This image appears to be AI-generated"
❌ Upload rejected
❌ Image automatically deleted

## Need Help?

If you encounter issues:
1. Check the server logs for detailed errors
2. Verify Python installation: `python --version`
3. Verify pip installation: `pip --version`
4. Check installed packages: `pip list`
5. Try reinstalling dependencies

## Alternative: Keep AI Disabled

If you prefer to skip AI validation:
- Keep `ENABLE_AI_VALIDATION=false`
- App works perfectly without it
- Enable it later when ready
- No Python installation needed

---

**Ready to start? Follow Step 1 above!** 🚀
