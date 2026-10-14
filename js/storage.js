/*
=========================================
CONFIGURAÇÕES DO BANCO LOCAL
=========================================
*/

const NOME_BANCO = "RegistroFotograficoDB";
const VERSAO_BANCO = 3;
const NOME_STORE = "fotografias";


/*
=========================================
ABRIR BANCO
=========================================
*/

function abrirBanco() {

    return new Promise(function (resolve, reject) {

        if (!window.indexedDB) {

            reject(
                new Error(
                    "IndexedDB não suportado."
                )
            );

            return;
        }


        const requisicao = indexedDB.open(
            NOME_BANCO,
            VERSAO_BANCO
        );


        /*
        -----------------------------------------
        PRIMEIRA CRIAÇÃO / ATUALIZAÇÃO
        -----------------------------------------
        */

        requisicao.onupgradeneeded =
            function (event) {

                const banco =
                    event.target.result;


                /*
                =========================================
                STORE DAS FOTOGRAFIAS
                =========================================
                */

                if (
                    !banco.objectStoreNames
                        .contains(NOME_STORE)
                ) {

                    banco.createObjectStore(
                        NOME_STORE,
                        {
                            keyPath: "id"
                        }
                    );

                }


                /*
                =========================================
                STORE DA CLASSIFICAÇÃO DO REGISTRO
                =========================================
                */

                if (
                    !banco.objectStoreNames
                        .contains("configuracao")
                ) {

                    banco.createObjectStore(
                        "configuracao",
                        {
                            keyPath: "chave"
                        }
                    );

                }

            };


        /*
        -----------------------------------------
        SUCESSO
        -----------------------------------------
        */

        requisicao.onsuccess =
            function (event) {

                resolve(
                    event.target.result
                );

            };


        /*
        -----------------------------------------
        ERRO
        -----------------------------------------
        */

        requisicao.onerror =
            function () {

                reject(
                    requisicao.error
                );

            };

    });

}


/*
=========================================
SALVAR FOTOGRAFIA
=========================================
*/

async function salvarFotografiaLocal(
    fotografia
) {

    try {

        const banco =
            await abrirBanco();


        /*
        Não salvamos fotografia.url.

        URL.createObjectURL() cria apenas uma
        URL temporária válida para a sessão
        atual do navegador.

        O arquivo/Blob original é armazenado
        diretamente no IndexedDB.
        */

        const registro = {

            id:
                fotografia.id,

            arquivo:
                fotografia.arquivo,

            dataHora:
                fotografia.dataHora
                    .toISOString(),

            latitude:
                fotografia.latitude,

            longitude:
                fotografia.longitude,

            precisao:
                fotografia.precisao,

            gpsObtido:
                fotografia.gpsObtido,

            municipio:
                fotografia.municipio,

            uf:
                fotografia.uf

        };


        return new Promise(function (
            resolve,
            reject
        ) {

            const transacao =
                banco.transaction(
                    NOME_STORE,
                    "readwrite"
                );


            const store =
                transacao.objectStore(
                    NOME_STORE
                );


            /*
            put() cria o registro quando ele
            ainda não existe e atualiza quando
            o mesmo ID já está armazenado.
            */

            store.put(
                registro
            );


            transacao.oncomplete =
                function () {

                    banco.close();

                    resolve();

                };


            transacao.onerror =
                function () {

                    banco.close();

                    reject(
                        transacao.error
                    );

                };


            transacao.onabort =
                function () {

                    banco.close();

                    reject(
                        transacao.error ||
                        new Error(
                            "Transação de armazenamento cancelada."
                        )
                    );

                };

        });

    }

    catch (erro) {

        console.error(
            "Não foi possível salvar a fotografia:",
            erro
        );

        throw erro;

    }

}


/*
=========================================
CARREGAR FOTOGRAFIAS
=========================================
*/

async function carregarFotografiasLocais() {

    try {

        const banco =
            await abrirBanco();


        return new Promise(function (
            resolve,
            reject
        ) {

            const transacao =
                banco.transaction(
                    NOME_STORE,
                    "readonly"
                );


            const store =
                transacao.objectStore(
                    NOME_STORE
                );


            const requisicao =
                store.getAll();


            requisicao.onsuccess =
                function () {

                    const registros =
                        requisicao.result || [];


                    /*
                    ---------------------------------
                    RECONSTRÓI OS OBJETOS
                    ---------------------------------

                    Como as URLs criadas com
                    URL.createObjectURL() deixam de
                    valer ao encerrar a página,
                    criamos uma nova URL para cada
                    arquivo recuperado do IndexedDB.
                    */

                    const resultado =
                        registros.map(
                            function (registro) {

                                return {

                                    id:
                                        registro.id,

                                    arquivo:
                                        registro.arquivo,

                                    url:
                                        URL.createObjectURL(
                                            registro.arquivo
                                        ),

                                    dataHora:
                                        new Date(
                                            registro.dataHora
                                        ),

                                    latitude:
                                        registro.latitude,

                                    longitude:
                                        registro.longitude,

                                    precisao:
                                        registro.precisao,

                                    gpsObtido:
                                        registro.gpsObtido,

                                    municipio:
                                        registro.municipio,

                                    uf:
                                        registro.uf

                                };

                            }
                        );


                    resolve(
                        resultado
                    );

                };


            requisicao.onerror =
                function () {

                    reject(
                        requisicao.error
                    );

                };


            transacao.oncomplete =
                function () {

                    banco.close();

                };

        });

    }

    catch (erro) {

        console.error(
            "Não foi possível carregar as fotografias:",
            erro
        );


        return [];

    }

}


