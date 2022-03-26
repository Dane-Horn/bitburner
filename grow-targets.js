import { getAllHosts, wgw } from 'scripts/util.js';

/** @param {NS} ns **/
export async function main(ns) {
	const [targetGrowth] = ns.args;
	const growScript = '/scripts/grow.js';
	const weakenScript = '/scripts/weaken.js';
	const hosts = getAllHosts(ns, 'home', 0, [])
		.map((host) => { return { host, server: ns.getServer(host) } })
		.filter(({ server: { moneyAvailable, moneyMax } }) => moneyAvailable < moneyMax)
		.map((obj) => { return { ...obj, wgw: wgw(ns, obj.host, growScript, weakenScript, targetGrowth) } })
		.filter(({ server: { hasAdminRights } }) => hasAdminRights)
		.sort((a, b) => b.wgw.totalCost - a.wgw.totalCost)
		.map(({
			host,
			wgw: {
				weaken, grow, growWeaken, totalCost,
			},
			server
		}) => {
			return {
				host,
				totalCost,
				ratio: `${weaken.threads}:${grow.threads}:${growWeaken.threads}`,
				cost: `${weaken.cost}:${grow.cost}:${growWeaken.cost}`,
				moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
			}
		});
	ns.tprint(JSON.stringify(hosts, null, 2));
}