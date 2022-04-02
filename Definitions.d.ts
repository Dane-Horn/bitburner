interface AllocateRequest {
    type: 'allocate',
    script: string,
    threads: number,
    args: (number | string)[]
}

interface AllocateAllRequest {
    type: 'allocateAll',
    requests: AllocateRequest[]
}