import { NS } from 'NetscriptDefinitions';
import { getAllHosts } from './scripts/util';

/** @param {NS} ns **/
export async function main(ns: NS) {
    const servers =
        getAllHosts(ns, 'home', 0, [])
            .map((host: string) => ns.getServer(host))
            .filter(({ purchasedByPlayer }) => !purchasedByPlayer);
    const player = ns.getPlayer();
    for (const server of servers) {
        ns.print(`${server.hostname}: required hacking ${server.requiredHackingSkill}`);
        if (!server.sshPortOpen && ns.ls('home', 'BruteSSH.exe').length > 0) {
            ns.brutessh(server.hostname);
        };
        if (!server.ftpPortOpen && ns.ls('home', 'FTPCrack.exe').length > 0) {
            ns.ftpcrack(server.hostname);
        }
        if (!server.smtpPortOpen && ns.ls('home', 'relaySMTP.exe').length > 0) {
            ns.relaysmtp(server.hostname);
        }
        if (!server.httpPortOpen && ns.ls('home', 'HTTPWorm.exe').length > 0) {
            ns.httpworm(server.hostname);
        }
        if (!server.sqlPortOpen && ns.ls('home', 'SQLInject.exe').length > 0) {
            ns.sqlinject(server.hostname);
        }
        if (server.openPortCount >= server.numOpenPortsRequired && player.hacking >= server.requiredHackingSkill && !server.hasAdminRights) {
            ns.print('nuking');
            ns.nuke(server.hostname);
        }
    }
}