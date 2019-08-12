/* eslint-disable max-len */
module.exports = {
  "empty": [
    {
      "title": "has a size of 0",
      "func": "size",
      "args": [],
      "expected": 0
    },
    {
      "title": "has a string of \"[]\"",
      "func": "toString",
      "args": [],
      "expected": "[]"
    }
  ],
  "addAfter": [
    {
      "title": "fails because of key averaging (isolated list)",
      "test_id": "addAfter_key_avg",
      "expected": {
        "error": RangeError,
        "message": "too much averaging"
      }
    },
    {
      "title": "fails because of unsafe integer (isolated list)",
      "test_id": "addAfter_unsafe_int",
      "expected": {
        "error": RangeError,
        "message": "unsafe integer"
      }
    },
    {
      "title": "fails when relative key is not the right type",
      "args": [ "not a number", null ],
      "expected": {
        "error": TypeError,
        "message": "relativeKey must be a number or null/undefined"
      }
    },
    {
      "title": "fails when relative key not found",
      "args": [ 0, null ],
      "expected": {
        "error": ReferenceError,
        "message": "relativeKey 0 not found"
      }
    },
    {
      "title": "fails adding after positive infinity key",
      "args": [ +Infinity, null ],
      "expected": {
        "error": RangeError,
        "message": "relativeKey must be less than positive infinity"
      }
    },
    {
      "title": "add a after null",
      "args": [ null, "a" ],
      "expected": {
        "returned": 0,
        "lists": [
          [ { "key": 0, "value": "a" } ],
          [ { "key": 0, "value": "a" } ],
          [ { "key": 0, "value": "a" } ]
        ]
      }
    },
    {
      "title": "add b after a",
      "args": [ 0, "b" ],
      "expected": {
        "returned": 1,
        "lists": [
          [ { "key": 0, "value": "a" } ],
          [ { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ],
          [ { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ]
        ]
      }
    },
    {
      "title": "add c after null",
      "args": [ null, "c" ],
      "expected": {
        "returned": -1,
        "lists": [
          [ { "key": 0, "value": "a" } ],
          [ { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ],
          [ { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ]
        ]
      }
    },
    {
      "title": "add d after a",
      "args": [ 0, "d" ],
      "expected": {
        "returned": 0.5,
        "lists": [
          [ { "key": 0, "value": "a" } ],
          [ { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ],
          [ { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" } ]
        ]
      }
    },
    {
      "title": "add e after -Infinity",
      "args": [ -Infinity, "e" ],
      "expected": {
        "returned": -2,
        "lists": [
          [ { "key": -2, "value": "e" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" } ]
        ]
      }
    },
    {
      "title": "add f after b",
      "args": [ 1, "f" ],
      "expected": {
        "returned": 2,
        "lists": [
          [ { "key": -2, "value": "e" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" } ]
        ]
      }
    },
    {
      "title": "add g after f",
      "args": [ 2, "g" ],
      "expected": {
        "returned": 3,
        "lists": [
          [ { "key": -2, "value": "e" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 3, "value": "g" } ]
        ]
      }
    },
    {
      "title": "add h after f",
      "args": [ 2, "h" ],
      "expected": {
        "returned": 2.5,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ]
        ]
      }
    },
    {
      "title": "add i after g",
      "args": [ 3, "i" ],
      "expected": {
        "returned": 4,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    },
    {
      "title": "add j after h",
      "args": [ 2.5, "j" ],
      "expected": {
        "returned": 2.75,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "j" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    }
  ],
  "get": [
    {
      "title": "fails if key is negative infinity",
      "args": [ -Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "fails if key is positive infinity",
      "args": [ +Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "gets 'a' for key 0",
      "args": [ 0 ],
      "expected": "a"
    },
    {
      "title": "gets 'b' for key 1",
      "args": [ 1 ],
      "expected": "b"
    },
    {
      "title": "gets 'c' for key -1",
      "args": [ -1 ],
      "expected": "c"
    },
    {
      "title": "gets 'd' for key 0.5",
      "args": [ 0.5 ],
      "expected": "d"
    },
    {
      "title": "gets 'e' for key -2",
      "args": [ -2 ],
      "expected": "e"
    },
    {
      "title": "gets 'f' for key 2",
      "args": [ 2 ],
      "expected": "f"
    },
    {
      "title": "gets 'g' for key 3",
      "args": [ 3 ],
      "expected": "g"
    },
    {
      "title": "gets 'h' for key 2.5",
      "args": [ 2.5 ],
      "expected": "h"
    },
    {
      "title": "gets 'i' for key 4",
      "args": [ 4 ],
      "expected": "i"
    },
    {
      "title": "gets 'j' for key 2.75",
      "args": [ 2.75 ],
      "expected": "j"
    }
  ],
  "non-empty": [
    {
      "title": "should have a size of 10",
      "func": "size",
      "args": [],
      "expected": 10
    },
    {
      "title": "should have a string with 10 key-value pairs",
      "func": "toString",
      "args": [],
      "expected": "[{-2=e},{-1=c},{0=a},{0.5=d},{1=b},{2=f},{2.5=h},{2.75=j},{3=g},{4=i}]"
    }
  ],
  "set": [
    {
      "title": "fails if key is not a number",
      "args": [ "not a number" ],
      "expected": {
        "error": TypeError,
        "message": "key must be a number"
      }
    },
    {
      "title": "fails if key is negative infinity",
      "args": [ -Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "fails if key is positive infinity",
      "args": [ +Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "fails if key doesn't exist",
      "args": [ -10, "fails" ],
      "expected": {
        "returned": false,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "a" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "a" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "j" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    },
    {
      "title": "set key 0 with new value 'z'",
      "args": [ 0, "z" ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "z" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "z" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "z" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "j" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    },
    {
      "title": "set key 2.75 with new value 'y'",
      "args": [ 2.75, "y" ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "e" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "z" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": 0, "value": "z" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "e" }, { "key": -1, "value": "c" }, { "key": 0, "value": "z" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    },
    {
      "title": "set key -2 with new value 'x'",
      "args": [ -2, "x" ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": -1, "value": "c" }, { "key": 0, "value": "z" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" }, { "key": 4, "value": "i" } ]
        ]
      }
    },
    {
      "title": "set key 4 with new value 'w'",
      "args": [ 4, "w" ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": -1, "value": "c" }, { "key": 0, "value": "z" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" }, { "key": 4, "value": "w" } ]
        ]
      }
    }
  ],
  "remove": [
    {
      "title": "fails if key is not a number",
      "args": [ "not a number" ],
      "expected": {
        "error": TypeError,
        "message": "key must be a number"
      }
    },
    {
      "title": "fails if key is negative infinity",
      "args": [ -Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "fails if key is positive infinity",
      "args": [ +Infinity ],
      "expected": {
        "error": RangeError,
        "message": "key must be finite"
      }
    },
    {
      "title": "can't remove key -10",
      "args": [ -10 ],
      "expected": {
        "returned": false,
        "lists": [
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": 0, "value": "z" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": -1, "value": "c" }, { "key": 0, "value": "z" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" }, { "key": 4, "value": "w" } ]
        ]
      }
    },
    {
      "title": "remove key 0",
      "args": [ 0 ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": -1, "value": "c" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" }, { "key": 4, "value": "w" } ]
        ]
      }
    },
    {
      "title": "remove key 4",
      "args": [ 4 ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" } ],
          [ { "key": -2, "value": "x" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -2, "value": "x" }, { "key": -1, "value": "c" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" } ]
        ]
      }
    },
    {
      "title": "remove key -2",
      "args": [ -2 ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": 2.5, "value": "h" } ],
          [ { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": 1, "value": "b" }, { "key": 2.5, "value": "h" }, { "key": 3, "value": "g" } ],
          [ { "key": -1, "value": "c" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.5, "value": "h" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" } ]
        ]
      }
    },
    {
      "title": "remove key 2.5",
      "args": [ 2.5 ],
      "expected": {
        "returned": true,
        "lists": [
          [ { "key": 3, "value": "g" } ],
          [ { "key": 1, "value": "b" }, { "key": 3, "value": "g" } ],
          [ { "key": -1, "value": "c" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" } ]
        ]
      }
    },
    {
      "title": "can't remove key 0 again (no double remove)",
      "args": [ 0 ],
      "expected": {
        "returned": false,
        "lists": [
          [ { "key": 3, "value": "g" } ],
          [ { "key": 1, "value": "b" }, { "key": 3, "value": "g" } ],
          [ { "key": -1, "value": "c" }, { "key": 0.5, "value": "d" }, { "key": 1, "value": "b" }, { "key": 2, "value": "f" }, { "key": 2.75, "value": "y" }, { "key": 3, "value": "g" } ]
        ]
      }
    }
  ]
};
