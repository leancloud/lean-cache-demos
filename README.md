# LeanCache Node.js Demos

该项目是 [LeanCache](https://leancloud.cn/docs/leancache_guide.html) 的示例项目，包含了一些场景的使用场景，使用 Node.js 和 Express 实现。

## 功能

* 抢红包：管理员在后台生成一些随机金额的红包供用户获取，利用 LeanCache 应对瞬时的高并发场景。
* 节点选举
* 任务队列
* 关联数据缓存：缓存一些数据量少、查询频繁、不常修改、关联结构复杂的关联数据。
* 排行榜缓存：维护一个用户游戏分数的排行榜，并在次日将榜单归档到云存储中。
* 热点只读数据缓存

## 本地运行 Redis

* Mac 运行 `brew install redis` 安装，然后用 `redis-server` 启动。
* Debian/Ubuntu 运行 `apt-get install redis-server`, CentOS/RHEL 运行 `yum install redis`.
* Windows 尚无官方支持，可以下载 [微软的分支版本](https://github.com/MSOpenTech/redis/releases) 安装包。

## 本地调试

首先确认本机已经安装 [Node.js](http://nodejs.org/) 运行环境和 [LeanCloud 命令行工具](https://leancloud.cn/docs/cloud_code_commandline.html)，在 LeanCloud 控制台上创建一个应用，将 appId 填充到下面的 `<appId>` 处，执行下列命令：

```
$ git clone https://github.com/leancloud/lean-cache-demos.git
$ cd lean-cache-demos
$ npm install
$ lean app add origin <appId>
$ lean up
```

应用成功启动后可访问 [localhost:3000](http://localhost:3000) 体验。

## 部署到 LeanEngine

部署到预备环境（若无预备环境则直接部署到生产环境）：
```
lean deploy
```

将预备环境的代码发布到生产环境：
```
lean publish
```

## 相关文档

* [云引擎总览](https://leancloud.cn/docs/leanengine_overview.html)
* [LeanCache 使用指南](https://leancloud.cn/docs/leancache_guide.html)
* [JavaScript 指南](https://leancloud.cn/docs/js_guide.html)
* [云引擎命令行工具](https://leancloud.cn/docs/leanengine_cli.html)
