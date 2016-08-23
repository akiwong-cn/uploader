/**
 * @file
 * @author wangqiushi <wangqiushi@bytedance.com>
 */

var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
var path = require('path');

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();
	form.uploadDir = path.join(__dirname, 'tmp');
    form.multiples = true;
    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'Content-Type': 'text/json'});
        res.writeHead(200, {
          'Access-Control-Allow-Origin': req.headers['origin'],
          'Access-Control-Allow-Method': 'POST',
          'Access-Control-Allow-Headers': 'range',
        });
        files = files['file[]'] || {};
      res.end(JSON.stringify({fields: fields, files: files}, null, '  '));
    });
    return;
  }

  // show a file upload form
    res.writeHeader(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': req.headers['origin'],
        'Access-Control-Allow-Method': 'POST',
        'Access-Control-Allow-Headers': 'x-requested-with, content-range',
    });
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="file[]" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(3000);