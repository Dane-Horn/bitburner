import { NS } from "../NetscriptDefinitions";

export async function main(ns: NS) {
    while (true) {
        const { strength, defense, dexterity, agility } = ns.getPlayer();
        const stats: [string, number][] = [
            ['strength', strength],
            ['defense', defense],
            ['dexterity', dexterity],
            ['agility', agility]
        ]
        const [lowestStat] = stats.reduce((min, next) => min[1] < next[1] ? min : next);
        ns.singularity.gymWorkout('powerhouse gym', lowestStat, false)
        await ns.asleep(5000);
    }
}

