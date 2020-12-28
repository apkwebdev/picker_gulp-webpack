'use strict';

// ===  Блок констант путей  ===
const devBrowser = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';    // Путь до браузера, который я хочу запускать сборщиком
const srcDir = './#src/';
const destDir = './docs/';
// Note: when changing the name of the destination directory from "docs" to another, in "destDir/.gitignore" also change!
const paths = {
  pages: {
    src: srcDir + 'pages/*/*.pug',
    dest: destDir,
    watch: [srcDir + '**/*.pug', '!' + srcDir + 'fonts/', '!' + srcDir + 'images/', '!' + srcDir + 'scripts/'],
    clean: destDir + '*.html'
  },
  styles: {
    src: {
      root: srcDir + 'styles/**/*.scss',
      pages: srcDir + 'pages/*/*.scss'
    },
    dest: {
      root: destDir + 'styles/',
      pages: destDir + 'styles/pages/'
    },
    watch: [srcDir + '**/*.scss', '!' + srcDir + 'fonts/', '!' + srcDir + 'images/', '!' + srcDir + 'scripts/'],
    clean: destDir + 'styles/'
  },
  scripts: {
    src: srcDir + 'scripts/bundle.js',
    dest: destDir + 'scripts/',
    watch: [srcDir + '**/*.js', '!' + srcDir + 'fonts/', '!' + srcDir + 'images/', '!' + srcDir + 'settings/', '!' + srcDir + 'styles/', '!' + srcDir + 'vendor/'],
    clean: destDir + 'scripts/'
  },
  vendor: {
    src: srcDir + 'vendor/**/*.js',
    dest: destDir + 'scripts/vendor/',
    watch: srcDir + 'vendor/**/*.js'
  },
  fonts: {
    src: srcDir + 'fonts/**/*.*',
    dest: destDir + 'fonts/',
    watch: srcDir + 'fonts/**/*.*',
    clean: destDir + 'fonts/'
  },
  favicons: {
    src: srcDir + 'images/favicons/*.{jpg,jpeg,png,gif}',
    dest: destDir + 'images/favicons/',
    watch: srcDir + 'images/favicons/*.{jpg,jpeg,png,gif}',
    clean: destDir + 'images/favicons/'
  },
  spritePNG: {
    src: srcDir + 'images/sprites/png/*.png',
    dest: destDir + 'images/sprites/',
    watch: srcDir + 'images/sprites/png/*.png',
    clean: destDir + 'images/sprites/png/',
    mixins: srcDir + 'settings/presets/'
  },
  spriteSVG: {
    src: srcDir + 'images/sprites/svg/*.svg',
    dest: destDir + 'images/sprites/',
    watch: srcDir + 'images/sprites/svg/*.svg',
    clean: destDir + 'images/sprites/svg/'
  },
  webp: {
    src: srcDir + 'images/content/*.{gif,png,jpg,jpeg}',
    dest: destDir + 'images/content/webp/',
    watch: srcDir + 'images/content/*.*',
    clean: destDir + 'images/content/webp/'
  },
  imageMin: {
    src: srcDir + 'images/content/*.{gif,png,jpg,jpeg,svg}',
    dest: destDir + 'images/content/other/',
    watch: srcDir + 'images/content/*.*',
    clean: destDir + 'images/content/other/'
  },
  video: {
    src: srcDir + 'images/video/*.*',
    dest: destDir + 'images/content/video/',
    watch: srcDir + 'images/video/*.*',
    clean: destDir + 'images/content/video/'
  },
  cleanAll: [ destDir + '*', '!' + destDir + '.git/', '!' + destDir + '.gitignore', '!' + destDir + 'README.md', '!' + destDir + 'LICENSE' ]
}

// ===  Блок вызова модулей  ===
const gulp = require('gulp');    

// Модули, использующиеся в разных задачах
const plumber = require('gulp-plumber');
  // Отлавливает ошибки "на лету" не останавливая процесс слежения за файлами  
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

const production = require('yargs').argv.p; 
  /**  Здесь p - это флаг режима продакшена. 
   *  В случае изменения этого флага в package.json 
   *  на другой необходимо его поменять и здесь!!!
   *  Смотреть свойство "scripts" файла package.json
   **/
const gulpif = require('gulp-if');  
  /** позволяет выставить условие для выполнения или невыполнения пайпа, 
   * например, используя переменную production (см. далее)
   **/  

