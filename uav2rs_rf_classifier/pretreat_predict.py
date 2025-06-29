##############################################################################################
#                                     预处理需要预测的地块                                     #
##############################################################################################
# 这段代码主要是以shp作为地块范围，以tiff作为遥感影像，提取地块的特征（在这里为波段均值，可改为其他特征提取方法），保存为csv文件

from osgeo import ogr, gdal, osr
import numpy as np
import csv


# shp数据是地块数据，用于界定地块范围
# raster是遥感影像数据，用于获取遥感影像特征
shp_path = "/home/lhy/zzh/高州地块分类/茂名地块/Maoming2.shp"
raster_path = "/home/lhy/zzh/高州地块分类/gaozhou.tif"




shp_ds = ogr.Open(shp_path)
layer = shp_ds.GetLayer()
raster_ds = gdal.Open(raster_path)
# 获取矢量的范围 (min_x, max_x, min_y, max_y)
layer_extent = layer.GetExtent()
# print(f"矢量范围:{layer_extent}")


raster_gt = raster_ds.GetGeoTransform()
# 计算影像的范围
raster_min_x = raster_gt[0]
raster_max_x = raster_min_x + raster_gt[1] * raster_ds.RasterXSize
raster_max_y = raster_gt[3]
raster_min_y = raster_max_y + raster_gt[5] * raster_ds.RasterYSize

# print(f"影像范围: min_x={raster_min_x}, max_x={raster_max_x}, min_y={raster_min_y}, max_y={raster_max_y}")
raster_proj = raster_ds.GetProjection()
nodata_values = [raster_ds.GetRasterBand(i + 1).GetNoDataValue() for i in range(raster_ds.RasterCount)]

shp_srs = layer.GetSpatialRef()
raster_srs = osr.SpatialReference()
raster_srs.ImportFromWkt(raster_proj)



mean_band1, mean_band2, mean_band3 = [], [], []

for feature in layer:
    geom = feature.GetGeometryRef()
    # if coord_transform:
    #     geom.Transform(coord_transform)

    min_x, max_x, min_y, max_y = geom.GetEnvelope()
    # print(geom.GetEnvelope())
    raster_min_x = raster_gt[0]
    raster_max_y = raster_gt[3]
    raster_max_x = raster_min_x + raster_gt[1] * raster_ds.RasterXSize
    raster_min_y = raster_max_y + raster_gt[5] * raster_ds.RasterYSize

    if not (min_x < raster_max_x and max_x > raster_min_x and min_y < raster_max_y and max_y > raster_min_y):
        # print("几何超出影像范围，跳过")
        continue
    x_off = int((min_x - raster_gt[0]) / raster_gt[1])
    y_off = int((max_y - raster_gt[3]) / raster_gt[5])
    x_size = int((max_x - min_x) / raster_gt[1]) + 1
    y_size = int((min_y - max_y) / raster_gt[5]) + 1
    print(x_off, y_off, x_size, y_size)    
    # input("")
    clipped_data = []
    for i in range(raster_ds.RasterCount):
        band = raster_ds.GetRasterBand(i + 1)
        data = band.ReadAsArray(x_off, y_off, x_size, y_size)
        clipped_data.append(data)

    clipped_data = np.array(clipped_data, dtype=float)
    mask = np.full(clipped_data[0].shape, True)
    for i, nodata in enumerate(nodata_values):
        if nodata is not None:
            mask &= (clipped_data[i] != nodata)

    clipped_data[:, ~mask] = np.nan
    mean_band1.append(np.nanmean(clipped_data[0]))
    mean_band2.append(np.nanmean(clipped_data[1]))
    mean_band3.append(np.nanmean(clipped_data[2]))

# 保存为 CSV 文件
with open("maoming_attributes.csv", "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["FID", "mean_R", "mean_G", "mean_B"])
    for i, (b1, b2, b3) in enumerate(zip(mean_band1, mean_band2, mean_band3)):
        writer.writerow([i, b1, b2, b3])

shp_ds = None
raster_ds = None

