function grid1(y: number, x: number) {
    console.log(solveGrid(0, 0, y-1, x-1))
}

function solveGrid(y: number, x: number, maxY: number, maxX: number) {
    if (y == maxY && x == maxX) return 1;
    let total = 0;
    if (y + 1 <= maxY) total += solveGrid(y+1, x, maxY, maxX)
    if (x + 1 <= maxX) total += solveGrid(y, x+1, maxY, maxX)
    return total;
}

grid1(4, 10)