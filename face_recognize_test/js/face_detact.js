// Global variables (equivalent to Python's global scope)
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let ctx = canvasOutput.getContext('2d');
let faceCascade;
let count = 0;
const MAX_FACES = 200;
let streaming = false;
let lastCaptureTime = {}; // 记录每个人脸最后一次捕获时间
const CAPTURE_INTERVAL = 3000; // 每个人脸的捕获间隔(毫秒)
const FPS = 3; // 增加FPS使视频更流畅
let currentCount = document.getElementById('currentCount');
let savedCount = document.getElementById('savedCount');


// onOpenCvReady as entry point
function onOpenCvReady() {
    // Wait for OpenCV to be fully loaded
    cv['onRuntimeInitialized'] = () => {
        // Create cascade classifier
        faceCascade = new cv.CascadeClassifier();
        let utils = new Utils('errorMessage');
        let cascadeFile = 'haarcascade_frontalface_default.xml';
        utils.createFileFromUrl(cascadeFile, cascadeFile, () => {
            faceCascade.load(cascadeFile);
            startVideo();
        });
    };
}

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
            video.addEventListener("playing", () => {
                streaming = true;
                processVideo();
            });
        })
        .catch(function(err) {
            console.error("Camera error: " + err);
        });
}

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