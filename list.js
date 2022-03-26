import { pick, getAllHosts } from './scripts/util.js'

/** @param {NS} ns **/
export async function main(ns) {
	const [filter, ...select] = ns.args;
	ns.tprint(select);
	const hosts = getAllHosts(ns, ns.getHostname(), 0, [])
		.map((host) => ns.getServer(host))
		.map((server) => select.length > 0 ? pick(server, select): server)
		.filter(eval(filter));
	ns.tprint(JSON.stringify(hosts, null, 2));
	return 0;
}