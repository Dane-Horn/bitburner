import { NS } from 'NetscriptDefinitions';
import { runGrowBatchHome, getDelays } from './scripts/util'

const delay = 200;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;

/** @param {NS} ns **/
export async function main(ns: NS) {
    const [target] = ns.args as [string];
    while (targetNotOptimized(ns, target)) {
        ns.print('optimizing target');
        const { longestTime } = getDelays(ns, target);
        const server = ns.getServer(target);
        const growthRequired = (server.moneyMax - server.moneyAvailable) / server.moneyAvailable;
        await runGrowBatchHome(ns, target, growScript, weakenScript, growthRequired, delay);
        await ns.asleep(longestTime);
    }
}

/** @param {NS} ns */
function targetNotOptimized(ns: NS, target: string) {
    const server = ns.getServer(target);
    ns.print(`money diff: ${server.moneyMax - server.moneyAvailable}`);
    ns.print(`security diff: ${server.hackDifficulty - server.minDifficulty}`);
    return server.moneyMax > server.moneyAvailable
        || server.hackDifficulty > server.minDifficulty;
}