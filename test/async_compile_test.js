var assert = require("assert");
var Graph = require("../src/graph");
var test_utils = require("./test_utils");

describe("Asynchronous compilation", function() {
  var stats = {
    n: function(xs, cb) {
      setTimeout(function() {
        return cb(xs.length);
      }, 50);
    },
    m: function(xs, n, cb) {
      setTimeout(function() {
        return cb(test_utils.sum(xs) / n);
      }, 50);
    },
    m2: function(xs, n, cb) {
      setTimeout(function() {
        return cb(test_utils.sum(xs, function(i) {return i * i;}) / n);
      }, 50);
    },
    v: function(m, m2, cb) {
      setTimeout(function() {
        return cb(m2 - (m * m));
      }, 50);
    },
    sd: function(v, cb) {
      setTimeout(function() {
        return cb(Math.sqrt(v));
      }, 50);
    }
  };

  it("should be a function", function() {
    var graph = new Graph();
    assert.equal(typeof graph.asyncCompile, "function");
  });

  it("should return a function", function() {
    var graph = new Graph();
    var fns = {
      a: function(cb) {},
      b: function(a, cb) {}
    };
    assert.equal(typeof graph.asyncCompile(fns), "function");
  });

  it("should resolve callback dependencies automatically", function(done) {
    var graph = new Graph();
    var async_stats = graph.asyncCompile(stats);
    // TODO test to ensure that the callback runs
    async_stats({xs:[1, 2, 3, 6]}, function(output) {
      assert.equal(typeof output, "object");
      assert.equal(Object.keys(output).length, 5);
      assert.equal(output.n, 4);
      assert.equal(output.m, 3);
      assert.equal(output.m2, (25 / 2));
      assert.equal(output.v, (7 / 2));
      assert.equal(output.sd, Math.sqrt(3.5));
      done();
    });
  });

  it("should show you what inputs are required", function() {
    var graph = new Graph();
    var stats_async = graph.asyncCompile(stats);
    var inputs = stats_async.inputs();
    assert.equal(inputs, 'xs');
    assert.equal(inputs.length, 1);
    assert.equal(inputs[0], 'xs');
  });

  it("should show you what outputs are required", function() {
    var graph = new Graph();
    var stats_async = graph.asyncCompile(stats);
    var outputs = stats_async.outputs();
    assert.equal(outputs.length, 5);
    assert.equal(outputs[0], 'n');
    assert.equal(outputs[1], 'm');
    assert.equal(outputs[2], 'm2');
    assert.equal(outputs[3], 'v');
    assert.equal(outputs[4], 'sd');
  });

  it("should resolve callback dependencies automatically when graph is out of order", function(done) {
    var graph = new Graph();
    var stats = {
      sd: function(v, cb) {return cb(Math.sqrt(v));},
      n: function(xs, cb) {return cb(xs.length);},
      m2: function(xs, n, cb) {return cb(test_utils.sum(xs, function(i) {return i * i;}) / n);},
      v: function(m, m2, cb) {return cb(m2 - (m * m));},
      m: function(xs, n, cb) {return cb(test_utils.sum(xs) / n);}
    };
    var async_stats = graph.asyncCompile(stats);
    async_stats({xs:[1, 2, 3, 6]}, function(output) {
      assert.equal(typeof output, "object");
      assert.equal(Object.keys(output).length, 5);
      assert.equal(output.n, 4);
      assert.equal(output.m, 3);
      assert.equal(output.m2, (25 / 2));
      assert.equal(output.v, (7 / 2));
      assert.equal(output.sd, Math.sqrt(3.5));
      done();
    });
  });
  
  it("should throw an error if we don't supply the right inputs", function() {
    var graph = new Graph();
    var stats_async = graph.asyncCompile(stats);
    try {
      stats_async();
    } catch (e) {
      assert.equal(e.message, "Compiled graph inputs must be an object");
    }
    try {
      stats_async({});
    } catch (e) {
      assert.equal(e.message, "Dependency does not exist in inputs: xs");
    }
  });
  
});