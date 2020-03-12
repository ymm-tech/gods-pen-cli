<template>
  <div class="widget attribute">
    <div>
      <el-collapse v-model="activeNames">
        <el-collapse-item title="属性设置" name="attr">
          <div
            v-if="componentProps"
            size="mini"
            label-position="left"
            label-width="80px"
            :model="componentProps"
          >
            <template v-for="(item,key) in propsInfo">
              <div
                class="form-item"
                :key="item.key"
                v-if="(!item.work || item.work())&&!item.meta.ignore"
              >
                <template>
                  <span class="label">
                    <el-tooltip placement="top">
                      <div style="max-width:300px" slot="content">{{item.desc||'无'}}</div>
                      <span>{{item.label||item.key}}</span>
                    </el-tooltip>
                  </span>
                  <span class="value" v-if="item">
                    <!-- 文本相关 -->
                    <el-input
                      v-if="item.type=='string'"
                      size="mini"
                      v-model="componentProps[item.key]"
                    ></el-input>
                    <el-input
                      v-else-if="item.type=='number'"
                      type="number"
                      size="mini"
                      v-model.number="componentProps[item.key]"
                    ></el-input>
                    <el-input
                      v-else-if="item.type=='input'"
                      size="mini"
                      v-model="componentProps[item.key]"
                    ></el-input>
                    <el-input
                      v-else-if="item.type=='text'"
                      :autosize="{ minRows: 2, maxRows: 5}"
                      type="textarea"
                      size="mini"
                      v-model="componentProps[item.key]"
                    ></el-input>
                    <rich-text
                      v-else-if="item.type=='richtext'"
                      :id="id"
                      v-model="componentProps[item.key]"
                    ></rich-text>
                    <y-color-picker
                      v-else-if="item.type=='color'"
                      v-model="componentProps[item.key]"
                      show-alpha
                    ></y-color-picker>
                    <!-- json -->
                    <attr-data
                      v-else-if="isCollapsed('attr') && item.type=='object'"
                      type="object"
                      :content.sync="componentProps[item.key]"
                    ></attr-data>
                    <attr-data
                      v-else-if="isCollapsed('attr') && item.type=='array'"
                      type="array"
                      :content.sync="componentProps[item.key]"
                    ></attr-data>
                    <attr-data
                      v-else-if="isCollapsed('attr') && item.type=='data'"
                      :content.sync="componentProps[item.key]"
                    ></attr-data>
                    <!-- 布尔值 -->
                    <el-switch
                      v-else-if="item.type=='boolean'"
                      size="mini"
                      v-model="componentProps[item.key]"
                    ></el-switch>
                    <!-- 图片 -->
                    <template v-else-if="item.type=='image'">
                      <resource type="image" :url.sync="componentProps[item.key]"></resource>
                    </template>
                    <resource
                      v-else-if="item.type=='audio'"
                      type="audio"
                      :url.sync="componentProps[item.key]"
                    ></resource>
                    <resource
                      v-else-if="item.type=='video'"
                      type="video"
                      :url.sync="componentProps[item.key]"
                    ></resource>
                    <resource
                      v-else-if="item.type=='file'"
                      type="file"
                      :url.sync="componentProps[item.key]"
                    ></resource>
                    <!-- 方法调用 -->
                    <attr-function
                      v-else-if="item.type=='function'"
                      :content.sync="componentProps[item.key]"
                    ></attr-function>

                    <!-- 时间选择器 -->
                    <el-date-picker
                      v-else-if="item.type=='date'"
                      value-format="yyyy/MM/dd HH:mm:ss"
                      v-model="componentProps[item.key]"
                      type="datetime"
                      placeholder="选择日期时间"
                    ></el-date-picker>

                    <!-- 枚举 -->
                    <el-select
                      v-else-if="item.type=='enum'"
                      :multiple="item.meta&&item.meta.multiple"
                      size="mini"
                      v-model="componentProps[item.key]"
                      placeholder="请选择"
                    >
                      <el-option
                        v-for="(item,key) in enumFilter(item.meta.defaultList)"
                        :key="key"
                        :label="item.label"
                        :value="item.value"
                      ></el-option>
                    </el-select>

                    <template v-else-if="item.type=='checkbox'">
                      <!-- checkbox-group -->
                      <el-checkbox-group
                        v-model="componentProps[item.key]"
                        v-if="item.meta.defaultList"
                      >
                        <el-checkbox
                          :label="item.value"
                          :key="key"
                          v-for="(item, key) in enumFilter(item.meta.defaultList)"
                        >{{item.label}}</el-checkbox>
                      </el-checkbox-group>
                      <!-- checkbox -->
                      <el-checkbox v-else v-model="componentProps[item.key]"></el-checkbox>
                    </template>

                    <!-- radio -->
                    <el-radio-group
                      v-model="componentProps[item.key]"
                      v-else-if="item.type=='radio'"
                    >
                      <el-radio
                        :label="item.value"
                        :key="key"
                        v-for="(item, key) in enumFilter(item.meta.defaultList)"
                      >{{item.label}}</el-radio>
                    </el-radio-group>
                  </span>
                </template>
              </div>
            </template>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>
