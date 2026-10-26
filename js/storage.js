/*
=========================================
CONFIGURAÇÕES DO BANCO LOCAL
=========================================
*/

const NOME_BANCO = "RegistroFotograficoDB";
const VERSAO_BANCO = 4;

const NOME_STORE = "fotografias";
const NOME_STORE_PDFS = "filaPDF";


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


                /*
                =========================================
                STORE DA FILA DE PDFs
                =========================================

                Esta store é independente das fotografias
                e da classificação atual.

                Assim, um PDF que estiver aguardando
                sincronização continuará armazenado mesmo
                depois que o usuário reiniciar o registro.
                */

                if (
                    !banco.objectStoreNames
                        .contains(NOME_STORE_PDFS)
                ) {

                    const storePDF =
                        banco.createObjectStore(
                            NOME_STORE_PDFS,
                            {
                                keyPath: "id"
                            }
                        );


                    /*
                    Índice utilizado posteriormente para
                    localizar PDFs pelo status:

                    PENDENTE
                    ENVIANDO
                    SINCRONIZADO
                    ERRO
                    */

                    storePDF.createIndex(
                        "status",
                        "status",
                        {
                            unique: false
                        }
                    );


                    /*
                    Permite ordenar/localizar os registros
                    pela data em que foram gerados.
                    */

                    storePDF.createIndex(
                        "dataGeracao",
                        "dataGeracao",
                        {
                            unique: false
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
        =========================================
        MONTA REGISTRO PERSISTENTE
        =========================================

        A URL "blob:" NÃO é salva porque ela é
        temporária e deixa de funcionar depois
        que a página é encerrada.

        O Blob/File original é armazenado
        diretamente no IndexedDB.
        */

        const registro = {

            id:
                fotografia.id,

            arquivo:
                fotografia.arquivo,

            dataHora:
                fotografia.dataHora instanceof Date
                    ? fotografia.dataHora.toISOString()
                    : fotografia.dataHora,

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
                fotografia.uf,

            detalhamento:
                fotografia.detalhamento || ""

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

                    const erro =
                        transacao.error;

                    banco.close();

                    reject(
                        erro
                    );

                };


            transacao.onabort =
                function () {

                    const erro =
                        transacao.error ||
                        new Error(
                            "Transação de armazenamento cancelada."
                        );

                    banco.close();

                    reject(
                        erro
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


                    const resultado =
                        registros
                            .filter(
                                function (registro) {

                                    /*
                                    Só tenta restaurar registros
                                    que realmente possuem a imagem.
                                    */

                                    return (
                                        registro &&
                                        registro.arquivo
                                    );

                                }
                            )
                            .map(
                                function (registro) {

                                    let url = "";

                                    try {

                                        /*
                                        Cria uma NOVA URL temporária.

                                        Nunca reutilizamos uma URL
                                        "blob:" de uma sessão anterior.
                                        */

                                        url =
                                            URL.createObjectURL(
                                                registro.arquivo
                                            );

                                    }

                                    catch (erro) {

                                        console.error(
                                            "Não foi possível reconstruir a imagem:",
                                            erro
                                        );

                                    }


                                    return {

                                        id:
                                            registro.id,

                                        arquivo:
                                            registro.arquivo,

                                        url:
                                            url,

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
                                            registro.municipio || null,

                                        uf:
                                            registro.uf || null,

                                        detalhamento:
                                            registro.detalhamento || ""

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

async function salvarClassificacaoLocal(
    classificacao
) {

    const db =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

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

            chave:
                "classificacao",

            categoria:
                classificacao?.categoria || "",

            subcategoria:
                classificacao?.subcategoria || "",

            incidente:
                classificacao?.incidente || "",

            instalacao:
                classificacao?.instalacao || "",

            localidade:
                classificacao?.localidade || "",

            nomeAcao:
                classificacao?.nomeAcao || ""

        };


        store.put(
            registro
        );


        transaction.oncomplete =
            function () {

                db.close();

                resolve();

            };


        transaction.onerror =
            function () {

                const erro =
                    transaction.error;

                db.close();

                reject(
                    erro
                );

            };


        transaction.onabort =
            function () {

                const erro =
                    transaction.error ||
                    new Error(
                        "Não foi possível salvar a classificação."
                    );

                db.close();

                reject(
                    erro
                );

            };

    });

}
  

/*
=========================================
CARREGAR CLASSIFICAÇÃO
=========================================
*/

async function carregarClassificacaoLocal() {

    const db =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

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
            store.get(
                "classificacao"
            );


        request.onsuccess =
            function () {

                const registro =
                    request.result;


                if (!registro) {

                    resolve(null);

                    return;

                }


                resolve({

                    categoria:
                        registro.categoria || "",

                    subcategoria:
                        registro.subcategoria || "",

                    incidente:
                        registro.incidente || "",

                    instalacao:
                        registro.instalacao || "",

                    localidade:
                        registro.localidade || "",

                    nomeAcao:
                        registro.nomeAcao || ""

                });

            };


        request.onerror =
            function () {

                reject(
                    request.error
                );

            };


        transaction.oncomplete =
            function () {

                db.close();

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

/*
=========================================
FILA OFFLINE DE PDFs
=========================================
*/


/*
=========================================
SALVAR PDF NA FILA
=========================================
*/

async function salvarPDFPendente(
    dadosPDF
) {

    const banco =
        await abrirBanco();


    /*
    =========================================
    MONTA REGISTRO
    =========================================
    */

    const registro = {

        id:
            dadosPDF.id,

        nomeArquivo:
            dadosPDF.nomeArquivo,

        arquivoPDF:
            dadosPDF.arquivoPDF,

        categoria:
            dadosPDF.categoria || "",

        subcategoria:
            dadosPDF.subcategoria || "",

        incidente:
            dadosPDF.incidente || "",

        instalacao:
            dadosPDF.instalacao || "",

        localidade:
            dadosPDF.localidade || "",

        nomeAcao:
            dadosPDF.nomeAcao || "",

        dataGeracao:
            dadosPDF.dataGeracao ||
            new Date().toISOString(),

        status:
            dadosPDF.status ||
            "PENDENTE",

        tentativas:
            dadosPDF.tentativas || 0,

        ultimaTentativa:
            dadosPDF.ultimaTentativa || null,

        sincronizadoEm:
            dadosPDF.sincronizadoEm || null,

        erro:
            dadosPDF.erro || null

    };


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readwrite"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
            );


        store.put(
            registro
        );


        transacao.oncomplete =
            function () {

                banco.close();

                resolve(
                    registro
                );

            };


        transacao.onerror =
            function () {

                const erro =
                    transacao.error;

                banco.close();

                reject(
                    erro
                );

            };


        transacao.onabort =
            function () {

                const erro =
                    transacao.error ||
                    new Error(
                        "Não foi possível armazenar o PDF."
                    );

                banco.close();

                reject(
                    erro
                );

            };

    });

}


/*
=========================================
LISTAR TODOS OS PDFs DA FILA
=========================================
*/

async function listarPDFsFila() {

    const banco =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readonly"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
            );


        const requisicao =
            store.getAll();


        requisicao.onsuccess =
            function () {

                const registros =
                    requisicao.result || [];


                /*
                Ordena do PDF mais antigo
                para o mais recente.
                */

                registros.sort(
                    function (a, b) {

                        return (
                            new Date(a.dataGeracao) -
                            new Date(b.dataGeracao)
                        );

                    }
                );


                resolve(
                    registros
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


/*
=========================================
LISTAR PDFs PENDENTES
=========================================
*/

async function listarPDFsPendentes() {

    const banco =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readonly"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
            );


        const indice =
            store.index(
                "status"
            );


        const requisicao =
            indice.getAll(
                "PENDENTE"
            );


        requisicao.onsuccess =
            function () {

                const registros =
                    requisicao.result || [];


                registros.sort(
                    function (a, b) {

                        return (
                            new Date(a.dataGeracao) -
                            new Date(b.dataGeracao)
                        );

                    }
                );


                resolve(
                    registros
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


/*
=========================================
OBTER PDF PELO ID
=========================================
*/

async function obterPDFFila(
    id
) {

    const banco =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readonly"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
            );


        const requisicao =
            store.get(
                id
            );


        requisicao.onsuccess =
            function () {

                resolve(
                    requisicao.result || null
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


/*
=========================================
ATUALIZAR STATUS DO PDF
=========================================
*/

async function atualizarStatusPDF(
    id,
    status,
    dadosExtras = {}
) {

    const banco =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readwrite"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
            );


        const requisicao =
            store.get(
                id
            );


        requisicao.onsuccess =
            function () {

                const registro =
                    requisicao.result;


                if (!registro) {

                    transacao.abort();

                    return;

                }


                registro.status =
                    status;


                /*
                =========================================
                DADOS ADICIONAIS
                =========================================
                */

                if (
                    dadosExtras.tentativas !==
                    undefined
                ) {

                    registro.tentativas =
                        dadosExtras.tentativas;

                }


                if (
                    dadosExtras.ultimaTentativa !==
                    undefined
                ) {

                    registro.ultimaTentativa =
                        dadosExtras.ultimaTentativa;

                }


                if (
                    dadosExtras.sincronizadoEm !==
                    undefined
                ) {

                    registro.sincronizadoEm =
                        dadosExtras.sincronizadoEm;

                }


                if (
                    dadosExtras.erro !==
                    undefined
                ) {

                    registro.erro =
                        dadosExtras.erro;

                }


                store.put(
                    registro
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

                resolve();

            };


        transacao.onerror =
            function () {

                const erro =
                    transacao.error;

                banco.close();

                reject(
                    erro
                );

            };


        transacao.onabort =
            function () {

                const erro =
                    transacao.error ||
                    new Error(
                        "PDF não encontrado na fila."
                    );

                banco.close();

                reject(
                    erro
                );

            };

    });

}


/*
=========================================
EXCLUIR PDF DA FILA
=========================================
*/

async function excluirPDFFila(
    id
) {

    const banco =
        await abrirBanco();


    return new Promise(function (
        resolve,
        reject
    ) {

        const transacao =
            banco.transaction(
                NOME_STORE_PDFS,
                "readwrite"
            );


        const store =
            transacao.objectStore(
                NOME_STORE_PDFS
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

                const erro =
                    transacao.error;

                banco.close();

                reject(
                    erro
                );

            };


        transacao.onabort =
            function () {

                const erro =
                    transacao.error ||
                    new Error(
                        "Não foi possível excluir o PDF da fila."
                    );

                banco.close();

                reject(
                    erro
                );

            };

    });

}

