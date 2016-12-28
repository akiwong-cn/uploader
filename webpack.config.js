 module.exports = {
     entry: './src/index.js',
     output: {
         path: './release',
         filename: 'file-upload.pack.js',
         library: 'FileUploader',
         libraryTarget: 'umd'
     },
     module: {
         loaders: [{
             test: /\.js$/,
             exclude: /node_modules/,
             loader: 'babel-loader',
             query: {
                 presets: ['es2015']
             }
         }]
     }
 };