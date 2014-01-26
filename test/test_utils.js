module.exports = {

  sum: function(arr, map_fn) {
    if (typeof map_fn !== "undefined") {
      arr = arr.map(map_fn);
    }
    return arr.reduce(function(acc, i) {return acc + i;});
  }

};