(function(global) {
  "use strict";
  
  var Graph;
  function universal(fn) {
    if (typeof module !== 'undefined') {
      console.log("Node.js!!");
      Graph = module.exports = fn;

      // TODO have to assume it will be available in the browser
      global.topological_sort = require("./topological_sort");
      global.Promise = require('es6-promise').Promise;
    } else {
      console.log("Browser");
      Graph = global.Graph = fn;
      // TODO we will have to backwards compile to es5, if we want to use promises
      global.topological_sort = "TODO";
      global.Promise = "TODO";
    }
  }
  
  universal(function() {
    this.edges = [],
    this.keys = [],
    this.deps = [],
    this.addDependency = function(dep) {
      for (var i = 0; i < this.deps.length; i++) {
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

  });

  // TODO change arg name, it's too confusing with the other graph_inputs
  Graph.prototype.eagerCompile = function(input_graph) {
    var self = this;
    for (var key in input_graph) {
      self.keys.push(key);
      var args = self.getArguments(input_graph[key]);
      for (var i = 0; i < args.length; i++) {
        self.addDependency(args[i]);
        self.edges.push([args[i], key]);
      }
    }

    self.sorted = global.topological_sort(this.edges);
    //console.log('sorted', self.sorted);

    var compiled_graph = function() {

      var graph_inputs = arguments[0];
      compiled_graph.validate(graph_inputs);
      
      // Collect parameters, evaluate functions, and return

      // TODO need to sort output correctly

      var output = {};
      var required_output = compiled_graph.outputs();
      //console.log('required_output', required_output);
      //console.log('sorted', self.sorted);
      for (var i = 0; i < self.sorted.length; i++) {
        var key = self.sorted[i][1];
        if (required_output.indexOf(key) !== -1) {
          //console.log('--- sorted key', key);
          var fn = input_graph[key];

          var fn_inputs = self.getArguments(fn);
          var args = [];
          for (var j = 0; j < fn_inputs.length; j++) {
            var arg = fn_inputs[j];
            if (typeof graph_inputs[arg] !== "undefined") {
              args.push(graph_inputs[arg]);
            } else {
              args.push(output[arg]);
            }
          }
          output[key] = fn.apply(null, args);
        }
      }
      return output;
    };
    
    /**
     * Validates that the input data passed into this function
     * fits with what is expected by our compiled graph.
     */
    compiled_graph.validate = function(graph_inputs) {
      self.assert(typeof graph_inputs, "object", "Compiled graph inputs must be an object");

      var input_keys = Object.keys(graph_inputs);
      var required_input = compiled_graph.inputs();
      for (var i = 0; i < required_input.length; i++) {
        if (input_keys.indexOf(required_input[i]) === -1) {
          throw new Error("Dependency does not exist in inputs: " + self.deps[i]);
        }
      }
    };

    compiled_graph.inputs = function() {
      var inputs = [];
      for (var i = 0; i < self.deps.length; i++) {
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

  Graph.prototype.asyncCompile = function(input_graph) {
    var self = this;
    // TODO ensure that we test all functions have a callback
    for (var key in input_graph) {
      self.keys.push(key);
      var args = self.getArguments(input_graph[key]);
      for (var i = 0; i < args.length - 1; i++) {
        var dependency = args[i];
        if (dependency !== '') {
          self.addDependency(args[i]);
          self.edges.push([args[i], key]);
        }
      }
    }

    self.sorted = global.topological_sort(this.edges);
    //console.log('sorted', self.sorted);

    var compiled_graph = function() {

      var graph_inputs = arguments[0];
      var callback = arguments[1];
      // TODO validate callback is a fn
      compiled_graph.validate(graph_inputs);

      var output = {};
      var waiting = 0;
      var required_output = compiled_graph.outputs();
      //console.log('required_output', required_output);
      //console.log('sorted', self.sorted);

      function next(i) {
        var key = self.sorted[i][1];
        //console.log('next', key);
        if (required_output.indexOf(key) !== -1) {
          var fn = input_graph[key];

          var fn_inputs = self.getArguments(fn);
          var args = [];
          // Don't include the last paramater (presumed to be a callback)
          for (var j = 0; j < fn_inputs.length - 1; j++) {
            var arg = fn_inputs[j];
            if (typeof graph_inputs[arg] !== "undefined") {
              args.push(graph_inputs[arg]);
            } else {
              args.push(output[arg]);
            }
          }
          waiting++;
          args.push(function(answer) {
            output[key] = answer;
            waiting--;
            if (i+1 < self.sorted.length) {
              next(i + 1);
            }
          });
          fn.apply(null, args);
        } else {
          if (i+1 < self.sorted.length) {
            next(i + 1);
          }
        }
      };
      next(0);
      // We're going to want to abstract our compiled graph somewhat
      // to dry up our code. Execution will need it's own abstraction
      // EagerExecution, AsyncExecution, WorkerExecution

      // TODO we don't need to wait now that we're doing async right
      //console.log('waiting val', waiting);
      (function wait() {
        //console.log("- waiting -", waiting);
        if (waiting == 0) {
          callback(output);
        } else {
          setTimeout(wait, 100);
        }
      })();
    };
    
    compiled_graph.validate = function(graph_inputs) {
      self.assert(typeof graph_inputs, "object", "Compiled graph inputs must be an object");
      
      var input_keys = Object.keys(graph_inputs);
      var required_input = compiled_graph.inputs();
      for (var i = 0; i < required_input.length; i++) {
        // TODO we don't want cb to be in required inputs
        // we don't want to hardcode cb, we just need to ignore the last param of all incoming fns
        if (input_keys.indexOf(required_input[i]) === -1 && required_input[i] !== "cb") {
          throw new Error("Dependency does not exist in inputs: " + self.deps[i]);
        }
      }
    };
    
    compiled_graph.inputs = function() {
      var inputs = [];
      for (var i = 0; i < self.deps.length; i++) {
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

})(this);
