'use strict';

var _tagmap = require('../dist/tagmap');

var _tagmap2 = _interopRequireDefault(_tagmap);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _hdbscanjs = require('hdbscanjs');

var _hdbscanjs2 = _interopRequireDefault(_hdbscanjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FILE_PATH = 'https://rivulet-zhang.github.io/dataRepo/tagmap/hashtags10k.json'; /* global it, describe, console */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// import { expect } from 'chai';


describe('hdbscan', function () {

  var tagMap = new _tagmap2.default(_hdbscanjs2.default.distFunc.geoDist);
  var sizeMeasurer = function sizeMeasurer(label, fontSize) {
    return {
      width: fontSize * 0.6 * label.length,
      height: fontSize
    };
  };
  var project = function project(val) {
    return [val[0] * 5, val[1] * 5];
  };

  it('extractCluster', function (done) {

    _axios2.default.get(FILE_PATH).then(function (response) {

      // parameter setup
      // const data = [[], response.data.slice(0, 50), response.data.slice(0, 1000), response.data.slice(0, 3000)];
      var data = [response.data.slice(0, 500)];
      var bbox = { minX: -180, maxX: 180, minY: -90, maxY: 90 };
      var weightThreshold = [1];
      var maxDist = [3];

      var maxFontSize = 30;
      var minFontSize = 10;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var d = _step.value;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = weightThreshold[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var w = _step2.value;
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = maxDist[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var m = _step3.value;

                  console.log('new test instance');
                  tagMap.buildHierarchy(d, { getPosition: function getPosition(val) {
                      return val.coordinates;
                    } });
                  var tagList = tagMap.extractCluster({ project: project, bbox: bbox, weightThreshold: w, maxDist: m });
                  console.log('The size of extracted tags are ' + tagList.length);
                  var nonOverlapTags = tagMap.layout({ minFontSize: minFontSize, maxFontSize: maxFontSize, sizeMeasurer: sizeMeasurer, isForce: true });
                  console.log('The size of non-overlap tags are ' + nonOverlapTags.length);
                  // console.log(JSON.stringify(nonOverlapTags));
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }).then(done, done);
  });
});