// Copyright © Citrix Systems, Inc.  All rights reserved.

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    'use strict';
    
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);
    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: {
            // configurable paths
            app: 'app',
            dist: 'dist'
        },

        // JSHint
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            app: [
                '<%= yeoman.app %>/scripts/**/*.js'
            ]
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: '<%= yeoman.app %>/scripts/**/*.js',
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            css: {
                files: ['<%= yeoman.app %>/styles/**/*.less'],
                tasks: ['less:development'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            html: {
                files: ['<%= yeoman.app %>/views/**/*.html'],
                tasks: ['html2js'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            gruntfile: {
                files: ['gruntfile.js']
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9005,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 98745
            },
            livereload: {
                options: {
                    open: true,
                    base: '<%= yeoman.app %>'
                }
            },
            test: {
                options: {
                    port: 9001,
                    base: [
                        'test',
                        '<%= yeoman.app %>'
                    ]
                }
            },
            dist: {
                options: {
                    base: '<%= yeoman.dist %>'
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.dist %>'
                    ]
                }]
            },
            bower: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.app %>/bower_components'
                    ]
                }]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },

        html2js: {
            options: {
                base: '.',
                rename: function (modulePath) {
                    var moduleName = modulePath.replace('app/', '');
                    return moduleName;
                }
            },
            main: {
                options: {
                    module: 'cwc.d3.templates'
                },
                src: ['<%= yeoman.app %>/views/**/*.html'],
                dest: '<%= yeoman.dist %>/scripts/d3-charts-templates.js'
            }
        },

        // Allow the use of non-minsafe AngularJS files. Automatically makes it
        // minsafe compatible so Uglify does not destroy the ng references
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            dist: {
                files: [{
                    '<%= yeoman.dist %>/scripts/d3-charts.js': [
                        '<%= yeoman.app %>/scripts/app.js',
                        '<%= yeoman.app %>/scripts/modules/**/*.js',
                        '<%= yeoman.app %>/scripts/directives/**/*.js',
                        '<%= yeoman.app %>/scripts/providers/**/*.js',
                        '<%= yeoman.app %>/scripts/services/**/*.js',
                        '<%= yeoman.app %>/scripts/validators/**/*.js',
                        '<%= yeoman.dist %>/scripts/d3-charts-templates.js'
                    ]
                }]
            }
        },

        uglify: {
            options: {
                compress: {
                    warnings: false
                },
                mangle: true
            },
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/d3-charts.min.js': '<%= yeoman.dist %>/scripts/d3-charts.js'
                }
            }
        },

        less: {
            development: {
                files: [{
                    expand: true,
                    src: ['<%= yeoman.app %>/styles/**/*.less'],
                    ext: '.css'
                }]
            },
            dist: {
                files: [{
                    // All directives stylesheet
                    '<%= yeoman.dist %>/styles/d3-charts.css': [
                        '<%= yeoman.app %>/styles/**/*.less'
                    ]
                }, {
                    // Individual directive stylesheets
                    expand: true,
                    flatten: true,
                    cwd: '<%= yeoman.app %>/styles',
                    src: ['**/*.less', '!theme-default.less'],
                    dest: '<%= yeoman.dist %>/styles/assets',
                    ext: '.css'
                }]
            }
        },

        cssmin: {
            dist: {
                files: [{
                    // All directives stylesheet
                    '<%= yeoman.dist %>/styles/d3-charts.min.css': [
                        '<%= yeoman.dist %>/styles/d3-charts.css'
                    ]
                }]
            }
        },

        htmlmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: ['*.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        concat: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/sandbox/bower_components.js': [
                        '<%= yeoman.app %>/bower_components/angular/angular.js',
                    ]
                }
            }
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/**/*.css'],
            js: ['<%= yeoman.dist %>/scripts/**/*.js'],
            options: {
                assetsDirs: ['<%= yeoman.dist %>'],
                blockReplacements: {
                    siteCSS: function (block) {
                        return '<link rel="stylesheet" href="' + block.dest + '" />';
                    },
                    siteJS: function (block) {
                        return '<script src="' + block.dest + '"></script>';
                    }
                }
            }
        },

        // Test settings
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        }
    });

    //Load third party tasks
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-ng-annotate');

    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'less:development',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('build', [
        'jshint',
        'clean:dist',
        'useminPrepare',
        'html2js',
        'ngAnnotate',
        'uglify',
        'less:dist',
        'cssmin',
        'htmlmin',
        'concat:dist',
        'usemin'
    ]);

    grunt.registerTask('test', [
        'html2js',
        'connect:test',
        'karma'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);
};
