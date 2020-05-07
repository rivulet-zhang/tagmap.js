/* global it, describe, console */
/* eslint-disable max-len */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// import { expect } from 'chai';
import TagMap from '../dist/tagmap';
import axios from 'axios';
import ClusterTree from 'hdbscanjs';

const FILE_PATH = 'https://rivulet-zhang.github.io/dataRepo/tagmap/hashtags10k.json';

describe('hdbscan', () => {

  const tagMap = new TagMap(ClusterTree.distFunc.geoDist);
  const sizeMeasurer = (label, fontSize) => ({
    width: fontSize * 0.6 * label.length,
    height: fontSize
  });
  const project = val => [val[0] * 5, val[1] * 5];

  it('extractCluster', (done) => {

    axios.get(FILE_PATH)
      .then(response => {

        // parameter setup
        // const data = [[], response.data.slice(0, 50), response.data.slice(0, 1000), response.data.slice(0, 3000)];
        const data = [response.data.slice(0, 500)];
        const bbox = {minX: -180, maxX: 180, minY: -90, maxY: 90};
        const weightThreshold = [1];
        const maxDist = [3];

        const maxFontSize = 30;
        const minFontSize = 10;

        for (const d of data) {
          for (const w of weightThreshold) {
            for (const m of maxDist) {
              console.log('new test instance');
              tagMap.buildHierarchy(d, {getPosition: val => val.coordinates});
              const tagList = tagMap.extractCluster({project, bbox, weightThreshold: w, maxDist: m});
              console.log(`The size of extracted tags are ${tagList.length}`);
              const nonOverlapTags = tagMap.layout({minFontSize, maxFontSize, sizeMeasurer, isForce: true});
              console.log(`The size of non-overlap tags are ${nonOverlapTags.length}`);
              // console.log(JSON.stringify(nonOverlapTags));
            }
          }
        }

      }).then(done, done);
  });

});
