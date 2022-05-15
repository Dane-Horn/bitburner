function validExpr(digits: string, target: number) {
    return solve(digits[0], digits.slice(1))
    .filter(([expression, result]) => result == target)
    .map(([expression]) => expression)
}

function solve(lhs: string, rhs: string): [string, number][] {
    if (rhs == '') return [[lhs, (eval(lhs) as number)]];
    const solutions = []
    if (!lhs.endsWith('0'))
        solutions.push(solve(lhs + rhs[0], rhs.slice(1)))
    solutions.push(solve(lhs + '+' + rhs[0], rhs.slice(1)))
    solutions.push(solve(lhs + '-' + rhs[0], rhs.slice(1)))
    solutions.push(solve(lhs + '*' + rhs[0], rhs.slice(1)))
    solutions.push(solve(lhs + '/' + rhs[0], rhs.slice(1)))
    return solutions.flat();
}

console.log(validExpr('7093116', -55))