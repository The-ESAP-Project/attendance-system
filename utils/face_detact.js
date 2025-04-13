// Global variables (equivalent to Python's global scope)
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let ctx = canvasOutput.getContext('2d');
let faceCascade;
let count = 0;
const MAX_FACES = 200;
let streaming = false;

// Python: if __name__ == '__main__': generate()
// In JS we use onOpenCvReady as entry point
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

// Python: camera = cv2.VideoCapture(0)
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
    // Python: while True: loop is implemented as recursive function in JS
    let cap = new cv.VideoCapture(video);
    let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let gray = new cv.Mat();

    const FPS = 12;
    function detectFaces() {
        if (!streaming || count >= MAX_FACES) {
            frame.delete();
            gray.delete();
            return;
        }

        // Python: ret, frame = camera.read()
        cap.read(frame);
        // Python: frame = cv2.flip(frame, 1)
        cv.flip(frame, frame, 1);
        // Python: gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);

        // Python: faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        let faces = new cv.RectVector();
        let msize = new cv.Size(0, 0);
        faceCascade.detectMultiScale(gray, faces, 1.3, 5, 0, msize, msize);

        // Python: for (x, y, w, h) in faces:
        for (let i = 0; i < faces.size(); i++) {
            let face = faces.get(i);
            
            // Python: cv2.rectangle(frame, (x,y), (x+w,y+h), (255,0,0), 2)
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(frame, point1, point2, [255, 0, 0, 255], 2);

            // Python: f = cv2.resize(gray[y:y+h, x:x+w], (200, 200))
            let faceRect = new cv.Rect(face.x, face.y, face.width, face.height);
            let roi = gray.roi(faceRect);
            let resizedFace = new cv.Mat();
            let dsize = new cv.Size(200, 200);
            cv.resize(roi, resizedFace, dsize, 0, 0, cv.INTER_AREA);

            // Python: cv2.imwrite('./data/at/name/%s.pgm' % str(count), f)
            // Browser can't write files directly, so we use Blob and download
            let tempCanvas = document.createElement('canvas');
            cv.imshow(tempCanvas, resizedFace);
            tempCanvas.toBlob(function(blob) {
                let a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = "face_" + count + ".png";
                a.click();
            });
            count++;

            roi.delete();
            resizedFace.delete();

            if (count >= MAX_FACES) break;
        }
        faces.delete();

        // Python: cv2.imshow('camera', frame)
        cv.imshow('canvasOutput', frame);
        
        // Python: cv2.waitKey(int(1000/12))
        setTimeout(detectFaces, 1000 / FPS);
    }
    detectFaces();
}