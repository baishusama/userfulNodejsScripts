
<template>
    <div
        class="current-button"
        static-attr-chinese="静态html属性"
        static-attr-english="'no need'"
        :bind-attr-chinese="'动态html属性'"
    >
        静态html内容
        <div>动态html内容前 {{ cancelText ? '双要替换的' : $t('双向绑定中不需要替换的') }} dynamic html after</div>
                    <span class="anticon  ellipsis" v-if="item.receivers">&nbsp;{{item.receivers}}</span>

    </div>
</template>
<script>
export default {

};
</script>
<style scoped lang="less">

</style>
