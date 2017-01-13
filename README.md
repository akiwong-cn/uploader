## 文件上传组件
a file upload component

## 使用方法

### 直接使用uploader

```javascript
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
```

### 使用factory

```javascript
var factory = new Factory();
var uploader = factory.getUploader({url: domain, chunk: true, chunkSize});
uploader.addFile(getFile(array, 'text/plain'));
let count = 0;
let error = null;
uploader.on('complete', () => {
    done();
});
uploader.on('chunkdone', () => {
    count++;
    var r = uploader.tr.getJson();
});
uploader.on('error', () => done('transport error'));
uploader.start();

```