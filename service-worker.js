/*
=========================================
SERVICE WORKER
RELATÓRIO DE BORDO OPERACIONAL
=========================================
*/


/*
=========================================
CONFIGURAÇÃO DO CACHE
=========================================
*/

const NOME_CACHE =
    "relatorio-bordo-operacional";


/*
Arquivos essenciais para funcionamento
offline da aplicação.
*/

const ARQUIVOS_OFFLINE = [

    "./",
    "./index.html",

    "./css/style.css",

    "./icons/fenix.png",
    "./icons/mapa.png",
    "./icons/caminhao.png",
    "./icons/app-icon-192.png",
    "./icons/app-icon-512.png",

    "./js/storage.js",
    "./js/gps.js",
    "./js/camera.js",
    "./js/pdf.js",
    "./js/app.js",

    "./lib/jspdf.umd.min.js",

    "./manifest.json"

];


/*
=========================================
INSTALAÇÃO
=========================================
*/

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches
                .open(NOME_CACHE)

                .then(
                    function (cache) {

                        return cache.addAll(
                            ARQUIVOS_OFFLINE
                        );

                    }
                )

                .then(
                    function () {

                        /*
                        A nova versão fica pronta
                        imediatamente.
                        */

                        return self.skipWaiting();

                    }
                )

        );

    }
);


/*
=========================================
ATIVAÇÃO
=========================================
*/

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches
                .keys()

                .then(
                    function (nomesCaches) {

                        return Promise.all(

                            nomesCaches.map(
                                function (nomeCache) {

                                    /*
                                    Remove caches antigos
                                    pertencentes a versões
                                    anteriores da aplicação.
                                    */

                                    if (
                                        nomeCache !==
                                        NOME_CACHE
                                    ) {

                                        return caches.delete(
                                            nomeCache
                                        );

                                    }

                                }
                            )

                        );

                    }
                )

                .then(
                    function () {

                        /*
                        O novo Service Worker assume
                        imediatamente as páginas.
                        */

                        return self.clients.claim();

                    }
                )

        );

    }
);


/*
=========================================
INTERCEPTAÇÃO DAS REQUISIÇÕES
=========================================
*/

self.addEventListener(
    "fetch",
    function (event) {

        /*
        Apenas requisições GET.
        */

        if (
            event.request.method !== "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        /*
        =========================================
        RECURSOS EXTERNOS
        =========================================

        Serviços externos continuam dependendo
        da internet e não são armazenados pelo
        Service Worker.
        */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
        =========================================
        NETWORK FIRST + FALLBACK PARA CACHE
        =========================================

        Com internet:

        1. tenta buscar a versão atual;
        2. atualiza o cache;
        3. entrega a versão atual.

        Sem internet:

        1. a rede falha;
        2. recupera a última versão armazenada;
        3. o aplicativo continua funcionando.
        */

        event.respondWith(

            fetch(
                event.request
            )

                .then(
                    function (
                        respostaRede
                    ) {

                        /*
                        Somente respostas válidas
                        são armazenadas.
                        */

                        if (
                            respostaRede &&
                            respostaRede.status === 200 &&
                            respostaRede.type !== "error"
                        ) {

                            const copiaResposta =
                                respostaRede.clone();


                            event.waitUntil(

                                caches
                                    .open(
                                        NOME_CACHE
                                    )

                                    .then(
                                        function (
                                            cache
                                        ) {

                                            return cache.put(
                                                event.request,
                                                copiaResposta
                                            );

                                        }
                                    )

                            );

                        }


                        return respostaRede;

                    }
                )

                .catch(
                    function () {

                        /*
                        Sem internet:
                        utiliza a cópia local.
                        */

                        return caches
                            .match(
                                event.request
                            )

                            .then(
                                function (
                                    respostaCache
                                ) {

                                    if (
                                        respostaCache
                                    ) {

                                        return respostaCache;

                                    }


                                    /*
                                    Se for uma navegação e não
                                    houver correspondência exata,
                                    tenta abrir o index offline.
                                    */

                                    if (
                                        event.request.mode ===
                                        "navigate"
                                    ) {

                                        return caches.match(
                                            "./index.html"
                                        );

                                    }


                                    return Response.error();

                                }
                            );

                    }
                )

        );

    }
);