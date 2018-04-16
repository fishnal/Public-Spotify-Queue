/**
 * Wraps an array so that it's read only.
 */
export class ReadOnlyArray<T> {
	/**
	 * Gets the element at the index.
	 * @param {number} index the index.
	 * @return {T} the element.
	 * @throws RangeError if the index is out of bounds.
	 */
	get: (index: number) => T;

	/**
	 * @return the size of the array.
	 */
	size: () => number;

	/**
	 * Performs an operation on each element. Optionally accepts
	 * the key for each value.
	 * @param {Function} callback the operation; optionally accepts the key of the element.
	 */
	forEach: (callback: (element: T, key?: string) => void) => void;

	/**
	 * Constructs a ReadOnlyArray from a given array.
	 * @param array the array to wrap.
	 */
	constructor(array: Array<T>) {
		this.get = (index: number): T => {
			if (index < 0 || index >= array.length) {
				throw new RangeError(`${index} not in range`);
			} else {
				return array[index];
			}
		}

		this.size = (): number => array.length;

		this.forEach = (callback: (element: T, key?: string) => void): void => {
			for (let key in array) {
				callback(array[key], key);
			}
		}
	}
}