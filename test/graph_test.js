var assert = require('assert');
var Graph = require('../src/graph');
var utils = require('../src/utils');

describe("Graph basics", function() {
  var sum = function(arr, map_fn) {
    if (typeof map_fn !== "undefined") {
      arr = arr.map(map_fn);
    }
    return arr.reduce(function(acc, i) {return acc + i;});
  };

  var stats = function(xs) {
    var n = xs.length;
    var m = sum(xs) / n;
    var m2 = sum(xs, function(i) {return i * i;}) / n;
    var v = m2 - (m * m);
    return {
      n: n, // count
      m: m, // mean
      m2: m2, // mean-square
      v: v // variance
    };
  };

  var stats_graph = {
    n: function(xs) {return xs.length;},
    m: function(xs, n) {return sum(xs) / n;},
    m2: function(xs, n) {return sum(xs, function(i) {return i * i;}) / n;},
    v: function(m, m2) {return m2 - (m * m);}
  };

  it("should be able to calculate basic stats", function() {
    var stats_vals = stats([1, 2, 3, 6]);
    assert.equal(stats_vals.n, 4);
    assert.equal(stats_vals.m, 3);
    assert.equal(stats_vals.m2, 12.5);
    assert.equal(stats_vals.v, 3.5);
  });
  
  it("should show you what inputs are required", function() {
    var graph = new Graph();
    var stats_eager = graph.eagerCompile(stats_graph);
    var inputs = stats_eager.inputs();
    assert.equal(inputs.length, 1);
    assert.equal(inputs[0], 'xs');
  });
  
  it("should show you what outputs are required", function() {
    var graph = new Graph();
    var stats_eager = graph.eagerCompile(stats_graph);
    var outputs = stats_eager.outputs();
    assert.equal(outputs.length, 4);
    assert.equal(outputs[0], 'n');
    assert.equal(outputs[1], 'm');
    assert.equal(outputs[2], 'm2');
    assert.equal(outputs[3], 'v');
  });
  
  it("should throw an error if we don't supply the right inputs", function() {
    var graph = new Graph();
    var stats_eager = graph.eagerCompile(stats_graph);
    try {
      stats_eager();
    } catch (e) {
      assert.equal(e.message, "Compiled graph inputs must be an object");
    }
    try {
      stats_eager({});
    } catch (e) {
      assert.equal(e.message, "Dependency does not exist in inputs: xs");
    }
  });
  
  it("should be able to eager compile a set of dependent functions", function() {
    var graph = new Graph();
    var stats_eager = graph.eagerCompile(stats_graph);
    var output = stats_eager({xs: [1, 2, 3, 6]});

    assert.equal(Object.keys(output).length, 4);
    assert.equal(output.n, 4);
    assert.equal(output.m, 3);
    assert.equal(output.m2, (25 / 2));
    assert.equal(output.v, (7 / 2));
  });
  
  it("should be able to extend a graph", function() {
    var graph = new Graph();
    var stats_extended = graph.eagerCompile(utils.merge(stats_graph,
                                                        {sd: function(v) {return Math.sqrt(v);}}));
    var output = stats_extended({xs: [1, 2, 3, 6]});

    assert.equal(Object.keys(output).length, 5);
    assert.equal(output.n, 4);
    assert.equal(output.m, 3);
    assert.equal(output.m2, (25 / 2));
    assert.equal(output.v, (7 / 2));
    assert.equal(output.sd, Math.sqrt(3.5));
  });
});