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
    while (true) {
        const bestCrime = crimes
            .map((crime) => getCrimeMetrics(ns, crime))
            .filter(({ chance }) => chance > 0.5)
            .reduce((max, next) => { return max.gainWithKarma > next.gainWithKarma ? max : next });
        ns.print(bestCrime)
        ns.singularity.commitCrime(crime || bestCrime.name);
        while (ns.singularity.isBusy()) {
            if ((ns as any).heart.break() < -54000) ns.exit()
            ns.print('committing crime - please standby')
            await ns.asleep(250);
        }
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
