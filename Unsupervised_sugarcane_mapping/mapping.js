//////////////////////////////////////////////////////////////////////////////////////////////////////

//////           This code is written in JavaScript and can be run in gee. Its link is         //////
//////           https://code.earthengine.google.com/5466700ba73840f15876cbd5f3f41504          //////

//////////////////////////////////////////////////////////////////////////////////////////////////////



                          // 这一段代码主要是进行数据训练前处理 //

function get_sar_series(startDate,endDate,roi)
{ 
    var dataset_s1=ee.ImageCollection('COPERNICUS/S1_GRD')   //select sentinel-1
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))//VV极化
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))//VH极化
            .filterBounds(roi) 
            .filter(ee.Filter.date(startDate,endDate)) 
            .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
            .map(function(image) {
              var edge = image.lt(-30.0); //set the threshold as -30.0
              var maskedImage = image.mask().and(edge.not()); 
              // create a mask to rule out the edge
              return image.updateMask(maskedImage);  // update the mask
            });
            
    var dataset_s1_sg=oeel.ImageCollection.SavatskyGolayFilter(dataset_s1,
      ee.Filter.maxDifference(1000*3600*24*36, 'system:time_start', null, 'system:time_start'),
      // retention of images with a time lag of up to 36 days 
      function(infromedImage,estimationImage){
      return ee.Image.constant(ee.Number(infromedImage.get('system:time_start'))
      .subtract(ee.Number(estimationImage.get('system:time_start'))));},3,['VH']);
      // select the band to be filtered 
    return dataset_s1_sg   //return teh sentinel-1 which was solved
}

var startDate1 = '2021-01-01';
var endDate1 = '2021-04-30';
var startDate2 = '2021-05-01';
var endDate2 = '2021-11-30';
var startDate3 = '2022-01-01';
var endDate3 = '2022-04-30';
var startDate4 = '2022-05-01';
var endDate4 = '2022-11-30';
var roi = zj  // choose the roi
// return the sar sequence that satisfies the condition //
var y1_t1_series = get_sar_series(startDate1,endDate1,roi).select('VH')
// print(y1_t1_series[0])
var y1_t2_series = get_sar_series(startDate2,endDate2,roi).select('VH')


var y2_t1_series = get_sar_series(startDate3,endDate3,roi).select('VH')
var y2_t2_series = get_sar_series(startDate4,endDate4,roi).select('VH')




// Pixel-by-pixel selection of the minimum filter on the time series //
var y1_t1_min = y1_t1_series.reduce(ee.Reducer.min()).focal_median();
var y1_t1_max = y1_t1_series.reduce(ee.Reducer.max()).focal_median();
var y1_t1_median = y1_t1_series.reduce(ee.Reducer.median()).focal_median();
var y1_t2_min = y1_t2_series.reduce(ee.Reducer.min()).focal_median();
var y1_t2_median = y1_t2_series.reduce(ee.Reducer.median()).focal_median();

// use the mask function to identify the nan area //
var gap1 = y1_t1_min.multiply(-1).add(-19).updateMask(y1_t1_min.lte(-19)).unmask(0)
var gap1 = gap1.updateMask(gap1.lte(4)).unmask(4).focal_median()
// Map.addLayer(gap1,{},'gap1')

var gap2 = y1_t2_median.subtract(y1_t2_min).multiply(-1).add(8)
var gap2 = gap2.updateMask(gap2.gte(0)).unmask(0).focal_median()
// Map.addLayer(gap2,{},'gap2')

var gap3 = y1_t2_min.subtract(y1_t1_min)
var gap3 = gap3.updateMask(gap3.gte(0)).unmask(0)
var gap3 = gap3.updateMask(gap3.lte(4)).unmask(4).focal_median()
// Map.addLayer(gap3,{},'gap3')

// var gap4 = y1_t1_min.multiply(-1).add(y1_t1_max).updateMask(y1_t1_min.lte(-19)).unmask(0)
// var gap4 = gap4.updateMask(gap4.lte(4)).unmask(4).focal_median()
var gap4 = y1_t1_min.multiply(-1).add(y1_t1_median).updateMask(y1_t1_min.lte(-19)).unmask(0)


