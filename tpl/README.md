## 介绍
模板项目分位3大模块

```
editor 一个组件的编辑器
preview 开发这个组件的时候的运行环境
src 组件的核心代码

```
核心数据流向

![image.png](https://ymm-maliang.oss-cn-hangzhou.aliyuncs.com/ymm-maliang/godspenshop/QPSfKg_1583462402051.png)

组件的核心是通过传入的数据进行不同的逻辑处理和显示， 而编辑器通过你自己编写的页面对组件的数据进行修改， 最终编辑器修改数据，组件同步更改显示，预览器则是提供在开发过程中的一个环境，用来提供默认数据。