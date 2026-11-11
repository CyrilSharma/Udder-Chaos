export default {
  server: { host: '127.0.0.1', port: 8000, proxy: { '/api': 'http://127.0.0.1:3000' } },
};
