export const TURNS = 6;
export const WORD_LENGTH = 8;
export const DAY_LENGTH = 24 * 60 * 60 * 1_000;
export const ZEROTH_BYTLE = new Date("2022-01-24T00:00:00.000Z");

export var main;
export var board;
export var entry;

export var currentRow = 0;
export var targetNumber = 0;
export var previousEntries = [];
export var previousStates = [];
export var finishedGame = false;

function setCellContents(cell, contents) {
    cell.innerHTML = "";

    if (contents != "") {
        var span = document.createElement("span");

        span.textContent = contents;

        cell.append(span);
    }
}

function setCellState(cell, state) {
    cell.setAttribute("bytle-state", state);
}

function generateBoard() {
    for (var i = 0; i < TURNS; i++) {
        var row = document.createElement("bytle-row");

        for (var j = 0; j < WORD_LENGTH; j++) {
            var cell = document.createElement("bytle-cell");

            row.append(cell);
        }

        board.append(row);
    }
}

export function getBytleNumber() {
    return Math.round((new Date().getTime() - ZEROTH_BYTLE.getTime()) / DAY_LENGTH) - 1;
}

export function generateTargetNumber() {
    targetNumber = ((getBytleNumber() * 80085) + 69420) % 256;
}

export function setRowValue(value, row = currentRow) {
    document.querySelectorAll("bytle-row")[row].querySelectorAll("bytle-cell").forEach(function(cell, i) {
        setCellContents(cell, value[i]);
    });
}

export function setRowStates(states, row = currentRow) {
    document.querySelectorAll("bytle-row")[row].querySelectorAll("bytle-cell").forEach(function(cell, i) {
        setCellState(cell, states[i]);
    });
}

function valueToBinary(value) {
    var binary = [];

    for (var i = 0; i < WORD_LENGTH; i++) {
        binary[(WORD_LENGTH - 1) - i] = ((value >> i) & 1) == 1 ? "1" : "0";
    }

    return binary;
}

export function setStreak(won = false) {
    var hasStreak = localStorage.getItem("bytle_lastWin") != null;
    var lastWin = Number(localStorage.getItem("bytle_lastWin"));

    if (won && (!hasStreak || new Date().getTime() - lastWin < DAY_LENGTH)) {
        localStorage.setItem("bytle_lastWin", new Date().getTime());
        localStorage.setItem("bytle_winStreak", Number(localStorage.getItem("bytle_winStreak") || 0) + 1);

        return Number(localStorage.getItem("bytle_winStreak"));
    }

    localStorage.removeItem("bytle_lastWin");
    localStorage.setItem("bytle_winStreak", won ? 1 : 0);

    return Number(localStorage.getItem("bytle_winStreak"));
}

export function checkCurrentRow() {
    var lastEntry = valueToBinary(previousEntries[previousEntries.length - 1]);
    var targetEntry = valueToBinary(targetNumber);
    var states = new Array(WORD_LENGTH).fill("notQuite");

    var pool = {};

    targetEntry.forEach(function(digit) {
        pool[digit] = (pool[digit] || 0) + 1;
    });

    targetEntry.forEach(function(digit, i) {
        if (lastEntry[i] == digit) {
            states[i] = "correct";
            pool[digit] = (pool[digit] || 0) - 1;

            return;
        }
    });

    targetEntry.forEach(function(digit, i) {
        if (states[i] == "correct") {
            return;
        }

        if ((pool[lastEntry[i]] || 0) > 0) {
            states[i] = "almost";
            pool[lastEntry[i]] = (pool[lastEntry[i]] || 0) - 1;

            return;
        }

        states[i] = "notQuite";
    });

    previousStates = states;

    setRowStates(states);
}

export function acceptEntry(value = entry.value, save = true) {
    if (finishedGame) {
        return;
    }

    var binary = valueToBinary(value);

    setRowValue(binary);

    previousEntries.push(value);

    if (save) {
        localStorage.setItem("bytle_number", getBytleNumber());
        localStorage.setItem("bytle_currentGame", JSON.stringify(previousEntries));
    }

    checkCurrentRow();

    entry.value = "";
    currentRow++;

    var won = true;

    previousStates.forEach(function(state) {
        if (state != "correct") {
            won = false;
        }
    });

    if (won) {
        finishedGame = true;

        var streak = localStorage.getItem("bytle_winStreak") || 1;

        if (save) {
            streak = setStreak(true);
        }

        document.querySelector("#result h2").textContent = "You got it!";
        document.querySelector("#result #comment").textContent = `You found today's Bytle in ${currentRow.toString(2).padStart(3, "0")} tries. Don't forget to come back tomorrow for another game!`;
        document.querySelector("#result #streak").textContent = streak;

        main.setAttribute("bytle-state", "finished won");
    } else if (currentRow >= TURNS) {
        finishedGame = true;

        if (save) {
            setStreak(false);
        }

        document.querySelector("#result h2").textContent = "Not today!";
        document.querySelector("#result p").textContent = `You have run out of tries! Today's Bytle answer is ${targetNumber.toString(2).padStart(WORD_LENGTH, "0")}. Come back tomorrow for another game!`;

        main.setAttribute("bytle-state", "finished lost");
    }
}

function adjustCells() {
    var firstCell = document.querySelector("bytle-cell");
    var width = firstCell.clientWidth;

    document.querySelectorAll("bytle-cell").forEach(function(cell) {
        cell.style.height = `${width}px`;
        cell.style.fontSize = `${width * 0.6}px`;
    });
}

window.addEventListener("load", function() {
    main = document.querySelector("main");
    board = document.querySelector("bytle-board");
    entry = document.querySelector("#entry");

    document.querySelector("#bytleNumber").textContent = "#" + getBytleNumber().toString(2).padStart(8, "0");

    entry.focus();

    generateTargetNumber();
    generateBoard();
    adjustCells();

    if (Number(localStorage.getItem("bytle_number")) != getBytleNumber()) {
        localStorage.removeItem("bytle_currentGame");
    }

    if (localStorage.getItem("bytle_currentGame") != null) {
        try {
            var entries = JSON.parse(localStorage.getItem("bytle_currentGame"));

            entries.forEach((entry) => acceptEntry(entry, false));
        } catch (e) {}
    }

    entry.addEventListener("keydown", function(event) {
        if (["Backspace", "Tab", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            return;
        }

        if (event.key == "Enter") {
            if (entry.value != "") {
                acceptEntry();
            }

            return;
        }

        if (Number.isNaN(Number(event.key))) {
            event.preventDefault();
        }
    });
});

window.addEventListener("resize", function() {
    adjustCells();
});