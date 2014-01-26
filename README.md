# Plumbing.js

Plumbing is a tool for architecting and parallizing complex
operations. In a way it can be thought of like dependency injection
for a set of interindependent calculations.

Plumbing.js helps you to organize your code in a composable manner, and
handles parameter arguments that your functions need to operate. It
embraces the idea of functional composition to help simplify the writing
and maintenance of these kinds of operations.

In addition to helping with code organization and composability, it
also lets us parallelize operations that can be run in tandem taking
full advantage of browsers or environments that support WebWorkers.

Plumbing.js is based on [Prismatics Plumbing library](https://github.com/Prismatic/plumbing) for Clojure.

# Examples

## The Old Way

Lets consider calculating a few statistics on an array of numbers. We
could easily create a tightly-coupled iterative function that does
what we want.

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
    stats([1, 2, 3, 6]);
    // => {n: 4, m: 3, m2: 12.5, v: 3.5}

However this function is brittle, and doesn't let us use any of the
intermediate calculations independently. We can do better.

## The Eager Compile Example

Using Plumbing.js we can refactor our stats example into a loosely
coupled and composable object.

    var stats_graph = {
      n: function(xs) {return xs.length;},
      m: function(xs, n) {return sum(xs) / n;},
      m2: function(xs, n) {return sum(xs, function(i) {return i * i;}) / n;},
      v: function(m, m2) {return m2 - (m * m);}
    };

    var graph = new Graph();
    var stats_eager = graph.eagerCompile(stats_graph);
    stats_eager({xs: [1, 2, 3, 6]});
    // => {n: 4, m: 3, m2: 12.5, v: 3.5}

If we later decide we want to calculate the standard deviation, we can
extend our graph easily.

    var graph = new Graph();
    var stats_extended = graph.eagerCompile(utils.merge(stats_graph,
                                                        {sd: function(v) {return Math.sqrt(v);}}));
    output = stats_extended({xs: [1, 2, 3, 6]});
    // => {n: 4, m: 3, m2: 12.5, v: 3.5, sd: 1.8708286933869707}

## An Asynchronous Example

We can use asynchronous functions too.

If you have a graph of asynchronous functions, we will organize
and execute them while handling their callback chaining for you. We
will return the results in a final callback. Just use `asyncCompile`.

    var example = {
      fn1: function(args, cb) {},
      fn2: function(args, cb) {},
      fn3: function(args, cb) {}
    };
    async_example = graph.asyncCompile(example)
    async_example(input, function(results) {
      // results => {fn1: ..., fn2: ..., fn3: ...}
    });

## Using WebWorkers to Perform Parallel Operations (In Progress...)

Since we can organize several asynchronous functions, we can also
defer our work to seperate WebWorker processes. Now if your functions
can be run in parallel at any point, we will ensure that this happens.
You don't even need to know how to use a WebWorker, or deal with any
messages. This time use `workerCompile`.

If we were to run these calculations in series it will take about
eight seconds to complete.

    var example = {
      one: function(cb) { setTimeout(function() {cb(1)}, 1000) },
      two: function(cb) { setTimeout(function() {cb(2)}, 1000) },
      three: function(cb) { setTimeout(function() {cb(3)}, 1000) }
      four: function(one, cb) { setTimeout(function() {cb(4)}, 1000) }
      five: function(one, two, three, cb) { setTimeout(function() {cb(5)}, 1000) }
      six: function(three, four, cb) { setTimeout(function() {cb(6)}, 1000) }
      seven: function(five, six, cb) { setTimeout(function() {cb(7)}, 1000) }
      eight: function(five, cb) { setTimeout(function() {cb(8)}, 1000) }
    };
    slow_example = graph.asyncCompile(example)

    var start = new Date();
    slow_example(input, function(results) {
      var time = start - new Date();
      // results => {one: ..., two: ..., three: ...}
      // time ~= 8 seconds
    });

With web workers we can run this in parallel, and almmost halve the
time it takes to complete.

    var example = {
      one: function(cb) { setTimeout(function() {cb(1)}, 1000) },
      two: function(cb) { setTimeout(function() {cb(2)}, 1000) },
      three: function(cb) { setTimeout(function() {cb(3)}, 1000) }
      four: function(one, cb) { setTimeout(function() {cb(4)}, 1000) }
      five: function(one, two, three, cb) { setTimeout(function() {cb(5)}, 1000) }
      six: function(three, four, cb) { setTimeout(function() {cb(6)}, 1000) }
      seven: function(five, six, cb) { setTimeout(function() {cb(7)}, 1000) }
      eight: function(five, cb) { setTimeout(function() {cb(8)}, 1000) }
    };
    parallel_example = graph.workerCompile(example)

    var start = new Date();
    parallel_example(input, function(results) {
      var time = start - new Date();
      // results => {one: ..., two: ..., three: ...}
      // time ~= 4 seconds!
    });

## TODO

- Browser compatibility
- Submit to npm
- More robust test cases
- Simple function profiling
- Web worker compilation

  Should allow us to compile a graph, and run all functions using web workers,
  handling the complexity of messaging and callbacks automatically.

  http://stackoverflow.com/questions/11909934/how-to-pass-functions-to-javascript-web-worker

- Better documentation
