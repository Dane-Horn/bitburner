import { NS } from 'NetscriptDefinitions';
import { getAllHosts, hwgw, mostEfficient } from './scripts/util';

export async function main(ns: NS) {
	const [percentageToSteal = 0.5, filterCode = "true"] = ns.args as [number, string];
	const hackScript = '/scripts/hack.js';
	const growScript = '/scripts/grow.js';
	const weakenScript = '/scripts/weaken.js';
	const hosts = getAllHosts(ns)
        .filter((host: string) => {
            const threadsNeeded = Math.ceil(0.5 / ns.hackAnalyze(host))
            return threadsNeeded !== Infinity;
        })
		.map((host: string) => ({
            host,
            server: ns.getServer(host),
            hwgw: hwgw(ns, host, percentageToSteal, hackScript, growScript, weakenScript), 
        }))
		.filter(({ server: { hasAdminRights } }) => hasAdminRights)
		.filter(({ hwgw: { gainPerMsPerGB }, server: { moneyMax } }) => moneyMax && gainPerMsPerGB)
		.sort((a: { hwgw: { gainPerMsPerGB: number; }; }, b: { hwgw: { gainPerMsPerGB: number; }; }) => a.hwgw.gainPerMsPerGB - b.hwgw.gainPerMsPerGB)
        .map(({
			host,
			hwgw: {
				gainPerMsPerGB, hack, hackWeaken, grow, growWeaken, totalCost, batchTime, maxBatches,
			},
			server
		}) => {
			return {
                maxBatches,
                host,
				totalCost,
				batchTime,
				gainPerMsPerGB,
                costs: `${hack.cost}:${hackWeaken.cost}:${grow.cost}:${growWeaken.cost}`,
				ratio: `${hack.threads}:${hackWeaken.threads}:${grow.threads}:${growWeaken.threads}`,
				moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
				minSec: server.minDifficulty,
				currSec: server.hackDifficulty,
			}
		})
        .filter((server) => eval(filterCode));
	ns.tprint(JSON.stringify(hosts, null, 2));
}