// 后向传播系数叠在一起的图层
var gz_lhy = gap1.add(gap2).add(gap3).focal_median()
// var gz = gz_lhy.gte(8).unmask(0)



// same as above //
var y2_t1_min = y2_t1_series.reduce(ee.Reducer.min()).focal_median();
var y2_t1_median = y2_t1_series.reduce(ee.Reducer.median()).focal_median();
var y2_t2_min = y2_t2_series.reduce(ee.Reducer.min()).focal_median();
var y2_t2_median = y2_t2_series.reduce(ee.Reducer.median()).focal_median();
var gap2_1 = y2_t1_min.multiply(-1).add(-19).updateMask(y2_t1_min.lte(-19)).unmask(0)
var gap2_1 = gap2_1.updateMask(gap2_1.lte(4)).unmask(4).focal_median()
// Map.addLayer(gap1,{},'gap1')

var gap2_2 = y2_t2_median.subtract(y2_t2_min).multiply(-1).add(8)
var gap2_2 = gap2_2.updateMask(gap2_2.gte(0)).unmask(0).focal_median()
// Map.addLayer(gap2,{},'gap2')

var gap2_3 = y2_t2_min.subtract(y2_t1_min)
var gap2_3 = gap2_3.updateMask(gap2_3.gte(0)).unmask(0)
var gap2_3 = gap2_3.updateMask(gap2_3.lte(4)).unmask(4).focal_median()
// Map.addLayer(gap3,{},'gap3')

var gz_lhy_2 = gap2_1.add(gap2_2).add(gap2_3).focal_median()

// var gz = gz_lhy.gte(8).unmask(0)
var gz_value =  gz_lhy.add(gz_lhy_2).focal_median()

// 获取 VH_min 字段
var vh_min = gz_value.select('VH_min');

// 归一化 VH_min 字段
var normalized_vh_min = vh_min.unitScale(0, 1);

// 将归一化 VH_min 字段添加到图像中
var normalized_gz_value = gz_value.addBands(normalized_vh_min.rename('VH_min'), null, true);
// 打印归一化后的图像
// print('Normalized gz_value:', normalized_gz_value);


var vizParamsBlackWhite = {
  min: 0,
  max: 30,
  palette: ['black', 'white']
};

// 获取 VH_min 字段
var vh_min = gz_value.select('VH_min');

// // 使用 reduceRegion 计算最小和最大值
var stats = vh_min.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: bd,
  scale: 10,  // 请根据你的数据调整比例
  maxPixels: 1e9
});

// 从结果中获取最小和最大值
var minValue = stats.getNumber('VH_min_min');
var maxValue = stats.getNumber('VH_min_max');

// 使用 unitScale 进行线性归一化
var normalized_vh_min =  vh_min.subtract(minValue).divide(maxValue.subtract(minValue));
var exportOptions = {
  image: y2_t1_median,
  description: 'y2_t1_median',
  folder: 'GEE_exports', // 可以更改为您希望保存的 Google Drive 文件夹
  fileNamePrefix: 'y2_t1_median',
  // dimensions: 512, // 或者 '512x512'，根据需要更改
  region: bd, // 导出区域
  scale: 10, // 分辨率，根据需要更改
  crs: 'EPSG:4326', // CRS，根据需要更改
  maxPixels: 1e10, // 最大像素限制，根据需要更改
  fileFormat: 'GeoTIFF' // 输出文件格式，可以是 'GeoTIFF' 或 'TFRecord'
};
Export.image.toDrive(exportOptions);



var threshold = 0.90


var gz = normalized_vh_min.gt(threshold).unmask(0)












var gz = gz_lhy_2 .gt(9).unmask(0)
// Map.addLayer(gz,{},'map')
// Map.addLayer(gz_lhy,{},'value')
// Map.addLayer(gz, {min: 0, max: 1, palette: ['black', 'white']}, 'Binary Mask');


// create mappings //
var reclassification_esa = function(img){
  return img.remap(
    [0,10,20,30,40,50,60,70,80,90,95,100],
    [0,2, 4, 3, 1, 8, 9, 10, 6, 5, 5, 7]);
}




