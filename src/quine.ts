import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
    var round = ns.args[0] as number;
    var possibleColours = (ns.args[1] || `["red", "yellow", "pthalo blue", "fanta orange"]`) as string
    var possibleColourArray = eval(possibleColours) as string[]
    var answer = (ns.args[2]
        || JSON
            .stringify(Array(possibleColourArray.length)
                .fill(possibleColourArray)
                .map(x => x[(Math.random() * possibleColourArray.length).toFixed(0)] || 'undefined')
                .flat()
            )
    ) as string
    var answerArray = eval(answer) as string[]
    var colourGuess = Array(answer.length).fill(possibleColourArray).map(x => x[(Math.random() * answer.length).toFixed(0)]).flat();
    var guessResult = answerArray
        .map((colour, i) => [colour, colourGuess[i]])
        .map(([colour, guess], i) => {
            if (colour == guess) return 'beer!'
            if (answerArray.includes(guess)) return 'right beer, wrong place'
            else return 'no beer!'
        })
        .map((result, i) => [colourGuess[i], result])
    var maybeBeer = Array(4).fill("abcdefghijklmnopqrstuvwxyz").map(x => x[(Math.random() * 26).toFixed(0)]).flat().reduceRight((x, y) => y + x)
    var IDidNotWinTheBeer = !guessResult.every(([colour, result]) => result == 'beer!')
    if (maybeBeer != 'beer' && IDidNotWinTheBeer) {
        var illegalColours = guessResult
            .filter(([colour, result]) => result == 'no beer!')
            .map(([colour]) => colour)
        var newPossibleColourArray = possibleColourArray
            .filter(colour => !illegalColours.includes(colour))
        await ns.write(`${maybeBeer}.js`, `export ${main.toString()}`, 'w')
        ns.exec(`${maybeBeer}.js`, 'home', 1, round + 1, JSON.stringify(newPossibleColourArray), answer);
    }
}