import { NS } from "NetscriptDefinitions";

export async function main(ns: NS) {
    var maybeBeer = Array(4).fill("abcdefghijklmnopqrstuvwxyz").map(x => x[(Math.random()*26).toFixed(0)]).flat().reduceRight((x, y) => y + x)
    if (maybeBeer != 'beer') {
        await ns.write(maybeBeer, main.toString(), 'w')
        ns.exec(maybeBeer, 'home');
    }
}