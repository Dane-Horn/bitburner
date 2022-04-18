import { NS } from "NetscriptDefinitions";

const requestMap: any = {
    allocate: { func: allocate, hasResponse: true },
    allocateAll: { func: allocateAll, hasResponse: true },
}

const scriptTypeMap: any = {
    hack: { getServers: getManagedServers },
    grow: { getServers: getHomeFirst },
    weaken: { getServers: getHomeFirst },
}

export async function main(ns: NS) {
    ns.clearPort(1);
    ns.clearPort(2);
    ns.disableLog('ALL');
    while (true) {
        const request = JSON.parse(await blockRead(ns, 1));
        ns.print(request);
        const { func, hasResponse } = requestMap[request.type];
        const response = await func(ns, request);
        ns.print(response);
        if (hasResponse) await ns.tryWritePort(2, JSON.stringify(response));
    }
}

function getManagedServers(ns: NS) {
    const servers = ns.getPurchasedServers()
        .map((server) => { return { name: server, available: ns.getServerMaxRam(server) - ns.getServerUsedRam(server) } })
        .sort((a, b) => a.available - b.available);
    servers.push({ name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - 10 })
    return servers;
}

function getHomeFirst(ns: NS) {
    const servers = ns.getPurchasedServers()
        .map((server) => { return { name: server, available: ns.getServerMaxRam(server) - ns.getServerUsedRam(server) } })
        .sort((a, b) => a.available - b.available);
    servers.unshift({ name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - 10 })
    return servers;
}

function getHome(ns: NS) {
    return { name: 'home', available: ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - 10 };
}

// request: {script, threads, args}
// response: {pid: int}
async function allocate(ns: NS, request: AllocateRequest) {
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

// request: {requests: [{script, threads, args}]}
// response: {pids: [int]}
async function allocateAll(ns: NS, request: AllocateAllRequest) {
    const { requests } = request;
    const pids: number[] = [];
    for (const { script, scriptType, threads, args } of requests) {
        const cost = ns.getScriptRam(script) * threads;
        let allocated = false;
        for (const { name, available } of scriptTypeMap[scriptType].getServers(ns)) {
            if (available >= cost && threads > 0) {
                allocated = true;
                await ns.scp(script, name);
                const pid = ns.exec(script, name, threads, ...args)
                pids.push(pid);
                break;
            }
        }
        if (!allocated) pids.push(0);
    }
    ns.print(pids);
    return { ...request, pids };
}

async function blockRead(ns: NS, port: number) {
    while (ns.peek(port) == 'NULL PORT DATA') await ns.asleep(200);
    return ns.readPort(port);
}