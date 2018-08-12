const SkipList = require('./../public/skiplist.js');
const { removeJsonComments } = require('./test_utils.js');
const fs = require('fs');
require('should');

const skiplistTestData = JSON.parse(fs.readFileSync('test/skiplist.test.json'));

removeJsonComments(skiplistTestData);

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
	})

	Math.random = () => {
		if (index >= pool.length) {
			// pool is done, revert
			Math.random = originalRandom;
			return Math.random();
		}

		// Math.random never returns 1, but we do it here just for some clarity
		return pool[index++];
	};
}

describe('SkipList', function() {
	const list = new SkipList();

	let expectedElements = [
		{ key: Number.NEGATIVE_INFINITY, value: null },
		{ key: 0, value: 'a' },
		{ key: 1, value: 'b' },
		{ key: -1, value: 'c' },
		{ key: 0.5, value: 'd' },
		{ key: -2, value: 'e' },
		{ key: 2, value: 'f' },
		{ key: 3, value: 'g' },
		{ key: 2.5, value: 'h' },
		{ key: 4, value: 'i' },
		{ key: 2.75, value: 'j' },
		{ key: Number.POSITIVE_INFINITY, value: null }
	]

	describe("#size()", function() {
		it('returns 0 when empty', function() {
			list.size().should.equal(0);
		});
	});

	describe("#toString()", function() {
		it('returns "[]" when empty', function() {
			list.toString().should.equal('[]');
		});
	});

	describe("#addAfter(number, any)", function() {
		let expectedSubLists = skiplistTestData.expectedSubLists.addAfter;

		// START--e-----------------h-----------END L3
		// START--e-----a-----------h-----g-----END L2
		// START--e-----a-----b-----h-----g-----END L1
		// START--e--c--a--d--b--f--h--j--g--i--END L0
		// order:	a (2), b (1), c (0), d (0), e (3)
		//			f (0), g (2), h (3), i (0), j (0)

		// addAfter args
		let addAfterTests = [
			{ args: [ null, 'a' ], expected: undefined },
			{ args: [ 0, 'b' ], expected: undefined },
			{ args: [ null, 'c' ], expected: undefined },
			{ args: [ 0, 'd' ], expected: undefined },
			{ args: [ -Infinity, 'e' ], expected: undefined },
			{ args: [ 1, 'f' ], expected: undefined },
			{ args: [ 2, 'g' ], expected: undefined },
			{ args: [ 2, 'h' ], expected: undefined },
			{ args: [ 3, 'i' ], expected: undefined },
			{ args: [ 2.5, 'j' ], expected: undefined }
		];

		overrideMathRandom(
			2, 1, 0, 0, 3,
			0, 2, 3, 0, 0
		);

		describe("throws a RangeError when there's not enough precision", function() {
			it('because of key averaging', function() {
				let tmpList = new SkipList();

				// adds key 0
				tmpList.addAfter(null, 0);
				// adds key 1
				tmpList.addAfter(0, 1);

				(() => {
					for (let i = 0; i < 1075; i++) {
						tmpList.addAfter(0, 'eventually runs out of precision');
					}
				}).should.throw(RangeError, {
					message: 'not enough precision, too much averaging'
				});
			});

			// we're going to override the implementation of Number#isSafeInteger(number) so we can
			// make the test quicker (a safe integer in this testing environment is within -10 and
			// 10); the original impl. will be restored after the test
			it('because of an unsafe integer', function() {
				let tmpList = new SkipList();
				let isSafeIntegerImpl = Number.isSafeInteger;
				let key = 0;

				Number.isSafeInteger = (number) => Math.abs(number) <= 10;

				(() => {
					tmpList.addAfter(null, 'start');

					for (let i = 0; i < 11; i++) {
						tmpList.addAfter(key++, 'key eventually becomes unsafe');
					}
				}).should.throw(RangeError, {
					message: 'not enough precision, unsafe integer'
				});

				Number.isSafeInteger = isSafeIntegerImpl;
			});
		});

		it('throws a TypeError when the relative key is not a number/null/undefined', function() {
			(() => list.addAfter('bad type', null)).should.throw(TypeError, {
				message: 'relativeKey must be a number of null/undefined'
			});
		});

		it('throws a ReferenceError when the relative key is not found', function() {
			(() => list.addAfter(0, null)).should.throw(ReferenceError, {
				message: 'relativeKey not found'
			});
		});

		it('throws a RangeError when adding after Infinity key', function() {
			(() => list.addAfter(Infinity, "doesn't matter")).should.throw(RangeError, {
				message: 'relativeKey must be less than positive infinity'
			});
		});

		addAfterTests.forEach(function(_test, ind) {
			let args = _test.args;
			let afterDesc = null;

			if (args[0] == null) {
				afterDesc = '[KEY NULL]';
			} else if (args[0] === Number.NEGATIVE_INFINITY) {
				afterDesc = '[KEY NEGATIVE_INFINITY]';
			} else {
				afterDesc = expectedElements.find((elem) => elem.key === args[0]).value;
			}

			it(`can add ${args[1]} after ${afterDesc}`, function() {
				(list.addAfter(...args) === undefined).should.be.true();

				let actualSubLists = getSubLists(list);

				actualSubLists.should.deepEqual(expectedSubLists[ind]);
			});
		});
	});

	describe("#get(number)", function() {
		expectedElements.forEach(function(expectedElement) {
			if (!Number.isFinite(expectedElement.key)) {
				it(`throws RangeError when getting ${expectedElement.key}`, function() {
					(() => list.get(expectedElement.key)).should.throw(RangeError, {
						message: 'key must be finite'
					});
				});
			} else {
				it(`returns ${expectedElement.value} for key ${expectedElement.key}`, function() {
					list.get(expectedElement.key).should.equal(expectedElement.value);
				});
			}
		});
	});

	describe("#size()", function() {
		it(`returns ${expectedElements.length - 2} after adding the previous elements`, function() {
			list.size().should.equal(expectedElements.length - 2);
		});
	});

	describe("#toString()", function() {
		it(`returns all ${expectedElements.length - 2} elements correctly`, function() {
			list.toString().should.equal(
				'[{-2=e},{-1=c},{0=a},{0.5=d},{1=b},{2=f},{2.5=h},{2.75=j},{3=g},{4=i}]'
			);
		});
	});

	describe("#set(number, any)", function() {
		let expectedSubLists = skiplistTestData.expectedSubLists.set;
		let setTests = [
			{ args: [ -10, 'fails' ], expected: false },
			{ args: [ 0, 'z' ], expected: true },
			{ args: [ 2.75, 'y' ], expected: true },
			{ args: [ -2, 'x' ], expected: true },
			{ args: [ 4, 'w' ], expected: true }
		];

		it('throws a TypeError if the key passed in is not a number', function() {
			(() => list.set('not a number', 'error')).should.throw(TypeError, {
				message: 'key must be a number'
			});
		});

		it('throws a RangeError if the key is not finite', function() {
			let shouldThrowArgs = [ RangeError, { message: 'key must be finite' } ];

			(() => list.set(Number.POSITIVE_INFINITY, 'error')).should.throw(...shouldThrowArgs);
			(() => list.set(Number.NEGATIVE_INFINITY, 'error')).should.throw(...shouldThrowArgs);
		});

		setTests.forEach(function(_test, ind) {
			let args = _test.args;
			let title = `returns ${_test.expected} when setting key ${args[0]} to value ${args[1]}`;

			it(title, function() {
				list.set(...args).should.equal(_test.expected);

				let actualSubLists = getSubLists(list);

				actualSubLists.should.deepEqual(expectedSubLists[ind]);
			});
		});
	});

	describe("#remove(number)", function() {
		let expectedSubLists = skiplistTestData.expectedSubLists.remove;
		let removeTests = [
			{ args: [ -10 ], expected: false },
			{ args: [ 0 ], expected: true },
			{ args: [ 4 ], expected: true },
			{ args: [ -2 ], expected: true },
			{ args: [ 2.75 ], expected: true },
			{ args: [ 2.5 ], expected: true },
			{ args: [ 0 ], expected: false }
		];

		it('throws a TypeError when the key is not a number', function() {
			(() => list.remove('not a number')).should.throw(TypeError, {
				message: 'key must be a number'
			});
		});

		it('throws a RangeError when the key is not finite', function() {
			(() => list.remove(Number.POSITIVE_INFINITY)).should.throw(RangeError, {
				message: 'key must be finite'
			});
			(() => list.remove(Number.NEGATIVE_INFINITY)).should.throw(RangeError, {
				message: 'key must be finite'
			});
		});

		removeTests.forEach(function(_test, ind) {
			let args = _test.args;
			let title = `returns ${_test.expected} when removing key ${args[0]}`;

			it(title, function() {
				let prevSize = list.size();

				list.remove(...args).should.equal(_test.expected);

				// assert that sizes are consistent
				if (_test.expected) {
					// expected a removal, so should be 1 less than prevSize
					list.size().should.equal(prevSize - 1);
				} else {
					// expected no removal, so size should be the same
					list.size().should.equal(prevSize);
				}

				// assert sub lists remain the same
				let actualSubLists = getSubLists(list);

				actualSubLists.should.deepEqual(expectedSubLists[ind]);
			});
		});
	});
});
