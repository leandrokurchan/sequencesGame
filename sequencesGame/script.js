document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.querySelector('.grid-container');
    const submitButton = document.querySelector('.submit-button');
    const shuffleButton = document.querySelector('.shuffle-button');
    const mistakesElement = document.getElementById('mistakes');
    const modal = document.getElementById('resultModal');
    const closeButton = document.querySelector('.close-button');
    const resultMessage = document.getElementById('resultMessage');
    const countdownTimer = document.getElementById('countdownTimer');
    const nextPuzzleMessage = document.getElementById('nextPuzzleMessage');
    let clickedSquares = [];
    let mistakesCount = 4;
    let data = null;
    let guessedSequences = new Set();
    let displayedSequences = new Set();
    let timerInterval;

    const colors = ["#FFC0CB", "#ADD8E6", "#90EE90", "#FFD700"]; 
    const currentDate = new Date();
    let day = currentDate.getDate();
    let sequenceKeys = ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10']; 
    let sequenceKey = sequenceKeys[day % sequenceKeys.length];

    fetch('./data.json')
        .then(res => res.json())
        .then(fetchedData => {
            data = fetchedData;
            loadSequence();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    function loadSequence() {
        clearGrid();
        const sequenceData = data[sequenceKey];
        sequenceData.order.forEach(number => {
            const square = document.createElement('div');
            square.classList.add('square');
            square.textContent = number;
            gridContainer.appendChild(square);
        });
        resetGameState();
    }

    function clearGrid() {
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }
    }

    function resetGameState() {
        clickedSquares = [];
        mistakesCount = 4;
        guessedSequences = new Set();
        displayedSequences = new Set();
        mistakesElement.textContent = 'Mistakes remaining: * * * *';
        submitButton.disabled = true;
    }

    function handleClick(square) {
        const number = square.textContent;
        if (!square.classList.contains('clicked') && clickedSquares.length < 4) {
            square.classList.add('clicked');
            clickedSquares.push(number);
        } else if (square.classList.contains('clicked')) {
            square.classList.remove('clicked');
            clickedSquares = clickedSquares.filter(num => num !== number);
        }
        submitButton.disabled = (clickedSquares.length !== 4);
    }

    gridContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('square')) {
            handleClick(event.target);
        }
    });

    function shuffleSquares() {
        const squares = Array.from(gridContainer.querySelectorAll('.square'));
        squares.forEach(square => {
            gridContainer.removeChild(square);
        });
        shuffleArray(squares);
        squares.forEach(square => {
            gridContainer.appendChild(square);
        });
    }

    shuffleButton.addEventListener('click', function() {
        shuffleSquares();
    });

    submitButton.addEventListener('click', function() {
        if (clickedSquares.length === 4) {
            const currentSequence = clickedSquares.slice().sort().join(',');
            if (guessedSequences.has(currentSequence)) {
                alert('Already guessed');
                return;
            }

            const sequenceData = checkSequence(clickedSquares, data[sequenceKey].cases);
            if (sequenceData) {
                displaySequence(sequenceData);
                const squaresToRemove = Array.from(gridContainer.querySelectorAll('.square.clicked'));
                squaresToRemove.forEach(square => {
                    gridContainer.removeChild(square);
                });

                clickedSquares = [];
                submitButton.disabled = true;

                if (displayedSequences.size === data[sequenceKey].cases.length) {
                    showResultModal('You win!');
                }
            } else {
                if (isOneAway(clickedSquares, data[sequenceKey].cases)) {
                    alert('One away');
                }
                mistakesCount--;
                updateMistakes();
                if (mistakesCount === 0) {
                    showResultModal('You lose!');
                    displayAllSequences(data[sequenceKey].cases);
                    removeAllSquares();
                }
            }

            guessedSequences.add(currentSequence);
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function checkSequence(selectedNumbers, cases) {
        for (let i = 0; i < cases.length; i++) {
            const sequence = cases[i];
            const values = sequence.values.map(value => value.toString());
            if (values.every(value => selectedNumbers.includes(value))) {
                return { ...sequence, color: colors[i] };
            }
        }
        return null;
    }

    function isOneAway(selectedNumbers, cases) {
        for (let i = 0; i < cases.length; i++) {
            const sequence = cases[i];
            const values = sequence.values.map(value => value.toString());
            let matchCount = 0;
            values.forEach(value => {
                if (selectedNumbers.includes(value)) {
                    matchCount++;
                }
            });
            if (matchCount === 3) {
                return true;
            }
        }
        return false;
    }

    function updateMistakes() {
        mistakesElement.textContent = 'Mistakes remaining: ' + '* '.repeat(mistakesCount).trim();
    }

    function displaySequence(sequenceData) {
        if (!displayedSequences.has(sequenceData.name)) {
            const nameRect = document.createElement('div');
            nameRect.classList.add('name-rect');
            nameRect.textContent = sequenceData.name;
            nameRect.style.backgroundColor = sequenceData.color;
            const existingRectangles = gridContainer.querySelectorAll('.name-rect');
            if (existingRectangles.length === 0) {
                gridContainer.insertBefore(nameRect, gridContainer.firstChild);
            } else {
                const lastRectangle = existingRectangles[existingRectangles.length - 1];
                gridContainer.insertBefore(nameRect, lastRectangle.nextSibling);
            }
            displayedSequences.add(sequenceData.name);
        }
    }

    function displayAllSequences(cases) {
        cases.forEach((sequenceData, index) => {
            displaySequence({ ...sequenceData, color: colors[index] });
        });
    }

    function removeAllSquares() {
        const squares = Array.from(gridContainer.querySelectorAll('.square'));
        squares.forEach(square => {
            gridContainer.removeChild(square);
        });
    }

    function showResultModal(message) {
        resultMessage.textContent = message;
        const nextDay = (day + 1) % sequenceKeys.length;
        nextPuzzleMessage.textContent = `Tomorrow's puzzle is: ${sequenceKeys[nextDay]}`;
        modal.style.display = "block";
        startCountdown();
    }

    closeButton.addEventListener('click', function() {
        modal.style.display = "none";
    });

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    function startCountdown() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeRemaining = midnight - now;

        function updateTimer() {
            const timeLeft = midnight - new Date();
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            countdownTimer.textContent = `Time until next game: ${hours}h ${minutes}m ${seconds}s`;
            if (timeLeft < 0) {
                clearInterval(timerInterval);
                countdownTimer.textContent = 'Time is up!';
                swapSequence();
            }
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function swapSequence() {
        day++;
        sequenceKey = sequenceKeys[day % sequenceKeys.length];
        loadSequence();
    }
});