/*
=========================================
EXCLUIR UMA FOTOGRAFIA
=========================================
*/

async function excluirFotografiaLocal(id) {

    try {

        const banco =
            await abrirBanco();


        return new Promise(function (
            resolve,
            reject
        ) {

            const transacao =
                banco.transaction(
                    NOME_STORE,
                    "readwrite"
                );


            const store =
                transacao.objectStore(
                    NOME_STORE
                );


            store.delete(
                id
            );


            transacao.oncomplete =
                function () {

                    banco.close();

                    resolve();

                };


            transacao.onerror =
                function () {

                    banco.close();

                    reject(
                        transacao.error
                    );

                };


            transacao.onabort =
                function () {

                    banco.close();

                    reject(
                        transacao.error ||
                        new Error(
                            "Transação de exclusão cancelada."
                        )
                    );

                };

        });

    }

    catch (erro) {

        console.error(
            "Não foi possível excluir a fotografia:",
            erro
        );

        throw erro;

    }

}


/*
=========================================
ATUALIZAR FOTOGRAFIA
=========================================
*/

async function atualizarFotografiaLocal(
    fotografia
) {

    /*
    Como salvarFotografiaLocal() utiliza
    store.put(), salvar novamente o mesmo
    ID atualiza o registro existente.
    */

    await salvarFotografiaLocal(
        fotografia
    );

}


/*
=========================================
APAGAR TODO O REGISTRO
=========================================
*/

async function limparFotografiasLocais() {

    try {

        const banco =
            await abrirBanco();


        return new Promise(function (
            resolve,
            reject
        ) {

            const transacao =
                banco.transaction(
                    NOME_STORE,
                    "readwrite"
                );


            const store =
                transacao.objectStore(
                    NOME_STORE
                );


            /*
            Esta operação somente é chamada
            quando o usuário confirma o botão
            Reiniciar.
            */

            store.clear();


            transacao.oncomplete =
                function () {

                    banco.close();

                    resolve();

                };


            transacao.onerror =
                function () {

                    banco.close();

                    reject(
                        transacao.error
                    );

                };


            transacao.onabort =
                function () {

                    banco.close();

                    reject(
                        transacao.error ||
                        new Error(
                            "Limpeza do armazenamento cancelada."
                        )
                    );

                };

        });

    }

    catch (erro) {

        console.error(
            "Não foi possível limpar o armazenamento:",
            erro
        );

        throw erro;

    }

}


/*
=========================================
SALVAR CLASSIFICAÇÃO
=========================================
*/

async function salvarClassificacaoLocal(classificacao) {

    const db = await abrirBanco();

    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                "configuracao",
                "readwrite"
            );

        const store =
            transaction.objectStore(
                "configuracao"
            );

        const registro = {
            chave: "classificacao",
            categoria:
                classificacao?.categoria || null,
            subcategoria:
                classificacao?.subcategoria || null,
            incidente:
                classificacao?.incidente || null
        };

        const request =
            store.put(registro);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}


/*
=========================================
CARREGAR CLASSIFICAÇÃO
=========================================
*/

async function carregarClassificacaoLocal() {

    const db = await abrirBanco();

    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                "configuracao",
                "readonly"
            );

        const store =
            transaction.objectStore(
                "configuracao"
            );

        const request =
            store.get("classificacao");

        request.onsuccess = function () {

            const registro =
                request.result;

            if (!registro) {

                resolve(null);
                return;
            }

            resolve({
                categoria:
                    registro.categoria || null,

                subcategoria:
                    registro.subcategoria || null,

                incidente:
                    registro.incidente || null
            });
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}


/*
=========================================
EXCLUIR CLASSIFICAÇÃO
=========================================
*/

async function excluirClassificacaoLocal() {

    const db = await abrirBanco();

    return new Promise(function (resolve, reject) {

        const transaction =
            db.transaction(
                "configuracao",
                "readwrite"
            );

        const store =
            transaction.objectStore(
                "configuracao"
            );

        const request =
            store.delete("classificacao");

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}
