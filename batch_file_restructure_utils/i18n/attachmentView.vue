<i18n>
{
    "cn": {
        "大四的打算": "大四的打算",
        "啊2": "啊2",
        "dasd": "dasd"
    }
}
</i18n>

<template>
    <div class="home-page" @scroll="throttle(down)()">
        dasdsa
        {{ (addas + dasdas + '的撒旦') | one | second | third }}
        {{ '大四的打算' | one | second | third }}
    </div>
</template>

<script>
//bug
// thhis.$message(this.$t('啊1'));
this.$message(this.$t(`啊2${asdasda}dasd`));
// this.$t(`啊3`);
// $t(`啊4`);
// this.$t(`啊5`);
</script>

<style scoped lang="less">
</style>
