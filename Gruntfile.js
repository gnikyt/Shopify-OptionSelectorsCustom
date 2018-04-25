module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015'],
        plugins: [
          [
            'transform-es2015-modules-umd',
            {
              globals: {
                'option-selector-custom': 'Shopify.OptionSelectorsCustom',
              },
              exactGlobals: true,
            },
          ],
        ],
      },
      dist: {
        files: {
          'dist/option-selectors-custom.js': 'src/option-selectors-custom.js',
        },
      },
    },
    uglify: {
      options: {
        screwIE8: true,
        mangle: false,
        preserveComments: /^!|@preserve|@license|@cc_on|\/\*\!/i,
      },
      default: {
        files: {
          'dist/option-selectors-custom.min.js': 'dist/option-selectors-custom.js',
        },
      },
    },
  });
  grunt.registerTask('default', ['babel', 'uglify']);
};
