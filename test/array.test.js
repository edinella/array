"use strict";

// require array
require('../array.js');

// some examples
var examples = [
  {'id': '50d2548dcaf0245c6f000001', 'name': 'Le Corbusier', 'office': 'office X'},
  {'id': '5124610c408b231968000001', 'name': 'Oscar Niemeyer', 'office': 'office Y'},
  {'id': '50bca975acceb00d3d000001', 'name': 'Juscelino Kubitschek', 'office': 'office X'}
];

// export tests
exports.IndexedArray = {
  'native constructor should generate instance of Array': function(){
    var a = [];
    expect(a).to.be.instanceof(Array);
  },
  'native Array instance should store received items': function(){
    var a = ['string', true, 1, null];
    expect(a).to.include('string');
    expect(a).to.include(true);
    expect(a).to.include(1);
    expect(a).to.include(null);
  },
  '"ensureIndex" method': {
    'should exist': function(){
      var a = new Array();
      expect(a.ensureIndex).to.be.a('function');
      var b = [];
      expect(b.ensureIndex).to.be.a('function');
    },
    'should store indexes in Array instance': function(){
      var a = [];
      a.ensureIndex(['id']);
      expect(a.indexes.id).to.be.a('object');
    },
    'should store multiple indexes at once in Array instance': function(){
      var a = [];
      a.ensureIndex(['id', 'name']);
      expect(a.indexes.id).to.be.a('object');
      expect(a.indexes.name).to.be.a('object');
    },
    'should be chainable': function(){
      var a = [].ensureIndex(['id']).ensureIndex(['name']);
      expect(a).to.be.instanceof(Array);
      expect(a.indexes.id).to.be.a('object');
      expect(a.indexes.name).to.be.a('object');
    },
    'should extend Array instance': {
      'only when "ensureIndex" method is called': function(){
        var a = [];
        expect(a.find).to.not.exist;
        expect(a.findOne).to.not.exist;
        expect(a.index).to.not.exist;
        expect(a.indexItem).to.not.exist;
        a.ensureIndex();
        expect(a.find).to.be.a('function');
        expect(a.findOne).to.be.a('function');
        expect(a.index).to.be.a('function');
        expect(a.indexItem).to.be.a('function');
      },
      'with "find" method': {
        'that should be a function':function(){
          var a = [].ensureIndex();
          expect(a.find).to.be.a('function');
        },
        'whose resultset': {
          'should be instance of Array':function(){
            var a = [].ensureIndex();
            var resultset = a.find();
            expect(resultset).to.be.instanceof(Array);
          },
          'should not be indexed by default':function(){
            var a = [].ensureIndex();
            var resultset = a.find();
            expect(resultset.find).to.not.exist;
            expect(resultset.findOne).to.not.exist;
            expect(resultset.index).to.not.exist;
            expect(resultset.indexItem).to.not.exist;
          },
          'should be indexed once deep indexing is ensured':function(){
            var a = [].ensureIndex([], true);
            var resultset = a.find();
            expect(resultset.find).to.be.a('function');
            expect(resultset.findOne).to.be.a('function');
            expect(resultset.index).to.be.a('function');
            expect(resultset.indexItem).to.be.a('function');
          },
          'should inherit index fields once deep indexing is ensured':function(){
            var a = [].ensureIndex(['id','name'], true);
            var resultset = a.find();
            expect(a.indexes).to.deep.equal(resultset.indexes);
          },
        },
        'that should find objects':{
          'not using index':{
            'querying with a string': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex();
              var results = a.find({'office':examples[0].office});
              expect(results).to.have.property('length', 2);
              expect(results[0]).to.deep.equal(examples[0]);
              expect(results[1]).to.deep.equal(examples[2]);
            },
            'querying with multiple strings': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex();
              var results = a.find({'office':examples[0].office,'id':examples[0].id});
              expect(results).to.have.property('length', 1);
              expect(results[0]).to.deep.equal(examples[0]);
            },
            'querying with a regular expression': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex();
              var results = a.find({'name': /^oscar/i });
              expect(results).to.have.property('length', 1);
              expect(results[0].name).to.be.equal('Oscar Niemeyer');
            },
          },
          'using index':{
            'querying with a string': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex(['office']);
              var results = a.find({'office':examples[0].office});
              expect(results).to.have.property('length', 2);
              expect(results[0]).to.deep.equal(examples[0]);
              expect(results[1]).to.deep.equal(examples[2]);
            },
            'querying with multiple strings': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex(['id','office','xxx']);
              var results = a.find({'office':examples[0].office,'id':examples[0].id});
              expect(results).to.have.property('length', 1);
              expect(results[0]).to.deep.equal(examples[0]);
            },
            'querying with a regular expression': function(){
              var a = [examples[0], examples[1], examples[2]].ensureIndex(['name']);
              var results = a.find({'name': /^oscar/i });
              expect(results).to.have.property('length', 1);
              expect(results[0].name).to.be.equal('Oscar Niemeyer');
            },
          },
        },
      },
      'with "findOne" method': {
        'that should be a function':function(){
          var a = [].ensureIndex();
          expect(a.findOne).to.be.a('function');
        },
        'that returns the first matching item':function(){
          var a = [examples[0], examples[1], examples[2]].ensureIndex(['office']);
          var result = a.findOne({'office':examples[0].office});
          expect(result).to.deep.equal(examples[0]);
        },
      },
      'with "index" method': {
        'that should be a function':function(){
          var a = [].ensureIndex();
          expect(a.index).to.be.a('function');
        },
        'that erases existent index positions':function(){
          var a = [].ensureIndex(['id']);
          expect(a.indexes.id).to.be.a('object');
          a.index();
          expect(a.indexes.id).to.deep.equal({});
        },
        'that add fields to index':function(){
          var a = [examples[0], examples[1], examples[2]].ensureIndex(['office']);
          expect(a.indexes.office).to.exist;
          expect(a.indexes.name).to.not.exist;
          a.index(['name']);
          expect(a.indexes.office).to.exist;
          expect(a.indexes.name).to.exist;
        },
      },
      'with "indexItem" method': function(){
        var a = [].ensureIndex();
        expect(a.indexItem).to.be.a('function');
      },
      'with "concat" method': {
        'that should exist': function(){
          var a = [].ensureIndex();
          expect(a.concat).to.be.a('function');
        },
        'that should concatenate arrays': function(){
          var a = [examples[0]].ensureIndex();
          var b = a.concat([examples[1]], [examples[2]]);
          expect(b).to.deep.equal([examples[0], examples[1], examples[2]]);
        },
        'that should preserve arrays indexes': function(){
          var a = [examples[0]].ensureIndex(['id']);
          var b = a.concat(
            [examples[1]].ensureIndex(['name']),
            [examples[2]].ensureIndex(['office'])
            );
          expect(b.indexes).to.exist;
          expect(b.indexes).to.have.keys(['id', 'name', 'office']);
        },
      },
    },
  },
};