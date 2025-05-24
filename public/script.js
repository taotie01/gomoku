// 五子棋游戏 - 再次点击确认版
const audio = document.getElementById("background_music");
const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
// 全局变量（以15x15棋盘为例，有16×16个交叉点）

let BOARD_SIZE = 19; // 交叉点数量 = 棋盘尺寸 + 1
let GRID_SIZE; // 动态计算格子大小
let board = [];
let currentPlayer = 1; // 1为黑棋，2为白棋
let gameOver = false;
let moveHistory = []; // 记录每一步棋的历史
const BOARD_MARGIN = 1; // 棋盘边距比例
let isAIEnabled = false; // AI是否启用
let AIDelay = 500; // AI思考延迟（毫秒）
let clickTimer = null; // 点击计时器（用于防抖）
const CLICK_DEBOUNCE_TIME = 300; // 防抖时间（毫秒）
// 修改按钮点击事件（假设按钮的id为"boardSizeBtn"）
const boardSizeBtn = document.getElementById("change");
boardSizeBtn.addEventListener("click", openSizePopup);

// 新增弹窗相关函数
function openSizePopup() {
  const popup = document.getElementById("sizePopup");
  const overlay = document.getElementById("sizeOverlay");
  if (popup && overlay) {
    popup.style.display = "block";
    overlay.style.display = "block";
  }
}

function closeSizePopup() {
  console.log("当前选择的棋盘尺寸：", BOARD_SIZE); // 新增日志
  const popup = document.getElementById("sizePopup");
  const overlay = document.getElementById("sizeOverlay");
  if (popup && overlay) {
    popup.style.display = "none";
    overlay.style.display = "none";
  }
  initBoard(); // 初始化棋盘
  resizeCanvas(); // 重新计算尺寸
}

// 尺寸选项点击处理
document.addEventListener("click", (e) => {
  // 点击尺寸选项时处理
  if (e.target.classList.contains("size-option")) {
    const selectedSize = parseInt(e.target.dataset.size);
    if (selectedSize) {
      // 确保获取到有效尺寸
      BOARD_SIZE = selectedSize; // 更新全局尺寸
      closeSizePopup(); // 关闭弹窗
      initBoard(); // 初始化新尺寸棋盘
      resizeCanvas(); // 重新计算尺寸并绘制
    }
  }
  // 点击取消按钮或遮罩层时关闭弹窗
  else if (e.target.id === "closeSizePopup" || e.target.id === "sizeOverlay") {
    closeSizePopup();
  }
});

// 设置自适应尺寸
function resizeCanvas() {
  const minDimension = Math.min(
    window.innerWidth * 0.9,
    window.innerHeight * 0.9
  );
  // 计算间隔数（交叉点数量 - 1）
  const intervalCount = BOARD_SIZE - 1;
  GRID_SIZE = Math.floor(minDimension / (intervalCount + BOARD_MARGIN * 2));
  canvas.width = GRID_SIZE * (intervalCount + BOARD_MARGIN * 2);
  canvas.height = GRID_SIZE * (intervalCount + BOARD_MARGIN * 2);
  drawBoard();
  music();
}

//背景音乐
function music() {
  // 设置音量为50%
  audio.volume = 0.5;
  // 在页面加载完毕后播放音乐
  window.onload = function () {
    audio.play();
  };
}
// 控制播放、暂停和重置的按钮
function pauseMusic() {
  audio.pause();
}
function playMusic() {
  audio.loop = true;
  audio.play();
}
function resetMusic() {
  audio.load();
}

// 初始化棋盘
function initBoard() {
  board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(0));
  gameOver = false;
  currentPlayer = 1;
  status.textContent = "当前玩家：黑棋";
  moveHistory = []; // 清空历史记录
  hideWinPopup(); // 确保隐藏弹窗
  drawBoard();
}

// 更新状态文本
function updateStatus() {
  if (gameOver) {
    status.textContent = `${currentPlayer === 1 ? "黑棋" : "白棋"} 胜利！`;
    showWinPopup(); // 显示胜利弹窗
  } else if (isAIEnabled && currentPlayer === 2) {
    status.textContent = "电脑思考中...";
    setTimeout(makeAIMove, AIDelay);
  } else {
    status.textContent = `当前玩家：${currentPlayer === 1 ? "黑棋" : "白棋"}${
      isAIEnabled && currentPlayer === 1 ? "（你）" : ""
    }`; //${selectedPiece ? " - 点击确认落子" : ""}
  }
}

