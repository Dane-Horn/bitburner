import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    const crimes = [
        'shoplift',
        'rob store',
        'mug someone',
        'larceny',
        'deal drugs',
        'bond forgery',
        'traffick illegal arms',
        'homicide',
        'grand theft auto',
        'kidnap and ransom',
        'assassinate',
        'heist',
    ]
    const [crime] = ns.args as [string]
    await ns.prompt("confirm committing crime")
    ns.tail();
    while (true) {
        const bestCrime = crimes
            .map((crime) => getCrimeMetrics(ns, crime))
            .reduce((max, next) => {
                return ((max.karma * max.chance) / max.time) > ((next.karma * next.chance) / next.time) ? max : next
            });
        ns.print(bestCrime)
        ns.singularity.commitCrime(crime || bestCrime.name);
        while (ns.singularity.isBusy()) {
            if ((ns as any).heart.break() < -54000) ns.exit()
            ns.print('committing crime - please standby')
            await ns.asleep(250);
        }
        ns.toast(`Karma: ${(ns as any).heart.break()}`)
    }
}

function getCrimeMetrics(ns: NS, crime: string) {
    const stats = ns.singularity.getCrimeStats(crime)
    const chance = ns.singularity.getCrimeChance(crime)
    const time = stats.time
    const metrics = {
        name: crime,
        karma: stats.karma,
        money: stats.money,
        time,
        chance,
        expectedGainPerSecond: stats.money * chance / (time / 1000),
        gainWithKarma: stats.money * chance / (time / 1000) * stats.karma,
    }
    return metrics;
}
