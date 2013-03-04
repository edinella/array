
/**
 * Creates an index on the field specified, if that index does not already exist.
 * @param {array|string} fields A Array that contains names of the fields to index, or a single one.
 * @param {boolean} indexResults Specifies if resultset should also be indexed.
 * @return {array}
 */
Array.prototype.ensureIndex = function ensureIndex(fields, indexResults){
  
  // if not already extended
  if(typeof this.indexes == 'undefined') {
    
    /**
     * Obtains a numeric score relative to operator performance and indexes
     * @param {object} indexes Instance indexes
     * @param {object} operator Operator to score
     * @return {integer}
     */
    var scoreOperatorForPerformance = function scoreOperatorForPerformance(indexes, operator){
      if(typeof indexes[operator.field] == 'undefined') return 0;
      var indexSize = typeof indexes[operator.field][operator.search] != 'undefined'
        ? indexes[operator.field][operator.search].length
        : 0;
      return indexSize < 2 ? 1 : 0.5;
    };
    
    /**
     * Orders query operators for performance
     * @param {object} indexes Instance indexes
     * @param {object} query Specifies the selection criteria using query operators
     * @return {array}
     */
    var orderOperators = function orderOperators(indexes, query) {
      var operators = [];
      for(var field in query)
        operators.push({'field': field, 'search': query[field]});
      operators.sort(function sortForPerformance(a, b){
        return scoreOperatorForPerformance(indexes, b) - scoreOperatorForPerformance(indexes, a);
      });
      return operators;
    };
    
    /**
     * Resultset constructor
     * @param {array} source Data instance
     * @return {array}
     */
    var Resultset = function Resultset(source){
      return Object.defineProperties([], {
        
        /**
         * Compares a value with a string or regular expression, and returns if it matches
         * @param {string} value Value to compare
         * @param {string|object} search Pattern or string to compare
         * @return {boolean}
         */
        compareValue: {value: function getCompareValue(value, search) {
          return search instanceof RegExp
            ? search.test(value)
            : value === search;
        }},
        
        /**
         * Runs operators and returns the combined results
         * @param {array} operators Ordered operators
         * @return {array}
         */
        select: {value:function select(operators) {
          for(var o=0,ol=operators.length;o<ol;o++)
            if(!this.runOperator(operators[o]))
              break;
          return this.inflateSelection();
        }},
        
        /**
         * Runs a function in resultset scope, for each item, choosing appropriated source
         * @param {function} fn Function to receive item and position
         * @return {array}
         */
        eachItem: {value: function eachItem(fn){
          if(this.length)
            for(var i=0,l=this.length;i<l;i++)
              fn.call(this, source[this[i]], i);
          else
            for(var i=0,l=source.length;i<l;i++)
              fn.call(this, source[i], i);
        }},
        
        /**
         * Reduces resultset for match selection, and returns resultset size
         * @param {array} selection Selected items
         * @return {integer}
         */
        reduceToSelection: {value: function reduceToSelection(selection){
          if(this.length == 0)
            Array.prototype.push.apply(this, selection);
          else
            for(var t=0,tl=this.length;t<tl;t++)
              if(selection.indexOf(this[t]) === -1)
                this.splice(t, 1);
          return this.length;
        }},
        
        /**
         * Runs a single operator, returning resultset size
         * @param {object} operator Operator to execute
         * @return {array}
         */
        runOperator: {value: function runOperator(operator){
          var selection = [];
          
          // whitout index
          if(typeof source.indexes[operator.field] == 'undefined')
            this.eachItem(function(item, i){
              if(this.compareValue(item[operator.field], operator.search))
                selection.push(i);
            });
          
          // with index
          else
            for(var indexedValue in source.indexes[operator.field])
              if(this.compareValue(indexedValue, operator.search))
                for(var c=0,cl=source.indexes[operator.field][indexedValue].length;c<cl;c++)
                  selection.push(source.indexes[operator.field][indexedValue][c]);
          
          // reduce data to selection and return current selection size
          return this.reduceToSelection(selection);
        }},
        
        /**
         * Converts resultset items from positions to its real objects, and returns resultset
         * @return {array}
         */
        inflateSelection: {value:function inflate(){
          for(var r=0,rl=this.length;r<rl;r++)
            this[r] = source[this[r]];
          return this;
        }}
      });
    };
    
    // extend this instance
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
        var operators = orderOperators(this.indexes, query);
        
        // obtains resultset
        var resultset = (new Resultset(this)).select(operators);
        
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