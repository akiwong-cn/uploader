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
      var bufs = [];
      req.on('data', (buf) => {
          bufs.push(buf);
      });
      req.on('end', (e) => {
          console.log(Buffer.concat(bufs));
          console.log('------toString:', Buffer.concat(bufs).toString());
      });
    // parse a file upload
    var form = new formidable.IncomingForm();
	form.uploadDir = path.join(__dirname, 'tmp');
    form.multiples = true;
    form.parse(req, function(err, fields, files) {
      files = files['file[]'] || {};
      var result = JSON.stringify({fields: fields, files: files}, null, '  ');
      if (fields.redirect_url) {
        res.writeHead(302, {
          Location: fields.redirect_url.replace('%s', encodeURIComponent(result))
        });
        res.end();
      } else {
        res.writeHead(200, {'Content-Type': 'text/json'});
        res.writeHead(200, {
          'Access-Control-Allow-Origin': req.headers['origin'],
          'Access-Control-Allow-Method': 'POST',
          'Access-Control-Allow-Headers': 'range',
        });
        res.end(result);
      }
    });
    return;
  }

  if (req.method.toLowerCase() == 'options') {
  // show a file upload form
    res.writeHeader(204, {
        'Access-Control-Allow-Origin': req.headers['origin'],
        'Access-Control-Allow-Method': 'POST',
        'Access-Control-Allow-Headers': 'x-requested-with, content-range, a',
    });
    res.end();
    return;
  }
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="file[]" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(3000);
