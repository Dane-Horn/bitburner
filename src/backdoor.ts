import { NS } from "NetscriptDefinitions";
import { getAllHosts, getPaths } from "./scripts/util";

export async function main(ns: NS) {
    const [target] = ns.args as [string]
    const targetPath = getPaths(ns, 'home')[target]
        for (const host of targetPath) {
            ns.singularity.connect(host);
            if (host == target) {
                ns.tprint(`installing backdoor on: ${host}`)
                await ns.singularity.installBackdoor();
            }
        }
        ns.singularity.connect(`home`)
}