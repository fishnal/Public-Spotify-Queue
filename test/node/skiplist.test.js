require('should');
const SkipList = require('../../src/node/skiplist.js');
const testData = require('./skiplist.test.data');

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

describe('SkipList', () => {
  const list = new SkipList();

  describe('empty', () => {
    testData['empty'].forEach((_test) => {
      it(_test.title, () => {
        list[_test.func](..._test.args).should.equal(_test.expected);
      });
    });
  });

  describe('addAfter', () => {
    overrideMathRandom(
      2, 1, 0, 0, 3,
      0, 2, 3, 0, 0
    );

    testData['addAfter'].forEach((_test) => {
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
        it(_test.title, () => {
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

  describe('get', () => {
    testData['get'].forEach((_test) => {
      it(_test.title, () => {
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

  describe('non-empty', () => {
    testData['non-empty'].forEach((_test) => {
      it(_test.title, () => {
        list[_test.func](..._test.args).should.equal(_test.expected);
      });
    });
  });

  describe('set', () => {
    testData['set'].forEach((_test) => {
      it(_test.title, () => {
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

  describe('remove', () => {
    testData['remove'].forEach((_test) => {
      it(_test.title, () => {
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
