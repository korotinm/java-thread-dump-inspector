// HDFS: output streams opened and never written to, never closed.
//
// Paste this whole file into Findings > Custom rules > + New rule.
// Fires only on dumps that contain Hadoop DFSOutputStream frames.

// Hadoop renames a DataStreamer thread once it allocates a block, so a thread still carrying
// the default name has an open output stream that never received data.
var leaked = d.threads.filter(function (t) {
  return /DFSOutputStream\$DataStreamer\.run/.test(t.frames.join("\n")) &&
         !/^DataStreamer for file/.test(t.name);
});
if (!leaked.length) return [];

return [{
  level: "warn",
  title: nThreads(leaked.length) + " opened an HDFS write stream and wrote nothing",
  text: "The output stream was created, no data was written and close() was never called. " +
        "These threads will not exit before the process does — look for an error path that " +
        "leaves the resource open. Blind spot: a stream abandoned after writing keeps its file " +
        "name and is not counted here, and in a single dump it looks identical to one still " +
        "writing. Compare two dumps to tell them apart.",
  items: leaked
}];
