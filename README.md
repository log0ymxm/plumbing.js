# Plumbing.js

Plumbing.js reimplements the computational graph portion of
[Prismatics Plumbing library](https://github.com/Prismatic/plumbing) for Clojure.

I wanted to be able to use a similar paradigm for implementing some
computations inside a pure javascript environment, and found the idea
to be relatively simple to implement. If you happen to be using
clojurescript, you probably can use Prismatic's library without issue.

## Examples

A tightly-coupled gross example,

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

Refactoring our stats example into a loosely coupled and composable object,

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

We can extend our object to compute new things,

    var graph = new Graph();
    var stats_extended = graph.eagerCompile(utils.merge(stats_graph,
                                                        {sd: function(v) {return Math.sqrt(v);}}));
    output = stats_extended({xs: [1, 2, 3, 6]});
    // => {n: 4, m: 3, m2: 12.5, v: 3.5, sd: 1.8708286933869707}

## Other References

- Topological ordering code is based off code found in a gist by
  [@shinout](https://github.com/shinout) found here, https://gist.github.com/shinout/1232505
