/*
=========================================
SERVICE WORKER
RELATÓRIO DE BORDO OPERACIONAL
=========================================
*/


/*
=========================================
VERSÃO DO APLICATIVO
=========================================

A versão é lida de js/versao.js.

O navegador também verifica alterações
nos arquivos importados. Portanto, alterar
apenas js/versao.js já dispara a
atualização do Service Worker.
*/

importScripts(
    "./js/versao.js"
);

const NOME_CACHE =
    `relatorio-bordo-operacional-v${VERSAO_APP}`;


/*
Tempo máximo de espera pela internet antes
de usar a cópia local (em milissegundos).

Evita que o aplicativo demore a abrir em
campo quando o sinal está muito fraco.
*/

const TEMPO_LIMITE_REDE_MS = 3000;


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

    "./js/versao.js",
    "./js/storage.js",
    "./js/municipios.js",
    "./js/gps.js",
    "./js/camera.js",
    "./js/pdf.js",
    "./js/sync.js",
    "./js/app.js",

    "./data/municipios.json",

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


        event.respondWith(
            responderRedeComLimite(
                event
            )
        );

    }
);


/*
=========================================
REDE PRIMEIRO, COM TEMPO LIMITE
=========================================

Com internet boa:

1. a versão atual chega da rede;
2. o cache é atualizado;
3. a versão atual é entregue.

Com sinal fraco (rede demora mais que
TEMPO_LIMITE_REDE_MS):

1. entrega imediatamente a cópia local;
2. a busca na rede continua em segundo
   plano e atualiza o cache para a
   próxima abertura.

Sem internet:

1. a rede falha;
2. entrega a cópia local;
3. o aplicativo continua funcionando.

Se não existir cópia local, aguarda a
rede pelo tempo que for necessário.
=========================================
*/

async function responderRedeComLimite(
    event
) {

    const requisicao =
        event.request;


    /*
    -----------------------------------------
    BUSCA NA REDE (E ATUALIZA O CACHE)
    -----------------------------------------
    */

    const promessaRede =
        fetch(
            requisicao
        )

            .then(
                async function (respostaRede) {

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

                        const cache =
                            await caches.open(
                                NOME_CACHE
                            );

                        await cache.put(
                            requisicao,
                            copiaResposta
                        );

                    }


                    return respostaRede;

                }
            );


    /*
    Mantém o Service Worker ativo até a
    atualização do cache terminar, mesmo
    que a cópia local já tenha sido entregue.
    */

    event.waitUntil(
        promessaRede.catch(
            function () {}
        )
    );


    /*
    -----------------------------------------
    1. TENTA A REDE DENTRO DO TEMPO LIMITE
    -----------------------------------------
    */

    let temporizador;


    const promessaTempoLimite =
        new Promise(
            function (resolve) {

                temporizador =
                    setTimeout(
                        function () {

                            resolve(null);

                        },
                        TEMPO_LIMITE_REDE_MS
                    );

            }
        );


    try {

        const respostaRapida =
            await Promise.race([
                promessaRede,
                promessaTempoLimite
            ]);


        if (respostaRapida) {

            return respostaRapida;

        }

    }

    catch (erro) {

        /*
        A rede falhou antes do tempo limite.
        Segue para a cópia local.
        */

    }

    finally {

        clearTimeout(
            temporizador
        );

    }


    /*
    -----------------------------------------
    2. CÓPIA LOCAL
    -----------------------------------------
    */

    const respostaCache =
        await caches.match(
            requisicao
        );


    if (respostaCache) {

        return respostaCache;

    }


    /*
    -----------------------------------------
    3. SEM CÓPIA LOCAL: AGUARDA A REDE
    -----------------------------------------
    */

    try {

        return await promessaRede;

    }

    catch (erro) {

        /*
        Se for uma navegação e não houver
        correspondência exata, tenta abrir
        o index offline.
        */

        if (
            requisicao.mode ===
            "navigate"
        ) {

            const indexOffline =
                await caches.match(
                    "./index.html"
                );

            if (indexOffline) {

                return indexOffline;

            }

        }


        return Response.error();

    }

}