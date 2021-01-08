module.exports = {
  apps: [
    {
      name: 'pepper',
      script: './index.js',
      watch: false,
      env: {
        PORT: 4400,
        NODE_ENV: 'development',
        messenger_extension_user_auth_token: 'pepper123star',
      },
      env_production: {
        PORT: 4400,
        NODE_ENV: 'production',
        messenger_extension_user_auth_token: 'pepper123star',
      },
    },
  ],
};
