// Lấy canvas và thiết lập kích thước
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Lấy audio element
const backgroundMusic = document.getElementById('backgroundMusic');

// Kích thước canvas
canvas.width = 320;
canvas.height = 480;
 
// Tải ảnh
const backgroundImg = new Image();
backgroundImg.src = 'background.png';

const birdImg = new Image();
birdImg.src = 'bird.png';

const pipeTopImg = new Image();
pipeTopImg.src = 'pipe-top.png';

const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipe-bottom.png';

let bird, pipes, frameCount, gameStarted, gameOver, score;

// Khởi tạo game
function resetGame() {
    bird = { x: 50, y: 150, width: 34, height: 24, gravity: 0.2, lift: -4, velocity: 0 };
    pipes = [];
    frameCount = 0;
    gameStarted = false;
    gameOver = false;
    score = 0;
    
    // Bắt đầu phát nhạc nền nếu chưa phát
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.log("Không thể phát nhạc nền:", error);
        });
    }
}

resetGame(); 

//nền
function drawBackground() {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}

//chim
function drawBird() {
    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

//ống
function drawPipes() {
    pipes.forEach(pipe => {
        ctx.drawImage(pipeTopImg, pipe.x, 0, pipe.width, pipe.top);
        ctx.drawImage(pipeBottomImg, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    });
}

//tạo ống
function createPipe() {
    const gap = 160; // Khoảng cách giữa 2 ống
    const minHeight = 70; // Chiều cao tối thiểu của phần trên của ống
    const maxHeight = 200; // Chiều cao tối đa của phần trên của ống

    // Tạo chiều cao ngẫu nhiên cho phần trên của ống trong khoảng từ minHeight đến maxHeight
    const pipeHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        width: 50,
        top: pipeHeight, // Chiều cao phần trên của ống
        bottom: canvas.height - pipeHeight - gap // Chiều cao phần dưới của ống (tính từ phần trên)
    });
}

//vị trí ống
function updatePipes() {
    pipes.forEach(pipe => {
        pipe.x -= 2; // Di chuyển ống sang trái
    });

    // Loại bỏ ống nếu ra khỏi màn hình
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // Thêm ống
    if (frameCount % 100 === 0) {
        createPipe();
    }
}

// Hàm kiểm tra va chạm
function checkCollision() {
    for (let pipe of pipes) {
        
        if (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x && (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) 
        {
            return true;
        }
    }
    // Kiểm tra va chạm với mép ống
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        return true;
    }
    return false;
}

//điểm
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 25);
}

// Vòng lặp
function gameLoop() {
    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    drawBackground();

    if (!gameStarted) {
        // Hiển thị hướng dẫn trước khi bắt đầu
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Nắm tay để bắt đầu!!', 60, canvas.height / 2);

    } else if (gameOver) {
        // Hiển thị điểm
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(`Game Over! Điểm của bạn: ${score}`, 20, canvas.height / 2 - 20);
        ctx.fillText('Nắm tay để chơi lại', 60, canvas.height / 2 + 20);
    } else {
        
        bird.velocity += bird.gravity;

        bird.y += bird.velocity;

        updatePipes();

        // Ghi điểm
        pipes.forEach(pipe => {
            if (pipe.x + pipe.width < bird.x && !pipe.scored) {
                score++;
                pipe.scored = true; 
            }
        });

        // Kiểm tra va chạm
        if (checkCollision()) {
            gameOver = true;
        }

    
        drawBird();
        drawPipes();
        drawScore();

        frameCount++;
    }

    requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop();

// Mediapipe hands
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function isFist(landmarks) {
    const tips = [8, 12, 16, 20]; 
    const palmBase = 6; 

    for (let tip of tips) {
        const tipY = landmarks[tip].y;
        const baseY = landmarks[palmBase].y;

        
        if (tipY < baseY) {
            return false;
        }
    }
    return true;
}


function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                           {color: '#00FF00', lineWidth: 0});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 0});

            if (isFist(landmarks)) {
                console.log("Nắm tay được phát hiện!"); // ktr
                if (!gameStarted && !gameOver) {
                    gameStarted = true;
                } else if (gameOver) {
                    resetGame();
                }
                bird.velocity = bird.lift;
            }
        }
    }
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
    maxNumHands: 1, // Giới hạn chỉ xử lý 1 tay
    modelComplexity: 0, // Đơn giản hóa mô hình
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 800,
    height: 450
});
camera.start();
