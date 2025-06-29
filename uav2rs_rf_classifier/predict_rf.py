###############################################################################################
#                                      预测结果                                                #
###############################################################################################
import pandas as pd
import joblib
import numpy as np
def load_label_mapping(file_path):
    label_mapping = {}
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            label, code = line.strip().split(":")
            label_mapping[int(code)] = label  # 注意这里的 key 是整数
    return label_mapping
    
# 加载label_mapping
label_mapping_file = "label_mapping.txt"
label_mapping = load_label_mapping(label_mapping_file)

# 加载模型
clf = joblib.load("random_forest_model.pkl")

# 读取新数据
csv_file = "maoming_attributes.csv"
df = pd.read_csv(csv_file)
df = df.dropna()
# 检查是否包含必要的字段
required_columns = ['mean_R', 'mean_G', 'mean_B']


# 提取特征数据
X_new = df[required_columns]
# print(X_new)
# input("")

# 使用模型进行预测
predictions_encoded = clf.predict(X_new)

# 将数字预测结果映射为标签
df['predicted_label'] = [label_mapping[pred] for pred in predictions_encoded]

# 保存带预测结果的新文件
output_file = "maoming_predictions.csv"
df.to_csv(output_file, index=False, encoding="utf-8")

print(f"预测完成！结果已保存至 {output_file}")