// next.config.js
const {
    PWD
} = process.env

const path = require('path')

require('dotenv').config({ path: path.join(PWD, '.env'), safe: true })
// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const glob = require('glob')

const isProd = process.env.NODE_ENV === 'production'

module.exports = (customWebpackConfig)=>{

    return {
        distDir:
        '.build.next' +
        (isProd
            ? ''
            : '.' +
              (process.env.NODE_ENV ? process.env.NODE_ENV : 'development')),

        // ,assetPrefix: process.env.NODE_ENV === "production" ? 'https://cdn.mydomain.com' : ''
        webpack(config, { isServer }) {
            
            process.chdir(PWD)

            // Add polyfills
            const originalEntry = config.entry
            config.entry = async () => {
            
                const entries = await originalEntry()

                if (entries['main.js']) {
                    entries['main.js'].unshift('./config/polyfills.js')
                }

                return entries
            }
        
            // Switch React with Preact
            if (process.env.USE_PREACT) {
                if (isServer) {
                    config.externals = ['react', 'react-dom', ...config.externals]
                }

                config.resolve.alias = Object.assign({}, config.resolve.alias, {
                    react$: 'preact-compat',
                    'react-dom$': 'preact-compat',
                    react: 'preact-compat',
                    'react-dom': 'preact-compat'
                })
            }

            // Compile SASS/SCSS
            config.module.rules.push(
                {
                    test: /\.(css|scss)/,
                    loader: 'emit-file-loader',
                    options: {
                        name: 'dist/[path][name].[ext]'
                    }
                },
                {
                    test: /\.css$/,
                    use: [ {
                        loader: 'babel-loader',
                        options: {
                            exclude: '/node_modules/' 
                        }
                    }, 'raw-loader', 'postcss-loader']
                },
                {
                    test: /\.s(a|c)ss$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                exclude: '/node_modules/' 
                            }
                        },
                        'raw-loader',
                        'postcss-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: ['styles', 'scss', 'node_modules']
                                    .map(d => path.join(__dirname, d))
                                    .map(g => glob.sync(g))
                                    .reduce((a, c) => a.concat(c), [])
                            }
                        }
                    ]
                }
            )

            // if (!isProd) {
            //     config.devtool = 'source-map'
            // }

            return Object.assign(config,customWebpackConfig)
        } // end webpack
    }
}// end module.exports ()=>...