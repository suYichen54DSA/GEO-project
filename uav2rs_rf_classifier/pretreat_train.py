
###############################################################################################
#                                      预处理训练的点数据                                       #
###############################################################################################
# 这段代码主要是通过读取xlsx文件，下载其中的图片，然后计算图片的RGB均值，将均值写回到CSV文件中，使得原CSV文件具有类别（label）和RGB均值信息（特征）

import pandas as pd
import requests
from PIL import Image
from io import BytesIO
import numpy as np
# 下载函数
def UPDATE(url, name, path):
    response = requests.get(url)
    # print(response)
    # input("")

    if response.status_code == 200:
        img = Image.open(BytesIO(response.content)).convert('RGB') 
        img_array = np.array(img)

        # 将各无人机影像中像元波段均值作为该影像的特征值
        # 在这里可以根据实际需要修改为更为精确的特征提取方法
        mean_R = img_array[:, :, 0].mean()
        mean_G = img_array[:, :, 1].mean()
        mean_B = img_array[:, :, 2].mean()
        # print(mean_R,mean_G,mean_B)
        # 更新数据
        df.at[index, 'mean_R'] = mean_R
        df.at[index, 'mean_G'] = mean_G
        df.at[index, 'mean_B'] = mean_B


# 读取xlsx，读取csv会有乱码
csv_file = "mark_images_export.xlsx"
df = pd.read_excel(csv_file)

# 读取对应图像存储目录
download_path = "image"
base_url = "http://birdseye-img-ali-cdn.sysuimars.com/"

# 均值化
df['mean_R'] = np.nan
df['mean_G'] = np.nan
df['mean_B'] = np.nan

# 遍历表格中的每一行
for index, row in df.iterrows():
    image_path = row['path']
    full_url = f"{base_url}{image_path}"  # 完整URL
    image_name = image_path.split('/')[-1]  # 提取图片名

    # 下载图片
    UPDATE(full_url, image_name, download_path)


# 将各无人机影像中像元波段均值写回CSV
output_file = "mark_images_with_means.csv"
df.to_csv(output_file, index=False)
print(f"已更新CSV{output_file}")
