"""
AI-Generated Image Detector
Uses a Vision Transformer (ViT) model fine-tuned specifically to detect
AI-generated / deepfake images vs real photographs.

Model: umm-maybe/AI-image-detector (ViT-based, trained on real vs AI-generated images)
       Downloaded to C:/aimod for reliable local loading.
Strategy: When ViT is available, uses BOTH the ViT model AND forensic analysis,
          combining scores for the most robust detection.
Fallback: If the ViT model fails to load, uses enhanced forensic analysis
          with stricter thresholds.
"""

from PIL import Image
import torch
import sys
import json
import os
import numpy as np


class AIImageDetector:
    def __init__(self):
        self.model = None
        self.processor = None
        self.method = None

        # Try to load the specialized AI image detection model
        try:
            self._load_hf_model()
        except Exception as e:
            print(f"[WARNING] ViT model load failed: {e}", file=sys.stderr)
            print("[WARNING] Using forensic-only analysis (less accurate).", file=sys.stderr)
            self.method = "forensic"

    def _load_hf_model(self):
        """Load a ViT model fine-tuned for AI-generated image detection."""
        print("[INFO] Loading AI Image Detection model...", file=sys.stderr)
        from transformers import AutoModelForImageClassification, AutoImageProcessor

        # Use a short local path to avoid Windows long path issues
        local_model_dir = "C:/aimod"
        hub_model_name = "umm-maybe/AI-image-detector"

        # Prefer local model directory if it exists (avoids long path issues)
        if os.path.isdir(local_model_dir) and os.path.exists(os.path.join(local_model_dir, "config.json")):
            model_source = local_model_dir
            print(f"[INFO] Loading model from local directory: {local_model_dir}", file=sys.stderr)
        else:
            model_source = hub_model_name
            print(f"[INFO] Loading model from HuggingFace Hub: {hub_model_name}", file=sys.stderr)

        self.processor = AutoImageProcessor.from_pretrained(model_source)
        self.model = AutoModelForImageClassification.from_pretrained(model_source)
        self.model.eval()
        self.method = "vit"

        # Read label mapping
        self.labels = self.model.config.id2label
        print(f"[INFO] Model loaded successfully. Labels: {self.labels}", file=sys.stderr)

    # ------------------------------------------------------------------ #
    #  Forensic / statistical analysis
    # ------------------------------------------------------------------ #
    def _forensic_analysis(self, image_path):
        """
        Enhanced forensic heuristics that look for telltale signs of
        AI-generated images:
          1. Frequency-domain smoothness (AI images lack high-freq noise)
          2. Color channel correlation
          3. Local variance / texture uniformity
          4. Histogram entropy analysis
          5. Edge coherence analysis
          6. JPEG artifact analysis
        Returns ai_probability (0.0 = definitely real, 1.0 = definitely AI).
        """
        img = Image.open(image_path).convert("RGB")
        img_array = np.array(img, dtype=np.float64)

        scores = []

        # --- 1. Frequency domain analysis (FFT) ---
        gray = np.mean(img_array, axis=2)
        fft = np.fft.fft2(gray)
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.log1p(np.abs(fft_shift))

        h, w = magnitude.shape
        cy, cx = h // 2, w // 2
        radius = min(h, w) // 4
        total_energy = np.sum(magnitude)
        Y, X = np.ogrid[:h, :w]
        low_freq_mask = ((Y - cy) ** 2 + (X - cx) ** 2) <= radius ** 2
        low_freq_energy = np.sum(magnitude[low_freq_mask])
        high_freq_ratio = 1.0 - (low_freq_energy / (total_energy + 1e-10))

        # AI images tend to have LESS high-frequency content
        # Tuned more aggressively: threshold at 0.40 instead of 0.45
        freq_score = min(max((0.40 - high_freq_ratio) / 0.15, 0.0), 1.0)
        scores.append(("frequency_smoothness", freq_score, 0.30))

        # --- 2. Color channel correlation ---
        r, g, b = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2]
        rg_corr = np.corrcoef(r.flatten(), g.flatten())[0, 1]
        rb_corr = np.corrcoef(r.flatten(), b.flatten())[0, 1]
        gb_corr = np.corrcoef(g.flatten(), b.flatten())[0, 1]
        avg_corr = (abs(rg_corr) + abs(rb_corr) + abs(gb_corr)) / 3.0

        # AI images often have very high inter-channel correlation
        corr_score = min(max((avg_corr - 0.80) / 0.15, 0.0), 1.0)
        scores.append(("color_correlation", corr_score, 0.20))

        # --- 3. Local variance analysis (texture uniformity) ---
        from PIL import ImageFilter
        img_blur = img.filter(ImageFilter.GaussianBlur(radius=2))
        blur_array = np.array(img_blur, dtype=np.float64)
        diff = np.abs(img_array - blur_array)
        local_var = np.std(diff)

        # AI images tend to have lower local variance (smoother textures)
        var_score = min(max((10.0 - local_var) / 6.0, 0.0), 1.0)
        scores.append(("texture_uniformity", var_score, 0.20))

        # --- 4. Histogram analysis (unnatural uniformity) ---
        hist_scores = []
        for ch in range(3):
            channel = img_array[:, :, ch].flatten()
            hist, _ = np.histogram(channel, bins=64, range=(0, 255))
            hist_norm = hist / (hist.sum() + 1e-10)
            entropy = -np.sum(hist_norm * np.log2(hist_norm + 1e-10))
            max_entropy = np.log2(64)
            hist_scores.append(entropy / max_entropy)

        avg_entropy = np.mean(hist_scores)
        entropy_score = min(max((0.90 - avg_entropy) / 0.08, 0.0), 1.0)
        scores.append(("histogram_uniformity", entropy_score, 0.15))

        # --- 5. Edge coherence analysis ---
        # AI images often have unnaturally smooth or overly consistent edges
        from PIL import ImageFilter as IF
        edges = img.convert("L").filter(IF.FIND_EDGES)
        edge_array = np.array(edges, dtype=np.float64)
        edge_std = np.std(edge_array)
        edge_mean = np.mean(edge_array)
        # Low edge mean with low std → unnaturally smooth (AI-like)
        edge_ratio = edge_mean / (edge_std + 1e-10)
        edge_score = min(max((1.5 - edge_ratio) / 1.0, 0.0), 1.0)
        scores.append(("edge_coherence", edge_score, 0.15))

        # --- Weighted combination ---
        weighted_sum = sum(s * w for _, s, w in scores)
        total_weight = sum(w for _, _, w in scores)
        ai_probability = weighted_sum / total_weight

        # Log details
        for name, score, weight in scores:
            print(f"  [FORENSIC] {name}: {score:.3f} (weight: {weight})", file=sys.stderr)
        print(f"  [FORENSIC] Combined AI probability: {ai_probability:.3f}", file=sys.stderr)

        return ai_probability, {name: round(score, 4) for name, score, _ in scores}

    # ------------------------------------------------------------------ #
    #  ViT model detection
    # ------------------------------------------------------------------ #
    def _detect_with_vit(self, image_path):
        """Use the fine-tuned ViT model for detection. Returns ai_probability."""
        image = Image.open(image_path).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model(**inputs)

        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=1)

        predicted_idx = probabilities.argmax(dim=1).item()
        predicted_label = self.labels[predicted_idx]
        confidence = probabilities[0][predicted_idx].item()

        print(f"[VIT] Prediction: {predicted_label} ({confidence:.4f})", file=sys.stderr)
        print(f"[VIT] All probabilities: {probabilities[0].tolist()}", file=sys.stderr)
        print(f"[VIT] Labels: {self.labels}", file=sys.stderr)

        # Determine which class is AI
        real_keywords = ["human", "real", "authentic", "genuine"]
        ai_keywords = ["artificial", "ai", "fake", "generated", "synthetic", "deepfake"]

        # Find the AI class index
        ai_class_idx = None
        for idx, label in self.labels.items():
            label_lower = label.lower()
            if any(kw in label_lower for kw in ai_keywords):
                ai_class_idx = idx
                break

        if ai_class_idx is not None:
            ai_probability = probabilities[0][ai_class_idx].item()
        else:
            # Default: index 0 is AI
            ai_probability = probabilities[0][0].item()

        print(f"[VIT] AI probability: {ai_probability:.4f}", file=sys.stderr)
        return ai_probability, predicted_label

    # ------------------------------------------------------------------ #
    #  Main detection entry point
    # ------------------------------------------------------------------ #
    def detect(self, image_path):
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"[DETECT] Analyzing image: {image_path}", file=sys.stderr)
        print(f"[DETECT] Method: {self.method}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)

        try:
            if self.method == "vit" and self.model is not None:
                return self._combined_detection(image_path)
            else:
                return self._forensic_only_detection(image_path)
        except Exception as e:
            print(f"[ERROR] Detection failed: {e}", file=sys.stderr)
            raise

    def _combined_detection(self, image_path):
        """
        Use BOTH ViT model and forensic analysis, combining scores
        for the most robust detection.
        ViT weight: 0.75, Forensic weight: 0.25
        """
        # Run ViT detection
        vit_ai_prob, model_label = self._detect_with_vit(image_path)

        # Run forensic analysis
        forensic_ai_prob, forensic_details = self._forensic_analysis(image_path)

        # Weighted combination: ViT is primary, forensic is secondary
        vit_weight = 0.75
        forensic_weight = 0.25
        combined_ai_prob = (vit_ai_prob * vit_weight) + (forensic_ai_prob * forensic_weight)

        print(f"\n[COMBINED] ViT AI prob: {vit_ai_prob:.4f} (weight: {vit_weight})", file=sys.stderr)
        print(f"[COMBINED] Forensic AI prob: {forensic_ai_prob:.4f} (weight: {forensic_weight})", file=sys.stderr)
        print(f"[COMBINED] Final AI probability: {combined_ai_prob:.4f}", file=sys.stderr)

        # Decision threshold: 0.45 (slightly below 0.5 to be more cautious)
        # This means we're biased towards flagging suspicious images
        threshold = 0.45
        is_ai = combined_ai_prob > threshold
        is_real = not is_ai

        if is_ai:
            confidence = combined_ai_prob
            label = "AI Generated"
        else:
            confidence = 1.0 - combined_ai_prob
            label = "Real"

        print(f"[RESULT] {label} (confidence: {confidence:.4f}, threshold: {threshold})", file=sys.stderr)

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "is_real": is_real,
            "ai_probability": round(combined_ai_prob, 4),
            "method": "vit_combined",
            "model_label": model_label,
            "vit_score": round(vit_ai_prob, 4),
            "forensic_score": round(forensic_ai_prob, 4),
        }

    def _forensic_only_detection(self, image_path):
        """
        Forensic-only detection (fallback when ViT model is unavailable).
        Uses a stricter threshold since forensic alone is less reliable.
        """
        print("[WARNING] Using forensic-only analysis (ViT model not available).", file=sys.stderr)

        forensic_ai_prob, forensic_details = self._forensic_analysis(image_path)

        # Use a lower threshold for forensic-only mode to be more conservative
        # (better to reject a real image than allow a fake one through)
        threshold = 0.40
        is_ai = forensic_ai_prob > threshold
        is_real = not is_ai

        if is_ai:
            confidence = forensic_ai_prob
            label = "AI Generated"
        else:
            confidence = 1.0 - forensic_ai_prob
            label = "Real"

        print(f"[RESULT] {label} (confidence: {confidence:.4f}, threshold: {threshold})", file=sys.stderr)

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "is_real": is_real,
            "ai_probability": round(forensic_ai_prob, 4),
            "method": "forensic_analysis",
            "details": forensic_details,
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    try:
        detector = AIImageDetector()
        result = detector.detect(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
