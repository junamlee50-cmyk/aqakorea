module.exports = {
  apps: [
    {
      name: 'aqakorea',
      script: 'bash',
      args: '-c "cd /home/work/.openclaw/workspace/aqakorea && script -q -c \'./node_modules/.bin/wrangler pages dev ./dist --port 3000 --compatibility-date=2024-12-18 --ip 0.0.0.0\' /dev/null"',
      cwd: '/home/work/.openclaw/workspace/aqakorea',
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
    }
  ]
};
