var createDefaultStream = require('./lib/default_stream');
var Test = require('./lib/test');
var createResultStream = require('./lib/results');

var canEmitExit = typeof process !== 'undefined' && process
    && typeof process.on === 'function'
;
var canExit = typeof process !== 'undefined' && process
    && typeof process.exit === 'function'
;

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate
    : process.nextTick
;

exports = module.exports = (function () {
    var harness;
    return function () {
        if (!harness) {
            harness = createHarness();
            harness.createStream().pipe(createDefaultStream());
        }
        return harness.apply(this, arguments);
    };
})();

exports.createHarness = createHarness;
exports.Test = Test;
exports.test = exports; // tap compat

var exitInterval;

function createHarness (conf_) {
    var exitCode = 0;
    var results;
    
    var test = function (name, conf, cb) {
        if (!results) {
            results = createResultStream();
            results.pause();
        }
        
        var t = new Test(name, conf, cb);
        (function inspectCode (st) {
            st.on('test', function sub (st_) {
                inspectCode(st_);
            });
            st.on('result', function (r) {
                if (!r.ok) exitCode = 1
            });
        })(t);
        
        results.push(t);
        return t;
    };
    
    test.createStream = function () {
        if (!results) results = createResultStream();
        nextTick(function () { results.resume() });
        return results;
    };
    
    return test;
}