import { NS } from 'NetscriptDefinitions';
import { getDelays, runGrowBatch, runHackBatch } from './scripts/util'

const delay = 50;
const hackScript = `/scripts/hack.js`;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;


export async function main(ns: NS) {
    let [target, hackThreads, groupSize] = ns.args as [string, number, number, string];
    ns.disableLog('ALL');
    while (true) {
        while (targetNotOptimized(ns, target)) {
            ns.print('optimizing target');
            const { longestTime } = getDelays(ns, target);
            const server = ns.getServer(target);
            const growthRequired = (server.moneyMax - server.moneyAvailable) / server.moneyAvailable;
            await runGrowBatch(ns, target, growScript, weakenScript, growthRequired, delay, longestTime, 1);
            ns.print(`sleeping for: ${longestTime}`);
            await ns.asleep(longestTime);
        }
        const { longestTime } = getDelays(ns, target);
        let success = false;
        do {
            success = await runHackBatch(ns, target, hackThreads, hackScript, growScript, weakenScript, delay, longestTime, groupSize);
            if (!success) groupSize--;
        } while (!success);
        ns.print(`running ${groupSize} batches`);
        ns.print(`sleeping for: ${longestTime + delay*5*groupSize}`);
        await ns.asleep(longestTime + delay*5*groupSize);
        groupSize += 5;
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
