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


// Difficulty settings
const DIFFICULTY = {
  easy:   { aiSpeed: 0.4, ballSpeedX: 8, ballSpeedY: 6 },
  medium: { aiSpeed: 0.6, ballSpeedX: 12, ballSpeedY: 8 },
  hard:   { aiSpeed: 1.2, ballSpeedX: 16, ballSpeedY: 10 },
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

// serve ball
let isServe = false;
let serveBy = null; // 'player' or 'ai'
let serveTimeout = null;

window.addEventListener('keydown', (e) => {
  if (isServe && serveBy === 'player' && (e.key === 'd' || e.key === 'D')) {
    serveBall('player');
  }
});

// Update resetBall to use difficulty speeds
function resetBall(winner) {
  // Clear any existing timeout
  if (serveTimeout) {
    clearTimeout(serveTimeout);
    serveTimeout = null;
  }

  // Reset ball to center
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  
  // Set serve state
  isServe = true;
  serveBy = winner;

  if (winner === 'ai') {
    // AI serves after a short delay
    aiY = Math.random() * (canvas.height - PADDLE_HEIGHT);
    serveTimeout = setTimeout(() => serveBall('ai'), 1000);
  }
  // Player serves by pressing D
}

function serveBall(who) {
  isServe = false;
  serveBy = null;
  
  // Set ball direction (player serves right, AI serves left)
  const direction = who === 'player' ? 1 : -1;
  ballSpeedX = DIFFICULTY[currentDifficulty].ballSpeedX * direction;
  
  // Add random vertical angle (but not too flat)
  let yRand = (Math.random() * 2 - 1);
  if (Math.abs(yRand) < 0.3) yRand = yRand < 0 ? -0.5 : 0.5;
  ballSpeedY = DIFFICULTY[currentDifficulty].ballSpeedY * yRand;
}

// Modify your scoring logic to use resetBall
// When AI scores:
if (ballX - BALL_RADIUS < 0) {
  aiScore++;
  resetBall('ai'); // AI serves next
}

// When player scores:
if (ballX + BALL_RADIUS > canvas.width) {
  playerScore++;
  resetBall('player'); // Player serves next
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

  // Scoring - MOVED INSIDE THE FUNCTION
  // Left wall = AI scores
  if (ballX - BALL_RADIUS < 0) {
    aiScore++;
    resetBall('ai'); // AI serves next
    return; // Exit early to prevent double scoring
  }

  // Right wall = player scores
  if (ballX + BALL_RADIUS > canvas.width) {
    playerScore++;
    resetBall('player'); // Player serves next
    return; // Exit early to prevent double scoring
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
  ctx.fillStyle = serveBy === 'player' ? '#0f0' : '#f00';
  ctx.beginPath();
  ctx.arc(
    serveBy === 'player' ? PLAYER_X + PADDLE_WIDTH : AI_X, 
    serveBy === 'player' ? playerY + PADDLE_HEIGHT/2 : aiY + PADDLE_HEIGHT/2,
    5, 0, Math.PI * 2
  );
  ctx.fill();
  
  if (serveBy === 'player') {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press D to serve', canvas.width/2, 70);
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