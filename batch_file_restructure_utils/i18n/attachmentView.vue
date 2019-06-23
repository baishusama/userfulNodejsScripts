<template>
<div class="home-page" @scroll="throttle(down)()">
    <header>
        <div class="user-logo vertical-center">
            <img v-if="userMes.id" :src="this.configApi+'/user/avatar/image/'+userMes.id"/>
            <svg class="icon normal auth-status" aria-hidden="true">
                <template v-if="isRealName">
                    <use xlink:href="#icon-yirenzheng"></use>
                </template>
                <template v-else>
                    <use xlink:href="#icon-weirenzheng"></use>
                </template>
            </svg>
            <span class="inline name-text">
                {{ (userMes.name || userMes.contact) | mosaic }}
                <span class="tips inline">
                    <template v-if="isRealName">
                        （已实名）
                    </template>
                    <template v-else>
                        （未实名）
                    </template>
                </span>
            </span>
        </div>
        <div class="tip-mes vertical-center">
            <router-link to="/newmessages" class="anticon tip-icon">&#xe620<span
                class="tip"
                :class="{ 'tip-none': msgNum=='0' }"
                :style="{width: msgNum>'99'?'23px':null}">{{(msgNum>'99')?'99':msgNum}}
                    <span class="add-sign" v-if="msgNum>'99'">+</span>
                </span>
            </router-link>
        </div>
    </header>
    <div class="nav">
        <span
            class="unselect"
            @click="status.push('recent');"
            :class="{'select':isRecent,'search-show':isSearch}">最近文件</span>
        <span
            class="unselect"
            @click="status.push('');"
            :class="{'select':isAll,'search-show':isSearch}">全部文件</span>
        <div class="fr search vertical-center" :class="{'search-show':isSearch}">
            <i class="anticon" @click="status.push('search')">&#xe707</i>
            <input placeholder="搜索文件名称/编号/签署方" v-model="keyword"/>
            <span class="delete" v-if="isSearch&&keyword" @click="keyword=''">
                <i class="anticon">&#xe709</i>
            </span>
            <span class="return" v-if='isSearch' @click="status.pop()">
                取消
            </span>
        </div>
    </div>
    <section class="content" :class="{white:isEmpty}">
        <template v-if="!isEmpty">
            <div
                class="content-item"
                v-for="(item,index) in contentItem"
                @click="detail(item.entityId,item.categoryType)">
                <svg
                    class="status normal"
                    :class="{'is-invaliding':item.status=='INVALIDING',
                    'is-file-audit':item.status=='FILE_AUDIT',
                    'is-seal-audit':item.status=='SEAL_AUDIT'}"
                    aria-hidden="true">
                    <use :xlink:href="contractStatus(item.status)"></use>
                </svg>
                <div class="contract-name ellipsis">{{item.subject}}</div>
                <div class="stream">
                    <template v-if="item.categoryType=='SEAL'">
                        <span class="sealname ellipsis inline">
                            {{item.applyerName}}申请使用
                            <template v-if="item.sealName">【{{item.sealName}}】</template>
                            <template v-else>印章</template>
                        </span>
                        <span class="physical inline">物理章</span>
                        <span class="count inline">{{item.sealUsageCount}}次</span>
                    </template>
                    <template v-if="item.categoryType=='CONTRACT'">
                        <span class="anticon ellipsis" v-if="item.draftsman">{{item.draftsman}}</span>
                        <img
                            src="../assets/img/blue-arrow.png"
                            style="vertical-align: super;"
                            v-if="item.draftsman&&item.receivers"
                            alt=""
                            width="30"/>
                        <span class="anticon  ellipsis" v-if="item.receivers">&nbsp;{{item.receivers}}</span>
                    </template>
                    <div class="border"></div>
                </div>
                <div class="stream">
                    <span v-if="item.categoryType=='SEAL'">申请时间：{{item.createTime|expire}}</span>
                    <span v-if="item.categoryType=='CONTRACT'">签署有效期：{{item.expireTime|expire}}</span>
                </div>
            </div>
            <waiting v-if="hasSend"></waiting>
        </template>
        <template v-else>
            <div class="middle-center" v-if="isSearch">
                <img src="../assets/img/no-search.png" alt="" width="160px;"/>
                <div class="" style="text-align:center;font-size:12px;color:#c0c0c0;">未搜索到相关数据</div>
            </div>
        </template>
    </section>
    <div class="helper clearfix" v-if="!helperClose&&isRecent">
        <div class="title">
            小助手
            <i class="anticon fr" @click="close">&#xe708</i>
        </div>
        <router-link :to="{ name: 'signature', params: {signType:'new'} }">
            <div class="list-item " v-if="!hasSign">
                设置个人签名
            </div>
        </router-link>
        <div class="list-item " v-if="!isRealName" @click="userAuth">
            实名认证
        </div>
        <a
            class="list-item "
            href="https://help.qiyuesuo.com/library/article/2452014063788740609">
            什么是电子合同？
        </a>
        <img
            v-if="!hasSign&&!isRealName"
            src="../assets/img/helper.png"
            class="vertical-center"
            alt=""
            height="100"/>
    </div>
