module.exports = {
  apps: [
    {
      name: 'finance-backend',
      script: 'src/index.ts',
      cwd: 'C:\\Users\\MSi\\Desktop\\Finance GM Bot\\backend',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      watch: false,
      env: { NODE_ENV: 'development', TS_NODE_TRANSPILE_ONLY: 'true' },
    },
    {
      name: 'finance-bot',
      script: 'src/index.ts',
      cwd: 'C:\\Users\\MSi\\Desktop\\Finance GM Bot\\bot',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      watch: false,
      env: { NODE_ENV: 'development', TS_NODE_TRANSPILE_ONLY: 'true' },
    },
  ],
};
