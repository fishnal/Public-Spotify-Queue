function SafeList(array) {
	this.get = function(index) {
		if (index < 0 || index >= array.length) {
			throw new RangeError(`${index} not in range`);
		} else {
			return array[index];
		}
	}

	this.size = function() {
		return array.length;
	}

	this.forEach = function(callback) {
		for (let i in array) {
			callback(array[i]);
		}
	}
}

module.exports = {
	SafeList: SafeList
}