// 绘制棋盘
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 绘制网格线
  ctx.strokeStyle = "#333"; // 深色线条
  ctx.lineWidth = 1;
  // 绘制网格线（从0到BOARD_SIZE，共 BOARD_SIZE+1 条线）
  for (let i = 0; i < BOARD_SIZE; i++) {
    // 垂直线
    ctx.beginPath();
    ctx.moveTo(
      GRID_SIZE * BOARD_MARGIN + i * GRID_SIZE,
      GRID_SIZE * BOARD_MARGIN
    );
    ctx.lineTo(
      GRID_SIZE * BOARD_MARGIN + i * GRID_SIZE,
      canvas.height - GRID_SIZE * BOARD_MARGIN
    );
    ctx.stroke();

    // 水平线
    ctx.beginPath();
    ctx.moveTo(
      GRID_SIZE * BOARD_MARGIN,
      GRID_SIZE * BOARD_MARGIN + i * GRID_SIZE
    );
    ctx.lineTo(
      canvas.width - GRID_SIZE * BOARD_MARGIN,
      GRID_SIZE * BOARD_MARGIN + i * GRID_SIZE
    );
    ctx.stroke();
  }

  // // 绘制中心点和角点（传统棋盘标记）
  // const points = [
  //   [3, 3],
  //   [3, 15],
  //   [15, 3],
  //   [15, 15],
  //   [9, 9], // 四个角落和中心
  // ];
  ctx.fillStyle = "#333";
  const starPoints = getStarPoints(BOARD_SIZE);

  starPoints.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(
      GRID_SIZE * BOARD_MARGIN + y * GRID_SIZE,
      GRID_SIZE * BOARD_MARGIN + x * GRID_SIZE,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  // 绘制棋子
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 1) {
        drawPiece(i, j, "#000000"); // 黑棋
      } else if (board[i][j] === 2) {
        drawPiece(i, j, "#ffffff"); // 白棋
      }
    }
  }

  // // 绘制预览棋子
  // if (previewPiece && !gameOver && (isAIEnabled ? currentPlayer === 1 : true)) {
  //   drawPreviewPiece(
  //     previewPiece.x,
  //     previewPiece.y,
  //     currentPlayer === 1 ? "#000000" : "#ffffff"
  //   );
  // }
}

// 新增星位计算函数（根据标准五子棋星位规则）
function getStarPoints(size) {
  const points = [];
  if (size >= 9) {
    // 至少9x9才绘制中心星位
    points.push([Math.floor(size / 2), Math.floor(size / 2)]); // 中心
  }
  if (size >= 13) {
    // 13x13及以上添加四角星位
    points.push([3, 3], [3, size - 4], [size - 4, 3], [size - 4, size - 4]);
  }
  return points;
}

// 绘制棋子
function drawPiece(x, y, color) {
  const centerX = GRID_SIZE * BOARD_MARGIN + y * GRID_SIZE;
  const centerY = GRID_SIZE * BOARD_MARGIN + x * GRID_SIZE;

  ctx.beginPath();
  ctx.arc(centerX, centerY, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 添加立体效果
  if (color === "#fff") {
    ctx.beginPath();
    ctx.arc(centerX, centerY, GRID_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.stroke();
  }
}

// 绘制预览棋子（半透明）
function drawPreviewPiece(x, y, color) {
  const centerX = GRID_SIZE * BOARD_MARGIN + y * GRID_SIZE;
  const centerY = GRID_SIZE * BOARD_MARGIN + x * GRID_SIZE;
  ctx.beginPath();
  ctx.arc(centerX, centerY, GRID_SIZE / 2 - 2, 0, Math.PI * 2);

  // 设置半透明颜色
  const alpha = color === "#000" ? "40" : "60"; // 黑色和白色的不同透明度
  ctx.fillStyle = color + alpha;
  ctx.fill();

  ctx.strokeStyle = color === "#000" ? "#666" : "#999";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 计算鼠标/触摸点对应的棋盘位置
function getBoardPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / GRID_SIZE;
  const y = (clientY - rect.top) / GRID_SIZE;

  // 找到最近的交叉点
  const gridX = Math.round(x - BOARD_MARGIN);
  const gridY = Math.round(y - BOARD_MARGIN);
  // // 检查坐标是否有效
  // if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
  //   console.log(
  //     `点击位置: (${clientX}, ${clientY}) → 棋盘坐标: (${gridY}, ${gridX})`
  //   );
  //   return { x: gridY, y: gridX };
  // }
  // // 计算距离，判断是否在有效范围内
  // const distance = Math.sqrt(
  //   Math.pow(x - (gridX + BOARD_MARGIN), 2) +
  //     Math.pow(y - (gridY + BOARD_MARGIN), 2)
  // );

  // // 如果距离太远，返回null
  // if (distance > 0.5) {
  //   return null;
  // }

  // 检查是否在棋盘范围内
  if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
    return { x: gridY, y: gridX }; // 注意：返回的是棋盘数组索引
  }

  return null;
}

// 检查胜利
function checkWin(x, y) {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  const player = board[x][y];

  for (let [dx, dy] of directions) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const newX = x + dx * i;
      const newY = y + dy * i;
      if (
        newX >= 0 &&
        newX < BOARD_SIZE &&
        newY >= 0 &&
        newY < BOARD_SIZE &&
        board[newX][newY] === player
      ) {
        count++;
      } else break;
    }
    //反向检查
    for (let i = 1; i < 5; i++) {
      const newX = x - dx * i;
      const newY = y - dy * i;
      if (
        newX >= 0 &&
        newX < BOARD_SIZE &&
        newY >= 0 &&
        newY < BOARD_SIZE &&
        board[newX][newY] === player
      ) {
        count++;
      } else break;
    }
    if (count >= 5) {
      return true;
    }
  }
  return false;
}

