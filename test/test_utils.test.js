const { removeJsonComments } = require('./test_utils.js');
const fs = require('fs');
require('should');

const testData = JSON.parse(fs.readFileSync('test/test_utils.test.json'));

describe('test_utils', function() {
	describe('removeJsonComments(object, ...string)', function() {
		/**
		 * @type {string[]}
		 */
		let arr = testData.arr;
		let testArgs = testData.testArgs;

		testArgs.forEach(function(args, testInd) {
			if (!args) {
				it('should remove all strings prefixed with one of [#,//]', function() {
					removeJsonComments(arr);
					arr.should.deepEqual(testData.expectedArrs[testInd]);
				});
			} else {
				it(`should remove all strings prefixed with one of [${args}]`, function() {
					removeJsonComments(arr, ...args);
					arr.should.deepEqual(testData.expectedArrs[testInd]);
				});
			}
		});
	});

});
