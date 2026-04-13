# ==========================================
# Car Number Plate Detection - LOCAL TRAINING
# (No Colab, No Drive, Pure Python)
# ==========================================

import os
import zipfile
import shutil
import xml.etree.ElementTree as ET
from tqdm import tqdm
from ultralytics import YOLO
import torch

# ==========================================
# CONFIG
# ==========================================

ZIP_PATH = "cars_plate.zip"   # keep zip in same folder
EXTRACT_PATH = "dataset"
YOLO_PATH = "yolo_dataset"

IMG_SIZE = 512
EPOCHS = 50
BATCH_SIZE = 8
MODEL_NAME = "yolov8n.pt"

DEVICE = 0 if torch.cuda.is_available() else "cpu"

# ==========================================
# STEP 1: EXTRACT DATASET
# ==========================================

def extract_dataset():
    if os.path.exists(EXTRACT_PATH):
        print("⚠️ Dataset already extracted, skipping...")
        return

    print("📦 Extracting dataset...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(EXTRACT_PATH)
    print("✅ Extraction complete")


# ==========================================
# STEP 2: CONVERT VOC → YOLO
# ==========================================

def convert_voc_to_yolo():
    print("🔄 Converting VOC → YOLO format...")

    os.makedirs(f"{YOLO_PATH}/images/train", exist_ok=True)
    os.makedirs(f"{YOLO_PATH}/labels/train", exist_ok=True)

    def convert(size, box):
        dw = 1.0 / size[0]
        dh = 1.0 / size[1]
        x = (box[0] + box[1]) / 2.0
        y = (box[2] + box[3]) / 2.0
        w = box[1] - box[0]
        h = box[3] - box[2]
        return (x * dw, y * dh, w * dw, h * dh)

    xml_files = []
    image_paths = {}

    # scan dataset
    for root, _, files in os.walk(EXTRACT_PATH):
        for file in files:
            full_path = os.path.join(root, file)

            if file.endswith(".xml"):
                xml_files.append(full_path)

            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                image_paths[file] = full_path

    print(f"📊 Found {len(xml_files)} annotations")
    print(f"📊 Found {len(image_paths)} images")

    for xml_file in tqdm(xml_files):
        tree = ET.parse(xml_file)
        root = tree.getroot()

        filename = root.find("filename").text

        if filename not in image_paths:
            continue

        size = root.find("size")
        w = int(size.find("width").text)
        h = int(size.find("height").text)

        txt_filename = os.path.splitext(filename)[0] + ".txt"
        label_path = os.path.join(YOLO_PATH, "labels/train", txt_filename)

        with open(label_path, "w") as f:
            for obj in root.iter("object"):
                cls = 0  # number_plate

                xmlbox = obj.find("bndbox")
                b = (
                    float(xmlbox.find("xmin").text),
                    float(xmlbox.find("xmax").text),
                    float(xmlbox.find("ymin").text),
                    float(xmlbox.find("ymax").text),
                )

                bb = convert((w, h), b)
                f.write(f"{cls} {' '.join(map(str, bb))}\n")

        shutil.copy(
            image_paths[filename],
            os.path.join(YOLO_PATH, "images/train", filename)
        )

    print("✅ Conversion complete")


# ==========================================
# STEP 3: CREATE data.yaml
# ==========================================

def create_yaml():
    print("📝 Creating data.yaml...")

    yaml_content = f"""
path: {YOLO_PATH}
train: images/train
val: images/train

names:
  0: number_plate
"""

    with open(os.path.join(YOLO_PATH, "data.yaml"), "w") as f:
        f.write(yaml_content)

    print("✅ data.yaml ready")


# ==========================================
# STEP 4: TRAIN MODEL
# ==========================================

def train_model():
    print(f"🚀 Training on device: {DEVICE}")

    model = YOLO(MODEL_NAME)

    model.train(
        data=os.path.join(YOLO_PATH, "data.yaml"),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        device=DEVICE
    )

    print("✅ Training complete")


# ==========================================
# STEP 5: SAVE MODEL
# ==========================================

def save_model():
    src = os.path.join("runs", "detect", "train", "weights", "best.pt")
    dst = "number_plate_model.pt"

    shutil.copy(src, dst)
    print(f"✅ Model saved at: {dst}")


# ==========================================
# MAIN PIPELINE
# ==========================================

if __name__ == "__main__":
    extract_dataset()
    convert_voc_to_yolo()
    create_yaml()
    train_model()
    save_model()