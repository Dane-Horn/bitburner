// var a = Array(4).fill("abcdefghijklmnopqrstuvwxyz").map(x => x[(Math.random()*26).toFixed(0)]).flat().reduceRight((x, y) => y + x)
// console.log(a)

Number.prototype.valueOf = function () { console.log() }

console.log(Number(2).valueOf())