// Модули для работы с pug и html файлами
const pug = require('gulp-pug');
const htmlValidator = require('gulp-w3c-html-validator');

// Модули для работы со стилями
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
  // Настройку указываем в файле .browserslistrc
const groupMedia = require('gulp-group-css-media-queries');
  // Группировка медиазапросов 
// const purgeCSS = require('gulp-purgecss'); // На рассмотрении
const csso = require('gulp-csso');  
  // минификация css файлов, по умолчанию минифицирует

// Модули для работы со скриптами
const webpackStream = require('webpack-stream');
let webpackConfig = require('./webpack.config.js'); 
  // путь до файла конфигурации модуля webpack
webpackConfig.mode = production ? 'production' : 'development';
webpackConfig.devtool = production ? false : 'source-map';
  // этими переменными задаём режим разработки и продакшена для модуля webpack-stream

// Модули для работы с картинками
const newer = require('gulp-newer');
// фавиконки 
const favicons = require('gulp-favicons');
// минификация и спрайты
const spritesmith = require('gulp.spritesmith');
const buffer = require('vinyl-buffer');
const imagemin = require('gulp-imagemin');
const merge = require('merge-stream'); // for spritePNG
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const svgSprite = require('gulp-svg-sprite');
// getWebp
const imageminWebp = require('imagemin-webp');
const webp = require('gulp-webp');

// Модуль запуска сервера
const browserSync = require('browser-sync').create();
// Модуль для удаления директорий и/или файлов
const del = require('del');


  // =========\\
 // Блок задач \\
// =============\\

// Преобразуем Pug в HTML
function pages() {
  return gulp.src(paths.pages.src)
    .pipe(plumber())
    .pipe(gulpif(!production, pug({ pretty: true })))
    .pipe(gulpif(production, pug()))
    .pipe(plumber.stop())
    .pipe(gulpif(production, htmlValidator()))
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest(paths.pages.dest))
};

// Работаем со стилями
function stylesRoot() {
  return gulp.src(paths.styles.src.root)
    .pipe(plumber())
    .pipe(gulpif(!production, sourcemaps.init()))
    .pipe(gulpif(!production, sass({ outputStyle: 'expanded' })))
    .pipe(gulpif(production, sass({ outputStyle: 'compressed' })))
    .pipe(plumber.stop())
    .pipe(groupMedia())
    .pipe(autoprefixer())
    // .pipe(purgeCSS({ content: [paths.pages.src] }))
    .pipe(gulpif(production, csso()))
    .pipe(rename(function (path) { path.basename += ".min" }))
    .pipe(gulpif(!production, sourcemaps.write('')))
    .pipe(gulp.dest(paths.styles.dest.root))
};

function stylesPages() {
  return gulp.src(paths.styles.src.pages)
    .pipe(plumber())
    .pipe(gulpif(!production, sourcemaps.init()))
    .pipe(gulpif(!production, sass({ outputStyle: 'expanded' })))
    .pipe(gulpif(production, sass({ outputStyle: 'compressed' })))
    .pipe(plumber.stop())
    .pipe(groupMedia())
    .pipe(autoprefixer())
    // .pipe(purgeCSS({ content: [paths.pages.src] }))
    .pipe(gulpif(production, csso()))
    .pipe(rename(function (path) { path.basename += ".min" }))
    .pipe(rename({ dirname: '' }))
    .pipe(gulpif(!production, sourcemaps.write('')))
    .pipe(gulp.dest(paths.styles.dest.pages))
};

// Работаем со сценариями
function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest(paths.scripts.dest))
};

// Работаем с вендорами 
function vendorjs() {
  return gulp.src(paths.vendor.src)
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest(paths.vendor.dest))
};

// Работаем со шрифтами 
function fonts() {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
};

// Работа с фавиконками
function favicon() {
  return gulp.src(paths.favicons.src)
    .pipe(newer(paths.favicons.dest))
    .pipe(favicons({
      icons: {
        appleIcon: true,
        favicons: true,
        online: false,
        appleStartup: false,
        android: false,
        firefox: false,
        yandex: false,
        windows: false,
        coast: false
      }
    }))
    .pipe(gulp.dest(paths.favicons.dest))
};

