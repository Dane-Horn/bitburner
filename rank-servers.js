import { getAllHosts, hwgw } from 'scripts/util.js';

/** @param {NS} ns **/
export async function main(ns) {
	const [hackThreads] = ns.args;
	const hackScript = '/scripts/hack.js';
	const growScript = '/scripts/grow.js';
	const weakenScript = '/scripts/weaken.js';
	const hosts = getAllHosts(ns, 'home', 0, [])
		.map((host) => mostEfficient(ns, host, hackThreads, hackScript, growScript, weakenScript))
		.filter(({ server: { hasAdminRights } }) => hasAdminRights)
		.filter(({ hwgw: { gainPerMsPerGB }, server: { moneyMax } }) => moneyMax && gainPerMsPerGB)
		.sort((a, b) => a.hwgw.gainPerMsPerGB - b.hwgw.gainPerMsPerGB)
		.map(({
			host,
			hwgw: {
				gainPerMsPerGB, hack, hackWeaken, grow, growWeaken, totalCost, batchTime,
			},
			server
		}) => {
			return {
				host,
				totalCost,
				batchTime,
				gainPerMsPerGB,
				ratio: `${hack.threads}:${hackWeaken.threads}:${grow.threads}:${growWeaken.threads}`,
				moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
				minSec: server.minDifficulty,
				currSec: server.hackDifficulty,
			}
		});
	ns.tprint(JSON.stringify(hosts, null, 2));
}

function mostEfficient(ns, host, maxThreads, hackScript, growScript, weakenScript) {
	const range = (start, stop, step) =>
		Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
	return (range(5, maxThreads, 5) || [1])
		.map((hackThreads) => { return { host, server: ns.getServer(host), hwgw: hwgw(ns, host, hackThreads, hackScript, growScript, weakenScript) } })
		.sort((a, b) => b.hwgw.gainPerMsPerGB - a.hwgw.gainPerMsPerGB)[0];
}