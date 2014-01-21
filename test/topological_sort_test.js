var assert = require('assert');
var topological_sort = require('../src/topological_sort');

describe("Simple topological sorting", function() {
  it("should succeed", function() {
    var edges = [
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4]
    ];
    var sorted = topological_sort(edges);
    assert.equal(sorted[0], 1);
    assert.equal(sorted[1], 3);
    assert.equal(sorted[2], 2);
    assert.equal(sorted[3], 4);
  });
  
  it("should fail with circular dependencies", function() {
    // failure ( A > B > C > A )
    var edges = [
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A']
    ];
    
    try {
      var sorted = topological_sort(edges);
    }
    catch (e) {
      assert.equal(e.message, "closed chain : A is in C");
    }
  });
  
});