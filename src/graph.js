// TODO make works with generic browser
var topological_sort = require("./topological_sort");

module.exports = graph = function() {
  this.edges = [],
  this.keys = [],
  this.deps = [],
  this.addDependency = function(dep) {
    for (i in this.deps) {
      if (this.deps[i] === dep) {
        return;
      }
    }
    this.deps.push(dep);
  };
  this.assert = function(obj1, obj2, message) {
    if (obj1 !== obj2) {
      throw new Error(message);
    }
  };
  this.getArguments = function(func) {
    // This regex is from require.js
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var args = func.toString().match(FN_ARGS)[1].split(',');
    args = args.map(function(a) { return a.trim(); });
    return args;
  };

};

// TODO change arg name, it's too confusing with the other graph_inputs
graph.prototype.eagerCompile = function(input_graph) {
  var self = this;
  for (key in input_graph) {
    self.keys.push(key);
    var args = self.getArguments(input_graph[key]);
    for (var i in args) {
      self.addDependency(args[i]);
      self.edges.push([args[i], key]);
    }
  }
  self.sorted = topological_sort(this.edges);
  
  var compiled_graph = function() {

    // Validate inputs

    var graph_inputs = arguments[0];
    self.assert(typeof graph_inputs, "object", "Compiled graph inputs must be an object");

    var input_keys = Object.keys(graph_inputs);
    var required_input = compiled_graph.inputs();
    for (i in required_input) {
      if (input_keys.indexOf(required_input[i]) === -1) {
        throw new Error("Dependency does not exist in inputs: " + self.deps[i]);
      }
    }
    
    // Collect parameters, evaluate functions, and return

    var output = {};
    var required_output = compiled_graph.outputs();
    for (i in required_output) {
      var key = required_output[i];
      var fn = input_graph[key];

      var fn_inputs = self.getArguments(fn);
      var args = [];
      for (i in fn_inputs) {
        var arg = fn_inputs[i];
        if (typeof graph_inputs[arg] !== "undefined") {
          args.push(graph_inputs[arg]);
        } else {
          args.push(output[arg]);
        }
      }
      output[key] = fn.apply(null, args);
    }
    return output;
  };

  compiled_graph.inputs = function() {
    var inputs = [];
    for (i in self.deps) {
      if (self.keys.indexOf(self.deps[i]) === -1) {
        inputs.push(self.deps[i]);
      }
    }
    return inputs;
  };

  compiled_graph.outputs = function() {
    return self.keys;
  };

  return compiled_graph;
};

graph.prototype.parCompile = function(input_graph) {
  // TODO
  console.log("par_compile");
  return function() {};
};

graph.prototype.profiled = function(input_graph) {
  // TODO
  console.log("profiled");
};