import {assert} from 'chai/chai'
import Uploader from '../src/uploader'
import getFile from './getFile'
import domain from './domain'

describe('uploader send file', function () {
    this.timeout(5000);
    it('uploader send one file', function (done) {
        var uploader = new Uploader({url: domain});
        uploader.addFile(getFile([123], 'text/plain'));
        assert.equal(uploader.status, Uploader.STATUS.UNSTART);
        uploader.on('complete', (uploader) => {
            const r = uploader.tr.getJson();
            if (r.files.size === 3) {
                done();
            } else {
                done('file size error');
            }
        });
        uploader.on('error', () => done('transport error'));
        uploader.start();
    });

    it('uploader send multi file', function (done) {
        var uploader = new Uploader({url: domain});
        uploader.addFile(getFile([123], 'text/plain'));
        uploader.addFile(getFile([234], 'text/plain'));
        assert.equal(uploader.status, Uploader.STATUS.UNSTART);
        var count = 0;
        uploader.on('done', () => {
            count++;
        });
        uploader.on('complete', () => {
            if (count == 2) {
                done();
            } else {
                done('file count error')
            }
        });
        uploader.on('error', () => done('transport error'));
        uploader.start();
    });
});