// 简单AI算法 - 评估棋盘位置价值
function evaluatePosition(x, y, player) {
  if (board[x][y] !== 0) return -1; // 已有棋子

  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  let maxScore = 0;

  for (let [dx, dy] of directions) {
    let score = 0;
    let consecutive = 0;
    let blockedEnds = 0;

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newX = x + dx * i;
      const newY = y + dy * i;

      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
        if (board[newX][newY] === player) {
          consecutive++;
        } else if (board[newX][newY] !== 0) {
          blockedEnds++;
          break;
        } else {
          break;
        }
      } else {
        blockedEnds++;
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newX = x - dx * i;
      const newY = y - dy * i;

      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
        if (board[newX][newY] === player) {
          consecutive++;
        } else if (board[newX][newY] !== 0) {
          blockedEnds++;
          break;
        } else {
          break;
        }
      } else {
        blockedEnds++;
        break;
      }
    }
    // 计算这一方向的分数
    if (consecutive === 4) {
      score = 10000; // 能连成5子
    } else if (consecutive === 3 && blockedEnds === 0) {
      score = 1000; // 活4
    } else if (consecutive === 3 && blockedEnds === 1) {
      score = 100; // 冲4
    } else if (consecutive === 2 && blockedEnds === 0) {
      score = 50; // 活3
    } else if (consecutive === 2 && blockedEnds === 1) {
      score = 10; // 冲3
    } else if (consecutive === 1 && blockedEnds === 0) {
      score = 5; // 活2
    }

    if (score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
}

// AI落子
function makeAIMove() {
  if (gameOver || currentPlayer !== 2 || !isAIEnabled) return;

  let bestScore = -1;
  let bestMoves = [];

  // 检查每个可能的位置
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== 0) continue;

      // 评估AI自己落子的价值
      const aiScore = evaluatePosition(i, j, 2);

      // 评估玩家落子的价值
      const playerScore = evaluatePosition(i, j, 1);

      // AI更关注自己的进攻，但也会防守
      const score = aiScore * 1.2 + playerScore;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [[i, j]];
      } else if (score === bestScore) {
        bestMoves.push([i, j]);
      }
    }
  }

  // 从最佳位置中随机选择一个
  if (bestMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    const [x, y] = bestMoves[randomIndex];

    // 记录这一步棋
    moveHistory.push({ x, y, player: currentPlayer });

    // 落子
    board[x][y] = currentPlayer;
    drawBoard();

    if (checkWin(x, y)) {
      gameOver = true;
    } else {
      currentPlayer = 1;
    }

    updateStatus();
  }
}

// 悔棋功能
function undoMove() {
  if (moveHistory.length === 0 || gameOver) return;

  // 获取最后一步棋
  const lastMove = moveHistory.pop();
  const { x, y, player } = lastMove;

  // 清除棋盘上的棋子
  board[x][y] = 0;

  // 切换回上一个玩家
  currentPlayer = player;

  // 更新状态
  updateStatus();

  // 重绘棋盘
  drawBoard();
}

// 切换AI对战模式
function toggleAIMode() {
  isAIEnabled = !isAIEnabled;
  document.getElementById("mode").textContent = isAIEnabled
    ? "当前模式：单人模式"
    : "当前模式：双人模式";
  if (isAIEnabled && currentPlayer === 2 && !gameOver) {
    updateStatus(); // 触发AI思考
  }
}

