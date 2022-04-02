import { NS } from "NetscriptDefinitions";
import { rankServers } from "./scripts/util";

export async function main(ns: NS) {
    const [maxThreads, serverCount, filterCode] = ns.args as [number, number, string];
    const ranked = rankServers(ns, maxThreads).filter((server) => eval(filterCode));
    let i = 0;
    for (const server of ranked) {
        if (i >= serverCount) break;
        ns.exec('hackBatchTurboHome.js', 'home', 1, ...[server.host, server.hackThreads, 100, 'home']);
        i++;
    }
}