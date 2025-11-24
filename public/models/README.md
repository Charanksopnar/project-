# Face-API.js Models

This directory should contain the face-api.js model files for face detection and recognition.

## Download Models

To download the required models, run:

```bash
node scripts/download-face-models.js
```

Or manually download from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Required Models

- `tiny_face_detector_model-weights_manifest.json` + shard
- `face_landmark_68_model-weights_manifest.json` + shard
- `face_recognition_model-weights_manifest.json` + shards
- `face_expression_model-weights_manifest.json` + shard
- `ssd_mobilenetv1_model-weights_manifest.json` + shards
- `age_gender_model-weights_manifest.json` + shard

## Note

If models are not available, the application will use fallback/mock detection methods and continue to function.

