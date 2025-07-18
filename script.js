const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 10;
const PLAYER_X = 20;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const PADDLE_SPEED = 7;

// Game state
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 6 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 4 * (Math.random() * 2 - 1);

let playerScore = 0;
let aiScore = 0;

// Control paddle with mouse
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  playerY = mouseY - PADDLE_HEIGHT / 2;
  playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function drawNet() {
  ctx.strokeStyle = '#888';
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawScore() {
  ctx.font = "32px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(playerScore, canvas.width / 4, 40);
  ctx.fillText(aiScore, canvas.width / 4 * 3, 40);
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 6 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 4 * (Math.random() * 2 - 1);
}

function updateAI() {
  // Simple AI follows the ball, but with some smoothing
  const centerAI = aiY + PADDLE_HEIGHT / 2;
  if (centerAI < ballY - 20) {
    aiY += PADDLE_SPEED * 0.8;
  } else if (centerAI > ballY + 20) {
    aiY -= PADDLE_SPEED * 0.8;
  }
  // Clamp
  aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

function updateBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Top and bottom collision
  if (ballY - BALL_RADIUS < 0) {
    ballY = BALL_RADIUS;
    ballSpeedY = -ballSpeedY;
  }
  if (ballY + BALL_RADIUS > canvas.height) {
    ballY = canvas.height - BALL_RADIUS;
    ballSpeedY = -ballSpeedY;
  }

  // Left paddle collision
  if (
    ballX - BALL_RADIUS < PLAYER_X + PADDLE_WIDTH &&
    ballY > playerY &&
    ballY < playerY + PADDLE_HEIGHT
  ) {
    ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS;
    ballSpeedX = -ballSpeedX;

    // Add some spin based on where it hits the paddle
    const hitPoint = (ballY - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    ballSpeedY = 4 * hitPoint;
  }

  // Right paddle collision (AI)
  if (
    ballX + BALL_RADIUS > AI_X &&
    ballY > aiY &&
    ballY < aiY + PADDLE_HEIGHT
  ) {
    ballX = AI_X - BALL_RADIUS;
    ballSpeedX = -ballSpeedX;

    // Add some spin based on where it hits the paddle
    const hitPoint = (ballY - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    ballSpeedY = 4 * hitPoint;
  }

  // Left wall = AI scores
  if (ballX - BALL_RADIUS < 0) {
    aiScore++;
    resetBall();
  }

  // Right wall = player scores
  if (ballX + BALL_RADIUS > canvas.width) {
    playerScore++;
    resetBall();
  }
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Net
  drawNet();

  // Paddles
  drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, "#fff");
  drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, "#fff");

  // Ball
  drawCircle(ballX, ballY, BALL_RADIUS, "#0ff");

  // Score
  drawScore();
}

function gameLoop() {
  updateAI();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();