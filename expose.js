import { getAllHosts } from 'scripts/util.js';

/** @param {NS} ns **/
export async function main(ns) {
	const servers =
		getAllHosts(ns, 'home', 0, [])
			.map((host) => ns.getServer(host))
			.filter(({ purchasedByPlayer }) => !purchasedByPlayer);
	const player = ns.getPlayer();
	for (const server of servers) {
		ns.print(`${server.hostname}: required hacking ${server.requiredHackingSkill}`);
		if (!server.sshPortOpen) {
			ns.brutessh(server.hostname);
		};
		if (!server.ftpPortOpen) {
			ns.ftpcrack(server.hostname);
		}
		if (!server.smtpPortOpen) {
			ns.relaysmtp(server.hostname);
		}
		if (!server.httpPortOpen) {
			ns.httpworm(server.hostname);
		}
		if (!server.sqlPortOpen) {
			ns.sqlinject(server.hostname);
		}
		if (server.openPortCount >= server.numOpenPortsRequired && player.hacking >= server.requiredHackingSkill && !server.hasAdminRights) {
			ns.print('nuking');
			ns.nuke(server.hostname);
		}
	}
}