</div>
</template>

<script>
import waiting from './waiting.vue';
let timer = null;
export default {
    components: {
        waiting
    },
    data() {
        return {
            window: window,
            userMes: quser,
            msgNum: '0', //消息通知
            contentItem: [],
            hasSign: false,
            helperClose: false,
            status: ['recent'],
            pageNo: 1,
            keyword: '',
            totalPages: 1,
            hasSend: null
        };
    },
    computed: {
        isEmpty() {
            return this.contentItem.length == 0;
        },
        currentStatus() {
            return this.status[this.status.length - 1];
        },
        searchWidth() {
            return this.isSearch ? 'calc(100% - 40px)' : '21px';
        },
        pageSize() {
            if (this.currentStatus == 'recent') {
                return 3;
            } else {
                return 10;
            }
        },
        isRealName() {
            return this.userMes.user.realnamed;
        },
        isRecent() {
            return this.currentStatus == 'recent';
        },
        isSearch() {
            return this.currentStatus == 'search';
        },
        isAll() {
            return !this.currentStatus;
        }
    },
    watch: {
        'contentItem.length'() {
            this.contentItem.map(contract => {
                if (contract.receivers) {
                    contract.receivers = contract.receivers
                        .replace(`、${contract.draftsman}`, '')
                        .replace(`${contract.draftsman}`, '')
                        .replace(/^、/, '');
                }
            });
        },
        keyword: {
            handler(nv, ov) {
                const self = this;
                self.debounce(() => {
                    let contract;
                    let loading = this.$loading('正在加载，请稍候');
                    (async function() {
                        try {
                            ({ body: contract } = await self.getBusinessList(1));
                            self.contentItem = contract.result;
                            self.pageNo = contract.page.pageNo;
                            self.totalPages = contract.page.totalPages;
                        } catch (e) {
                            console.log(e);
                        } finally {
                            loading.close();
                        }
                    })();
                }, 500)();
            }
        },
        currentStatus: {
            handler(ov) {
                router.push({ name: 'home', query: { status: ov } });
                const self = this;
                let contract;
                let loading;
                if (self.isSearch && !self.keyword) {
                    self.contentItem = [];
                    return;
                }
                if (!self.isSearch) {
                    loading = this.$loading('正在加载，请稍候');
                }
                (async function() {
                    try {
                        ({ body: contract } = await self.getBusinessList(1));
                        self.contentItem = contract.result;
                        self.pageNo = contract.page.pageNo;
                        self.totalPages = contract.page.totalPages;
                    } catch (e) {
                        console.log(e);
                    } finally {
                        if (!self.isSearch) {
                            loading.close();
                        }
                    }
                })();
            }
        }
    },
    filters: {
        expire(time) {
            return time && time.slice(0, 10);
        }
    },
    created: function() {
        let hasStatus = this.$route.query.hasOwnProperty('status');
        if (hasStatus) {
            this.status.push(this.$route.query.status);
        }

        const self = this;
        let count, seal, contract, helperClose;

        let loading = this.$loading('正在加载，请稍候');
        let quser;
        (async function() {
            try {
                ({ body: quser } = await self.$http.get('/user/quser'));
                window.quser = quser;
                self.userMes = quser;
                let helperClosePromise = self.$http.get('/guide/exist?guideKey=assistantTip');
                let countPromise = self.$http.get('/message/count');
                let sealPromise = self.$http.get('/seal/active');
                ({ body: helperClose } = await helperClosePromise);
                ({ body: count } = await countPromise);
                ({ body: seal } = await sealPromise);
                let { count: msgNum } = count;
                self.msgNum = parseInt(msgNum);
                if (seal.result) {
                    self.hasSign = true;
                } else {
                    self.hasSign = false;
                }
                self.helperClose = helperClose.knowGuide;
                if (!hasStatus || (hasStatus && self.$route.query.status == 'recent')) {
                    let contractPromise = self.getBusinessList(1);
                    ({ body: contract } = await contractPromise);
                    let { result: contentItem } = contract;
                    self.contentItem = contentItem;
                }
            } catch (e) {
                console.log(e);
            } finally {
                loading.close();
            }
        })();
    },
    mounted: function() {
        if (window.sessionStorage.identitied == 'true') {
            this.$message(
                `<p style="color:white;font-size:15px;text-align: center;"><i class="anticon logo-icon" style="color: #53bdfe;">&#xe60c</i>认证成功</p>
                <p style="color:#ccc;font-size:12px;">恭喜您，实名认证成功</p>`
            );
            window.sessionStorage.identitied = false;
        }
    },
    methods: {
        userAuth() {
            const self = this;
            (async function() {
                try {
                    let data = await self.$http.get('/user/auth/url?pageUrl=' + window.location.href);
                    window.location = data.data.result;
                } catch (e) {
                    console.log(e);
                }
            })();
        },
        detail(id, type) {
            if (type == 'SEAL') {
                this.$router.push({ name: 'physicalDetail', params: { physicalId: id }, query: { from: 'weixin' } });
            } else {
                this.$router.push({ name: 'detail', params: { contractId: id }, query: { from: 'weixin' } });
            }
        },
        getBusinessList(pageNo) {
            if (this.isSearch) {
                return this.$http.get(
                    '/business/list?pageNo=' + pageNo + '&pageSize=' + this.pageSize + '&keyword=' + this.keyword
                );
            } else {
                return this.$http.get('/business/list?pageNo=' + pageNo + '&pageSize=' + this.pageSize);
            }
        },
        debounce(func, delay) {
            return function(...args) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    func.apply(this, args);
                }, delay);
            };
        },
        throttle: function(func) {
            const self = this;
            return function() {
                var context = this;
                var args = arguments;
                if (!self.hasSend) {
                    (async function() {
                        try {
                            self.hasSend = true;
                            let contracts;
                            contracts = await func.apply(context, args);
                            if (contracts) {
                                self.contentItem = self.contentItem.concat(contracts.body.result);
                                self.pageNo = contracts.body.page.pageNo;
                                self.totalPages = contracts.body.page.totalPages;
                            }
                            self.hasSend = null;
                        } catch (e) {
                            console.log(e);
                        }
                    })();
                }
            };
        },
        down: function() {
            if (this.pageNo == this.totalPages + 1) {
                return;
            }
            let ele = document.getElementsByClassName('home-page')[0];
            const isMore = ele.scrollTop + ele.clientHeight === ele.scrollHeight;
            if (!isMore || this.isRecent) {
                return;
            }
            return this.getBusinessList(this.pageNo + 1);
        },
        async close() {
            try {
                this.helperClose = true;
                await this.$http.get('/guide/add?guideKey=assistantTip');
            } catch (error) {
                console.log(error);
            }
        },
        contractStatus(val) {
            switch (val) {
                case 'INVALIDING':
                    return '#icon-zuofeiquerenzhong';
                case 'INVALIDED':
                    return '#icon-yizuofei';
                case 'DRAFT':
                    return '#icon-zhuangtai-caogao';
                case 'COMPLETE':
                    return '#icon-zhuangtai-yiwancheng';
                case 'RECALLED':
                    return '#icon-zhuangtai-yichehui';
                case 'SIGNING':
                    return '#icon-zhuangtai-qianshuzhong';
                case 'REJECT':
                case 'REJECTED':
                    return '#icon-zhuangtai-yituihui';
                case 'EXPIRED':
                    return '#icon-zhuangtai-yiguoqi';
                case 'FILLING':
                    return '#icon-zhuangtai-nidingzhong';
                case 'FILE_AUDIT':
                    return '#icon-zhuangtai-wenjianshenpi';
                case 'SEAL_AUDIT':
                    return '#icon-zhuangtai-yinzhangshenpi';
                case 'ENABLE':
                    return '#icon-zhuangtai-yongyin';
                case 'AUTHED':
                    return '#icon-zhuangtai-yishouquan';
                default:
                    return '';
            }
        }
    }
};
</script>

