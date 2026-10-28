import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO

class YOLOFaceDetector:
    def __init__(self, conf_thresh=0.4):
        self.conf_thresh = conf_thresh
        # Use YOLOv8n (nano) which handles person/face bounding boxes efficiently
        try:
            self.model = YOLO("yolov8n.pt")
            self.initialized = True
        except Exception as e:
            print(f"Warning: YOLO initialization fallback to OpenCV: {e}")
            self.initialized = False

    def detect_and_crop(self, image_path, margin=0.15):
        img = cv2.imread(str(image_path))
        if img is None:
            raise FileNotFoundError(f"Image not found: {image_path}")
        h, w, _ = img.shape

        box = None
        if self.initialized:
            results = self.model(img, verbose=False)[0]
            # Look for detected person / face
            for r in results.boxes:
                # Class 0 is person in COCO
                if int(r.cls[0]) == 0 and float(r.conf[0]) >= self.conf_thresh:
                    xyxy = r.xyxy[0].cpu().numpy()
                    box = [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
                    break

        # Fallback to Haar Cascade if YOLO person detector didn't isolate close crop
        if box is None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            if len(faces) > 0:
                fx, fy, fw, fh = faces[0]
                box = [fx, fy, fx + fw, fy + fh]

        # If already a cropped portrait or no face box found, use the image directly
        if box is None:
            return img, [0, 0, w, h], False

        x1, y1, x2, y2 = box
        # Add margin
        mx = int((x2 - x1) * margin)
        my = int((y2 - y1) * margin)
        x1_crop = max(0, x1 - mx)
        y1_crop = max(0, y1 - my)
        x2_crop = min(w, x2 + mx)
        y2_crop = min(h, y2 + my)

        cropped = img[y1_crop:y2_crop, x1_crop:x2_crop]
        return cropped, [x1_crop, y1_crop, x2_crop, y2_crop], True

if __name__ == "__main__":
    detector = YOLOFaceDetector()
    test_img = Path("D:/projects/asd-decision-client/data/raw/facial_images/autism-image-dataset/test/autistic/001.jpg")
    if test_img.exists():
        cropped, bbox, was_cropped = detector.detect_and_crop(test_img)
        print(f"✓ YOLO Detector test successful. Original size, BBox: {bbox}, Cropped: {was_cropped}, Output shape: {cropped.shape}")
