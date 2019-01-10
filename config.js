module.exports = {
    server: {
        proxy: {
            url: 'http://afn47:Halo33221@webproxy-nl.corp.vattenfall.com:8080'
        },
        cloud: {
            protocol: 'http://',
            host: '136.144.181.63',
            port: 5000,
            url: 'http://136.144.181.63:5000'
        },
        du: {
            url: 'https://sapdu1.corp.vattenfall.com'
        }
    }
}