<style scoped lang="less">
@import (reference) '../extend.less';
.white {
    background: white;
    margin-bottom: 0px !important;
    height: e('calc(100% - 101px)');
}
.helper {
    padding: 20px;
    background: white;
    position: relative;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);

    .title {
        font-size: 14px;
        color: #383838;
        line-height: 18px;
        margin-bottom: 10px;
        font-weight: bold;
        i {
            color: #c0c0c0;
        }
    }
    .list-item {
        font-size: 14px;
        color: #666666;
        line-height: 25px;
        text-align: left;
        &:before {
            content: ' ';
            vertical-align: middle;
            display: inline-block;
            background: #d8d8d8;
            width: 5px;
            height: 5px;
            margin-top: -3px;
            margin-right: 5px;
            border-radius: 100%;
        }
    }
    img {
        right: 40px;
    }
}
header {
    height: 60px;
    background-color: #273039;
    position: fixed;
    width: 100%;
    z-index: 2;
    .user-logo {
        left: 20px;
        img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 12px;
            vertical-align: middle;
        }
        .auth-status {
            position: absolute;
            top: 25px;
            left: 30px;
        }
        .name-text {
            color: #fff;
            vertical-align: middle;
            margin-right: 12px;
        }
        .tips {
            font-size: 16px;
            line-height: 16px;
            -webkit-transform: scale(0.5, 0.5);
            -moz-transform: scale(0.5, 0.5);
            transform: scale(0.5, 0.5);
            vertical-align: middle;
            margin-left: -25px;
            color: white;
        }
    }
    .tip-mes {
        right: 20px;
        .tip-icon {
            font-size: 22px;
            color: #ffffff;
        }
        .tip {
            display: inline-block;
            font-size: 9px;
            color: #fff;
            width: 14px;
            height: 14px;
            line-height: 14px;
            background: @error-color;
            border-radius: 7px;
            text-align: center;
            vertical-align: top;
            margin-left: -10px;
            font-weight: initial;

            .add-sign {
                font-size: 8px;
            }
        }
        .tip-none {
            display: none;
        }
    }
}
.nav {
    padding: 0 20px;
    font-size: 14px;
    color: #666;
    height: 40px;
    line-height: 39px;
    background-color: #fff;
    border-bottom: 1px solid #d9d9d9;
    position: fixed;
    z-index: 2;
    width: e('calc(100% - 40px)');
    top: 60px;
    .unselect {
        &:not(:first-child) {
            margin-left: 30px;
        }
        &.select {
            color: @base-color;
            border-bottom: 2px solid @base-color;
            display: inline-block;
        }
        &.search-show {
            border-bottom: 0px;
            color: #666;
        }
    }
    .search {
        &.search-show {
            padding-left: 0px;
            width: e('calc(100% - 40px)');
            border-left: 0px;
        }
        i {
            color: #999999;
        }
        input {
            width: e('calc(100% - 60px)');
            display: inline-block;
            background: white;
            padding: 0;
            border: none;
            font-size: 14px;
            color: #383838;
        }
        .delete {
            position: absolute;
            right: 42px;
            top: 0px;
            i {
                font-size: 18px;
                color: #c0c0c0;
            }
        }
        .return {
            position: absolute;
            right: 0;
            top: 0;
            color: @base-color;
        }
        width: 21px;
        transition: all 0.5s ease;
        right: 20px;
        line-height: 20px;
        border-left: 1px solid #e6e6e6;
        padding-left: 20px;
        background: #fff;
    }
}
.content {
    margin-bottom: 10px;
    padding-top: 101px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
    .content-item {
        background-color: #fff;
        padding: 20px;
        border-bottom: 1px solid #ececec;
        position: relative;
        &:active {
            background: #f5f5f5;
        }
        &:last-child {
            border-bottom: 0px;
        }
        .stream {
            font-size: 12px;
            color: #666666;
            line-height: 12px;
            position: relative;
            img {
                position: relative;
                top: 1px;
            }
            &:not(:last-child) {
                margin-bottom: 12px;
            }
            &:before {
                content: '';
                display: inline-block;
                background: #ffffff;
                border: 1px solid #c0c0c0;
                width: 5px;
                height: 5px;
                border-radius: 100%;
                margin-right: 10px;
                vertical-align: middle;
                margin-top: -4px;
                position: relative;
                top: 1px;
            }
            .border {
                position: absolute;
                left: 3px;
                top: 13px;
                border-left: 1px dashed #c0c0c0;

                height: 21px;
            }
            .physical {
                color: #fff;
                background: #00cc99;
                padding: 3px;
                font-weight: bold;
                border: 2px solid #00cc99;
                border-radius: 3px;
                font-size: 12px;
                margin-left: -5px;
                transform: scale(2/3, 2/3);
                transform-origin: 50% 0%;
                &:before {
                    content: '';
                    display: inline-block;
                    background: #00cc99;
                    width: 8px;
                    height: 8px;
                    position: absolute;
                    left: -5px;
                    top: 5px;
                    transform: rotate(45deg);
                }
            }
            .sealname {
                max-width: e('calc(100% - 140px)');
                vertical-align: top;
                margin-top: 2px;
            }
            .count {
                font-weight: bold;
                color: #78889f;
                background: #e6eaf0;
                padding: 3px 5px;
                border: 2px solid #e6eaf0;
                border-radius: 3px;
                font-size: 12px;
                transform: scale(2/3, 2/3);
                transform-origin: 50% 0%;
                margin-left: -10px;
            }
            .anticon {
                font-size: 12px;
                max-width: e('calc((100% - 60px)/2)');
                display: inline-block;
            }
            .contract-sponsor:before {
                content: '\E629';
                color: #418ad3;
                margin-right: 3px;
            }
            .contract-receiver:before {
                content: '\E608';
                color: #81e1cd;
                margin-right: 3px;
            }
        }
        .contract-name {
            font-size: 18px;
            font-weight: bold;
            color: #383838;
            line-height: 20px;
            margin-bottom: 10px;
        }
        .status {
            font-size: 100px;
            height: 40px;
            position: absolute;
            top: -15px;
            width: 40px;
            right: -2px;
            &.is-seal-audit,
            &.is-file-audit {
                height: 50px;
                top: -19px;
                width: 52px;
                right: -4px;
            }
            &.is-invaliding {
                font-size: 60px;
                height: 60px;
                top: -24px;
                width: 60px;
                right: -4px;
            }
        }
    }
}
.home-page {
    &:extend(.main-page);
    overflow-x: hidden;
}
</style>
