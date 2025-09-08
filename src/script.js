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

// Serve aiming variables
let servePosition = 0.5; // 0 to 1 representing position along paddle
const SERVE_SPEED = 3; // How fast the serve position moves with arrow keys

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

// Difficulty settings
const DIFFICULTY = {
  easy: { aiSpeed: 0.4, ballSpeedX: 8, ballSpeedY: 6 },
  medium: { aiSpeed: 0.6, ballSpeedX: 12, ballSpeedY: 8 },
  hard: { aiSpeed: 1.2, ballSpeedX: 16, ballSpeedY: 10 },
  impossible: { aiSpeed: 2, ballSpeedX: 25, ballSpeedY: 25 }
};

let currentDifficulty = 'easy';

// Listen for difficulty button clicks
const difficultyButtons = ['easy', 'medium', 'hard', 'impossible'].map(difficulty => document.getElementById(difficulty)).filter(Boolean);
function updateActiveDifficultyButton() {
  difficultyButtons.forEach(btn => {
    if (btn.id === currentDifficulty) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
['easy', 'medium', 'hard', 'impossible'].forEach(difficulty => {
  const btn = document.getElementById(difficulty);
  if (btn) {
    btn.addEventListener('click', () => {
      currentDifficulty = difficulty;
      // Reset ball speed immediately when difficulty changes
      ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * (Math.random() > 0.5 ? 1 : -1);
      ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * (Math.random() * 2 - 1);
      updateActiveDifficultyButton();
    });
  }
});
// Set initial active button
updateActiveDifficultyButton();

// Set initial ball speed based on difficulty
ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * (Math.random() > 0.5 ? 1 : -1);
ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * (Math.random() * 2 - 1);

function updateAI() {
  // AI follows the ball, speed based on difficulty
  const centerAI = aiY + PADDLE_HEIGHT / 2;
  const aiSpeed = PADDLE_SPEED * DIFFICULTY[currentDifficulty].aiSpeed;
  if (centerAI < ballY - 20) {
    aiY += aiSpeed;
  } else if (centerAI > ballY + 20) {
    aiY -= aiSpeed;
  }
  // Clamp
  aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

// Serve state variables
let isServe = false;
let serveBy = null; // 'player' or 'ai'
let serveTimeout = null;

// Serve control with arrow keys and D
window.addEventListener('keydown', (e) => {
  if (isServe && serveBy === 'player') {
    if (e.key === 'ArrowUp') {
      servePosition = Math.max(0, servePosition - 0.05);
    } else if (e.key === 'ArrowDown') {
      servePosition = Math.min(1, servePosition + 0.05);
    } else if (e.key === 'd' || e.key === 'D') {
      serveBall('player');
    }
  }
});


function resetBall(winner) {
  // Clear any existing timeout
  if (serveTimeout) {
    clearTimeout(serveTimeout);
    serveTimeout = null;
  }

  // Reset ball to winner
  if (winner === 'ai') {
    ballX = canvas.width / 1.1;
    ballY = canvas.height / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
  } else {
    ballX = canvas.width / 12;
    ballY = canvas.height / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
  }

  // Reset serve position to middle
  servePosition = 0.5;

  // Set serve state
  isServe = true;
  serveBy = winner;

  if (winner === 'ai') {
    // AI serves after a short delay
    aiY = Math.random() * (canvas.height - PADDLE_HEIGHT);
    serveTimeout = setTimeout(() => serveBall('ai'), 1000);
  }
}

function serveBall(who) {
  isServe = false;
  serveBy = null;

  // Set ball direction (player serves right, AI serves left)
  const direction = who === 'player' ? 1 : -1;
  ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * direction;

  // Calculate exact trajectory based on crosshair position
  if (who === 'player') {
    const targetY = playerY + PADDLE_HEIGHT * servePosition;
    const deltaY = targetY - (playerY + PADDLE_HEIGHT / 2);

    // Calculate angle based on position (more extreme near edges)
    const angleFactor = deltaY / (PADDLE_HEIGHT / 2); // -1 to 1

    // Apply non-linear curve for more control near center
    const curvedFactor = Math.sign(angleFactor) * Math.pow(Math.abs(angleFactor), 1.5);

    ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * curvedFactor * 2;
  } else {
    // AI serves randomly (keep original AI serve logic)
    let yRand = (Math.random() * 2 - 1);
    if (Math.abs(yRand) < 0.3) yRand = yRand < 0 ? -0.5 : 0.5;
    ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * yRand;
  }
}

function updateBall() {
  if (isServe) return; // Don't move ball during serve

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
    ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * (ballSpeedX > 0 ? 1 : -1) * -1;
    const hitPoint = (ballY - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * hitPoint;
  }

  // Right paddle collision (AI)
  if (
    ballX + BALL_RADIUS > AI_X &&
    ballY > aiY &&
    ballY < aiY + PADDLE_HEIGHT
  ) {
    ballX = AI_X - BALL_RADIUS;
    ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * (ballSpeedX > 0 ? 1 : -1) * -1;
    const hitPoint = (ballY - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * hitPoint;
  }

  // Scoring
  if (ballX - BALL_RADIUS < 0) {
    aiScore++;
    resetBall('ai');
    return;
  }

  if (ballX + BALL_RADIUS > canvas.width) {
    playerScore++;
    resetBall('player');
    return;
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

  if (isServe) {
    // Draw serve indicator
    const serveY = serveBy === 'player' ?
      playerY + PADDLE_HEIGHT * servePosition :
      aiY + PADDLE_HEIGHT / 2;

    ctx.fillStyle = serveBy === 'player' ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.arc(
      serveBy === 'player' ? PLAYER_X + PADDLE_WIDTH : AI_X,
      serveY,
      5, 0, Math.PI * 2
    );
    ctx.fill();

    if (serveBy === 'player') {
      // Draw crosshair at predicted landing point
      const targetY = playerY + PADDLE_HEIGHT * servePosition;
      const deltaY = targetY - (playerY + PADDLE_HEIGHT / 2);
      const curvedFactor = Math.sign(deltaY) * Math.pow(Math.abs(deltaY) / (PADDLE_HEIGHT / 2), 1.5);
      const predictedY = canvas.height / 2 + (canvas.height * curvedFactor * 0.8);

      // Draw crosshair at predicted position
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 20, predictedY - 15);
      ctx.lineTo(canvas.width - 20, predictedY + 15);
      ctx.moveTo(canvas.width - 30, predictedY);
      ctx.lineTo(canvas.width - 10, predictedY);
      ctx.stroke();

      // Draw aiming line
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PLAYER_X + PADDLE_WIDTH, targetY);
      ctx.lineTo(canvas.width - 20, predictedY);
      ctx.stroke();

      // Draw serve position marker on paddle
      ctx.fillStyle = '#0f0';
      ctx.fillRect(
        PLAYER_X - 10,
        playerY + PADDLE_HEIGHT * servePosition - 2,
        5,
        4
      );

      // Draw instructions
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Press D to serve', canvas.width / 2, 70);
      ctx.fillText('Use ↑↓ to aim', canvas.width / 2, 100);
    }
  }
}

function gameLoop() {
  updateAI();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start the game
resetBall(Math.random() > 0.5 ? 'player' : 'ai'); // Random first serve
gameLoop();