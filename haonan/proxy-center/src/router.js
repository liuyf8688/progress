import Vue from 'vue'
import Router from 'vue-router'
import Home from 'src/containers/Home'
import Withdraw from 'src/containers/Withdraw'
import WithdrawHistory from 'src/containers/WithdrawHistory'
import DirectPush from 'src/containers/DirectPush'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      redirect: '/index'
    },
    {
      path: '/index',
      name: 'home',
      component: Home
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: Withdraw
    },
    {
      path: '/withdraw/history',
      name: 'withdraw_history',
      component: WithdrawHistory
    },
    {
      path: '/directPush',
      name: 'directPush',
      component: DirectPush
    },
    {
      path: '*',
      redirect: '/index'
    }
  ]
})

function urlArgs() {
  const args = {}
  const query = location.search.substring(1)
  const pairs = query.split("&")
  for (let i = 0; i < pairs.length; i++) {
    const pos = pairs[i].indexOf("=")
    if (pos == -1) continue
    const name = pairs[i].substring(0, pos)
    let value = pairs[i].substring(pos + 1)
    value = decodeURIComponent(value)
    args[name] = value
  }
  return args
}

const hitErrorCode = code => ['10003', '10004', '10005', '10006', '10009', '10010', '10011', '10012', '10013', '10015', '10016'].findIndex(item => item === code)

router.beforeEach((to, from, next) => {
  // 如果已经有openId了，则证明已经授权过了，不需要再去走下面的逻辑了
  const openId = Vue.prototype.$cookies.get('openId')
  if (openId) {
    next()
    return
  }

  // 用户在公众号授权中间页点击按钮同意授权
  // 中间页重定向到项目地址，前端获取url中的code值
  // 这里需要注意，使用hash模式的路由，如http://www.hash.com/#/index
  // 授权通过后，回调地址会变成http://www.hash.com/?code=CODE&state=STATE#/index这种形式
  // 这样的使用$route.query是获取不到参数的，需要使用window.location原生解析
  let code = urlArgs().code
  if (code) {
    // 有可能是错误的code
    if (hitErrorCode(code) !== -1) {
      const $toast = Vue.prototype.$toast
      switch (code) {
        case '10004':
          $toast('此公众号被封禁!', 0)
          break
        case '10006':
          $toast('请先关注此公众号!', 0)
          break
        case '10009':
          $toast('您的操作太频繁了，请稍后再试!', 0)
          break
        default:
          $toast('系统问题，请您稍后再试!', 0)
      }
    } else {
      // 把code存到cookie里，用于第一次获取用户信息使用
      Vue.prototype.$cookies.set('authorizationCode', code)
      next()
    }
  } else {
    // 没授权过，请求数据，获取公众号授权中间页地址并跳转
    Vue.prototype.$http
      .get(`/server/api/auth/url?url=${location.href}&state=${''}`)
      .then(({ data }) => {
        if (data.code === 200) {
          window.location.href = data.result
        }
      })
  }
})

export default router
