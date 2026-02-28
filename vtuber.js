import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { VRMLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/VRMLoader.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

let renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명
let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 5);
scene.add(light);

// VRM 로드
let model;
const loader = new VRMLoader();
loader.load('model.vrm', (vrm) => {
    model = vrm.scene;
    model.userData.vrm = vrm; // BlendShape 접근용
    scene.add(model);
});

// face-api 모델 로드
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');

// 웹캠 준비
const video = document.createElement('video');
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    video.play();
});

// 입 열림 계산 함수
async function getMouthOpen() {
    if(video.readyState < 2) return 0;

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks(true);

    if(!detection) return 0;

    const mouth = detection.landmarks.getMouth();
    const height = Math.abs(mouth[13].y - mouth[19].y); // 입 위/아래 거리
    const width = Math.abs(mouth[14].x - mouth[18].x);
    return Math.min(1, height / width); // 0~1로 정규화
}

// 렌더 루프
async function animate() {
    requestAnimationFrame(animate);

    if(model) {
        const mouthOpen = await getMouthOpen();
        const blendShape = model.userData.vrm.blendShapeProxy;
        blendShape.setValue('a', mouthOpen); // 'a' = VRM 입 BlendShape 이름
    }

    renderer.render(scene, camera);
}
animate();
