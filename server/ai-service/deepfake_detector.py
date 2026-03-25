#!/usr/bin/env "C:/Users/Nithishwar/OneDrive/Desktop/Mini Project/.venv/Scripts/python.exe"
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

Python interpreter: .venv at project root
  Windows : <project-root>/.venv/Scripts/python.exe
  Packages: torch, torchvision, transformers, Pillow, numpy  (see requirements.txt)
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Third-party imports — all satisfied by the project .venv
# ---------------------------------------------------------------------------
from PIL import Image  # type: ignore[import]
from PIL import ImageFilter  # type: ignore[import]
import numpy as np  # type: ignore[import]

# torch — guarded so script still runs in forensic-only mode if .venv is missing
try:
    import torch  # type: ignore[import]
    import torch.nn.functional as F  # type: ignore[import]
    _TORCH_AVAILABLE: bool = True
except (ImportError, OSError) as _torch_err:
    torch = None  # type: ignore[assignment]
    F = None      # type: ignore[assignment]
    _TORCH_AVAILABLE = False
    print(
        f"[WARNING] torch unavailable ({_torch_err}) – falling back to forensic-only.",
        file=sys.stderr,
    )


# ---------------------------------------------------------------------------
# Detector class
# ---------------------------------------------------------------------------
class AIImageDetector:
    def __init__(self) -> None:
        self.model: Any = None
        self.processor: Any = None
        self.method: str = "forensic"   # overwritten to "vit" on success
        self.labels: Dict[Any, str] = {}

        try:
            self._load_hf_model()
        except Exception as exc:
            print(f"[WARNING] ViT model load failed: {exc}", file=sys.stderr)
            print("[WARNING] Using forensic-only analysis (less accurate).", file=sys.stderr)
            self.method = "forensic"

    # ---------------------------------------------------------------------- #
    #  Model loading
    # ---------------------------------------------------------------------- #
    def _load_hf_model(self) -> None:
        """Load a ViT model fine-tuned for AI-generated image detection."""
        if not _TORCH_AVAILABLE:
            raise ImportError(
                "torch is not available. Run: "
                ".venv/Scripts/pip install -r server/ai-service/requirements.txt"
            )

        print("[INFO] Loading AI Image Detection model...", file=sys.stderr)
        from transformers import AutoModelForImageClassification, AutoImageProcessor  # type: ignore[import]

        local_model_dir = "C:/aimod"
        hub_model_name  = "umm-maybe/AI-image-detector"

        if os.path.isdir(local_model_dir) and os.path.exists(
            os.path.join(local_model_dir, "config.json")
        ):
            model_source = local_model_dir
            print(f"[INFO] Loading model from local dir: {local_model_dir}", file=sys.stderr)
        else:
            model_source = hub_model_name
            print(f"[INFO] Loading model from HuggingFace: {hub_model_name}", file=sys.stderr)

        self.processor = AutoImageProcessor.from_pretrained(model_source)
        model = AutoModelForImageClassification.from_pretrained(model_source)
        model.eval()  # type: ignore[union-attr]
        self.model  = model
        self.method = "vit"
        self.labels = dict(model.config.id2label)  # type: ignore[union-attr]
        print(f"[INFO] Model loaded. Labels: {self.labels}", file=sys.stderr)

    # ---------------------------------------------------------------------- #
    #  Forensic / statistical analysis
    # ---------------------------------------------------------------------- #
    def _forensic_analysis(self, image_path: str) -> Tuple[float, Dict[str, float]]:
        """
        Heuristic analysis for AI-generated image telltales:
          1. Frequency-domain smoothness  2. Color channel correlation
          3. Texture uniformity           4. Histogram entropy
          5. Edge coherence
        Returns (ai_probability, details_dict).
        """
        img: Any       = Image.open(image_path).convert("RGB")
        img_array: Any = np.array(img, dtype=np.float64)

        scores: List[Tuple[str, float, float]] = []

        # 1. FFT frequency analysis
        gray: Any      = np.mean(img_array, axis=2)
        fft: Any       = np.fft.fft2(gray)
        fft_shift: Any = np.fft.fftshift(fft)
        magnitude: Any = np.log1p(np.abs(fft_shift))

        h, w   = int(magnitude.shape[0]), int(magnitude.shape[1])
        cy, cx = h // 2, w // 2
        radius = min(h, w) // 4
        total_energy: float    = float(np.sum(magnitude))
        Y: Any                 = np.ogrid[:h, :w][0]
        X: Any                 = np.ogrid[:h, :w][1]
        low_freq_mask: Any     = ((Y - cy) ** 2 + (X - cx) ** 2) <= radius ** 2
        low_freq_energy: float = float(np.sum(magnitude[low_freq_mask]))
        high_freq_ratio: float = 1.0 - (low_freq_energy / (total_energy + 1e-10))
        freq_score: float      = float(min(max((0.40 - high_freq_ratio) / 0.15, 0.0), 1.0))
        scores.append(("frequency_smoothness", freq_score, 0.30))

        # 2. Color channel correlation
        r: Any = img_array[:, :, 0]
        g: Any = img_array[:, :, 1]
        b: Any = img_array[:, :, 2]
        rg_corr: float  = float(np.corrcoef(r.flatten(), g.flatten())[0, 1])
        rb_corr: float  = float(np.corrcoef(r.flatten(), b.flatten())[0, 1])
        gb_corr: float  = float(np.corrcoef(g.flatten(), b.flatten())[0, 1])
        avg_corr: float = (abs(rg_corr) + abs(rb_corr) + abs(gb_corr)) / 3.0
        corr_score: float = float(min(max((avg_corr - 0.80) / 0.15, 0.0), 1.0))
        scores.append(("color_correlation", corr_score, 0.20))

        # 3. Texture uniformity (local variance)
        img_blur: Any   = img.filter(ImageFilter.GaussianBlur(radius=2))
        blur_array: Any = np.array(img_blur, dtype=np.float64)
        diff: Any       = np.abs(img_array - blur_array)
        local_var: float = float(np.std(diff))
        var_score: float = float(min(max((10.0 - local_var) / 6.0, 0.0), 1.0))
        scores.append(("texture_uniformity", var_score, 0.20))

        # 4. Histogram entropy
        hist_scores_raw: List[float] = []
        for ch in range(3):
            channel: Any    = img_array[:, :, ch].flatten()
            hist: Any       = np.histogram(channel, bins=64, range=(0, 255))[0]
            hist_norm: Any  = hist / (float(hist.sum()) + 1e-10)
            entropy: float  = float(-np.sum(hist_norm * np.log2(hist_norm + 1e-10)))
            max_ent: float  = float(np.log2(64))
            hist_scores_raw.append(entropy / max_ent)
        avg_entropy: float   = float(np.mean(hist_scores_raw))
        entropy_score: float = float(min(max((0.90 - avg_entropy) / 0.08, 0.0), 1.0))
        scores.append(("histogram_uniformity", entropy_score, 0.15))

        # 5. Edge coherence
        edges: Any      = img.convert("L").filter(ImageFilter.FIND_EDGES)
        edge_arr: Any   = np.array(edges, dtype=np.float64)
        edge_std: float = float(np.std(edge_arr))
        edge_mean: float = float(np.mean(edge_arr))
        edge_ratio: float = edge_mean / (edge_std + 1e-10)
        edge_score: float = float(min(max((1.5 - edge_ratio) / 1.0, 0.0), 1.0))
        scores.append(("edge_coherence", edge_score, 0.15))

        weighted_sum: float   = sum(s * w for _, s, w in scores)
        total_weight: float   = sum(w for _, _, w in scores)
        ai_probability: float = weighted_sum / total_weight

        for name, score, weight in scores:
            print(f"  [FORENSIC] {name}: {score:.3f} (weight={weight})", file=sys.stderr)
        print(f"  [FORENSIC] AI probability: {ai_probability:.3f}", file=sys.stderr)

        details: Dict[str, float] = {
            name: float(round(float(sc), 4)) for name, sc, _ in scores
        }
        return ai_probability, details

    # ---------------------------------------------------------------------- #
    #  ViT model detection
    # ---------------------------------------------------------------------- #
    def _detect_with_vit(self, image_path: str) -> Tuple[float, str]:
        """Use the fine-tuned ViT model. Returns (ai_probability, predicted_label)."""
        assert _TORCH_AVAILABLE and torch is not None and F is not None, "torch not available"
        assert self.processor is not None and self.model is not None

        processor: Any = self.processor
        model: Any     = self.model

        image: Any  = Image.open(image_path).convert("RGB")
        inputs: Any = processor(images=image, return_tensors="pt")

        with torch.no_grad():  # type: ignore[union-attr]
            outputs: Any = model(**inputs)

        logits: Any        = outputs.logits
        probabilities: Any = F.softmax(logits, dim=1)  # type: ignore[union-attr]

        predicted_idx: int    = int(probabilities.argmax(dim=1).item())
        predicted_label: str  = str(self.labels.get(predicted_idx, predicted_idx))
        confidence: float     = float(probabilities[0][predicted_idx].item())

        print(f"[VIT] Prediction: {predicted_label} ({confidence:.4f})", file=sys.stderr)
        print(f"[VIT] All probs: {probabilities[0].tolist()}", file=sys.stderr)

        ai_keywords: List[str] = ["artificial", "ai", "fake", "generated", "synthetic", "deepfake"]
        ai_class_idx: Optional[int] = None
        for idx, lbl in self.labels.items():
            if any(kw in str(lbl).lower() for kw in ai_keywords):
                ai_class_idx = int(idx)
                break

        if ai_class_idx is not None:
            ai_probability = float(probabilities[0][ai_class_idx].item())
        else:
            ai_probability = float(probabilities[0][0].item())

        print(f"[VIT] AI probability: {ai_probability:.4f}", file=sys.stderr)
        return ai_probability, predicted_label

    # ---------------------------------------------------------------------- #
    #  Main detection entry point
    # ---------------------------------------------------------------------- #
    def detect(self, image_path: str) -> Dict[str, Any]:
        print(f"\n{'=' * 60}", file=sys.stderr)
        print(f"[DETECT] Image: {image_path}", file=sys.stderr)
        print(f"[DETECT] Method: {self.method}", file=sys.stderr)
        print(f"{'=' * 60}", file=sys.stderr)

        try:
            if self.method == "vit" and self.model is not None:
                return self._combined_detection(image_path)
            return self._forensic_only_detection(image_path)
        except Exception as exc:
            print(f"[ERROR] Detection failed: {exc}", file=sys.stderr)
            raise

    def _combined_detection(self, image_path: str) -> Dict[str, Any]:
        """ViT (75%) + forensic (25%) combined detection."""
        vit_prob,    model_label  = self._detect_with_vit(image_path)
        forensic_prob, foren_det = self._forensic_analysis(image_path)

        combined: float = vit_prob * 0.75 + forensic_prob * 0.25

        print(f"\n[COMBINED] ViT={vit_prob:.4f}  Forensic={forensic_prob:.4f}  "
              f"Final={combined:.4f}", file=sys.stderr)

        threshold: float  = 0.45
        is_ai: bool       = combined > threshold
        is_real: bool     = not is_ai
        confidence: float = combined if is_ai else 1.0 - combined
        label: str        = "AI Generated" if is_ai else "Real"

        print(f"[RESULT] {label} (conf={confidence:.4f})", file=sys.stderr)
        return {
            "label":          label,
            "confidence":     float(round(confidence,   4)),
            "is_real":        is_real,
            "ai_probability": float(round(combined,     4)),
            "method":         "vit_combined",
            "model_label":    model_label,
            "vit_score":      float(round(vit_prob,     4)),
            "forensic_score": float(round(forensic_prob, 4)),
        }

    def _forensic_only_detection(self, image_path: str) -> Dict[str, Any]:
        """Forensic-only fallback (ViT unavailable)."""
        print("[WARNING] Using forensic-only analysis (ViT not available).", file=sys.stderr)

        forensic_prob, foren_det = self._forensic_analysis(image_path)

        threshold: float  = 0.40
        is_ai: bool       = forensic_prob > threshold
        is_real: bool     = not is_ai
        confidence: float = forensic_prob if is_ai else 1.0 - forensic_prob
        label: str        = "AI Generated" if is_ai else "Real"

        print(f"[RESULT] {label} (conf={confidence:.4f})", file=sys.stderr)
        return {
            "label":          label,
            "confidence":     float(round(confidence,    4)),
            "is_real":        is_real,
            "ai_probability": float(round(forensic_prob, 4)),
            "method":         "forensic_analysis",
            "details":        foren_det,
        }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    _image_path = sys.argv[1]
    if not os.path.exists(_image_path):
        print(json.dumps({"error": f"Image file not found: {_image_path}"}))
        sys.exit(1)

    try:
        detector = AIImageDetector()
        result   = detector.detect(_image_path)
        print(json.dumps(result))
    except Exception as _exc:
        print(json.dumps({"error": str(_exc)}))
        sys.exit(1)
