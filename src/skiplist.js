const { isNumber } = require('./utils.js');

/**
 * A doubly-linked node for a skip list. Can traverse forward and backward (for element traversal)
 * and up and down (for list traversal).
 *
 * @prop {Function} update
 */
class SkipNode {
    /**
     * Constructs a new SkipNode with all of it's links set to null.
     *
     * @param {number} key the key for this node.
     * @param {any} value the value for this node.
     */
    constructor(key, value) {
        if (key == null || !isNumber(key)) {
            throw new TypeError("key must be a number");
        }

        /**
         * The next node.
         *
         * @type {SkipNode}
         */
        this.next = null;

        /**
         * The previous node.
         *
         * @type {SkipNode}
         */
        this.prev = null;

        /**
         * The above node (should have the same key and value as this node).
         *
         * @type {SkipNode}
         */
        this.above = null;

        /**
         * The below node (should have the same key and value as this node).
         *
         * @type {SkipNode}
         */
        this.below = null;

        /**
         * The key of this node.
         *
         * @type {number}
         */
        this.key = key;

        /**
         * The value of this node.
         *
         * @type {any}
         */
        this.value = value;

        /**
         * Updates a property for this node and the ones above and below this node.
         *
         * @param {string} property property to change
         * @param {any} newValue the new value for the property
         * @returns {void}
         */
        this.update = (property, newValue) => {
            let node = this;
            let goDown = true;

            do {
                // change the property for the current node
                node[property] = newValue;

                // go to below node if we're going down, otherwise go to above node
                node = goDown
                    ? node.below
                    : node.above;

                if (!node && goDown) {
                    // node is null when we go all the way down the below node link, which indicates
                    // we should start going up, but start it at this.above to save some iterations
                    goDown = false;
                    node = this.above;
                }
            } while (node);
        }

        /**
         * Unlinks this node from it's surrounding nodes.
         *
         * @returns {void}
         */
        this.unlink = () => {
            if (this.prev) {
                this.prev.next = this.next;
            }

            if (this.next) {
                this.next.prev = this.prev;
            }

            if (this.above) {
                this.above.below = this.below;
            }

            if (this.below) {
                this.below.above = this.above;
            }
        };

        /**
         * Copy the key and value of this node into a new node. Does not copy the links.
         *
         * @returns {SkipNode} the copied node.
         */
        this.copy = () => new SkipNode(this.key, this.value);

        /**
         * Returns a string representation of the node in the format `key=value`
         *
         * @returns {string} string representation of this node.
         */
        this.toString = () => `${this.key}=${this.value}`;
    }
}

const POS_INF_NODE = new SkipNode(Number.POSITIVE_INFINITY, null);
const NEG_INF_NODE = new SkipNode(Number.NEGATIVE_INFINITY, null);

/**
 * A list that supports skip-list nodes, ones that can traverse on the same list (typical next or
 * previous nodes), as well as to nodes that exist on other lists (these lists are considered to be
 * above or below this one).
 */
