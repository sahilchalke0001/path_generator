const ROWS = 20;
const COLS = 20;
let start = null;
let end = null;
let isSelectingStart = true;
let delay = 50; // Delay between steps in ms

const grid = document.getElementById('grid');

// Initialize the grid
function createGrid() {
    grid.innerHTML = ''; // Clear the grid before initializing
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            grid.appendChild(cell);
        }
    }
}

// Event listener for cell clicks to select start and end points
function handleCellClick(e) {
    const cell = e.target;
    if (cell.classList.contains('wall')) return;

    if (isSelectingStart) {
        if (start) start.classList.remove('start');
        cell.classList.add('start');
        start = cell;
        isSelectingStart = false;
    } else {
        if (end) end.classList.remove('end');
        cell.classList.add('end');
        end = cell;
        isSelectingStart = true;
    }
}

// Generate a random maze
function generateMaze() {
    clearGrid(); // Clear previous maze and grid states
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const random = Math.random();
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (random < 0.3) {
                cell.classList.add('wall');
            }
        }
    }
}

// Clear the entire grid (start, end, walls, paths, etc.)
function clearGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('start', 'end', 'wall', 'path', 'visited');
    });
    start = null;
    end = null;
    isSelectingStart = true;
}

// Clear only the paths and visited cells without affecting the walls or start/end points
function clearPath() {
    const cells = document.querySelectorAll('.cell.path, .cell.visited');
    cells.forEach(cell => {
        cell.classList.remove('path', 'visited');
    });
}

// Delay helper function to slow down the algorithm steps for visualization
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Pathfinding Algorithms with Visualization

// Breadth-First Search (BFS)
async function bfs(start, end) {
    const queue = [start];
    const cameFrom = new Map();
    const visited = new Set();
    visited.add(start);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current === end) {
            await reconstructPath(cameFrom, current);
            return;
        }

        if (current !== start) {  // Keep start green
            current.classList.add('visited');
        }
        await sleep(delay);

        for (let neighbor of getNeighbors(current)) {
            if (!visited.has(neighbor) && !neighbor.classList.contains('wall')) {
                visited.add(neighbor);
                cameFrom.set(neighbor, current);
                queue.push(neighbor);
            }
        }
    }
}

// Depth-First Search (DFS)
async function dfs(start, end) {
    const stack = [start];
    const cameFrom = new Map();
    const visited = new Set();
    visited.add(start);

    while (stack.length > 0) {
        const current = stack.pop();

        if (current === end) {
            await reconstructPath(cameFrom, current);
            return;
        }

        if (current !== start) {  // Keep start green
            current.classList.add('visited');
        }
        await sleep(delay);

        for (let neighbor of getNeighbors(current)) {
            if (!visited.has(neighbor) && !neighbor.classList.contains('wall')) {
                visited.add(neighbor);
                cameFrom.set(neighbor, current);
                stack.push(neighbor);
            }
        }
    }
}

// Dijkstra's Algorithm
async function dijkstra(start, end) {
    const dist = new Map();
    const cameFrom = new Map();
    const pq = [start];
    const visited = new Set();

    dist.set(start, 0);

    while (pq.length > 0) {
        pq.sort((a, b) => dist.get(a) - dist.get(b));
        const current = pq.shift();

        if (current === end) {
            await reconstructPath(cameFrom, current);
            return;
        }

        if (current !== start) {  // Keep start green
            current.classList.add('visited');
        }
        await sleep(delay);

        visited.add(current);

        for (let neighbor of getNeighbors(current)) {
            if (neighbor.classList.contains('wall') || visited.has(neighbor)) continue;

            const alt = dist.get(current) + 1;
            if (alt < (dist.get(neighbor) || Infinity)) {
                dist.set(neighbor, alt);
                cameFrom.set(neighbor, current);
                pq.push(neighbor);
            }
        }
    }
}

// A* Algorithm
async function aStar(start, end) {
    const openSet = [start];
    const closedSet = [];
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();
    gScore.set(start, 0);
    fScore.set(start, heuristic(start, end));

    while (openSet.length > 0) {
        let current = openSet.reduce((acc, cell) => (fScore.get(cell) < fScore.get(acc) ? cell : acc));

        if (current === end) {
            await reconstructPath(cameFrom, current);
            return;
        }

        if (current !== start) {  // Keep start green
            current.classList.add('visited');
        }
        await sleep(delay);

        openSet.splice(openSet.indexOf(current), 1);
        closedSet.push(current);

        for (let neighbor of getNeighbors(current)) {
            if (closedSet.includes(neighbor) || neighbor.classList.contains('wall')) continue;

            let tentativeGScore = gScore.get(current) + 1;

            if (!openSet.includes(neighbor)) openSet.push(neighbor);
            else if (tentativeGScore >= gScore.get(neighbor)) continue;

            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, gScore.get(neighbor) + heuristic(neighbor, end));
        }
    }
}

// Heuristic for A* Algorithm (Manhattan Distance)
function heuristic(a, b) {
    const aRow = parseInt(a.dataset.row);
    const aCol = parseInt(a.dataset.col);
    const bRow = parseInt(b.dataset.row);
    const bCol = parseInt(b.dataset.col);
    return Math.abs(aRow - bRow) + Math.abs(aCol - bCol);
}

// Get neighboring cells
function getNeighbors(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const neighbors = [];

    if (row > 0) neighbors.push(document.querySelector(`[data-row="${row - 1}"][data-col="${col}"]`));
    if (row < ROWS - 1) neighbors.push(document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`));
    if (col > 0) neighbors.push(document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`));
    if (col < COLS - 1) neighbors.push(document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`));

    return neighbors;
}

// Reconstruct and visualize the path after an algorithm completes
async function reconstructPath(cameFrom, current) {
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        current.classList.remove('visited');
        current.classList.add('path');
        await sleep(delay);
    }
}

// Event Listeners
document.getElementById('generateMaze').addEventListener('click', generateMaze);
document.getElementById('clearMaze').addEventListener('click', clearGrid);
document.getElementById('visualizePath').addEventListener('click', async () => {
    if (start && end) {
        const algorithm = document.getElementById('algorithm').value;
        clearPath(); // Clear previous paths

        if (algorithm === 'aStar') {
            await aStar(start, end);
        } else if (algorithm === 'bfs') {
            await bfs(start, end);
        } else if (algorithm === 'dfs') {
            await dfs(start, end);
        } else if (algorithm === 'dijkstra') {
            await dijkstra(start, end);
        }
    } else {
        alert('Please select both a start and an end point.');
    }
});

// Initialize the grid on page load
createGrid();
