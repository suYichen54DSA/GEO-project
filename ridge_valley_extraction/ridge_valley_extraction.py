import numpy as np
from osgeo import gdal
from scipy.ndimage import gaussian_filter
from skimage.morphology import skeletonize

# 输入文件路径
gd_dem_path = "DEM提取/srtm_58_07/gd_dem_upscaled_30.tif"
# gd_slope_path = "DEM提取/srtm_58_07/gd_slope.tif"
# gd_aspect_path = "DEM提取/srtm_58_07/gd_aspect.tif"
ridge_output_path = "DEM提取/srtm_58_07/ridge_skeleton_30m.tif"
valley_output_path = "DEM提取/srtm_58_07/valley_skeleton_30m.tif"
ridge_threshold = 90  # 设置山脊曲率阈值
valley_threshold = 10 # 设置山谷子曲率阈值
# 读取数据 #
def read_raster(file_path):
    dataset = gdal.Open(file_path)
    band = dataset.GetRasterBand(1)
    array = band.ReadAsArray().astype(np.float32)
    transform = dataset.GetGeoTransform()
    projection = dataset.GetProjection()
    return array, dataset, transform, projection
gd_dem, dataset, transform, projection = read_raster(gd_dem_path)

# 计算梯度 #
def calculate_curvature(dem):
    gy, gx = np.gradient(dem)  # 计算梯度
    gyy, _ = np.gradient(gy)   # 计算二阶导数
    _, gxx = np.gradient(gx)
    curvature = gxx + gyy      # 高度曲率，凸起的地方值较大
    return curvature

curvature = calculate_curvature(gd_dem)

# 处理nan #
mean_value = np.nanmean(curvature) 
curvature = np.nan_to_num(curvature, nan=mean_value)  

# 提取局部最大与最小 #
valley_candidates = curvature > np.percentile(curvature, ridge_threshold)  # 取曲率前 ridge_threshold% 的区域
ridge_candidates = curvature < np.percentile(curvature, valley_threshold)  # 选取曲率最低的区域


smoothed_ridge = gaussian_filter(ridge_candidates.astype(float), sigma=1)
smoothed_valley = gaussian_filter(valley_candidates.astype(float), sigma=1)
ridge_final = (smoothed_ridge > 0.5).astype(np.uint8)
valley_final = (smoothed_valley > 0.5).astype(np.uint8)

# 进行细化
ridge_skeleton = skeletonize(ridge_final)
valley_skeleton = skeletonize(valley_final)
# print(np.unique(ridge_skeleton))
# print(np.unique(valley_skeleton))

# 保存骨架化后的山脊线与山谷线 #
driver = gdal.GetDriverByName("GTiff")
out_ds = driver.Create(ridge_output_path,dataset.RasterXSize, dataset.RasterYSize, 1, gdal.GDT_Byte)
out_ds.SetGeoTransform(transform)
out_ds.SetProjection(projection)
out_ds.GetRasterBand(1).WriteArray(ridge_skeleton)
out_ds.FlushCache()
out_ds = None

driver = gdal.GetDriverByName("GTiff")
out_ds = driver.Create(valley_output_path, dataset.RasterXSize, dataset.RasterYSize, 1, gdal.GDT_Byte)
out_ds.SetGeoTransform(transform)
out_ds.SetProjection(projection)
out_ds.GetRasterBand(1).WriteArray(valley_skeleton)
out_ds.FlushCache()
out_ds = None