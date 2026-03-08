#!/bin/bash
# Sealos DevBox 发布版本启动脚本
set -e
cd /home/devbox/project
[ ! -d .next ] && npm install && npm run build
exec npm run start
