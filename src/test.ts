import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    ns.tprint(getAllHosts(ns))
    const exposeScripts: [string, (host: string) => void][] = [
        ["SQLInject.exe", ns.sqlinject],
        ["FTPCrack.exe", ns.ftpcrack],
        ["BruteSSH.exe", ns.brutessh],
        ["relaySMTP.exe", ns.relaysmtp],
        ["HTTPWorm.exe", ns.httpworm],
        ["NUKE.exe", ns.nuke]
    ];
    const ownedScripts = exposeScripts.filter(x => ns.fileExists(x[0]));
    const hosts = getAllHosts(ns);
    for (const host of hosts) {
        for (const [scriptName, script] of ownedScripts) {
            try {
                ns.tprint(`running ${scriptName} against ${host}`);
                await script(host);
            } catch { } //preserving this behaviour - still looks ugly though
        }
    }
}

function getAllHosts(ns: NS) {
    let q = ["home"];
    const duplicates = Array(30).fill('')
        .map(_ => q = [...new Set(
            q.map(s => [s, ns.scan(s)]).flat(2))]
        )
        .flat(2);
    return [...new Set(duplicates)];
}