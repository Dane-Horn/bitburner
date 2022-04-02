import { NS } from 'NetscriptDefinitions';
import { getDelays, runHackBatchStatic, runGrowBatchHome } from './scripts/util'

const delay = 100;
const hackScript = `/scripts/hack.js`;
const growScript = `/scripts/grow.js`;
const weakenScript = `/scripts/weaken.js`;


export async function main(ns: NS) {
    let [target, hackThreads, groupSize, host] = ns.args as [string, number, number, string];
    ns.disableLog('asleep');
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('getServerMinSecurityLevel');
    ns.disableLog('getServerSecurityLevel');
    while (true) {
        while (targetNotOptimized(ns, target)) {
            ns.print('optimizing target');
            const { longestTime } = getDelays(ns, target);
            const server = ns.getServer(target);
            const growthRequired = (server.moneyMax - server.moneyAvailable) / server.moneyAvailable;
            await runGrowBatchHome(ns, target, growScript, weakenScript, growthRequired, delay);
            ns.print(`sleeping for: ${longestTime}`);
            await ns.asleep(longestTime);
        }
        const { longestTime } = getDelays(ns, target);
        for (let i = 1; i <= (groupSize || 10); i++) {
            ns.print(`running batch: ${i}`);
            await runHackBatchStatic(ns, target, hackThreads, hackScript, growScript, weakenScript, delay, host || 'home', longestTime);
        }
        ns.print(`sleeping for: ${longestTime + 8000}`);
        await ns.asleep(longestTime + 8000);
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
