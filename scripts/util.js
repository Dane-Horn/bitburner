/** @param {NS} ns **/
function getAllHosts(ns, current, depth, result) {
	result.push(current);
	const neighbours = ns.scan(current)
		.filter((host) => !result.includes(host));
	for (const neighbour of neighbours) {
		result = getAllHosts(ns, neighbour, depth + 1, result);
	}
	return result;
}

function pick(obj, fields) {
	return fields
		.filter((field) => field in obj)
		.reduce((obj2, key) => (obj2[key] = obj[key], obj2), {});
}

/** @param {NS} ns **/
function getPaths(ns, source) {
	const paths = buildPaths(ns, source, 0, [], {});
	Object.entries(paths).forEach(([key, path]) => path.shift());
	return paths;
}

/** @param {NS} ns **/
function buildPaths(ns, current, depth, path, result) {
	path.push(current);
	result[current] = path;
	const neighbours = ns.scan(current)
		.filter((host) => !(host in result));
	if (neighbours.length == 0) return result;
	for (const neighbour of neighbours) {
		result = buildPaths(ns, neighbour, depth + 1, [...path], result);
	}
	return result;
}

/** @param {NS} ns **/
function getDelays(ns, target) {
	const weakenTime = ns.getWeakenTime(target);
	const hackTime = ns.getHackTime(target);
	const growTime = ns.getGrowTime(target);
	const longestTime = Math.max(weakenTime, hackTime, growTime);
	return {
		hackDelay: longestTime - hackTime,
		growDelay: longestTime - growTime,
		weakenDelay: longestTime - weakenTime,
		longestTime,
	};
}

/** @param {NS} ns **/
function hwgw(ns, target, hackThreads, hackScript, growScript, weakenScript) {
	const weakenTime = ns.getWeakenTime(target);
	const hackTime = ns.getHackTime(target);
	const growTime = ns.getGrowTime(target);
	const longestTime = Math.max(weakenTime, hackTime, growTime);

	const hackCost = ns.getScriptRam(hackScript) * hackThreads;
	const hackGain = ns.hackAnalyze(target) * hackThreads;
	const hackAmountGain = ns.getServerMoneyAvailable(target) * hackGain;
	const hackSecurityGain = ns.hackAnalyzeSecurity(hackThreads);
	const hackWeakenThreads = weakenThreadsRequired(ns, hackSecurityGain);
	const hackWeakenCost = ns.getScriptRam(weakenScript) * hackWeakenThreads;
	const percentageRequired = (growthPercentageRequired(ns, target, hackGain) + 0.02) || 0;
	const growThreads = Math.ceil(ns.growthAnalyze(target, 1 + percentageRequired));
	const growCost = ns.getScriptRam(growScript) * growThreads;
	const growSecurityGain = ns.growthAnalyzeSecurity(growThreads);
	const growWeakenThreads = weakenThreadsRequired(ns, growSecurityGain);
	const growWeakenCost = ns.getScriptRam(weakenScript) * growWeakenThreads;

	const gainPerMs = hackAmountGain / longestTime;
	const gainPerMsPerGB = gainPerMs / (hackCost + hackWeakenCost + growCost + growWeakenCost);
	return {
		batchTime: longestTime,
		gainPerMs,
		gainPerMsPerGB,
		totalCost: hackCost + hackWeakenCost + growCost + growWeakenCost,
		hack: {
			threads: hackThreads,
			cost: hackCost,
			time: hackTime,
			securityGain: hackSecurityGain,
			percentGain: hackGain,
			amountGain: hackAmountGain,
		},
		hackWeaken: {
			threads: hackWeakenThreads,
			cost: hackWeakenCost,
			time: weakenTime,
		},
		grow: {
			threads: growThreads,
			cost: growCost,
			time: growTime,
			securityGain: growSecurityGain,
		},
		growWeaken: {
			threads: growWeakenThreads,
			cost: growWeakenCost,
			time: weakenTime,
		},
	};
}

/** @param {NS} ns **/
function wgw(ns, target, growScript, weakenScript, targetGrowth) {
	const weakenTime = ns.getWeakenTime(target);
	const growTime = ns.getGrowTime(target);
	const longestTime = Math.max(weakenTime, growTime);

	const secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
	const weakenThreads = weakenThreadsRequired(ns, secDiff);
	const weakenCost = ns.getScriptRam(weakenScript) * weakenThreads;
	const growThreads = Math.ceil(ns.growthAnalyze(target, 1 + targetGrowth));
	const growCost = ns.getScriptRam(growScript) * growThreads;
	const growSecurityGain = ns.growthAnalyzeSecurity(growThreads);
	const growWeakenThreads = weakenThreadsRequired(ns, growSecurityGain);
	const growWeakenCost = ns.getScriptRam(weakenScript) * growWeakenThreads;

	return {
		host: target,
		batchTime: longestTime,
		totalCost: weakenCost + growCost + growWeakenCost,
		weaken: {
			threads: weakenThreads,
			cost: weakenCost,
			time: weakenTime,
		},
		grow: {
			threads: growThreads,
			cost: growCost,
			time: growTime,
			securityGain: growSecurityGain,
		},
		growWeaken: {
			threads: growWeakenThreads,
			cost: growWeakenCost,
			time: weakenTime,
		},
	};
}

/** @param {NS} ns **/
function weakenThreadsRequired(ns, securityAmount) {
	let threads = 0;
	while (ns.weakenAnalyze(threads) < securityAmount) threads += 1;
	return threads;
}

/** @param {NS} ns **/
function growthPercentageRequired(ns, target, percentageLost) {
	const available = ns.getServerMoneyAvailable(target);
	const afterHack = available * (1 - percentageLost);
	const percentageRequired = (available - afterHack) / afterHack;
	return percentageRequired;
}

var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
function generateUuid() {
	var d0 = Math.random() * 0xffffffff | 0;
	var d1 = Math.random() * 0xffffffff | 0;
	var d2 = Math.random() * 0xffffffff | 0;
	var d3 = Math.random() * 0xffffffff | 0;
	return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
		lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
		lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
		lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}
/** @param {NS} ns **/
async function request(ns, requestPort, responsePort, request) {
	const requestId = generateUuid();
	await ns.tryWritePort(requestPort, JSON.stringify({ ...request, requestId }));
	while (ns.peek(responsePort) == 'NULL PORT DATA' || JSON.parse(ns.peek(responsePort)).requestId != requestId) await ns.asleep(500);
	return JSON.parse(ns.readPort(responsePort));
}

/** @param {NS} ns **/
async function noWaitRequest(ns, requestPort, request) {
	const requestId = generateUuid();
	await ns.tryWritePort(requestPort, JSON.stringify({ ...request, requestId }));
	return;
}

/** @param {NS} ns **/
async function allocateAll(ns, allocateRequests) {
	const result = [];
	for (const req of allocateRequests) {
		result.push(await request(ns, 1, 2, req));
	}
	return result;
}

/** @param {NS} ns **/
async function freeAll(ns, freeRequests) {
	for (const req of freeRequests) {
		await noWaitRequest(ns, 1, req);
	}
}

export { getAllHosts, pick, getPaths, wgw, generateUuid, request, getDelays, noWaitRequest, allocateAll, freeAll, hwgw };