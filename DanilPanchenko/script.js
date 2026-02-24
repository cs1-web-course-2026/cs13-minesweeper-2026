
document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('proportion-form');
	const aInput = document.getElementById('a');
	const bInput = document.getElementById('b');
	const cInput = document.getElementById('c');
	const xInput = document.getElementById('x');

	form.addEventListener('submit', function(e) {
		e.preventDefault();
		const a = parseFloat(aInput.value);
		const b = parseFloat(bInput.value);
		const c = parseFloat(cInput.value);
		if (a === 0) {
			xInput.value = 'Ділення на 0!';
			return;
		}
		const x = (b * c) / a;
		xInput.value = x;
	});
});

let rows, cols, mines, board = [], gameOver = false;

function startGame(r, c, m) {
	rows = r;
	cols = c;
	mines = m;
	board = [];
	gameOver = false;
	document.getElementById("status").innerHTML = "";
	const game = document.getElementById("game");
	game.innerHTML = "";
	game.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
	for (let i = 0; i < rows; i++) {
		board[i] = [];
		for (let j = 0; j < cols; j++) {
			board[i][j] = { mine: false, revealed: false, count: 0 };
		}
	}
	let placed = 0;
	while (placed < mines) {
		let r = Math.floor(Math.random() * rows);
		let c = Math.floor(Math.random() * cols);
		if (!board[r][c].mine) {
			board[r][c].mine = true;
			placed++;
		}
	}
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (board[i][j].mine) continue;
			let count = 0;
			for (let x = -1; x <= 1; x++) {
				for (let y = -1; y <= 1; y++) {
					let ni = i + x, nj = j + y;
					if (ni >= 0 && nj >= 0 && ni < rows && nj < cols && board[ni][nj].mine) count++;
				}
			}
			board[i][j].count = count;
		}
	}
	render();
}

function render() {
	const game = document.getElementById("game");
	game.innerHTML = "";
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			const cell = document.createElement("div");
			cell.classList.add("cell");
			cell.onclick = () => reveal(i, j, cell);
			// Додаємо прапорець правою кнопкою
			cell.oncontextmenu = (e) => {
				e.preventDefault();
				toggleFlag(i, j, cell);
			};
			game.appendChild(cell);
		}
	}
}
// Додаємо прапорці
function toggleFlag(i, j, el) {
	if (gameOver || board[i][j].revealed) return;
	if (!board[i][j].flagged) {
		board[i][j].flagged = true;
		el.innerText = "🚩";
		el.classList.add("flagged");
	} else {
		board[i][j].flagged = false;
		el.innerText = "";
		el.classList.remove("flagged");
	}
}

function reveal(i, j, el) {
	if (gameOver || board[i][j].revealed || board[i][j].flagged) return;
	board[i][j].revealed = true;
	el.classList.add("revealed");
	if (board[i][j].mine) {
		el.classList.add("mine");
		el.innerText = "💣";
		gameOver = true;
		document.getElementById("status").innerHTML = '<div class="lose">💥 Ви програли!</div>' +
			'<button id="retryBtn" class="retry-btn">Спробувати ще раз</button>';
		document.getElementById("retryBtn").onclick = function() {
			startGame(rows, cols, mines);
		};
		revealAll();
		return;
	}
	if (board[i][j].count > 0) {
		el.innerText = board[i][j].count;
	} else {
		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				let ni = i + x, nj = j + y;
				if (ni >= 0 && nj >= 0 && ni < rows && nj < cols) {
					const index = ni * cols + nj;
					const next = document.getElementsByClassName("cell")[index];
					if (!board[ni][nj].revealed) reveal(ni, nj, next);
				}
			}
		}
	}
	checkWin();
}

function revealAll() {
	const cells = document.getElementsByClassName("cell");
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (board[i][j].mine) {
				const index = i * cols + j;
				cells[index].classList.add("mine");
				cells[index].innerText = "💣";
			}
		}
	}
}

function checkWin() {
	let safe = 0;
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (!board[i][j].mine && board[i][j].revealed) safe++;
		}
	}
	if (safe === rows * cols - mines) {
		gameOver = true;
		document.getElementById("status").innerHTML = '<div class="win">🏆 Ви перемогли!</div>';
		revealAll();
	}
}

// Запуск по умолчанию
startGame(8,8,10);
