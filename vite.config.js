import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		host: true,
		port: 5173,
		allowedHosts: ['rg.direc.lat'],
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true
			},
			'/status': {
				target: 'http://localhost:3001',
				changeOrigin: true
			},
			'/auth': {
				target: 'http://localhost:3001',
				changeOrigin: true
			}
		}
	}
});
