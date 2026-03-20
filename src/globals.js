(function() {
  window.global = window;
  window.process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: function(fn) { setTimeout(fn, 0); }
  };
})();
