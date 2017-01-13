import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'src/index.js',
  plugins: [
    babel({
      plugins: ["external-helpers"]
    }),
    nodeResolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ],
  moduleName: 'FileUploader',
  targets: [
    { dest: 'dist/file-upload.js', format: 'umd' }
  ]
};