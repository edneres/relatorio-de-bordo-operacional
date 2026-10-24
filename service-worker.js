/*
=========================================
SERVICE WORKER
RELATÓRIO DE REGISTRO FOTOGRÁFICO
=========================================
*/


/*
=========================================
CONFIGURAÇÃO DO CACHE
=========================================
*/

const NOME_CACHE =
    "registro-fotografico-v3.9";


/*
    Todos os arquivos necessários para
    o funcionamento principal da aplicação
    são armazenados localmente.

    Recursos externos de internet não
    devem ser adicionados aqui.
*/

const ARQUIVOS_OFFLINE = [

    "./",
    "./index.html",

    "./css/style.css",

    "./icons/fenix.png",
    "./icons/mapa.png",
    "./icons/caminhao.png",

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

        );


        /*
            Ativa a nova versão do Service
            Worker sem precisar aguardar o
            fechamento de todas as abas.
        */

        self.skipWaiting();

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
                                        Remove versões antigas
                                        do cache da aplicação.
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
                            Faz o Service Worker
                            assumir imediatamente
                            as páginas abertas.
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
            Somente requisições GET podem
            ser armazenadas no Cache Storage.
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
        -----------------------------------------
        RECURSOS EXTERNOS
        -----------------------------------------

        Requisições para outros servidores,
        como Nominatim/OpenStreetMap,
        continuam indo diretamente para
        a internet.

        Se estiver offline, o próprio código
        da aplicação tratará a indisponibilidade.
        */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
        -----------------------------------------
        ARQUIVOS DA APLICAÇÃO
        -----------------------------------------

        Estratégia:
        CACHE FIRST

        1. Procura localmente.
        2. Se encontrar, usa o cache.
        3. Se não encontrar, tenta a rede.
        4. Se conseguir baixar, guarda uma
           cópia para acessos futuros.
        */

        event.respondWith(

            caches
                .match(
                    event.request
                )

                .then(
                    function (respostaCache) {

                        if (
                            respostaCache
                        ) {

                            return respostaCache;

                        }


                        return fetch(
                            event.request
                        )

                            .then(
                                function (
                                    respostaRede
                                ) {

                                    /*
                                        Não armazenamos respostas
                                        inválidas.
                                    */

                                    if (
                                        !respostaRede ||
                                        respostaRede.status !== 200 ||
                                        respostaRede.type === "error"
                                    ) {

                                        return respostaRede;

                                    }


                                    /*
                                        Clona porque uma Response
                                        só pode ser consumida uma vez.
                                    */

                                    const copiaResposta =
                                        respostaRede.clone();


                                    caches
                                        .open(
                                            NOME_CACHE
                                        )

                                        .then(
                                            function (
                                                cache
                                            ) {

                                                cache.put(
                                                    event.request,
                                                    copiaResposta
                                                );

                                            }
                                        );


                                    return respostaRede;

                                }
                            );

                    }
                )

        );

    }
);
