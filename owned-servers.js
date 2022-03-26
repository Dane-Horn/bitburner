/** @param {NS} ns **/
export async function main(ns) {
	const servers = ns.getPurchasedServers()
		.map((server) => ns.getServer(server))
		.map(({ hostname, maxRam, ramUsed }) => { return { hostname, maxRam, ramUsed } })
	ns.tprint(JSON.stringify(servers, null, 2));
}