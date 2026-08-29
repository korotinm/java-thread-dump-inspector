var filtered = d.threads.filter(function (t) {
    return /Thread-\d+/.test(t.name) && !/ThreadPoolExecutor\.runWorker|ForkJoinWorkerThread\.run/.test(t.frames.join("\n"));
});

if (!filtered.length) return [];

return [{
    level: "alert",
    title: nThreads(filtered.length) + "(unnamed) without a pool",
    items: filtered
}];
