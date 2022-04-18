interface AllocateRequest {
    type: 'allocate',
    script: string,
    scriptType: "hack" | "grow" | "weaken",
    threads: number,
    args: (number | string)[]
}

interface AllocateAllRequest {
    type: 'allocateAll',
    requests: AllocateRequest[]
}