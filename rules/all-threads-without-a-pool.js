var filtered = d.threads.filter(function (t) {
    return !/ThreadPoolExecutor\.runWorker|ForkJoinWorkerThread\.run/.test(t.frames.join("\n"));
});

if (!filtered.length) return [];

return [{
    level: "warn",
    title: nThreads(filtered.length) + " without a pool",
    items: filtered
}];
