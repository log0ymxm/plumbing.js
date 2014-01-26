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
    assert.equal(sorted[0][1], 1);
    assert.equal(sorted[1][1], 2);
    assert.equal(sorted[2][1], 3);
    assert.equal(sorted[3][1], 4);
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
      assert.equal(e.message, "No root nodes found in graph.");
    }
  });
  
  it("should let us get the depth of dependencies", function() {
    var edges = [
      [1, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [3, 6],
      [4, 6],
      [5, 7],
      [5, 8],
      [6, 7]
    ];
    var expected = [
      [0,1],
      [0,2],
      [0,3],
      [1,4],
      [1,5],
      [2,6],
      [2,8],
      [3,7]
    ];
    var sorted = topological_sort(edges);
    //assert.equal(sorted, expected);
    assert.equal(sorted[0][0], 0);
    assert.equal(sorted[0][1], 1);
    assert.equal(sorted[1][0], 0);
    assert.equal(sorted[1][1], 2);
    assert.equal(sorted[2][0], 0);
    assert.equal(sorted[2][1], 3);
    assert.equal(sorted[3][0], 1);
    assert.equal(sorted[3][1], 4);
    assert.equal(sorted[4][0], 1);
    assert.equal(sorted[4][1], 5);
    assert.equal(sorted[5][0], 2);
    assert.equal(sorted[5][1], 6);
    assert.equal(sorted[6][0], 2);
    assert.equal(sorted[6][1], 8);
    assert.equal(sorted[7][0], 3);
    assert.equal(sorted[7][1], 7);

  });
  
});