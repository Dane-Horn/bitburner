import { NS } from 'NetscriptDefinitions';
import { getDelays, runGrowBatch, runHackBatch } from './scripts/util'

const delay = 35;
const hackScript = `/scripts/hack.js`;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;


export async function main(ns: NS) {
    let [target, percentageToSteal = 0.5, groupSize] = ns.args as [string, number, number, string];
    ns.disableLog('ALL');
    while (true) {
        while (targetNotOptimized(ns, target)) {
            ns.print('optimizing target');
            const { longestTime } = getDelays(ns, target);
            const server = ns.getServer(target);
            const growthRequired = (server.moneyMax - server.moneyAvailable) / server.moneyAvailable;
            await runGrowBatch(ns, target, growScript, weakenScript, growthRequired, delay, 1);
            ns.print(`sleeping for: ${longestTime}`);
            await ns.asleep(longestTime + delay * 8);
        }
        const { longestTime } = getDelays(ns, target);
        let batchesRun = 0;
        do {
            batchesRun = await runHackBatch(ns, target, percentageToSteal, hackScript, growScript, weakenScript, delay, groupSize);
            if (batchesRun === 0) groupSize -= 1;
            if (groupSize <= 0) ns.exit();
        } while (batchesRun === 0);
        ns.print(`running ${batchesRun} batches`);
        ns.print(`sleeping for: ${longestTime + delay * 5 * batchesRun}`);
        await ns.asleep(longestTime + delay * 5 * batchesRun);
        if (batchesRun >= groupSize) groupSize += 5;
        ns.print('batches completed');
    }
}

function targetNotOptimized(ns: NS, target: string) {
    const server = ns.getServer(target);
    ns.print(`money diff: ${server.moneyMax - server.moneyAvailable}`);
    ns.print(`security diff: ${server.hackDifficulty - server.minDifficulty}`);
    return server.moneyMax > server.moneyAvailable
        || server.hackDifficulty > server.minDifficulty;
}