// Делаем PNG sprite
function spritePNG() {
  // Генерируем спрайт
  const spriteData = gulp.src(paths.spritePNG.src).pipe(spritesmith({
    imgName: 'sprite.png',
    imgPath: '../../images/sprites/sprite.png',
    cssName: 'sprite-png.scss',
    padding: 0,
    cssVarMap: function (sprite) {
      sprite.name = 'pngicon-' + sprite.name;
    }
  }));

  // Оптимизируем спрайт
  const imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest(paths.spritePNG.dest));

  // Собираем SCSS
  const cssStream = spriteData.css
    .pipe(gulp.dest(paths.spritePNG.mixins));

  return merge(imgStream, cssStream)
    // .pipe(browserSync.reload({stream: true}))
};

// Делаем SVG спрайт
function spriteSVG() {
  return gulp.src(paths.spriteSVG.src)
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg",
        }
      }
    }))
    .pipe(gulp.dest(paths.spriteSVG.dest))
    // .pipe(browserSync.reload({stream: true}))
};

// getWebp
function getWebp() {
  return gulp.src(paths.webp.src)
    .pipe(newer(paths.webp.dest))
    .pipe(webp(imageminWebp({
      lossless: true,
      quality: 100,
      alphaQuality: 100
    })))
  .pipe(gulp.dest(paths.webp.dest)) 
}

// Минификация и оптимизация изображений
function imageMin() {
  return gulp.src(paths.imageMin.src)
    .pipe(newer(paths.imageMin.dest))
    .pipe(buffer())
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest(paths.imageMin.dest))
    // .pipe(browserSync.reload({stream: true}))
};

// Работаем с видео 
function video() {
  return gulp.src(paths.video.src)
    .pipe(gulp.dest(paths.video.dest))
};

/** 
 * Модуль, запускающий сервер в директории destDir и браузер devBrowser 
 * (Переменные destDir и devBrowser заданы в блоке путей в самом верху).
 * Начиная с версии 2.23 при установке свойства watch в положение true
 * может сам отслеживать изменения в директории, в которой запущен
 * сервер и при обнаружении изменившегося файла перезапустить сервер.
 **/
function server() {
  browserSync.init({
    watch: true,
    server: destDir,
    browser: devBrowser,
    notify: false,
    open: true,
    cors: true
  });
};

/**
 * Смотритель за изменениями в директории srcDir. Запускает задачи(функции)
 * описанные выше в случае обнаружения изменений в указанных путях. Для 
 * отслеживания используется встроенный в модуль gulp метод watch. 
 */
function watcher() {
  gulp.watch(paths.pages.watch, gulp.parallel(pages));
  gulp.watch(paths.styles.watch, gulp.parallel(styles)); // see Task vars below
  gulp.watch(paths.scripts.watch, gulp.parallel(scripts));
  gulp.watch(paths.vendor.watch, gulp.parallel(vendorjs));
  gulp.watch(paths.fonts.watch, gulp.parallel(fonts));
  gulp.watch(paths.favicons.watch, gulp.parallel(favicon));
  gulp.watch(paths.spritePNG.watch, gulp.parallel(spritePNG));
  gulp.watch(paths.spriteSVG.watch, gulp.parallel(spriteSVG));
  gulp.watch(paths.webp.watch, gulp.parallel(getWebp));
  gulp.watch(paths.imageMin.watch, gulp.parallel(imageMin));
};

/** 
 * Модуль очистки директорий и/или файлов. При запуске в режиме продакшен
 * удаляет директорию destDir полностью, в режиме разработки - удаляет
 * только файлы согласно указанным путям, т.е. в этом случае не будет 
 * удалено содержимое директории images в директории destDir.
 */
function clean() {
  return production ? 
            del(paths.cleanAll) : 
            del([
              paths.pages.clean, 
              paths.styles.clean,
              paths.scripts.clean,
            ]);
};


// ===  Tasks vars  ===

let styles = gulp.series(stylesRoot, stylesPages);

let create = gulp.parallel(
  imageMin,
  gulp.series(spritePNG, styles),
  getWebp,
  spriteSVG,
  favicon,
  scripts,
  vendorjs,
  pages,
  fonts,
  video  
);

let dev = gulp.parallel(watcher, server);

exports.create = create;
exports.clean = clean;
exports.default = gulp.series(clean, create, dev);


// exports.pg = pages;
// exports.st = styles;
// exports.scr = scripts;
// exports.png = spritePNG;
// exports.svg = spriteSVG;
// exports.fav = favicon;