<style lang="stylus" rel="stylesheet/stylus" type="text/stylus">
  .widget.attribute {
    position: relative;
    padding: 5px !important;

    .el-input-group__append {
      padding: 0 10px;
      cursor: pointer;
    }

    .update {
      padding: 20px 10px;
      text-align: center;

      .desc {
        text-align: left;
        margin: 10px 5px;
      }
    }

    .id-lock {
      position: absolute;
      right: 0;
      top: 0;
    }

    .alerttip {
      margin-bottom: 5px;
    }

    .noselect {
      font-size: 20px;
      color: #aaa;
      font-weight: bolder;
      text-align: center;
    }

    .form-item {
      margin-bottom: 5px;
      padding: 5px;

      &:hover {
        background-color: #6081bd33;
        border-radius: 5px;

        .label {
          color: #ffffff;
        }
      }

      .label {
        font-weight: bold;
        display: inline-block;
        margin-bottom: 4px;
        font-size: 12px;
        min-width: 70px;
      }

      .value {
        color: #909399;
      }
    }
  }
</style>

<script type="text/ecmascript-6">
  /**
   * 组件属性编辑器，每个组件的各个设置都是通过这里分发处理
   */

  export default {
    mixins: [],
    name: 'Attribute',
    components: {},
    data: function () {
      return {
        currEditor: '',
        currEditorData: {},
        showUpdate: false,
        id: '',
        canEditId: false,
        propsInfo: {},
        activeNames: ['base', 'animate', 'attr'],
        newNodeInfo: null,
        oldStyle: null,
        forbidEdit: false
      }
    },
    props: {
      componentProps: {
        type: Object
      },
      active: {
        type: [Number, Boolean],
        default: 0
      }
    },
    watch: {
    },
    mounted: function () {
      this.onSelectOne()
    },
    methods: {
      onSelectOne: function (vm) {
        this.dealPropsType()
      },
      isCollapsed (attr) {
        var activeNames = this.activeNames
        return activeNames && (activeNames.length && activeNames.indexOf(attr) > -1 || activeNames == attr)
      },
      enumFilter (list) {
        if (!list) return []
        if (list instanceof Array) {
          return list.map(li => {
            return {
              label: li,
              value: li
            }
          })
        }
        if (typeof list === 'object') {
          return Object.entries(list).map(([key, value]) => {
            return {
              label: value,
              value: key
            }
          })
        }
        return list
      },
      dealPropsType: function () {
        var instance = window.componentVm
        this.propsInfo = []
        function getPropType (prop) {
          // 编辑器属性上存在类型信息。以编辑器为准
          var propEditor = prop.editor || prop.editer
          if (propEditor && propEditor.type) {
            return propEditor.type.toLocaleLowerCase()
          }
          var type = prop.type
          if (typeof type == 'string') {
            return type
          }
          const match = type.toString().match(fnTypeRE)
          var ttype = typeof type === 'function'
            ? match && match[1] || 'any'
            : 'any'
          return ttype.toLocaleLowerCase()
        }
        if (instance && instance.$options) {
          var props = instance.$options.props
          var fnTypeRE = /^(?:function|class) (\w+)/
          var propsData = []
          for (let key in props) {
            const prop = props[key]
            var propEditor = prop.editor || prop.editer
            let propData = {
              key,
              value: instance[key],
              type: getPropType(prop),
              work: (propEditor && propEditor.work || (() => true)).bind(instance), // 新增属性有效性（是否应出现）的检测 绑定this至当前组件实例
              meta: propEditor || {},
              order: prop.order || 10000,
              required: !!prop.required
            }
            // 编辑属性存在则处理些特殊属性
            if (propEditor) {
              propData.label = propEditor.label
              propData.desc = propEditor.desc
            }
            propsData.push(propData)
          }
          this.propsInfo = propsData || []
          this.propsInfo = this.propsInfo.sort(function (a, b) {
            return a.order - b.order
          })
          console.log('propsData', propsData)
        }
      }
    }
  }
</script>
