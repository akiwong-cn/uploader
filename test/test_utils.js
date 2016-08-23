import {assert} from 'chai/chai'
import {merge} from '../src/util'

describe('test merge function', () => {
    it('merge two object', () => {
        var a = {a: 1};
        var b = {b: 2};
        merge(a, b);
        assert.equal(a['b'], 2);
        assert.deepEqual(Object.keys(b), ['b']);
        assert.deepEqual(Object.keys(a), ['a', 'b']);
    });

    it('merge multi object', () => {
        var a = {a: 1};
        var b = {b: 2};
        var c = {c: b};
        merge(a, b, c);
        assert.deepEqual(Object.keys(b), ['b']);
        assert.deepEqual(Object.keys(c), ['c']);
        assert.deepEqual(Object.keys(a), ['a', 'b', 'c']);
        assert.equal(a['c'], b);
    });
})
