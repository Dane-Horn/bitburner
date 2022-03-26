let servers;
/** @param {NS} ns **/
export async function main(ns) {
	ns.exec('clearPorts.js', 'home', 1);
	const requestMap = {
		allocate: { func: allocate, hasResponse: true },
	}
	while (true) {
		const request = JSON.parse(await blockRead(ns, 1));
		ns.print(request);
		const { func, hasResponse } = requestMap[request.type];
		const response = await func(ns, request);
		ns.print(response);
		if (hasResponse) await ns.tryWritePort(2, JSON.stringify(response));
	}
}

function getManagedServers(ns) {
	const servers = ns.getPurchasedServers()
		.map((server) => { return { name: server, available: ns.getServerMaxRam(server) - ns.getServerUsedRam(server) } })
		.sort((a, b) => a.available - b.available);
	servers.push({ name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') })
	return servers;
}

// request: {script, threads, args}
// response: {allocatedServer: string}
/** @param {NS} ns **/
async function allocate(ns, request) {
	const { script, threads, args } = request;
	const cost = ns.getScriptRam(script) * threads;
	for (const { name, available } of getManagedServers(ns)) {
		if (available >= cost) {
			await ns.scp(script, name);
			const pid = ns.exec(script, name, threads, ...args)
			return { ...request, pid };
		}
	}
	return { ...request, pid: 0 };
}

/** @param {NS} ns **/
async function blockRead(ns, port) {
	while (ns.peek(port) == 'NULL PORT DATA') await ns.sleep(500);
	return ns.readPort(port);
}