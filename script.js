import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard);
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
setupInputOnce();

document.getElementById("game-board").addEventListener("touchstart", handleTouchStart, false);
document.getElementById("game-board").addEventListener("touchmove", handleTouchMove, false);

let xDown = null, yDown = null;

// Фиксируем изначальные координаты прикосновения
function handleTouchStart(evt) {
  const { clientX, clientY } = evt.touches[0];
  xDown = clientX; yDown = clientY;
}



// Отслеживаем движение пальца и определяем направление свайпа
function handleTouchMove(evt) {
  if (!xDown || !yDown) {
    return; // Если изначальные координаты не зафиксированы, прекращаем выполнение
  }

  const { clientX, clientY } = evt.touches[0];

  const xDiff = xDown - clientX;
  const yDiff = yDown - clientY;

  // Вычисляем, был ли свайп выполнен по горизонтали или вертикали
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    xDiff > 0 ? window.dispatchEvent(new CustomEvent("vector", { detail: { move: "left" } })) : window.dispatchEvent(new CustomEvent("vector", { detail: { move: "right" } }));
  } else {
    yDiff > 0 ? window.dispatchEvent(new CustomEvent("vector", { detail: { move: "up" } })) : window.dispatchEvent(new CustomEvent("vector", { detail: { move: "down" } }));
  }

  // Обнуляем координатыhiuhhiugkji после распознавания свайпа
  xDown = yDown = null;
}

function setupInputOnce() {
  window.addEventListener("keydown", handleInput, { once: true });
  window.addEventListener("vector", vectorInput());
}

function gameOver() {
  document.getElementById("gameover").style.setProperty("visibility", "visible");
}

async function handleInput(event) {
  switch (event.detail.move) {
    case "up":
      alert("up");
      if (!canMoveUp()) {
        setupInputOnce();
        return;
      }
      await moveUp();
      break;
    case "down":
      alert("down");
      if (!canMoveDown()) {
        setupInputOnce();
        return;
      }
      await moveDown();
      break;
    case "left":
      alert("left");
      if (!canMoveLeft()) {
        setupInputOnce();
        return;
      }
      await moveLeft();
      break;
    case "right":
      alert("right");
      if (!canMoveRight()) {
        setupInputOnce();
        return;
      }
      await moveRight();
      break;
    default:
      setupInputOnce();
      return;
  }

  const newTile = new Tile(gameBoard);
  grid.getRandomEmptyCell().linkTile(newTile);

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    await newTile.waitForAnimationEnd();
    /*Insert gameover*/
    gameOver();
    return;

  }

  setupInputOnce();
}

function vectorInput(e) {
  switch (e) {
    case "up":
      if (!canMoveUp()) {
        setupInputOnce();
        alert("rabotaet ubl");
        return;
      }
      moveUp();
      break;
    case "down":
      if (!canMoveDown()) {
        setupInputOnce();
        return;
      }
      moveDown();
      break;
    case "left":
      if (!canMoveLeft()) {
        setupInputOnce();
        return;
      }
      moveLeft();
      break;
      case "right":
      if (!canMoveRight()) {
        setupInputOnce();
        return;
      }
      await moveRight();
      break;
    default:
      setupInputOnce();
      return;
  }

  const newTile = new Tile(gameBoard);
  grid.getRandomEmptyCell().linkTile(newTile);

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    await newTile.waitForAnimationEnd();
    /*Insert gameover*/
    gameOver();
    return;

  }

  setupInputOnce();
}

async function moveUp() {
  await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() {
  await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft() {
  await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight() {
  await slideTiles(grid.cellsGroupedByReversedRow);
}

async function slideTiles(groupedCells) {
  const promises = [];

  groupedCells.forEach(group => slideTilesInGroup(group, promises));

  await Promise.all(promises);
  grid.cells.forEach(cell => {
    cell.hasTileForMerge() && cell.mergeTiles()
  });
}

function slideTilesInGroup(group, promises) {
  for (let i = 1; i < group.length; i++) {
    if (group[i].isEmpty()) {
      continue;
    }

    const cellWithTile = group[i];

    let targetCell;
    let j = i - 1;
    while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
      targetCell = group[j];
      j--;
    }

    if (!targetCell) {
      continue;
    }

    promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

    if (targetCell.isEmpty()) {
      targetCell.linkTile(cellWithTile.linkedTile);
    } else {
      targetCell.linkTileForMerge(cellWithTile.linkedTile);
    }

    cellWithTile.unlinkTile();
  }
}

function canMoveUp() {
  return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveLeft() {
  return canMove(grid.cellsGroupedByRow);
}

function canMoveRight() {
  return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCells) {
  return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) {
  return group.some((cell, index) => {
    if (index === 0) {
      return false;
    }

    if (cell.isEmpty()) {
      return false;
    }

    const targetCell = group[index - 1];
    return targetCell.canAccept(cell.linkedTile);
  });
}