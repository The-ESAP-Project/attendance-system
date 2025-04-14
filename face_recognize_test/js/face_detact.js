// Global variables (equivalent to Python's global scope)
let video = document.getElementById('videoInput');
let videoSelect = document.getElementById('cameraSelect');
let currentStream = null;
let canvasOutput = document.getElementById('canvasOutput');
let ctx = canvasOutput.getContext('2d');
let faceCascade;
let count = 0;
const MAX_FACES = 200;
let streaming = false;
let lastCaptureTime = {}; // cache last capture time for each face
const FPS = 3; // 增加FPS使视频更流畅
let currentCount = document.getElementById('currentCount');
let savedCount = document.getElementById('savedCount');

// Add at the beginning of the file, after global variables
function onOpenCvReady() {
    cv['onRuntimeInitialized'] = async () => {
        console.log("OpenCV.js initialized");
        faceCascade = new cv.CascadeClassifier();
        // Create utils instance
        let utils = new Utils('errorMessage');
        // Load pre-trained classifier file
        let cascadeFile = 'haarcascade_frontalface_default.xml';
        
        utils.createFileFromUrl(cascadeFile, cascadeFile, () => {
            console.log("Cascade file loaded");
            faceCascade.load(cascadeFile);
            // Initialize camera access
            startVideo().then(() => {
                console.log("Video started");
                // Enumerate cameras after permission granted
                getCameraDevices().then(() => {
                    console.log("Camera devices enumerated");
                });
            });
        });
    };
}

// Modify getCameraDevices function
async function getCameraDevices() {
    try {
        // Request camera permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log("Found video devices:", videoDevices);
        
        // Clear existing options
        while (videoSelect.firstChild) {
            videoSelect.removeChild(videoSelect.firstChild);
        }
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '选择摄像头...';
        videoSelect.appendChild(defaultOption);
        
        // Add camera options
        videoDevices.forEach((videoDevice, index) => {
            const option = document.createElement('option');
            option.value = videoDevice.deviceId;
            option.textContent = videoDevice.label || `Camera ${index + 1}`;
            videoSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error enumerating devices:", err);
    }
}

async function startVideo(deviceId = '') {
    // Stop any existing stream
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        video.srcObject = stream;
        video.play();
        
        video.addEventListener("playing", () => {
            streaming = true;
            processVideo();
        });
        
        // Get camera list after permission is granted
        await getCameraDevices();
    } catch (err) {
        console.error("Camera error: " + err);
    }
}

// Add event listener for camera selection
videoSelect.addEventListener('change', (event) => {
    if (event.target.value) {
        startVideo(event.target.value);
    }
});

// Add event listener for camera selection
videoSelect.addEventListener('change', (event) => {
    if (event.target.value) {
        startVideo(event.target.value);
    }
});

function processVideo() {
    let cap = new cv.VideoCapture(video);
    let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let gray = new cv.Mat();

    function detectFaces() {
        if (!streaming || count >= MAX_FACES) {
            frame.delete();
            gray.delete();
            return;
        }

        cap.read(frame);
        cv.flip(frame, frame, 1);
        cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);
        let faces = new cv.RectVector();
        let msize = new cv.Size(0, 0);
        faceCascade.detectMultiScale(gray, faces, 1.3, 5, 0, msize, msize);

        currentCount.textContent = faces.size();

        for (let i = 0; i < faces.size(); i++) {
            let face = faces.get(i);
            
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(frame, point1, point2, [255, 0, 0, 255], 2);

            let faceRect = new cv.Rect(face.x, face.y, face.width, face.height);
            let roi = gray.roi(faceRect);
            let resizedFace = new cv.Mat();
            let dsize = new cv.Size(200, 200);
            cv.resize(roi, resizedFace, dsize, 0, 0, cv.INTER_AREA);

            let tempCanvas = document.createElement('canvas');
            cv.imshow(tempCanvas, resizedFace);
            tempCanvas.toBlob(function(blob) {
                let a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = "face_" + count + ".png";
                a.click();
                // 更新已保存的人脸数
                savedCount.textContent = count;
            });
            count++;

            roi.delete();
            resizedFace.delete();

            if (count >= MAX_FACES) break;
        }
        faces.delete();
        cv.imshow('canvasOutput', frame);
        
        setTimeout(detectFaces, 1000 / FPS);
    }
    detectFaces();
}