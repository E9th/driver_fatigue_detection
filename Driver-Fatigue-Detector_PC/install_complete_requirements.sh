#!/bin/bash
echo "🔧 Installing requirements for Complete PC Detector..."

# Python packages
pip install opencv-python
pip install dlib
pip install imutils
pip install scipy
pip install numpy
pip install pyrebase4

# Download face landmark predictor
echo "📥 Downloading face landmark predictor..."
if [ ! -f "shape_predictor_68_face_landmarks.dat" ]; then
    echo "Please download shape_predictor_68_face_landmarks.dat from:"
    echo "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
    echo "Extract and place it in the same folder as pc_detector_complete.py"
fi

# TTS support
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔊 Installing TTS for Linux..."
    sudo apt-get update
    sudo apt-get install espeak espeak-data-th
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔊 TTS ready for macOS (using built-in 'say')"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🔊 Installing TTS for Windows..."
    pip install pyttsx3
fi

echo "✅ Installation complete!"
echo "📋 To run: python pc_detector_complete.py"
