import { NS, Server } from 'NetscriptDefinitions';
import { pick, getAllHosts } from './scripts/util'

/** @param {NS} ns **/
export async function main(ns: NS) {
	const [filter, ...select] = ns.args as [string, ...string[]];
	ns.tprint(select);
	const hosts = getAllHosts(ns, ns.getHostname(), 0, [])
		.map((host: string) => ns.getServer(host))
		.map((server: Server) => select.length > 0 ? pick(server, select): server)
		.filter(eval(filter as string));
	ns.tprint(JSON.stringify(hosts, null, 2));
	return 0;
}