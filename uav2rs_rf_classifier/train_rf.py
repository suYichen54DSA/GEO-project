###############################################################################################
#                                采用随机森林模型进行训练                                       #
###############################################################################################
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib  # 用于保存模型

# 读取数据
csv_file = "mark_images_with_means.csv"
df = pd.read_csv(csv_file)

# 获取唯一分类标签并编码，其中leibie为原csv文件中的label对应的列名
unique_labels = df['leibie'].unique()
label_mapping = {label: idx for idx, label in enumerate(unique_labels)}
df['label_encoded'] = df['leibie'].map(label_mapping)

# 准备特征和标签
X = df[['mean_R', 'mean_G', 'mean_B']]  # 特征
y = df['label_encoded']  # 数字编码标签



# 构建随机森林分类器，可依据实际需求改为其他模型
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)



# 保存模型
model_file = "random_forest_model.pkl"
joblib.dump(clf, model_file)

with open("label_mapping.txt","w",encoding='utf-8') as f:
    for label,code in label_mapping.items():
        f.write(f"{label}:{code}\n")

# 打印分类标签映射
print("分类标签映射:")
print(label_mapping)
print(f"模型已保存至 {model_file}")