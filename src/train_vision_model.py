import os
import sys
import json
from pathlib import Path
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path("D:/projects/asd-decision-client")
DATA_DIR = BASE_DIR / "data" / "raw" / "facial_images" / "autism-image-dataset"
MODELS_DIR = BASE_DIR / "models"

print("=" * 70)
print("  TRAINING NEUROSCREEN FACIAL VISION CNN (MOBILENETV2)")
print("=" * 70)

IMG_SIZE = (160, 160)
BATCH_SIZE = 32

train_dir = DATA_DIR / "train"
valid_dir = DATA_DIR / "valid"
test_dir = DATA_DIR / "test"

# Data pipeline
train_ds = tf.keras.utils.image_dataset_from_directory(
    train_dir,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="binary",
    shuffle=True,
    seed=42
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    valid_dir,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="binary",
    shuffle=False
)

test_ds = tf.keras.utils.image_dataset_from_directory(
    test_dir,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="binary",
    shuffle=False
)

# Prefetch
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
test_ds = test_ds.cache().prefetch(buffer_size=AUTOTUNE)

# Data augmentation
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.08),
    layers.RandomZoom(0.08),
])

# Base model
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(160, 160, 3),
    include_top=False,
    weights="imagenet"
)
base_model.trainable = False

# Head
inputs = layers.Input(shape=(160, 160, 3))
x = data_augmentation(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(1, activation="sigmoid")(x)

model = models.Model(inputs, outputs)

model.compile(
    optimizer=optimizers.Adam(learning_rate=5e-4),
    loss="binary_crossentropy",
    metrics=["accuracy", tf.keras.metrics.AUC(name="auc")]
)

model_path = MODELS_DIR / "facial_mobilenet_model.keras"

cb = [
    callbacks.EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
    callbacks.ModelCheckpoint(filepath=str(model_path), monitor="val_accuracy", save_best_only=True)
]

print("Training for 5 epochs...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=5,
    callbacks=cb,
    verbose=1
)

# Evaluate on Test Set
test_loss, test_acc, test_auc = model.evaluate(test_ds, verbose=0)
print(f"\nTest Evaluation:")
print(f"  Test Accuracy : {test_acc * 100:.2f}%")
print(f"  Test ROC-AUC  : {test_auc * 100:.2f}%")

# Save vision metrics
vision_metrics = {
    "model_name": "MobileNetV2-ASD-Vision",
    "image_size": IMG_SIZE,
    "total_images": 3014,
    "test_accuracy": round(float(test_acc), 4),
    "test_auc": round(float(test_auc), 4),
    "model_file": model_path.name
}

with open(MODELS_DIR / "vision_metrics.json", "w", encoding="utf-8") as f:
    json.dump(vision_metrics, f, indent=2)

print(f"\nVision model saved to: {model_path}")
