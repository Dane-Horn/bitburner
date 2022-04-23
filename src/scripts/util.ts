import { NS } from "NetscriptDefinitions";
import { getGrowTime, getHackTime, getWeakenTime } from "scripts/formulas";

function getAllHosts(ns: NS, current: string, depth: number, result: string[]) {
    result.push(current);
    const neighbours = ns.scan(current)
        .filter((host) => !result.includes(host));
    for (const neighbour of neighbours) {
        result = getAllHosts(ns, neighbour, depth + 1, result);
    }
    return result;
}

function getAvailableServers(ns: NS) {
    const servers = getAllHosts(ns, 'home', 0, [])
        .map(host => ns.getServer(host))
        .filter(server => server.hostname !== 'home' && server.hasAdminRights)
        .map((server) => { return { name: server.hostname, available: server.maxRam - server.ramUsed } })
        .sort((a, b) => a.available - b.available);
    servers.push({ name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - 10 })
    return servers;
}

function pick(obj: any, fields: string[]) {
    return fields
        .filter((field) => field in obj)
        .reduce((obj2: any, key) => (obj2[key] = obj[key], obj2), {});
}

function getPaths(ns: NS, source: string) {
    const paths: { [x: string]: string[]; } = buildPaths(ns, source, 0, [], {});
    Object.entries(paths).forEach(([_key, path]) => path.shift());
    return paths;
}

