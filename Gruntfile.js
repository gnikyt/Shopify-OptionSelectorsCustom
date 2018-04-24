module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015'],
      },
      dist: {
        files: {
          'dist/option-selection-custom.js': 'src/option-selection-custom.js',
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
          'dist/option-selection-custom.min.js': 'dist/option-selection-custom.js',
        },
      },
    },
  });
  grunt.registerTask('default', ['babel', 'uglify']);
};