//90+100:mangrove and wetland-->wetland
//110:Lichens and mosses-->tundra

// IMPORTANT //
// using ESA from research area to preduce the mask of water and building//
var ESA = ee.ImageCollection("ESA/WorldCover/v100").map(reclassification_esa).mosaic().clip(zj);
var water = ESA.eq(6).unmask(0)
var build = ESA.eq(8).unmask(0)
var esamask = water.add(build).eq(0).unmask(0)
var gz_mask = gz.updateMask(esamask.eq(1)).unmask(0)


// Map.addLayer(gz,{},'map')

// Map.addLayer(gzpt,{color:'red'},'gzpt')
// Map.addLayer(rice,{color:'yellow'},'ricept')
// Map.addLayer(others,{color:'blue'},'otherpt')

var outim = gz_mask.clip(bd)


// Map.addLayer(gz_mask,{},'map')





// 使用 inspector 工具查看图层像素值

// var exportOptions = {
//   image: outim,
//   description: 'gz_mask_export',  // 导出文件的描述
//   folder: 'GEE_exports',          // 保存到 Google Drive 的文件夹名称
//   fileNamePrefix: 'outim',      // 导出文件的前缀
//   region: bd,                      // 导出区域
//   scale: 10,                       // 分辨率
//   crs: 'EPSG:4326',                // CRS
//   maxPixels: 1e10,                 // 最大像素限制
//   fileFormat: 'GeoTIFF'            // 输出文件格式
// };
// // 发起导出任务
// Export.image.toDrive(exportOptions);
// identify the map of a wide variety of crops,and add layers of them //

var gzpt2 = gzpt.map(function(feature){
    var num = 1;
    return feature.set('class', num);
  })
  
var anshupt = anshupts.map(function(feature){
    var num = 0;
    return feature.set('class', num);
  })
var otherpt = others.map(function(feature){
    var num = 0;
    return feature.set('class', num);
  })
var ricept = rice.map(function(feature){
    var num = 0;
    return feature.set('class', num);
  })
// print(gzpt.first())
// Map.addLayer(gzpt)


var total_pt = gzpt2.merge(anshupt).merge(ricept).merge(otherpt)

// Map.addLayer(otherpts)
var pt = gzpt.merge(others)
// print("total",pt.size())
var sampleori = img.sampleRegions({
  collection: pt,
  properties: ['class'],
  scale: 10
});

var sampleori_val = img.sampleRegions({
  collection: total_pt,
  properties: ['class'],
  scale: 10
});
// Map.addLayer(gzpt,{color:"red"},"gz")
// Map.addLayer(ricept,{color:"blue"},"rice")
// Map.addLayer(otherpt,{color:"green"},"other")


// var otherpts = otherpt.merge(ricept).merge(aspt)

var otherpts = otherpt.merge(ricept).merge(aspt)
// .randomColumn().filter(ee.Filter.lt('random', 1))
// var pt = pt.set("classmap",num)
var pt = otherpts.merge(gzpt2)
// var pt = pt.set("classmap",num)
// print(pt.first())
var classmap=outim.select("VH_min").rename('classmap')
Map.addLayer(classmap)

// set the val //
var validation= classmap.sampleRegions({
  collection: pt,
  properties: ['class'],
  scale: 10,
  geometries:true
});

// set the test and assess the result //
var testAccuracy = validation.errorMatrix('class', 'classmap');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());
print("Consumer's accuracy", testAccuracy.consumersAccuracy());
print('kappa accuracy', testAccuracy.kappa());//面板上显示kappa值

// Calculate producer's accuracy, also known as sensitivity and the
// compliment of omission error (1 − omission error).
print("Producer's accuracy", testAccuracy.producersAccuracy());
print(gz_mask)
Export.image.toAsset(
{
  image: gz_mask,
  description: "gz_mask_export", // 导出图像的描述
  assetId: "projects/ee-suyichen0124/assets/ganzhe/gz_mask", // 存储 Asset 的路径
  scale: 10, // 分辨率
  region: bd, // 导出的区域
  crs: "EPSG:4326", // 投影坐标系
  maxPixels: 10e12 // 最大像素数
})
