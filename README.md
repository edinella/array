# array
Indexed javascript object list

## About
This is an Array prototype extension, adding index support for use in javascript arrays with similar objects.

### Features
* All you can do with a [native Array](http://www.w3schools.com/jsref/jsref_obj_array.asp "Array methods"), you can do with a indexed one
* Single or multiple field indexes, defined before or after storing objects
* Fast obtaining items matching pattern sought
* Search using a string, or a regular expression

### Installation
Just require ```array.js``` file.

### Run tests
```
npm install
npm test
```

## Usage

### Activate indexing in your array
```js
var users = new Array();
users.ensureIndex();
```
You can also activate indexing in a already filled array
```js
var users = [
  {'id': '50d2548dcaf0245c6f000001', 'name': 'Le Corbusier', 'office': 1},
  {'id': '5124610c408b231968000001', 'name': 'Oscar Niemeyer', 'office': 2},
  {'id': '50bca975acceb00d3d000001', 'name': 'Juscelino Kubitschek', 'office': 1}
];
users.ensureIndex();
```

### Define fields you want to index
Index are defined by "ensureIndex" method. You can call it right in index activation, or later.
```js
users.ensureIndex(['id', 'office']);
```

### Find items in Array
```js
var query = {'name': /^\w+ niemeyer/i, 'office': 2};
var results = users.find(query);
```
If the field is indexed results will be faster, but not indexed fields works too.
Query arguments are internally ordered for performance, most exclusive arguments go first.
In this example, "office" field have an index, so the "name" argument needs to check much fewer items.

### Find single item in Array
```js
var item = users.findOne(query);
```

## Chainability
"ensureIndex" method is chainable.
```js
var oscar = [obj1, obj2]
  .ensureIndex('id')
  .push(obj3)
  .ensureIndex('office')
  .findOne({'id': '5124610c408b231968000001'});
```
If you want to "find" method become chainable, set it when activating indexing.
```js
users.ensureIndex(['id', 'office'], true);
var results = users
  .find({'office':1})
  .findOne({'id': '50bca975acceb00d3d000001'});
```