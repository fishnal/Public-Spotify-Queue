const fs = require('fs');
require('should');
const SkipList = require('../../../src/js/backend/skiplist.js');

const testData = JSON.parse(fs.readFileSync(`${__dirname}/skiplist.test.json`), (key, value) => {
    if (value instanceof Array) {
        // replace stringy Infinity occurrences to their literal counterparts in the array
        value.forEach((elem, ind) => {
            if ((/[+-]Infinity/).test(elem)) {
                value[ind] = Number(elem);
            }
        });
    } else if (key === 'error') {
        // convert stringy error to it's class counterpart
        value = global[value];
    }

    return value;
});

/**
 * Gets all the lists involved in a skip list.
 *
 * @param {SkipList} list the skip list
 * @returns {object[]} all the sub lists in the skip list.
 */
function getSubLists(list) {
    let subLists = [];

    list.forEachList(Array.prototype.push, subLists);

    return subLists;
}

/**
 * Overrides `Math.random` for testing purposes. Returns 0 or 1 depending on what boolean value is
 * popped next from the pool. If the pool is empty, then `Math.random` is reassigned back to it's
 * original definition.
 * @param {number[]} [promotionValues] indicates how many times each element should be promoted
 * (i.e. [1,3] would mean the first element is promoted once, and the second is promoted three
 * times); negative values become 0.
 * @returns {void}
 */
function overrideMathRandom(...promotionValues) {
    const originalRandom = Math.random;
    let index = 0;
    // indicates if an element will be promoted
    let pool = [];

    // make the pool
    promotionValues.forEach((promotionCount) => {
        if (promotionCount < 0) {
            // negative value becomes 0
            promotionCount = 0;
        }

        for (let i = 0; i < promotionCount; i++) {
            pool.push(true);
        }

        pool.push(false);
    });

    Math.random = () => {
        // Math.random never returns 1, but we do it here just for some clarity
        let poolValue = pool[index++];

        if (index >= pool.length) {
            // pool is done, revert override
            Math.random = originalRandom;
        }

        return poolValue;
    };
}

describe('SkipList', function() {
    const list = new SkipList();

    describe('empty', function() {
        testData['empty'].forEach(function(_test) {
            it(_test.title, function() {
                list[_test.func](..._test.args).should.equal(_test.expected);
            });
        });
    });

    describe('addAfter', function() {
        overrideMathRandom(
            2, 1, 0, 0, 3,
            0, 2, 3, 0, 0
        );

        testData['addAfter'].forEach(function(_test) {
            if (_test.test_id === 'addAfter_key_avg') {
                let overriddenRand = Math.random;
                let tmpList = new SkipList();

                // prevent promotions
                Math.random = () => 0;

                // adds key 0
                tmpList.addAfter(null, null);
                // adds key 1
                tmpList.addAfter(0, null);

                (() => {
                    for (let i = 0; i < 1075; i++) {
                        tmpList.addAfter(0, null);
                    }
                }).should.throw(RangeError, {
                    message: 'too much averaging'
                });

                Math.random = overriddenRand;
            } else if (_test.test_id === 'addAfter_unsafe_int') {
                let isSafeIntegerImpl = Number.isSafeInteger;
                let overriddenRand = Math.random;
                let tmpList = new SkipList();
                let key = 0;

                Math.random = () => 0;
                Number.isSafeInteger = (number) => Math.abs(number) <= 10;

                (() => {
                    tmpList.addAfter(null, null);

                    for (let i = 0; i < 11; i++) {
                        tmpList.addAfter(key++, null);
                    }
                }).should.throw(RangeError, {
                    message: 'unsafe integer'
                });

                Math.random = overriddenRand;
                Number.isSafeInteger = isSafeIntegerImpl;
            } else {
                it(_test.title, function() {
                    if (_test.expected.error) {
                        (() => list.addAfter(..._test.args)).should.throw(_test.expected.error, {
                            message: _test.expected.message
                        });
                    } else {
                        list.addAfter(..._test.args).should.equal(_test.expected.returned);
                        getSubLists(list).should.deepEqual(_test.expected.lists);
                    }
                });
            }
        });
    });

    describe('get', function() {
        testData['get'].forEach(function(_test) {
            it(_test.title, function() {
                if (_test.expected.error) {
                    (() => list.get(..._test.args)).should.throw(_test.expected.error, {
                        message: _test.expected.message
                    });
                } else {
                    list.get(..._test.args).should.equal(_test.expected);
                }
            });
        });
    });

    describe('non-empty', function() {
        testData['non-empty'].forEach(function(_test) {
            it(_test.title, function() {
                list[_test.func](..._test.args).should.equal(_test.expected);
            });
        });
    });

    describe('set', function() {
        testData['set'].forEach(function(_test) {
            it(_test.title, function() {
                if (_test.expected.error) {
                    (() => list.set(..._test.args)).should.throw(_test.expected.error, {
                        message: _test.expected.message
                    });
                } else {
                    list.set(..._test.args).should.equal(_test.expected.returned);
                    getSubLists(list).should.deepEqual(_test.expected.lists);
                }
            });
        });
    });

    describe('remove', function() {
        testData['remove'].forEach(function(_test) {
            it(_test.title, function() {
                if (_test.expected.error) {
                    (() => list.remove(..._test.args)).should.throw(_test.expected.error, {
                        message: _test.expected.message
                    });
                } else {
                    list.remove(..._test.args).should.equal(_test.expected.returned);
                    getSubLists(list).should.deepEqual(_test.expected.lists);
                }
            });
        });
    });
});