// 显示胜利弹窗
function showWinPopup() {
  const popup = document.getElementById("winPopup");
  const overlay = document.getElementById("overlay");
  const message = document.getElementById("winMessage");

  if (popup && message) {
    message.textContent = `${currentPlayer === 1 ? "黑棋" : "白棋"}胜利！`;
    popup.style.display = "block";
    overlay.style.display = "block";
  }
}

// 隐藏胜利弹窗
function hideWinPopup() {
  const popup = document.getElementById("winPopup");
  const overlay = document.getElementById("overlay");
  if (popup) {
    popup.style.display = "none";
    overlay.style.display = "none";
  }
}

// 处理点击事件
function handleCanvasClick(clientX, clientY) {
  if (gameOver || (isAIEnabled && currentPlayer === 2)) return;
  const gridPos = getBoardPosition(clientX, clientY);
  // 防止重复点击
  if (clickTimer) {
    clearTimeout(clickTimer);
  }

  clickTimer = setTimeout(() => {
    clickTimer = null;
    const gridPos = getBoardPosition(clientX, clientY);
    console.log("获取的棋盘坐标:", gridPos); // 新增日志
    if (!gridPos) return;
    // 检查坐标是否在有效范围内（再次确认）
    if (
      gridPos.x >= 0 &&
      gridPos.x < BOARD_SIZE &&
      gridPos.y >= 0 &&
      gridPos.y < BOARD_SIZE
    ) {
      // 记录这一步棋
      if (board[gridPos.x][gridPos.y] === 0) {
        moveHistory.push({ x: gridPos.x, y: gridPos.y, player: currentPlayer });

        // 落子
        board[gridPos.x][gridPos.y] = currentPlayer;
        drawBoard();
        if (checkWin(gridPos.x, gridPos.y)) {
          gameOver = true;
        } else {
          currentPlayer = currentPlayer === 1 ? 2 : 1;
        }

        updateStatus();
        // return;
      }
    }
  }, CLICK_DEBOUNCE_TIME);
}

// // 处理鼠标移动（显示预览棋子）
// canvas.addEventListener("mousemove", (e) => {
//   if (gameOver || (isAIEnabled && currentPlayer === 2)) return;

//   const gridPos = getBoardPosition(e.clientX, e.clientY);
//   if (gridPos && board[gridPos.x][gridPos.y] === 0) {
//     if (
//       !previewPiece ||
//       previewPiece.x !== gridPos.x ||
//       previewPiece.y !== gridPos.y
//     ) {
//       previewPiece = gridPos;
//       drawBoard();
//     }
//   } else if (previewPiece) {
//     previewPiece = null;
//     drawBoard();
//   }
// });

// 处理触摸移动（显示预览棋子）
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault(); // 防止页面滚动
  if (gameOver || (isAIEnabled && currentPlayer === 2)) return;

  const touch = e.touches[0];
  const gridPos = getBoardPosition(touch.clientX, touch.clientY);
  if (gridPos && board[gridPos.x][gridPos.y] === 0) {
    board[gridPos.x][gridPos.y] = currentPlayer;
    drawBoard();
  }
});

// 处理鼠标点击
canvas.addEventListener("click", (e) => {
  handleCanvasClick(e.clientX, e.clientY);
});

// 处理触摸点击
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (e.touches.length === 0 && e.changedTouches.length > 0) {
    const touch = e.changedTouches[0];
    handleCanvasClick(touch.clientX, touch.clientY);
  }
});
//改变棋盘尺寸
function changeSize() {
  const popup = document.getElementById("change");
  const overlay = document.getElementById("overchange");
  const message1 = document.getElementById("min");
  const message2 = document.getElementById("mou");
  const message3 = document.getElementById("max");

  if (popup && message1) {
    BOARD_SIZE = 8;
    popup.style.display = "block";
    overlay.style.display = "block";
  }
}
//关闭改变尺寸
function overchange() {
  const popup = document.getElementById("winPopup");
  const overlay = document.getElementById("overlay");
  if (popup) {
    popup.style.display = "none";
    overlay.style.display = "none";
  }
}

// 重置游戏
function resetGame() {
  initBoard();
}

// 初始化
window.addEventListener("resize", resizeCanvas);
initBoard();
resizeCanvas();
// 关闭弹窗按钮事件
document.getElementById("closePopup").addEventListener("click", hideWinPopup);
