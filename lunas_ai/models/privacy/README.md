# Privacy detectors

## Face detector

`face_detection_yunet_2023mar.onnx` is the lightweight MIT-licensed YuNet
face detector from OpenCV Zoo. It is used to locate faces, including small
faces in wider traffic scenes, without OCR or identity recognition.

Source: https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet

## License-plate detector

`license-plate.pt` is the MIT-licensed YOLOv8n license-plate detector from
the Koushim `yolov8-license-plate-detection` model repository. It is used only
to locate plate regions; the service never performs OCR or stores plate text.

Source: https://huggingface.co/Koushim/yolov8-license-plate-detection

Before release, validate this weight against representative local traffic
images and replace it if its regional plate performance is insufficient.
