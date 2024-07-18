const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const timeDeltaInput = document.getElementById('timeDelta');
const newPathButton = document.getElementById('newPathButton');
const clearAllButton = document.getElementById('clearAllButton');
const clearLastButton = document.getElementById('clearLastButton');
const exportButton = document.getElementById('exportButton');

let isDrawing = false;
let currentPath = [];
let paths = [];
let currentColor = '#000000';
let startTime = 0;
let endTime = 1000;
let timeDelta = 100;

newPathButton.addEventListener('click', startNewPath);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

clearAllButton.addEventListener('click', clearAllPaths);
clearLastButton.addEventListener('click', clearLastPath);
exportButton.addEventListener('click', exportPaths);

colorPicker.addEventListener('input', e => currentColor = e.target.value);
startTimeInput.addEventListener('input', e => startTime = parseInt(e.target.value));
endTimeInput.addEventListener('input', e => endTime = parseInt(e.target.value));
timeDeltaInput.addEventListener('input', e => timeDelta = parseInt(e.target.value));

function startNewPath() {
    currentPath = [];
}

function startDrawing(event) {
    if (currentPath.length === 0) {
        isDrawing = true;
        currentPath.push({ x: event.offsetX, y: event.offsetY });
        ctx.beginPath();
        ctx.moveTo(event.offsetX, event.offsetY);
        ctx.strokeStyle = currentColor;
    }
}

function draw(event) {
    if (!isDrawing) return;

    const { offsetX: x, offsetY: y } = event;
    ctx.lineTo(x, y);
    ctx.stroke();
    currentPath.push({ x, y });
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
    if (currentPath.length > 1) {
        paths.push({ color: currentColor, path: currentPath, startTime, endTime, timeDelta });
    }
}

function clearAllPaths() {
    paths = [];
    redrawPaths();
}

function clearLastPath() {
    paths.pop();
    redrawPaths();
}

function redrawPaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(({ color, path }) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.closePath();
    });
}

/**
 * Convert a 2D array into a CSV string
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function arrayToCsv(data) {
    return data.map(row =>
        row
            .map(String)  // convert every value to String
            .map(v => v.replaceAll('"', '""'))  // escape double quotes
            .map(v => `"${v}"`)  // quote it
            .join(',')  // comma-separated
    ).join('\r\n');  // rows starting on new lines
}

/**
 * Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function downloadBlob(content, filename, contentType) {
    // Create a blob
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob, { oneTimeOnly: true });

    // Create a link to download it
    let link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
}

function exportPaths() {
    let sampledPoints = [['X', 'Y', 'Date', 'TrackId']];

    for (let pathId = 0; pathId < paths.length; pathId++) {
        const { color, path, startTime, endTime, timeDelta } = paths[pathId];
        const duration = endTime - startTime;
        const totalPoints = Math.ceil(duration / timeDelta);
        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const index = Math.floor(t * (path.length - 1));
            // x, y, time, id
            sampledPoints.push([path[index].x, path[index].y, startTime + i * timeDelta, pathId]);
        }
    }

    downloadBlob(arrayToCsv(sampledPoints), 'sampled_points.csv', 'text/csv;charset=utf-8');

    console.log('successfully downloaded');
}