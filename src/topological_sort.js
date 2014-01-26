// Topological sort
// Accepts: 2d graph where a [0 = no edge; non-0 = edge]
// Returns: 1d array where each index is that node's group_id
module.exports = function top_sort(edges) {
  var indices = [];
  function index(obj) {
    if (indices.indexOf(obj) !== -1) {
      return indices.indexOf(obj);
    } else {
      indices.push(obj);
      return indices.length - 1;
    }
  }
  
  function edges_to_graph(edges) {
    var graph = [];
    for (var i = 0; i < edges.length; i++) {
      var to = index(edges[i][0]);
      var from = index(edges[i][1]);
      if (typeof graph[from] === "undefined") {
        graph[from] = [];
      }
      graph[from][to] = 1;
    }
    var size = graph.length;
    for (i = 0; i < size; i++) {
      if (typeof graph[i] === "undefined") {
        graph[i] = [];
      }
      for (var j = 0; j < size; j++) {
        if (typeof graph[i][j] === "undefined") {
          graph[i][j] = 0;
        }
      }
    }
    return graph;
  }

  var graph = edges_to_graph(edges);
  var size = graph.length;
  var group_ids = [];
  for (var i = 0; i < size; i++) {
    group_ids.push(0);
  }
  var node_queue = [];

  // Find the root nodes, add them to the queue.
  for (var i = 0; i < size; i++) {
    var is_root = true;

    for (var j = 0; j < size; j++) {
      if (graph[i][j] !== 0) {
        is_root = false;
        break;
      }
    }

    if (is_root) {
      node_queue.push(i);
    }
  }

  // Detect error case and handle if needed.
  if (node_queue.length === 0) {
    throw new Error("No root nodes found in graph.");
  }

  // Depth first search, updating each node with it's new depth.
  while (node_queue.length > 0) {
    var cur_node = node_queue.pop();

    // For each node connected to the current node...
    for (var i = 0; i < size; i++) {
      if (graph[i][cur_node] === 0) { 
        continue; 
      }

      // See if dependent node needs to be updated with a later group_id
      if (group_ids[cur_node] + 1 > group_ids[i]) {
        group_ids[i] = group_ids[cur_node] + 1;
        node_queue.push(i);
      }
    }
  }
  
  var groups = [];
  for (var i = 0; i < group_ids.length; i++) {
    var group = group_ids[i];
    groups[i] = [group, indices[i]];
  }

  return groups.sort(function(a, b) {
    return a[0] > b[0];
  });
};