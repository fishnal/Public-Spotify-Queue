const { SkipList } = require('./../public/utils.js');
const { removeJsonComments } = require('./test_utils.js');
const fs = require('fs');
require('should');

const skiplistTestData = JSON.parse(fs.readFileSync('test/skiplist.test.json'));

removeJsonComments(skiplistTestData);

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
		let expectedSubLists = skiplistTestData.expectedSubLists;

		// START--e-----------------h-----------END L3
		// START--e-----a-----------h-----g-----END L2
		// START--e-----a-----b-----h-----g-----END L1
		// START--e--c--a--d--b--f--h--j--g--i--END L0
		// order:	a (2), b (1), c (0), d (0), e (3)
		//			f (0), g (2), h (3), i (0), j (0)

		// addAfter args
		let addAfterArgs = [
			[ null, 'a' ],
			[ 0, 'b' ],
			[ null, 'c' ],
			[ 0, 'd' ],
			[ -Infinity, 'e' ],
			[ 1, 'f' ],
			[ 2, 'g' ],
			[ 2, 'h' ],
			[ 3, 'i' ],
			[ 2.5, 'j' ]
		];

		overrideMathRandom(
			2, 1, 0, 0, 3,
			0, 2, 3, 0, 0
		);

		it('throws a ReferenceError when adding after a defined relative key', function() {
			(() => list.addAfter(0, null)).should.throw(ReferenceError);
		});

		addAfterArgs.forEach(function(args, ind) {
			let afterDesc = null;

			if (args[0] == null) {
				afterDesc = '[KEY NULL]';
			} else if (args[0] === Number.NEGATIVE_INFINITY) {
				afterDesc = '[KEY NEGATIVE_INFINITY]';
			} else {
				afterDesc = expectedElements.find((elem) => elem.key === args[0]).value;
			}

			it(`can add ${args[1]} after ${afterDesc}`, function() {
				list.addAfter(...args);

				let actualSubLists = [];

				list.forEachList((subList) => actualSubLists.push(subList));

				actualSubLists.should.deepEqual(expectedSubLists[ind]);
			});
		});

		it('throws a RangeError when adding after Infinity key', function() {
			(() => list.addAfter(Infinity, "doesn't matter")).should.throw(RangeError);
		});
	});

	describe("#get(number)", function() {
		expectedElements.forEach(function(expectedElement) {
			if (!Number.isFinite(expectedElement.key)) {
				it(`throws RangeError when getting ${expectedElement.key}`, function() {
					(() => list.get(expectedElement.key)).should.throw(RangeError);
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
});