class SortedLinkedList {
    /**
     * Constructs a sorted linked list.
     */
    constructor() {
        /**
         * The head/first element of the list.
         *
         * @type {SkipNode}
         */
        this.head = NEG_INF_NODE.copy();

        /**
         * The tail/last element of the list.
         *
         * @type {SkipNode}
         */
        this.tail = POS_INF_NODE.copy();

        this.head.next = this.tail;
        this.tail.prev = this.head;

        /**
         * Size of the list. Publicly accessible property for use with `SkipList`
         *
         * @type {number}
         */
        this.size = 0;

        /**
         * Iterates over all the elements in this list.
         *
         * @param {function} callback the operation to perform on each element, takes in two
         * arguments, the key and the value.
         * @param {object} thisArg `this` object that the callback function can refer to.
         * @returns {void}
         */
        this.forEach = (callback, thisArg) => {
            let node = this.head.next;

            while (node && node !== this.tail) {
                callback.call(thisArg, node.key, node.value);

                node = node.next;
            }
        }

        /**
         * Adds an element to the skip list, keeping elements in order. If the key already exists,
         * it updates the value of that key.
         *
         * @param {number} key the element's key.
         * @param {object} value the element's value.
         * @returns {SkipNode} the newly added node or the updated node; returned node can be used
         * for updating it's `aboveNode` and `belowNode` fields.
         * @throws {RangeError} if the key is infinite
         */
        this.add = (key, value) => {
            if (!Number.isFinite(key)) {
                throw new RangeError('key must be finite');
            }

            // new node to add
            let node = new SkipNode(key, value);
            // currently iterating node
            let curr = this.head;
            // previous node iterated through (null before iterating)
            let prev = null;

            // iterate through list so long as we have a node and
            // the key is greater than that node's key
            while (curr && key > curr.key) {
                // updating prev to be curr, and
                // curr to be curr's next node
                prev = curr;
                curr = curr.next;
            }

            if (curr.key === key) {
                // update curr's value
                curr.value = value;
                // set n to curr, so we return the proper node ref
                node = curr;
            } else {
                // inserting between two elements
                // updating links with prev
                prev.next = node;
                node.prev = prev;
                // updating links with curr
                curr.prev = node;
                node.next = curr;
            }

            // update size
            this.size++;

            return node;
        }

        /**
         * Gets the value associated with the key.
         *
         * @param {number} key the key to find.
         * @returns {any} null if the key doesn't exist; otherwise the value for the key (note this
         * value can be null)
         */
        this.get = (key) => {
            let curr = this.head;

            while (curr && key > curr.key) {
                curr = curr.next;
            }

            if (!curr && curr.key === key) {
                return curr.value;
            }

            return null;
        }

        /**
         * Removes a key from the list.
         *
         * @param {number} key the key to remove
         * @returns {boolean} true if the key was sucessfully removed.
         */
        this.remove = (key) => {
            let curr = this.head;

            while (curr && key > curr.key) {
                curr = curr.next;
            }

            if (!curr && curr.key === key) {
                curr.unlink();
                this.size--;

                return true;
            }

            return false;
        }

        /**
         * Parses this list's nodes to an array-like string.
         *
         * @returns {string} a readable string of the list.
         */
        this.toString = () => {
            let str = "[";
            let node = this.head.next;

            while (node && node !== this.tail) {
                str += `{${node}}`;
                node = node.next;

                if (node !== this.tail) {
                    str += ",";
                } else {
                    break;
                }
            }

            return `${str}]`;
        }
    }
}

/**
 * A skip list implementation. All elements are key-value pairs.
 * Keys will be numbers, and values will be the songs.
 */
