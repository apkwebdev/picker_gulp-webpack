module.exports = {
  entry: {
    main: './#src/scripts/bundle.js'
  },
  output: {
    filename: 'bundle.min.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
