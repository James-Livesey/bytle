export const TURNS = 6;
export const WORD_LENGTH = 8;

export var board;
export var entry;

export var currentRow = 0;
export var targetNumber = 69; // TODO: lol, will generate every day at some point
export var previousEntries = [];

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

export function checkCurrentRow() {
    var lastEntry = previousEntries[previousEntries.length - 1];
    var targetEntry = valueToBinary(targetNumber);
    var states = new Array(WORD_LENGTH).fill("notQuite");

    var pool = {};

    targetEntry.forEach(function(digit) {
        pool[digit] = (pool[digit] || 0) + 1;
    });

    targetEntry.forEach(function(digit, i) {
        console.log(digit, i, pool);
        if (lastEntry[i] == digit) {
            states[i] = "correct";
            pool[digit] = (pool[digit] || 0) - 1;

            return;
        }

        if ((pool[digit] || 0) > 0) {
            states[i] = "almost";
            pool[digit]--;
            pool[digit] = (pool[digit] || 0) - 1;

            return;
        }

        states[i] = "notQuite";
    });

    setRowStates(states);
}

export function acceptEntry(value = entry.value) {
    var binary = valueToBinary(value);

    setRowValue(binary);

    previousEntries.push(binary);

    checkCurrentRow();

    entry.value = "";
    currentRow++;
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
    board = document.querySelector("bytle-board");
    entry = document.querySelector("#entry");

    generateBoard();
    adjustCells();

    entry.addEventListener("keydown", function(event) {
        if (event.key == "Backspace") {
            return;
        }

        if (event.key == "Enter") {
            acceptEntry();

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