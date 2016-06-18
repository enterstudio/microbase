var osmosis = require('osmosis');
var stringify = require('csv-stringify');
var fs = require('fs');

url = 'http://www.elcorteingles.es/electrodomesticos/frigorificos-y-congeladores/';
data = '';
a = 0;

stringifier = stringify({ quoted: true });
stringifier.on('readable', function () {
  while (row = stringifier.read()) {
    data += row;
  }
});
stringifier.on('error', function (err) {
  console.log(err.message);
});
stringifier.on('finish', function () {
  fs.writeFile("./data/data.csv", data, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
});

osmosis
  .get(url)
  .config('concurrency', 1)
  .config('tries', 3)
  .config('timeout', 2500)
  .paginate('.pagination > ul > li:last > a', 100)
  .set({
    loc1: 'head > link[rel=canonical]@href'
  })
  .find('.product')
  .set({
    data: 'span@data-json'
  })
  .then(function (context, data, next) {
    var items = context.find('div > div.product-image');
    next(items[0], data);
  })
  .set('location', 'a@href')
  .follow('a@href')

  // Product Page
  .find('#product-info')
  .set({
    //id: '#pid@data-product-id',
    //title: 'h2.title',
    //brand: 'h2.brand > a@title',
    //price: '#price-container > div > span.former',
    //salePrice: '#price-container > div > span.current',
    description: 'div.description-container > p'
  })
  .find('.product-features')
  .set({
    type: 'dl>dt:contains("Tipo de frigorifico") + dd',
    classenerg: 'dl>dt:contains("Clasificación energética") + dd',
    capacity: 'dl>dt:contains("Capacidad útil del refrigerador") + dd',
    color: 'dl>dt:contains("Color de la puerta") + dd',
    dimensions: 'dl>dt:contains("Dimensiones (ancho x alto x fondo)") + dd',
  })
  .find('#product-images')
  .set({
    'img210': ['div > ul > li > img@src'],
    'img640': ['div > ul > li > img@data-screen-src'],
    'img1200': ['div > ul > li > img@data-zoom-src']
  })
  .data(function (p) {
    const dto = JSON.parse(p.data);
    stringifier.write([
      dto.id,
      dto.name,
      dto.brand,
      dto.price.original,
      dto.price.final,
      p.location,
      p.type,
      p.classenerg,
      p.capacity,
      p.color,
      p.dimensions,
      p.description,
      dto.category.join(':'),
      p.img210.join(':'),
      p.img640.join(':'),
      p.img1200.join(':')
    ]);
    console.log(++a, p.loc1, dto.id, dto.name);
  })
  .done(function () {
    stringifier.end();
  })
  //.log(console.log)
  .error(console.log)
//.debug(console.log)