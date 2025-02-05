// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

let numBoids = 100;
let visualRange = 30;
let rangeSquared = visualRange * visualRange;

var boids = [];

let speed = 5;
let noise = 140;

const gridSize = 180;
let grid = [];

function initBoids() {
  for (var i = 0; i < numBoids; i += 1) {
    let angle = Math.random() * Math.PI * 2
    let dx = Math.cos(angle) * speed
    let dy = Math.sin(angle) * speed
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: dx,
      dy: dy,
      newdx: dx,
      newdy: dy,
      history: [],
    };
  }
}


function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight - 80;
  canvas.width = width;
  canvas.height = height;
}
function keepWithinBounds(boid) {
  if (boid.x < 0) {
    boid.x += width;
  }
  if (boid.x > width) {
    boid.x -= width
  }
  if (boid.y < 0) {
    boid.y += height
  }
  if (boid.y > height) {
    boid.y -= height
  }
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function getCellIndex(x, y) {
  const i = Math.floor((x / width) * gridSize);
  const j = Math.floor((y / height) * gridSize);
  return (i % gridSize) + (j % gridSize) * gridSize;
}

function updateGrid() {
  for (let i = 0; i < grid.length; i++) {
    grid[i].length = 0;
  }
  for (let boid of boids) {
    let cellIndex = getCellIndex(boid.x, boid.y);
    grid[cellIndex].push(boid);
  }
}

function getNeighbors(boid) {
  let neighbors = [];
  const i = Math.floor((boid.x / width) * gridSize);
  const j = Math.floor((boid.y / height) * gridSize);

  const wChunks = Math.ceil(visualRange * gridSize / width)
  const lChunks = Math.ceil(visualRange * gridSize / height)

  for (let di = -wChunks; di <= wChunks; di++) {
    for (let dj = -lChunks; dj <= lChunks; dj++) {
      const ni = (i + di + gridSize) % gridSize;
      const nj = (j + dj + gridSize) % gridSize;
      const cellIndex = ni + nj * gridSize;
      if (grid[cellIndex]) {
        neighbors = neighbors.concat(grid[cellIndex]);
      }
    }
  }
  return neighbors;
}

function matchDirection(boid) {
  let avgDX = 0, avgDY = 0, numNeighbors = 0;
  const neighbors = getNeighbors(boid);

  for (let other of neighbors) {
    let dx = boid.x - other.x;
    let dy = boid.y - other.y;
    dx -= width * Math.round(dx / width);
    dy -= height * Math.round(dy / height);
    if (dx * dx + dy * dy < rangeSquared) {
      avgDX += other.dx;
      avgDY += other.dy;
      numNeighbors++;
    }
  }

  if (numNeighbors) {
    avgDX /= numNeighbors;
    avgDY /= numNeighbors;
    let angle = avgDX || avgDY ? Math.atan2(avgDY, avgDX) : Math.random() * Math.PI * 2;
    boid.newdx = Math.cos(angle) * speed;
    boid.newdy = Math.sin(angle) * speed;
  }
}

function addNoise(boid) {
  const noiseRadians = noise * Math.PI / 180

  angle = Math.atan2(boid.dy, boid.dx);
  angle = mod(angle + Math.random() * noiseRadians - noiseRadians / 2, 2 * Math.PI)
  boid.dx = Math.cos(angle) * speed
  boid.dy = Math.sin(angle) * speed
}

let DRAW_TRAIL = false;

function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#558cf477";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (DRAW_TRAIL) {
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    let x = boid.history[0][0]
    let y = boid.history[0][1]
    for (const point of boid.history) {
      if (Math.abs(x - point[0]) < width / 2 && Math.abs(y - point[1]) < height / 2) {
        ctx.lineTo(point[0], point[1]);
      } else {
        ctx.moveTo(point[0], point[1]);
      }
      x = point[0]
      y = point[1]
    }

    ctx.stroke();
  }
}


function animationLoop() {
  for (let boid of boids) {
    matchDirection(boid);
  }
  for (let boid of boids) {
    boid.dx = boid.newdx
    boid.dy = boid.newdy
  }

  for (let boid of boids) {
    addNoise(boid)

    boid.x += boid.dx;
    boid.y += boid.dy;
    keepWithinBounds(boid);
    boid.history.push([boid.x, boid.y])
    boid.history = boid.history.slice(-50);
  }
  updateGrid()

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  let calc = 0;
  let totalX = 0;
  let totalY = 0;
  for (let boid of boids) {
    totalX += boid.dx;
    totalY += boid.dy;
  }

  const calcValue = document.getElementById("calcValue")
  calc = Math.sqrt(totalX * totalX + totalY * totalY) / numBoids / speed
  calcValue.innerHTML = calc.toString().substring(0, 5)

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);

  grid = Array.from({ length: gridSize * gridSize }, () => []);


  let form = document.getElementById('numberForm');
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const numberValue = document.getElementById('number').value;

    console.log('Number entered:', numberValue);
    numBoids = numberValue;
    boids = []
    initBoids();
    console.log(boids.length)
  });

  form = document.getElementById('speedForm');
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const speedValue = document.getElementById('speed').value;
    speed = speedValue;
  });

  form = document.getElementById('rangeForm');
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const rangeValue = document.getElementById('range').value;
    visualRange = rangeValue;
    rangeSquared = visualRange * visualRange
  });

  form = document.getElementById('noiseForm');
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const noiseValue = document.getElementById('noise').value;

    noise = noiseValue;
  });

  toggle = document.getElementById('toggle');
  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    DRAW_TRAIL = !DRAW_TRAIL
  });

  reset = document.getElementById('reset');
  reset.addEventListener('click', function (event) {
    event.preventDefault();
    boids = []
    initBoids();
  });
};
