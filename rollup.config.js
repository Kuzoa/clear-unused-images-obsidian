import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const isProd = process.env.BUILD === 'production';

const banner = `/*
这是一个由Rollup生成的/打包的文件。
如果您想查看源代码，请访问插件github的原存储库
*/
`;

export default {
    input: 'src/main.ts',
    output: {
        dir: '.',
        sourcemap: 'inline',
        sourcemapExcludeSources: isProd,
        format: 'cjs',
        exports: 'default',
        banner,
    },
    external: ['obsidian'],
    plugins: [typescript(), nodeResolve({ browser: true }), commonjs(), terser()],
};
