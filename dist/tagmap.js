'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable max-len */


var _d3Scale = require('d3-scale');

var _tag = require('./tag');

var _tag2 = _interopRequireDefault(_tag);

var _rbush = require('rbush');

var _rbush2 = _interopRequireDefault(_rbush);

var _hdbscanjs = require('hdbscanjs');

var _hdbscanjs2 = _interopRequireDefault(_hdbscanjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TagMap = function () {
  function TagMap() {
    var distFunc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : TagMap.distFunc.euclidean;

    _classCallCheck(this, TagMap);

    this.tagTree = {};
    this.tagList = [];
    this.distFunc = distFunc;
  }

  _createClass(TagMap, [{
    key: 'buildHierarchy',
    value: function buildHierarchy(data, _ref) {
      var _this = this;

      var _ref$getLabel = _ref.getLabel,
          getLabel = _ref$getLabel === undefined ? function (val) {
        return val.label;
      } : _ref$getLabel,
          _ref$getPosition = _ref.getPosition,
          getPosition = _ref$getPosition === undefined ? function (val) {
        return val.position;
      } : _ref$getPosition,
          _ref$getWeight = _ref.getWeight,
          getWeight = _ref$getWeight === undefined ? function (val) {
        return val.weight;
      } : _ref$getWeight;

      // clear tree
      this.tagTree = {};
      // group tags based on the content
      data.forEach(function (val) {
        var label = getLabel(val);
        if (!_this.tagTree.hasOwnProperty(label)) {
          _this.tagTree[label] = [];
        }
        _this.tagTree[label].push({ data: getPosition(val), opt: getWeight(val) });
      });
      for (var key in this.tagTree) {
        var cluster = new _hdbscanjs2.default(this.tagTree[key], this.distFunc);
        this.tagTree[key] = cluster.getTree();
      }
    }
  }, {
    key: 'extractCluster',
    value: function extractCluster(_ref2) {
      var _this2 = this;

      var _ref2$project = _ref2.project,
          project = _ref2$project === undefined ? function (val) {
        return val;
      } : _ref2$project,
          _ref2$bbox = _ref2.bbox,
          bbox = _ref2$bbox === undefined ? null : _ref2$bbox,
          _ref2$weightThreshold = _ref2.weightThreshold,
          weightThreshold = _ref2$weightThreshold === undefined ? 0 : _ref2$weightThreshold,
          _ref2$maxDist = _ref2.maxDist,
          maxDist = _ref2$maxDist === undefined ? TagMap.maxDist : _ref2$maxDist;

      // clear tagList
      this.tagList = [];

      var _loop = function _loop(key) {
        var tree = _this2.tagTree[key];
        var flagCluster = tree.filter(function (val) {
          // a cluster of a single point
          if (val.isLeaf) {
            return true;
          }
          // test the cluster does not split under the current zoom level
          var cp0 = project(val.edge[0]);
          var cp1 = project(val.edge[1]);
          return Math.sqrt(Math.pow(cp0[0] - cp1[0], 2) + Math.pow(cp0[1] - cp1[1], 2)) < maxDist;
        }, bbox);

        // generate tags which passed the test and weightThreshold
        var tags = flagCluster.map(function (val) {
          var tag = new _tag2.default(key);
          val.data.forEach(function (p, i) {
            return tag.add(p, val.opt[i]);
          });
          tag.setCenter(project(tag.center));
          return tag;
        }).filter(function (val) {
          return val.weight >= weightThreshold;
        });

        _this2.tagList = _this2.tagList.concat(tags);
      };

      for (var key in this.tagTree) {
        _loop(key);
      }
      return this.tagList;
    }
  }, {
    key: '_getScale',
    value: function _getScale(minWeight, maxWeight, minFontSize, maxFontSize) {
      if (minWeight === maxWeight) {
        return function (x) {
          return minFontSize;
        };
      }
      // set log scale for label size
      return (0, _d3Scale.scaleLog)().base(Math.E).domain([minWeight, maxWeight]).range([minFontSize, maxFontSize]);
    }

    // center is two element array

  }, {
    key: '_rotate',
    value: function _rotate(center, angle, radius) {
      var radian = angle / 180.0 * Math.PI;
      var x = Math.cos(radian) * radius + center[0];
      var y = Math.sin(radian) * radius + center[1];
      return [x, y];
    }

    // forcely place tag without overlap removal

  }, {
    key: '_forcePlaceTag',
    value: function _forcePlaceTag(placedTag, tree, tag) {
      placedTag.push(tag);
    }

    // a greedy circular layout method

  }, {
    key: '_placeTag',
    value: function _placeTag(placedTag, tree, tag) {
      var angle = -90.0;
      var deltaAngle = 25;
      var radius = 0;
      var deltaRadius = 1.5;
      var iter = 0;
      var iterThreshold = 20;

      var center = tag.center.slice();
      while (iter <= iterThreshold) {
        // calculate the new candidate position
        var p = this._rotate(center, angle, radius);
        tag.setCenter(p);
        var bbox = {
          minX: p[0] - tag.width * 0.5,
          maxX: p[0] + tag.width * 0.5,
          minY: p[1] - tag.height * 0.5,
          maxY: p[1] + tag.height * 0.5
        };
        // if no collision, position the tag
        if (!tree.collides(bbox)) {
          placedTag.push(tag);
          tree.insert(bbox);
          break;
        }
        // increment angle and radius
        angle += deltaAngle;
        radius += deltaRadius;
        iter++;
      }
    }
  }, {
    key: 'layout',
    value: function layout(_ref3) {
      var _this3 = this;

      var minFontSize = _ref3.minFontSize,
          maxFontSize = _ref3.maxFontSize,
          sizeMeasurer = _ref3.sizeMeasurer,
          _ref3$isForce = _ref3.isForce,
          isForce = _ref3$isForce === undefined ? false : _ref3$isForce,
          _ref3$maxNumOfTags = _ref3.maxNumOfTags,
          maxNumOfTags = _ref3$maxNumOfTags === undefined ? TagMap.maxNumOfTags : _ref3$maxNumOfTags;

      if (!this.tagList || this.tagList.length === 0) {
        return [];
      }
      // get tags in descending order
      var orderedTags = this.tagList.sort(function (a, b) {
        return b.weight - a.weight;
      });
      // get scale function to calculate size of label bounding box
      var minWeight = orderedTags[orderedTags.length - 1].weight;
      var maxWeight = orderedTags[0].weight;

      // calculate bounding box
      orderedTags.forEach(function (x) {
        var fontSize = _this3._getScale(minWeight, maxWeight, minFontSize, maxFontSize)(x.weight);

        var _sizeMeasurer = sizeMeasurer(x.label, fontSize),
            width = _sizeMeasurer.width,
            height = _sizeMeasurer.height;

        x.setSize(width, height);
      });

      // run actual layout algorithm
      var placedTag = [];
      var tree = (0, _rbush2.default)();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = orderedTags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var tag = _step.value;

          if (placedTag.length >= maxNumOfTags) {
            break;
          }
          if (isForce) {
            this._forcePlaceTag(placedTag, tree, tag);
          } else {
            this._placeTag(placedTag, tree, tag);
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

      return placedTag;
    }

    // screen-space aggregation threshold: invisible to the user

  }], [{
    key: 'maxDist',
    get: function get() {
      return 20;
    }

    // max number of tags shown in the view: invisible to the user for now, might change to a user-defined paramater later

  }, {
    key: 'maxNumOfTags',
    get: function get() {
      return 100;
    }
  }]);

  return TagMap;
}();

exports.default = TagMap;


TagMap.distFunc = {
  euclidean: _hdbscanjs2.default.distFunc.euclidean,
  geoDist: _hdbscanjs2.default.distFunc.geoDist
};