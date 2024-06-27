import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

vkBridge.send("VKWebAppInit", {});
const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard);
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
setupInputOnce();

document
  .getElementById("game-board")
  .addEventListener("touchstart", handleTouchStart, false);
document
  .getElementById("game-board")
  .addEventListener("touchmove", handleTouchMove, false);

let xDown = null,
  yDown = null;

function handleTouchStart(evt) {
  const { clientX, clientY } = evt.touches[0];
  xDown = clientX;
  yDown = clientY;
}

checkReklama();

function handleTouchMove(evt) {
  if (!xDown || !yDown) {
    return; 
  }

  const { clientX, clientY } = evt.touches[0];

  const xDiff = xDown - clientX;
  const yDiff = yDown - clientY;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    xDiff > 0
      ? document
          .getElementById("game-board")
          .dispatchEvent(
            new CustomEvent("vector", { detail: { move: "left" } })
          )
      : document
          .getElementById("game-board")
          .dispatchEvent(
            new CustomEvent("vector", { detail: { move: "right" } })
          );
  } else {
    yDiff > 0
      ? document
          .getElementById("game-board")
          .dispatchEvent(new CustomEvent("vector", { detail: { move: "up" } }))
      : document
          .getElementById("game-board")
          .dispatchEvent(
            new CustomEvent("vector", { detail: { move: "down" } })
          );
  }

  xDown = yDown = null;
}

function setupInputOnce() {
  console.log("Вызов setupInputOnce");
  window.addEventListener("keydown", handleInput, { once: true });
  window.addEventListener(
    "vector",
    (e) => {
      var vmove = e.detail.move;
      vectorInput(vmove);
    },
    { once: true }
  );
}

function gameOver() {
  document
    .getElementById("gameover")
    .style.setProperty("visibility", "visible");
}

async function handleInput(event) {
  switch (event.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInputOnce();

        return;
      }
      await moveUp();

      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInputOnce();

        return;
      }
      await moveDown();

      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInputOnce();

        return;
      }
      await moveLeft();

      break;
    case "ArrowRight":
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
    console.log("Не могу двигаться");
    await newTile.waitForAnimationEnd();
    gameOver();
    return;
  }

  setupInputOnce();
}

async function vectorInput(vmove) {
  switch (vmove) {
    case "up":
      if (!canMoveUp()) {
        setupInputOnce();

        return;
      }
      await moveUp();
      break;
    case "down":
      if (!canMoveDown()) {
        setupInputOnce();

        return;
      }
      await moveDown();
      break;
    case "left":
      if (!canMoveLeft()) {
        setupInputOnce();

        return;
      }
      await moveLeft();
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
    console.log("Не можем двигаться");
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
  console.log("Вызов slideTiles");
  const promises = [];

  groupedCells.forEach((group) => slideTilesInGroup(group, promises));

  await Promise.all(promises);
  grid.cells.forEach((cell) => {
    cell.hasTileForMerge() && cell.mergeTiles();
  });
}

function slideTilesInGroup(group, promises) {
  console.log("Вызов slideTilesInGroup");
  
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
  return groupedCells.some((group) => canMoveInGroup(group));
}

function canMoveInGroup(group) {
  console.log("Вызов canMoveInGroup");

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
