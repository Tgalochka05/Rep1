// Инициализация Howler.js для звуков
const sounds = {
    click: new Howl({ src: ['sounds/click.mp3'] }),
    success: new Howl({ src: ['sounds/success.mp3'] }),
    background: new Howl({ 
        src: ['sounds/background.mp3'],
        loop: true,
        volume: 0.3
    })
};

// Элементы DOM
const startScreen = document.getElementById('startScreen');
const tutorialScreen = document.getElementById('tutorialScreen');
const gameScreen = document.getElementById('gameScreen');
const endScreen = document.getElementById('endScreen');
const startBtn = document.getElementById('startBtn');
const tutorialBtn = document.getElementById('tutorialBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const pauseBtn = document.getElementById('pauseBtn');
const soundBtn = document.getElementById('soundBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const playerNameInput = document.getElementById('playerName');
const nameError = document.getElementById('nameError');
const difficultySelect = document.getElementById('difficulty');
const gameArea = document.getElementById('gameArea');
const scoreValue = document.getElementById('scoreValue');
const timeValue = document.getElementById('timeValue');
const levelValue = document.getElementById('levelValue');
const reactionValue = document.getElementById('reactionValue');
const finalScore = document.getElementById('finalScore');
const avgReaction = document.getElementById('avgReaction');
const highScoresList = document.getElementById('highScoresList');
const secretMessage = document.getElementById('secretMessage');

// Игровые переменные
let gameState = {
    score: 0,
    timeLeft: 60,
    level: 'easy',
    targetsClicked: 0,
    totalReactionTime: 0,
    gameInterval: null,
    timerInterval: null,
    isPaused: false,
    soundOn: true,
    secretCode: [],
    secretCodeSequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
};

// Настройки уровней сложности
const difficultySettings = {
    easy: {
        targetSize: 'easy',
        spawnInterval: 1500,
        disappearTime: 3000,
        points: 10,
        levelName: 'Легкий'
    },
    medium: {
        targetSize: 'medium',
        spawnInterval: 1000,
        disappearTime: 2000,
        points: 20,
        levelName: 'Средний'
    },
    hard: {
        targetSize: 'hard',
        spawnInterval: 700,
        disappearTime: 1500,
        points: 30,
        levelName: 'Сложный'
    }
};

// Инициализация игры
function initGame() {
    // Загрузка рекордов из localStorage
    loadHighScores();
    
    // Настройка обработчиков событий
    setupEventListeners();
}
// Настройка всех обработчиков событий
function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    tutorialBtn.addEventListener('click', showTutorial);
    backToMenuBtn.addEventListener('click', showStartScreen);
    pauseBtn.addEventListener('click', togglePause);
    soundBtn.addEventListener('click', toggleSound);
    restartBtn.addEventListener('click', startGame);
    menuBtn.addEventListener('click', showStartScreen);
    
    // Обработка секретного кода
    document.addEventListener('keydown', handleSecretCode);
    
    // Проверка ввода имени
    playerNameInput.addEventListener('input', validateName);
}

function validateName() {
    const name = playerNameInput.value.trim();
    if (name.length < 3 || name.length > 20) {
        nameError.textContent = 'Имя должно быть от 3 до 20 символов';
        return false;
    }
    nameError.textContent = '';
    return true;
}
// Загрузка таблицы рекордов из localStorage
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScoresList.innerHTML = '';
    
    // Сортировка и отображение топ-5 результатов
    scores.sort((a, b) => b.score - a.score).slice(0, 5).forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score.name}: ${score.score} (${score.avgReaction}мс)`;
        highScoresList.appendChild(li);
    });
}

function saveHighScore(name, score, avgReactionTime) {
    const scores = JSON.parse(localStorage.getItem('highScores')) || [];
    scores.push({ name, score, avgReaction: avgReactionTime });
    localStorage.setItem('highScores', JSON.stringify(scores));
}

// Показать стартовый экран
function showStartScreen() {
    startScreen.style.display = 'block';
    tutorialScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'none';
    
    // Остановка звуков
    sounds.background.stop();
}
// Показать обучение
function showTutorial() {
    startScreen.style.display = 'none';
    tutorialScreen.style.display = 'block';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'none';
}

// Показать экран игры
function showGameScreen() {
    startScreen.style.display = 'none';
    tutorialScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    endScreen.style.display = 'none';
    
    // Запуск фоновой музыки
    if (gameState.soundOn) {
        sounds.background.play();
    }
}

// Показать экран конца игры
function showEndScreen() {
    startScreen.style.display = 'none';
    tutorialScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'block';
    
    // Остановка фоновой музыки
    sounds.background.stop();
}

// Начать новую игру
function startGame() {
    if (!validateName()) return;
    
    // Сброс игрового состояния
    gameState.score = 0;
    gameState.timeLeft = 60;
    gameState.level = difficultySelect.value;
    gameState.targetsClicked = 0;
    gameState.totalReactionTime = 0;
    gameState.isPaused = false;
    gameState.secretCode = [];
    
    // Обновление UI
    scoreValue.textContent = '0';
    timeValue.textContent = '60';
    reactionValue.textContent = '-';
    levelValue.textContent = difficultySettings[gameState.level].levelName;
    
    // Очистка игровой области
    gameArea.innerHTML = '';
    
    // Показать игровой экран
    showGameScreen();
    
    // Запуск таймера
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Запуск спавна целей
    gameState.gameInterval = setInterval(spawnTarget, difficultySettings[gameState.level].spawnInterval);
}

function updateTimer() {
    gameState.timeLeft--;
    timeValue.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

//Функция спавна котиков
function spawnTarget() {
    if (gameState.isPaused) return;
    
    const settings = difficultySettings[gameState.level];
    const target = document.createElement('div');
    target.className = `target ${settings.targetSize}`;
    
    //Пределы спавна
    const maxX = gameArea.offsetWidth - parseInt(target.style.width || 50);
    const maxY = gameArea.offsetHeight - parseInt(target.style.height || 50);
    
    // Случайная позиция в пределах игровой области
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    // Запоминаем время появления
    const appearTime = Date.now();
    
    // Обработчик клика
    target.addEventListener('click', function() {
        if (gameState.isPaused) return;
        
        const reactionTime = Date.now() - appearTime;
        gameState.totalReactionTime += reactionTime;
        gameState.targetsClicked++;
        
        // Обновление UI
        reactionValue.textContent = reactionTime;
        
        // Добавление очков
        const points = Math.max(1, Math.floor(settings.points * (1 - reactionTime / settings.disappearTime)));
        gameState.score += points;
        scoreValue.textContent = gameState.score;
        
        // Воспроизведение звука
        if (gameState.soundOn) {
            sounds.click.play();
        }
        
        // Анимация взрыва
        createExplosion(x, y);
        
        // Удаление цели
        target.remove();
    });
    
    gameArea.appendChild(target);
    
    // Автоматическое исчезновение цели через некоторое время
    setTimeout(() => {
        if (target.parentNode === gameArea) {
            target.remove();
        }
    }, settings.disappearTime);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    explosion.style.width = '100px';
    explosion.style.height = '100px';
    
    gameArea.appendChild(explosion);
    
    // Удаление взрыва после анимации
    setTimeout(() => {
        explosion.remove();
    }, 1000);
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? 'Продолжить' : 'Пауза';
    
    if (gameState.isPaused) {
        sounds.background.pause();
    } else {
        sounds.background.play();
    }
}

function toggleSound() {
    gameState.soundOn = !gameState.soundOn;
    soundBtn.textContent = gameState.soundOn ? 'Звук Вкл' : 'Звук Выкл';
    
    Howler.mute(!gameState.soundOn);
}

function endGame() {
    // Очистка интервалов
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.gameInterval);
    
    // Расчет средней реакции
    const avgReactionTime = gameState.targetsClicked > 0 
        ? Math.round(gameState.totalReactionTime / gameState.targetsClicked)
        : 0;
    
    // Обновление UI
    finalScore.textContent = gameState.score;
    avgReaction.textContent = avgReactionTime;
    
    // Сохранение результата
    saveHighScore(playerNameInput.value.trim(), gameState.score, avgReactionTime);
    loadHighScores();
    
    // Показать экран окончания игры
    showEndScreen();
}
// Обработка секретного кода
function handleSecretCode(e) {
    gameState.secretCode.push(e.key);
    if (gameState.secretCode.length > gameState.secretCodeSequence.length) {
        gameState.secretCode.shift();
    }
    
    // Проверка совпадения с секретной последовательностью
    if (gameState.secretCode.join(',') === gameState.secretCodeSequence.join(',')) {
        secretMessage.textContent = 'Поздравляем! Вы нашли секретную пасхалку! +1000 очков!';
        gameState.score += 1000;
        scoreValue.textContent = gameState.score;
        
        // Очистка кода после активации
        gameState.secretCode = [];
        
        // Воспроизведение звука успеха
        if (gameState.soundOn) {
            sounds.success.play();
        }
    }
}

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', initGame);