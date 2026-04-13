from ultralytics import YOLO
import easyocr
import cv2
import os
import re
import numpy as np

from pymongo import MongoClient
from datetime import datetime, timezone
from collections import Counter

# ==========================================
# CONFIG
# ==========================================

MODEL_PATH = "best.pt"
SAVE_DIR = "plates"
YOLO_CONF = 0.5

# 🔥 YOUR MONGODB URI (KEEP ONLY THIS)
MONGO_URI = "mongodb+srv://kulkarnipreeti15_db_user:NKNJtR029FwDXieq@parkease.gnyg2s9.mongodb.net/parking?retryWrites=true&w=majority"

# ==========================================
# 🔥 USER INPUT SLOT
# ==========================================

while True:
    SLOT_ID = input("Enter Parking Slot ID (A1 / A2 / A3 ...): ").strip().upper()
    if re.match(r'^[A-Z][0-9]+$', SLOT_ID):
        break
    print("❌ Invalid format. Try again.")

print(f"✅ Using Slot ID: {SLOT_ID}")

# ==========================================
# MONGODB
# ==========================================

client = MongoClient(MONGO_URI)
db = client["parking"]
collection = db["bookings"]

os.makedirs(SAVE_DIR, exist_ok=True)

# ==========================================
# MODELS
# ==========================================

model = YOLO(MODEL_PATH)
reader = easyocr.Reader(['en'], gpu=True)

# ==========================================
# HELPERS
# ==========================================

def clean_plate(text):
    return re.sub(r'[^A-Z0-9]', '', text.upper())

def smart_correct_plate(text):
    text = list(text)

    for i, ch in enumerate(text):
        if i < 2:
            if ch.isdigit():
                text[i] = chr(ord('A') + int(ch) % 26)
        elif i < 4:
            if ch.isalpha():
                text[i] = '0' if ch == 'O' else '1'
        elif i >= len(text) - 4:
            if ch.isalpha():
                text[i] = '0' if ch == 'O' else '1'

    return "".join(text)

# ==========================================
# 🔥 INTELLIGENT FIX TO INDIAN FORMAT
# ==========================================

def fix_to_indian_plate(results_all):

    if not results_all:
        return None

    # Character voting
    max_len = max(len(r) for r in results_all)
    final = ""

    for i in range(max_len):
        chars = [r[i] for r in results_all if i < len(r)]
        if chars:
            final += Counter(chars).most_common(1)[0][0]

    # Normalize length
    if len(final) < 10:
        final = final.ljust(10, '0')
    elif len(final) > 10:
        final = final[:10]

    final = list(final)

    # Force format AA NN AA NNNN
    for i in range(2):
        if final[i].isdigit():
            final[i] = chr(ord('A') + int(final[i]) % 26)

    for i in range(2, 4):
        if final[i].isalpha():
            final[i] = '0'

    for i in range(4, 6):
        if final[i].isdigit():
            final[i] = chr(ord('A') + int(final[i]) % 26)

    for i in range(6, 10):
        if final[i].isalpha():
            final[i] = '0'

    return "".join(final)

# ==========================================
# MONGODB SEND
# ==========================================

def send_to_mongodb(slot_id, is_parked, plate_number=None):

    data = {
        "slot_id": slot_id,
        "is_parked": is_parked,
        "vehicle_number": plate_number,
        "timestamp": datetime.now(timezone.utc)
    }

    collection.update_one(
        {"slot_id": slot_id},
        {"$set": data},
        upsert=True
    )

    print("📡 Sent to MongoDB:", data)

# ==========================================
# OCR FUNCTION
# ==========================================

def run_ocr(image):

    results_all = []

    for _ in range(3):

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
        gray = cv2.filter2D(gray, -1, kernel)

        gray = cv2.bilateralFilter(gray, 11, 17, 17)

        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )

        inverted = cv2.bitwise_not(thresh)

        for img in [thresh, inverted]:

            plate_resized = cv2.resize(img, (400, 120))
            results = reader.readtext(plate_resized)

            for (_, text, prob) in results:

                clean_text = clean_plate(text)
                clean_text = smart_correct_plate(clean_text)

                if len(clean_text) >= 6:
                    results_all.append(clean_text)

    if results_all:
        print("RAW OCR:", results_all)

        final = fix_to_indian_plate(results_all)

        print(f"🔧 Corrected Plate: {final}")
        print(f"🚗 FINAL PLATE: {final}")

        send_to_mongodb(SLOT_ID, True, final)
        return final

    print("❌ OCR unstable")
    return None

# ==========================================
# REALTIME
# ==========================================

def realtime_capture():
    cap = cv2.VideoCapture(0)

    print("🎥 Press 'A' to capture | 'Q' to quit")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (640, 480))
        results = model.predict(frame, conf=YOLO_CONF, verbose=False)
        boxes = results[0].boxes

        last_plate = None
        max_area = 0

        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if (x2-x1) < 80 or (y2-y1) < 25:
                    continue

                area = (x2-x1)*(y2-y1)
                plate = frame[y1:y2, x1:x2]

                if area > max_area:
                    max_area = area
                    last_plate = plate

                cv2.rectangle(frame,(x1,y1),(x2,y2),(0,255,0),2)

        cv2.imshow("Detection", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == ord('a'):
            if last_plate is not None:
                print("📸 Capturing...")
                run_ocr(last_plate)
            else:
                print("❌ No plate detected")
                send_to_mongodb(SLOT_ID, False, None)

        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    realtime_capture()