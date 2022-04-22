import { NS } from 'NetscriptDefinitions';
import { getAllHosts, mostEfficient } from './scripts/util';

export async function main(ns: NS) {
	const [hackThreads = 100, filterCode = "true"] = ns.args as [number, string];
	const hackScript = '/scripts/hack.js';
	const growScript = '/scripts/grow.js';
	const weakenScript = '/scripts/weaken.js';
	const hosts = getAllHosts(ns, 'home', 0, [])
		.map((host: string) => mostEfficient(ns, host, hackThreads, hackScript, growScript, weakenScript))
		.filter(({ server: { hasAdminRights } }) => hasAdminRights)
		.filter(({ hwgw: { gainPerMsPerGB }, server: { moneyMax } }) => moneyMax && gainPerMsPerGB)
		.sort((a: { hwgw: { gainPerMsPerGB: number; }; }, b: { hwgw: { gainPerMsPerGB: number; }; }) => a.hwgw.gainPerMsPerGB - b.hwgw.gainPerMsPerGB)
        .map(({
			host,
			hwgw: {
				gainPerMsPerGB, hack, hackWeaken, grow, growWeaken, totalCost, batchTime, maxHackThreads,
			},
			server
		}) => {
			return {
                host,
                maxHackThreads,
				totalCost,
				batchTime,
				gainPerMsPerGB,
				ratio: `${hack.threads}:${hackWeaken.threads}:${grow.threads}:${growWeaken.threads}`,
				moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
				minSec: server.minDifficulty,
				currSec: server.hackDifficulty,
			}
		})
        .filter((server) => eval(filterCode));
	ns.tprint(JSON.stringify(hosts, null, 2));
}

