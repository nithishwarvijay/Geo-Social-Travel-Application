# Deepfake Detection AI Service

This service uses a Vision Transformer (ViT) model to detect AI-generated or manipulated images.

## Setup Instructions

### 1. Install Python Dependencies

Make sure you have Python 3.8+ installed, then run:

```bash
cd server/ai-service
pip install -r requirements.txt
```

Or using pip3:
```bash
pip3 install -r requirements.txt
```

### 2. Download the Model

The model will be automatically downloaded from Hugging Face on first use:
- Model: `ashish-001/deepfake-detection-using-ViT`
- Size: ~350MB
- First run may take a few minutes to download

### 3. Test the Service

Test the deepfake detector:

```bash
python deepfake_detector.py path/to/test/image.jpg
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

## How It Works

1. **Image Upload**: User uploads an image through the frontend
2. **AI Validation**: Backend calls the Python service to validate the image
3. **Detection**: The ViT model analyzes the image for deepfake characteristics
4. **Result**: 
   - If **Real** (prediction = 1): Post is created
   - If **Fake** (prediction = 0): Upload is rejected with error message

## Model Details

- **Architecture**: Vision Transformer (ViT)
- **Training**: Fine-tuned on deepfake detection dataset
- **Output**: Binary classification (Real/Fake)
- **Confidence**: Probability score (0-1)

## Troubleshooting

### Python not found
- Make sure Python is installed and in your PATH
- Update `pythonPath` in `server/services/deepfakeService.js` if needed

### Model download fails
- Check internet connection
- Ensure you have ~1GB free disk space
- Try manually downloading from Hugging Face

### Memory issues
- The model requires ~2GB RAM
- Close other applications if needed
- Consider using CPU instead of GPU for smaller memory footprint

## Performance

- **CPU**: ~2-5 seconds per image
- **GPU**: ~0.5-1 second per image
- **Model size**: ~350MB
- **Memory usage**: ~2GB

## Disabling the Service

To disable deepfake detection (for development):

1. Comment out the validation code in `server/controllers/postsController.js`
2. Or set an environment variable to skip validation

## Security Notes

- Images detected as fake are automatically deleted
- No fake images are stored on the server
- Validation happens before database insertion
- Failed validations return detailed error messages
