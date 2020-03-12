## 介绍
模板项目分位3大模块

```
editor 一个组件的编辑器
preview 开发这个组件的时候的运行环境
src 组件的核心代码

```

![image.png](https://ymm-maliang.oss-cn-hangzhou.aliyuncs.com/ymm-maliang/godspenshop/YGZv9U_1583984525058.png)

为了便于维护和扩展，我们觉得一个组件的可配置数据包括简单数据，复杂逻辑数据，对应可编辑属性的部分也分为两部分

1. 编辑器提供基础属性编辑 （系统默认支持）
```
/**
 * 
 * @param type: 字段类型，支持原生类型以及【码良输入类型】
 * 
 * 码良输入类型: 
 * input    单行输入框
 * text     多行输入框
 * enum     列表单选    需提供选项字段defaultList， 支持数组、map结构
 * image    图片选择
 * audio    音频选择
 * video    视频选择
 * richtext 富文本 
 * number   数字
 * function 方法设置
 * data     json数据
 * date     时间选择
 * checkbox 多选框      同enum 不提供defaultList字段时，输入值为布尔类型
 * radio    单选框      同enum
 * 
*/


```
2. 编辑器能提供扩展编辑编辑能力（editor），主要针对运营方便操作，特征性的开发组件属性的编辑功能，提供对运营友好的操作体验



核心数据流向

![image.png](https://ymm-maliang.oss-cn-hangzhou.aliyuncs.com/ymm-maliang/godspenshop/QPSfKg_1583462402051.png)

组件的核心是通过传入的数据进行不同的逻辑处理和显示， 而编辑器通过你自己编写的页面对组件的数据进行修改， 最终编辑器修改数据，组件同步更改显示，预览器则是提供在开发过程中的一个环境，用来提供默认数据。


