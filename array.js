
/**
 * Creates an index on the field specified, if that index does not already exist.
 * @param {array|string} fields A Array that contains names of the fields to index, or a single one.
 * @param {boolean} indexResults Specifies if resultset should also be indexed.
 * @return {array}
 */
Array.prototype.ensureIndex = function ensureIndex(fields, indexResults){
  
  // extends if necessary
  if(typeof this.indexes == 'undefined') {
    Object.defineProperties(this, {
      
      // stores indexes
      indexes: {value: {}},
      indexResults: {value: indexResults},
      
      /**
       * Selects and return objects.
       * @param {object} query Specifies the selection criteria using query operators.
       * @return {array}
       */
      find: {value: function find(query){
        
        // order query operators for performance
        var operators = [];
        var indexes = this.indexes;
        for(var field in query)
          operators.push({'field':field,'search':query[field]});
        var scoreOperatorForPerformance = function scoreOperatorForPerformance(operator){
          if(typeof indexes[operator.field] == 'undefined') return 0;
          var indexSize = 0;
          if(typeof indexes[operator.field][operator.search] != 'undefined')
            indexSize += indexes[operator.field][operator.search].length;
          if(indexSize < 2) return 1;
          return 0.5;
        };
        operators.sort(function sortForPerformance(a, b){
          return scoreOperatorForPerformance(b)-scoreOperatorForPerformance(a);
        });
        
        // define compare functions
        var compareEqual = function compareEqual(value, search){return value === search};
        var compareRegExp = function compareRegExp(value, search){return search.test(value)};
        
        // run operators
        var resultset = [];
        for(var o=0,ol=operators.length;o<ol;o++) {
          var operatorResultset = [];
          var compareValue = operators[o].search instanceof RegExp? compareRegExp: compareEqual;
          if(typeof this.indexes[operators[o].field] == 'undefined') {
            if(o===0) {
              for(var t=0,tl=this.length;t<tl;t++)
                if(compareValue(this[t][operators[o].field], operators[o].search))
                  operatorResultset.push(t);
            }
            else {
              for(var r=0,rl=resultset.length;r<rl;r++)
                if(compareValue(this[resultset[r]][operators[o].field], operators[o].search))
                  operatorResultset.push(resultset[r]);
            }
          }
          else {
            for(var indexedValue in this.indexes[operators[o].field])
              if(compareValue(indexedValue, operators[o].search))
                for(var c=0,cl=this.indexes[operators[o].field][indexedValue].length;c<cl;c++)
                  operatorResultset.push(this.indexes[operators[o].field][indexedValue][c]);
          }
          
          // reduces resultset
          if(o===0)
            resultset = operatorResultset;
          else
            for(var r=0,rl=resultset.length;r<rl;r++)
              if(operatorResultset.indexOf(resultset[r]) === -1)
                resultset.splice(r, 1);
          
          // results not found
          if(!resultset.length) break;
        }
        
        // inflate resultset
        for(var r=0,rl=resultset.length;r<rl;r++)
          resultset[r] = this[resultset[r]];
        
        // return optionally chainable resultset
        if(this.indexResults)
          resultset.ensureIndex(Object.keys(this.indexes));
        return resultset;
      }},
      
      /**
       * Selects and return a single object.
       * @param {object} query Specifies the selection criteria using query operators.
       * @return {array}
       */
      findOne: {value: function findOne(query){
        return this.find(query)[0];
      }},
      
      /**
       * Reset and apply indexes.
       * @param {array} fields Optional. A Array that contains names of the fields to index.
       * @return {array}
       */
      index: {value: function index(fields){
        fields = fields || Object.keys(this.indexes);
        if(typeof fields != 'undefined') {
          this.indexes = {};
          for(var i=0,l=fields.length;i<l;i++)
            this.indexes[fields[i]] = {};
        }
        for(var position=0,thisLength=this.length;position<thisLength;position++)
          this.indexItem(this[position], position);
        return this;
      }},
      
      /**
       * Indexes a single object.
       * @param {object} item Object to index.
       * @param {integer} position Position to index object at.
       * @return {array}
       */
      indexItem: {value: function indexItem(item, position){
        for(var field in this.indexes){
          if(typeof item[field] != 'undefined')
            if(typeof this.indexes[field][item[field]] == 'undefined')
              this.indexes[field][item[field]] = [position];
            else
              this.indexes[field][item[field]].push(position);
        }
        return this;
      }},
      
      /**
       * Joins two or more arrays, and returns a copy of the joined arrays
       */
      concat: {value: function(){
        var newIndexes = Object.keys(this.indexes) || [];
        for(var a=0,al=arguments.length;a<al;a++)
          newIndexes = newIndexes.concat(Object.keys(arguments[a].indexes || {}));
        return Array.prototype.concat.apply(this, arguments).ensureIndex(newIndexes);
      }},
      
      /**
       * Removes the last element of an array, and returns that element
       */
      pop: {value: function(){
        var lastIndex = this.length-1;
        var removedItem = Array.prototype.pop.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].filter(function(i){
            return i !== lastIndex;
          });
        return removedItem;
      }},
      
      /**
       * Adds new elements to the end of an array, and returns the new length
       */
      push: {value: function(){
        var originalLength = this.length;
        Array.prototype.push.apply(this, arguments);
        var newLength = this.length;
        for(var position=originalLength;position<newLength;position++)
          this.indexItem(this[position], position);
        return newLength;
      }},
      
      /**
       * Reverses the order of the elements in an array
       */
      reverse: {value: function(){
        var length = this.length;
        Array.prototype.reverse.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].map(function(i){
            return i * -1 + length;
          });
        return this;
      }},
      
      /**
       * Removes the first element of an array, and returns that element
       */
      shift: {value: function(){
        var removedElement = Array.prototype.shift.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].map(function(i){
            return i - 1;
          });
        return removedElement;
      }},
      
      /**
       * Selects a part of an array, and returns the new array
       */
      slice: {value: function(start, end){
        var sliced = Array.prototype.slice.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].filter(function(i){
            return i < end && i >= start;
          }).map(function(i){
            return i - start;
          });
        return sliced;
      }},
      
      /**
       * Sorts the elements of an array
       */
      sort: {value: function(){
        Array.prototype.sort.apply(this, arguments);
        this.index();
      }},
      
      /**
       * Adds/Removes elements from an array
       */
      splice: {value: function(index, howmany){
        var selectionEnd = index+howmany;
        var removedItems = Array.prototype.splice.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].filter(function(i){
            return i < index || i >= selectionEnd;
          });
        for(var position=index,l=this.length;position<l;position++)
          this.indexItem(this[position], position);
        return removedItems;
      }},
      
      /**
       * Adds new elements to the beginning of an array, and returns the new length
       */
      unshift: {value: function(){
        var newLength = Array.prototype.unshift.apply(this, arguments);
        for(var field in this.indexes)
          this.indexes[field] = this.indexes[field].map(function(i){
            return i + arguments.length;
          });
        for(var position=0,l=arguments.length;position<l;position++)
          this.indexItem(this[position], position);
        return newLength;
      }}
    });
  }
  
  // apply new indexes
  this.index(typeof fields == 'string'? [fields]: fields);
  
  // chainable
  return this;
};