class SkipList {
    /**
     * Constructs a skip list, with the bottom list being empty.
     */
    constructor() {
        const BOTTOM_INDEX = 0;
        const RANDOM_THRESHOLD = 0.5;

        /**
         * Ordered lists contained in this skip list. The first element is always the bottom-most
         * list in the skip list. The top-most list is the last element in this array.
         */
        const lists = [ new SortedLinkedList() ];
        const bottomList = lists[BOTTOM_INDEX];

        /**
         * Gets the size of the list.
         *
         * @returns {number} the size.
         */
        this.size = () => lists[BOTTOM_INDEX].size;

        /**
         * Iterates over all the elements in this skip list (does not iterate over every single
         * node, but rather all the elements that appear in the bottom-list).
         *
         * @param {function} callback the operation to perform on each element, takes in two
         * arguments, the key and the value.
         * @param {object} thisArg `this` object that the callback function can refer to
         * @returns {void}
         */
        this.forEach = (callback, thisArg) => {
            lists[BOTTOM_INDEX].forEach(callback, thisArg);
        }

        /**
         * Iterates over all the lists in the skip list, thus over EVERY node present in the skip
         * list. Starts with the top-most list.
         *
         * @param {function} callback the operation to perform on each list, takes in one
         * argument, which is an array of the keys and values of iterating list's nodes.
         * @param {object} thisArg `this` object that the callback function can refer to
         * @returns {void}
         */
        this.forEachList = (callback, thisArg) => {
            for (let i = lists.length - 1; i > -1; i--) {
                let safeList = [];

                lists[i].forEach((key, value) => {
                    safeList.push({ key, value });
                });

                callback.call(thisArg, safeList);
            }
        }

        /**
         * Recursively searches for a node based on it's key. Additionally, an options object can
         * be provided, which will perform certain operations:
         *
         * + `stopImmediately`: indicates to return target node when found instead of traversing
         * downwards to find it's bottom-most counter part (this is good for when the links of the
         * nodes aren't needed)
         *
         * @param {number} key the node's key
         * @param {SkipNode} node the current iterating node
         * @param {object} opts specifies certain operations to perform
         * @returns {SkipNode} null if the element wasn't found; otherwise the element
         */
        function getNode(key, node, opts) {
            // base case
            if (!node) {
                return null;
            } else if (!opts) {
                opts = {};
            }

            let curr = node;
            let prev = curr;

            curr = curr.next;

            while (curr && curr.key <= key) {
                prev = curr;
                curr = curr.next;
            }

            if (prev.key === key) {
                while (!opts.stopImmediately && prev.below) {
                    prev = prev.below;
                }

                return prev;
            }

            return getNode(key, prev.below, opts);
        }

        /**
         * Gets the element based on it's key.
         *
         * @param {number} key the element's key
         * @returns {any} null if the element wasn't found; otherwise the element's value (which
         * could also be null).
         * @throws {RangeError} if the key is infinite
         * @throws {TypeError} if the key is not a number
         */
        this.get = (key) => {
            if (!isNumber(key)) {
                throw new TypeError('key must be a number');
            } else if (!Number.isFinite(key)) {
                throw new RangeError('key must be finite');
            }

            return getNode(key, lists[lists.length - 1].head, { stopImmediately: true }).value;
        }

        /**
         * Promotes a node to lists other than the bottom one.
         *
         * @param {SkipNode} node the node to promote
         * @returns {void}
         */
        function promote(node) {
            let prevPromoted = null;
            let currPromoted = node;

            for (let i = 1; Math.random() >= RANDOM_THRESHOLD; i++) {
                if (!lists[i]) {
                    // make a new list
                    lists.push(new SortedLinkedList());
                    // make heads of lists[i-1] and lists[i] point to each other with
                    // above and below nodes
                    lists[i - 1].head.above = lists[i].head;
                    lists[i].head.below = lists[i - 1].head;
                    // same thing with tail
                    lists[i - 1].tail.above = lists[i].tail;
                    lists[i].tail.below = lists[i - 1].tail;
                }

                prevPromoted = currPromoted;
                // add node to a higher list
                currPromoted = lists[i].add(node.key, node.value);

                // update above and below nodes
                prevPromoted.above = currPromoted;
                currPromoted.below = prevPromoted;
            }
        }

        /**
         * Adds an element after a certain (relative) key. The key for the new element is determined
         * based on neighboring keys. If the relative key doesn't exist, then the element is not
         * added.
         *
         * Special cases:
         *
         * 1. If the list has no elements, the relative key is ignored, and the new element's key
         * will be 0
         * 2. If the relative key is undefined or negative infinity, then the element will be
         * inserted before the first element in this list. The new element's key will be the floor
         * of the first element's key
         * 3. If the relative key is the last element, then the new element's will be the ceiling of
         * the last element's key
         * 4. If the relative key is not the first or last element, then we let the relative key's
         * element be `a`, and it's next linked element be `b`. Our new element's key will
         * be an average of `a`s and `b`s keys. In the case where too many elements are inserted
         * after one particular element, say `a`, then the average of the keys can end up being
         * the same number. In which case, a `RangeError` is thrown.
         *
         * @param {number} relativeKey the key to add the new element after
         * @param {any} newValue the value of the new element
         * @returns {number} the key of the new element added
         * @throws {ReferenceError} if the relativeKey doesn't exist in the list
         * @throws {RangeError} if the relativeKey is positive infinity or if there is no suitable
         * new key
         * @throws {TypeError} if the relativeKey isn't a number or null/undefined
         */
        this.addAfter = (relativeKey, newValue) => {
            if (!isNumber(relativeKey) && relativeKey != null) {
                throw new TypeError('relativeKey must be a number or null/undefined');
            } else if (relativeKey === Number.POSITIVE_INFINITY) {
                throw new RangeError('relativeKey must be less than positive infinity');
            }

            // add into bottom list first
            //         make sure to set head and tail variables
            // flip fair coin for this new element
            //        if heads, promote element one level up (create new level if needed)
            //            these new levels may only have one node, and that's fine
            //        else tails, stop promoting the new element

            // giving the new element a temporary key as the max value
            let node = new SkipNode(Number.MAX_VALUE, newValue);

            if (relativeKey == null) {
                relativeKey = Number.NEGATIVE_INFINITY;
            }

            // curr's key should never be positive infinity, but curr can be the node before
            // the positive infinity node, thus curr's next key can be positive infinity
            let curr = getNode(relativeKey, lists[lists.length - 1].head);

            if (!curr || curr.key !== relativeKey) {
                throw new ReferenceError(`relativeKey ${relativeKey} not found`);
            }

            let next = curr.next;
            let newKey = null;

            // if curr key or next key is infinite, then that means we are inserting after the
            // head or before the tail (respectively)
            // because of an error check, we flip the conditions here so we can group some of
            // the code together in one flow
            if (Number.isFinite(curr.key) && Number.isFinite(next.key)) {
                // newKey just needs to be an average of curr's and next's keys
                newKey = (curr.key + next.key) / 2;

                if (newKey === curr.key || newKey === next.key) {
                    // we've used up all our precision, don't add this element
                    throw new RangeError("too much averaging");
                }
            } else {
                if (curr.key === Number.NEGATIVE_INFINITY) {
                    // if next key is infinite, that means there are no elements in the list yet
                    // so newKey becomes 0
                    if (!Number.isFinite(next.key)) {
                        newKey = 0;
                    } else {
                        // make newKey a floor of next key
                        // if next key is an integer, then make newKey one less
                        newKey = Number.isInteger(next.key)
                            ? curr.next.key - 1
                            : Math.floor(next.key);
                    }
                } else if (next.key === Number.POSITIVE_INFINITY) {
                    // make newKey a ceil of curr's key
                    // if curr's key is an integer, then make newKey one more
                    newKey = Number.isInteger(curr.key)
                        ? curr.key + 1
                        : Math.ceil(curr.key);
                }

                // newKey could end up being an unsafe integer from above operations
                if (!Number.isSafeInteger(newKey, true)) {
                    throw new RangeError("unsafe integer");
                }
            }

            // updating node's key
            node.key = newKey;
            // updating links with curr
            curr.next = node;
            node.prev = curr;
            // updating links with next
            next.prev = node;
            node.next = next;

            // update size of bottom list
            bottomList.size++;

            promote(node);

            return newKey;
        }

        /**
         * Updates a key's value.
         *
         * @param {number} key the key to update
         * @param {any} newValue the new value for the key
         * @returns {boolean} true if the key was found and updated
         * @throws {TypeError} if key is not a number
         * @throws {RangeError} if key is not finite
         */
        this.set = (key, newValue) => {
            if (!isNumber(key)) {
                throw new TypeError('key must be a number');
            } else if (!Number.isFinite(key)) {
                throw new RangeError('key must be finite');
            }

            let node = getNode(key, lists[lists.length - 1].head, { stopImmediately: true });

            if (!node) {
                return false;
            }

            node.update('value', newValue);

            return true;
        };

        /**
         * Removes a key from the list.
         *
         * @param {number} key the key to remove
         * @returns {boolean} true if the key was found and removed
         * @throws {TypeError} if key is not a number
         * @throws {RangeError} if key isn't finite
         */
        this.remove = (key) => {
            if (!isNumber(key)) {
                throw new TypeError('key must be a number');
            } else if (!Number.isFinite(key)) {
                throw new RangeError('key must be finite');
            }

            let node = getNode(key, lists[lists.length - 1].head);

            if (!node) {
                return false;
            }

            // this is our way of getting to the current node's above link (this above link can
            // be messed around with in SkipNode#unlink())
            let next = node.above;

            for (let ind = 0; node; ind++) {
                node.unlink();
                lists[ind].size--;

                if (lists[ind].size === 0 && ind !== BOTTOM_INDEX) {
                    // if this list is empty, then all lists above this one should will be empty
                    // after removing this node from those higher-up lists.
                    // BUT, we don't do this if this is the bottom list, because we still need it
                    // in case we ever add more elements later on
                    lists.splice(ind, lists.length - ind);
                }

                node = next;

                if (next) {
                    next = next.above;
                }
            }

            return true;
        }

        /**
         * Parses each element in the bottom list into a string.
         *
         * @returns {string} string representation of this skip list.
         */
        this.toString = () => bottomList.toString();
    }
}

module.exports = SkipList;