function buildPaths(ns: NS, current: string, depth: number, path: string[], result: { [x: string]: string[]; }) {
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

function getDelays(ns: NS, target: string) {
    const targetServer = ns.getServer(target);
    const player = ns.getPlayer();
    const weakenTime = getWeakenTime(targetServer, player);
    const hackTime = getHackTime(targetServer, player);
    const growTime = getGrowTime(targetServer, player);
    const longestTime = Math.max(weakenTime, hackTime, growTime);
    return {
        hackDelay: longestTime - hackTime,
        growDelay: longestTime - growTime,
        weakenDelay: longestTime - weakenTime,
        longestTime,
    };
}

function hwgw(ns: NS, target: string, percentageToSteal: number, hackScript: string, growScript: string, weakenScript: string) {
    const hackThreads = Math.ceil(percentageToSteal / ns.hackAnalyze(target));
    if (hackThreads === Infinity) throw new Error('infinite hack threads required');
    const maxBatches = Math.floor(ns.getWeakenTime(target) / (35 * 4))
    const targetServer = ns.getServer(target)
    const player = ns.getPlayer()
    const weakenTime = getWeakenTime(targetServer, player)
    const hackTime = getHackTime(targetServer, player);
    const growTime = getGrowTime(targetServer, player);
    const longestTime = Math.max(weakenTime, hackTime, growTime);
    const hackCost = ns.getScriptRam(hackScript) * hackThreads;
    const hackGain = ns.hackAnalyze(target) * hackThreads;
    const hackAmountGain = ns.getServerMoneyAvailable(target) * hackGain;
    const hackSecurityGain = ns.hackAnalyzeSecurity(hackThreads);
    const hackWeakenThreads = weakenThreadsRequired(ns, hackSecurityGain);
    const hackWeakenCost = ns.getScriptRam(weakenScript) * hackWeakenThreads;
    const percentageRequired = (growthPercentageRequired(ns, target, hackGain)) || 0;
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 + (percentageRequired * 1.1))) || 1;
    const growCost = ns.getScriptRam(growScript) * growThreads;
    const growSecurityGain = ns.growthAnalyzeSecurity(growThreads);
    const growWeakenThreads = weakenThreadsRequired(ns, growSecurityGain);
    const growWeakenCost = ns.getScriptRam(weakenScript) * growWeakenThreads;

    const gainPerMs = hackAmountGain / longestTime;
    const gainPerMsPerGB = gainPerMs / (hackCost + hackWeakenCost + growCost + growWeakenCost);
    return {
        maxBatches,
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

async function runHackBatch(ns: NS, target: string, percentageToSteal: number, hackScript: string, growScript: string, weakenScript: string, delay: number, batches?: number) {
    const batchDetails = hwgw(ns, target, percentageToSteal, hackScript, growScript, weakenScript);
    const { hackDelay, growDelay, weakenDelay } = getDelays(ns, target);
    let offset = 0;
    let requests: AllocateRequest[] = [];
    batches = Math.min(batches || 1, batchDetails.maxBatches);
    for (let i = 0; i < (batches); i++) {
        requests.push({
            type: 'allocate',
            script: hackScript,
            scriptType: "hack",
            threads: batchDetails.hack.threads,
            args: [target, hackDelay + (offset++ * delay), 'hack', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: weakenScript,
            scriptType: 'weaken',
            threads: batchDetails.hackWeaken.threads,
            args: [target, weakenDelay + (offset++ * delay), 'hackWeaken', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: growScript,
            scriptType: 'grow',
            threads: batchDetails.grow.threads,
            args: [target, growDelay + (offset++ * delay), 'grow', generateUuid()],
        });
        requests.push({
            type: 'allocate',
            script: weakenScript,
            scriptType: 'weaken',
            threads: batchDetails.growWeaken.threads,
            args: [target, weakenDelay + (offset++ * delay), 'growWeaken', generateUuid()],
        });
    }
    const { pids } = await request(ns, 1, 2, { type: 'allocateAll', requests });
    if (pids.some((pid: number) => !pid)) {
        for (const pid of pids) {
            ns.kill(pid);
        }
        return 0;
    }
    return batches;
}

async function runHackBatchStatic(ns: NS, target: string, hackThreads: number, hackScript: string, growScript: string, weakenScript: string, delay: number, host: string, longestTime?: number) {
    const batchDetails = hwgw(ns, target, hackThreads, hackScript, growScript, weakenScript);
    const { hackDelay, growDelay, weakenDelay } = getDelays(ns, target);
    await ns.scp([hackScript, growScript, weakenScript], host);
    const hackPid = ns.exec(hackScript, host, batchDetails.hack.threads, ...[target, hackDelay + (0 * delay), 'hack', generateUuid()])
    await ns.asleep(delay);
    const hackWeakenPid = ns.exec(weakenScript, 'home', batchDetails.hackWeaken.threads, ...[target, weakenDelay + (1 * delay), 'hackWeaken', generateUuid()]);
    await ns.asleep(delay);
    const growPid = ns.exec(growScript, 'home', batchDetails.grow.threads, ...[target, growDelay + (2 * delay), 'grow', generateUuid()]);
    await ns.asleep(delay);
    const growWeakenPid = ns.exec(weakenScript, 'home', batchDetails.growWeaken.threads, ...[target, weakenDelay + (3 * delay), 'growWeaken', generateUuid()]);
    await ns.asleep(delay);
    ns.print(`${hackPid} ${hackWeakenPid} ${growPid} ${growWeakenPid}`)
    if (!(hackPid || hackWeakenPid || growPid || growWeakenPid)) {
        ns.kill(hackPid);
        ns.kill(hackWeakenPid);
        ns.kill(growPid);
        ns.kill(growWeakenPid);
        ns.exit();
    }
}

function wgw(ns: NS, target: string, growScript: string, weakenScript: string, targetGrowth: number) {
    const targetServer = ns.getServer(target);
    const player = ns.getPlayer();
    const weakenTime = getWeakenTime(targetServer, player);
    const growTime = getGrowTime(targetServer, player);
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

async function runGrowBatch(ns: NS, target: string, growScript: string, weakenScript: string, targetGrowth: number, delay: number, batches?: number) {
    let offset = 0;
    let requests: AllocateRequest[] = [];
    let pids = [0, 0, 0];
    let tries = 0;
    while (!pids.every((pid: number) => pid)) {
        if (tries++ >= 10) {
            ns.print('failed to run grow batch')
            ns.exit();
        }
        const batchDetails = wgw(ns, target, growScript, weakenScript, targetGrowth);
        const { growDelay, weakenDelay } = getDelays(ns, target);
        for (const pid of pids) {
            ns.kill(pid);
        }
        requests = [];
        for (let i = 0; i < (batches || 1); i++) {
            requests.push({
                type: 'allocate',
                script: weakenScript,
                scriptType: 'weaken',
                threads: batchDetails.weaken.threads,
                args: [target, weakenDelay + (offset++ * delay), 'hackWeaken', generateUuid()],
            });
            requests.push({
                type: 'allocate',
                script: growScript,
                scriptType: 'grow',
                threads: batchDetails.grow.threads,
                args: [target, growDelay + (offset++ * delay), 'grow', generateUuid()],
            });
            requests.push({
                type: 'allocate',
                script: weakenScript,
                scriptType: 'weaken',
                threads: batchDetails.growWeaken.threads,
                args: [target, weakenDelay + (offset++ * delay), 'growWeaken', generateUuid()],
            });
        }
        offset++;
        const response = await request(ns, 1, 2, { type: 'allocateAll', requests });
        pids = response.pids;
        ns.print(pids)
        targetGrowth = targetGrowth * 0.5;
    }
}

async function runGrowBatchHome(ns: NS, target: string, growScript: string, weakenScript: string, targetGrowth: number, delay: number) {
    let weakenPid = 0,
        growPid = 0,
        growWeakenPid = 0,
        i = 0;
    while (weakenPid == 0 || growPid == 0 || growWeakenPid == 0) {
        ns.kill(weakenPid)
        ns.kill(growPid)
        ns.kill(growWeakenPid)
        ns.tprint(`target growth: ${targetGrowth}`)
        ns.tprint(`pids: ${weakenPid} ${growPid} ${growWeakenPid}`)
        if (i++ >= 10) ns.exit();
        const batchDetails = wgw(ns, target, growScript, weakenScript, targetGrowth);
        const { growDelay, weakenDelay } = getDelays(ns, target);
        weakenPid = ns.exec(weakenScript, 'home', batchDetails.weaken.threads || 1, ...[target, weakenDelay + (0 * delay), 'weaken', generateUuid()]);
        await ns.asleep(delay);
        growPid = ns.exec(growScript, 'home', batchDetails.grow.threads || 1, ...[target, growDelay + (1 * delay), 'grow', generateUuid()]);
        await ns.asleep(delay);
        growWeakenPid = ns.exec(weakenScript, 'home', batchDetails.growWeaken.threads || 1, ...[target, weakenDelay + (2 * delay), 'growWeaken', generateUuid()]);
        await ns.asleep(delay);
        targetGrowth = targetGrowth * 0.5
    }
}

function weakenThreadsRequired(ns: NS, securityAmount: number) {
    let threads = 0;
    while (ns.weakenAnalyze(threads) < securityAmount) threads += 1;
    return threads + 1;
}

function growthPercentageRequired(ns: NS, target: string, percentageLost: number) {
    const available = ns.getServerMoneyAvailable(target);
    const afterHack = available * (1 - percentageLost);
    const percentageRequired = (available - afterHack) / afterHack;
    return percentageRequired;
}

var lut: any = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
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

async function request(ns: NS, requestPort: number, responsePort: number, request: any) {
    const requestId = generateUuid();
    await ns.tryWritePort(requestPort, JSON.stringify({ ...request, requestId }));
    while (ns.peek(responsePort) == 'NULL PORT DATA' || JSON.parse(ns.peek(responsePort)).requestId != requestId) await ns.asleep(200);
    return JSON.parse(ns.readPort(responsePort));
}

async function noWaitRequest(ns: NS, requestPort: number, request: any) {
    const requestId = generateUuid();
    await ns.tryWritePort(requestPort, JSON.stringify({ ...request, requestId }));
    return;
}

async function allocateAll(ns: NS, allocateRequests: any[]) {
    const result = [];
    for (const req of allocateRequests) {
        result.push(await request(ns, 1, 2, req));
    }
    return result;
}

async function freeAll(ns: NS, freeRequests: any[]) {
    for (const req of freeRequests) {
        await noWaitRequest(ns, 1, req);
    }
}

export function mostEfficient(ns: NS, host: string, maxThreads: number, hackScript: string, growScript: string, weakenScript: string) {
    const range = (start: number, stop: number, step: number) =>
        Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
    return (range(1, maxThreads, 1) || [1])
        .map((hackThreads) => { return { host, server: ns.getServer(host), hwgw: hwgw(ns, host, hackThreads, hackScript, growScript, weakenScript) } })
        .sort((a, b) => b.hwgw.gainPerMsPerGB - a.hwgw.gainPerMsPerGB)[0];
}

export function rankServers(ns: NS, hackThreads: number) {
    const hackScript = '/scripts/hack.js';
    const growScript = '/scripts/grow.js';
    const weakenScript = '/scripts/weaken.js';
    const hosts = getAllHosts(ns, 'home', 0, [])
        .map((host: string) => mostEfficient(ns, host, hackThreads, hackScript, growScript, weakenScript))
        .filter(({ server: { hasAdminRights } }) => hasAdminRights)
        .filter(({ hwgw: { gainPerMsPerGB }, server: { moneyMax } }) => moneyMax && gainPerMsPerGB)
        .sort((a: { hwgw: { gainPerMsPerGB: number; }; }, b: { hwgw: { gainPerMsPerGB: number; }; }) => b.hwgw.gainPerMsPerGB - a.hwgw.gainPerMsPerGB)
        .map(({
            host,
            hwgw: {
                gainPerMsPerGB, hack, hackWeaken, grow, growWeaken, totalCost, batchTime,
            },
            server
        }) => {
            return {
                host,
                totalCost,
                batchTime,
                gainPerMsPerGB,
                hackThreads: hack.threads,
                ratio: `${hack.threads}:${hackWeaken.threads}:${grow.threads}:${growWeaken.threads}`,
                moneyPercentage: server.moneyAvailable / server.moneyMax * 100,
                minSec: server.minDifficulty,
                currSec: server.hackDifficulty,
            }
        });
    return hosts;
}

export {
    getAllHosts,
    pick,
    getPaths,
    wgw,
    generateUuid,
    request,
    getDelays,
    noWaitRequest,
    allocateAll,
    freeAll,
    hwgw,
    runHackBatch,
    runGrowBatch,
    runHackBatchStatic,
    runGrowBatchHome,
    getAvailableServers,
};