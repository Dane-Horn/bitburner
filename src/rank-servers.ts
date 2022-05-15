import { NS } from 'NetscriptDefinitions';
import { getAllHosts, hwgw, mostEfficient, rankServers } from './scripts/util';

export async function main(ns: NS) {
	const [percentageToSteal = 0.05] = ns.args as [number, string];
	const servers = rankServers(ns, percentageToSteal);
	ns.tprint(JSON.stringify(servers, null, 4))
}

