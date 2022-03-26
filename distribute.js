/** @param {NS} ns **/
export async function main(ns) {
	const [host, script, ...args] = ns.args;
	const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	const cost = ns.getScriptRam(script);
	const maxThreads = free / cost;
	const nThreads = Number(await ns.prompt(`number of threads, max threads for this script and host is ${maxThreads}`, { type: 'text' }));
	const copyResult = await ns.scp(script, host);
	ns.tprint(`script copied: ${copyResult}`);
	const pid = ns.exec(script, host, nThreads, ...args);
	if (pid > 0) {
		ns.tprint(`process with pid ${pid} successfully started`);
	} else {
		ns.tprint(`process failed to start`);
	}

}