import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path

class GradCAMExplainer:
    def __init__(self, model_path="D:/projects/asd-decision-client/models/facial_mobilenet_model.keras"):
        self.model = tf.keras.models.load_model(str(model_path))
        self.base_mobilenet = None
        for l in self.model.layers:
            if "mobilenet" in l.name.lower():
                self.base_mobilenet = l
                break

        # Sub-model that outputs both the last conv activations and the final prediction
        # Last conv layer inside MobileNetV2 is 'out_relu'
        last_conv_layer = self.base_mobilenet.get_layer("out_relu")
        self.conv_model = tf.keras.models.Model(
            inputs=self.base_mobilenet.inputs,
            outputs=last_conv_layer.output
        )

        # Classification head layers after mobilenet
        head_input = tf.keras.layers.Input(shape=last_conv_layer.output.shape[1:])
        x = head_input
        for l in self.model.layers[3:]: # layers from global_average_pooling2d onward
            x = l(x)
        self.head_model = tf.keras.models.Model(inputs=head_input, outputs=x)

    def generate_heatmap(self, img_array):
        # img_array shape: (1, 160, 160, 3)
        preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)

        with tf.GradientTape() as tape:
            conv_outputs = self.conv_model(preprocessed)
            tape.watch(conv_outputs)
            preds = self.head_model(conv_outputs)
            loss = preds[:, 0]

        # Gradients of prediction wrt conv outputs
        grads = tape.gradient(loss, conv_outputs)
        # Global average pool the gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight the conv outputs by pooled gradients
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # Apply ReLU
        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-10)
        return heatmap.numpy(), float(preds[0][0])

    def overlay_heatmap(self, original_bgr, heatmap, alpha=0.4):
        h, w, _ = original_bgr.shape
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        color_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        overlay = cv2.addWeighted(color_heatmap, alpha, original_bgr, 1 - alpha, 0)
        return overlay

if __name__ == "__main__":
    explainer = GradCAMExplainer()
    test_img = Path("D:/projects/asd-decision-client/data/raw/facial_images/autism-image-dataset/test/autistic/001.jpg")
    if test_img.exists():
        raw_bgr = cv2.imread(str(test_img))
        img_rgb = cv2.cvtColor(raw_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(img_rgb, (160, 160))
        img_array = np.expand_dims(resized.astype(np.float32), axis=0)

        heatmap, pred_prob = explainer.generate_heatmap(img_array)
        overlay = explainer.overlay_heatmap(raw_bgr, heatmap)

        out_path = Path("D:/projects/asd-decision-client/models/sample_gradcam_overlay.jpg")
        cv2.imwrite(str(out_path), overlay)
        print(f"✓ Grad-CAM successful! Predicted P(ASD): {pred_prob*100:.2f}%. Saved overlay to: {out_path.name}")
