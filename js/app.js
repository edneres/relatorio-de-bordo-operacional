/*
=========================================
FOTOGRAFIAS DO REGISTRO ATUAL
=========================================
*/

let fotografias = [];


/*
=========================================
INICIALIZAÇÃO
=========================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const botaoCameraInicial =
            document.getElementById(
                "btn-camera"
            );

        const botaoCameraFinal =
            document.getElementById(
                "btn-camera-final"
            );

        const botaoReiniciar =
            document.getElementById(
                "btn-reiniciar"
            );

        const botaoGerarPDF =
            document.getElementById(
                "btn-pdf"
            );

        const botaoInformacoes =
            document.getElementById(
                "btn-informacoes"
            );

        const botaoFecharInformacoes =
            document.getElementById(
                "btn-fechar-informacoes"
            );

        const modalInformacoes =
            document.getElementById(
                "modal-informacoes"
            );

        const opcoesTipoServico =
            document.querySelectorAll(
                'input[name="tipo-servico"]'
            );

        const opcoesSubtipoServico =
            document.querySelectorAll(
                'input[name="subtipo-servico"]'
            );

        const subopcoesExpansao =
            document.getElementById(
                "subopcoes-expansao"
            );

        const subopcoesManutencao =
            document.getElementById(
                "subopcoes-manutencao"
            );

        const campoIncidente =
            document.getElementById(
                "campo-incidente"
            );

        const numeroIncidente =
            document.getElementById(
                "numero-incidente"
            );

        const nomeAcao =
            document.getElementById(
                "nome-acao"
            );

        const contadorNomeAcao =
            document.getElementById(
                "contador-nome-acao"
            );


        /*
        =========================================
        CLASSIFICAÇÃO DO REGISTRO
        =========================================
        */

        opcoesTipoServico.forEach(
            function (opcao) {

                opcao.addEventListener(
                    "change",
                    function () {

                        /*
                        Esconde tudo antes de mostrar
                        a categoria selecionada.
                        */

                        subopcoesExpansao.classList.add(
                            "oculto"
                        );

                        subopcoesManutencao.classList.add(
                            "oculto"
                        );

                        campoIncidente.classList.add(
                            "oculto"
                        );


                        /*
                        Limpa a subopção anterior.
                        */

                        opcoesSubtipoServico.forEach(
                            function (subopcao) {

                                subopcao.checked = false;

                            }
                        );

                        numeroIncidente.value = "";


                        /*
                        EXPANSÃO
                        */

                        if (
                            this.value ===
                            "expansao"
                        ) {

                            subopcoesExpansao
                                .classList
                                .remove(
                                    "oculto"
                                );

                        }


                        /*
                        MANUTENÇÃO
                        */

                        if (
                            this.value ===
                            "manutencao"
                        ) {

                            subopcoesManutencao
                                .classList
                                .remove(
                                    "oculto"
                                );

                        }


                        atualizarValidacaoRegistro();

                        atualizarBotoes();

                        salvarDadosRegistro();

                    }
                );

            }
        );


        /*
        =========================================
        SUBOPÇÕES
        =========================================
        */

        opcoesSubtipoServico.forEach(
            function (opcao) {

                opcao.addEventListener(
                    "change",
                    function () {

                        campoIncidente.classList.add(
                            "oculto"
                        );

                        numeroIncidente.value = "";


                        /*
                        Tratamento de Pendências
                        de Incidente
                        */

                        if (
                            this.value ===
                            "tratamento-incidente"
                        ) {

                            campoIncidente
                                .classList
                                .remove(
                                    "oculto"
                                );

                            setTimeout(
                                function () {

                                    numeroIncidente.focus();

                                },
                                100
                            );

                        }


                        atualizarValidacaoRegistro();

                        atualizarBotoes();

                        salvarDadosRegistro();

                    }
                );

            }
        );


        /*
        =========================================
        NÚMERO DO INCIDENTE
        =========================================
        */

        numeroIncidente.addEventListener(
            "input",
            function () {

                atualizarValidacaoRegistro();

                atualizarBotoes();

                salvarDadosRegistro();

            }
        );


        /*
        =========================================
        NOME DA AÇÃO
        =========================================
        */

        nomeAcao.addEventListener(
            "input",
            function () {

                /*
                Garante o limite de 25 caracteres.
                */

                if (
                    this.value.length > 25
                ) {

                    this.value =
                        this.value.slice(
                            0,
                            25
                        );

                }


                contadorNomeAcao.textContent =
                    `${this.value.length}/25`;


                atualizarValidacaoRegistro();

                atualizarBotoes();

                salvarDadosRegistro();

            }
        );


        /*
        -----------------------------------------
        CONFIGURA CÂMERA
        -----------------------------------------
        */

        configurarCamera();


        /*
        -----------------------------------------
        CÂMERA INICIAL
        -----------------------------------------
        */

        botaoCameraInicial.addEventListener(
            "click",
            function () {

                if (
                    !classificacaoPreenchida()
                ) {

                    alert(
                        "Preencha a classificação do registro antes de tirar a fotografia."
                    );

                    return;

                }


                if (
                    !nomeAcaoPreenchido()
                ) {

                    alert(
                        "Preencha o Nome da Ação antes de tirar a fotografia."
                    );

                    nomeAcao.focus();

                    return;

                }


                abrirCamera();

            }
        );


        /*
        -----------------------------------------
        CÂMERA APÓS AS FOTOS
        -----------------------------------------
        */

        botaoCameraFinal.addEventListener(
            "click",
            function () {

                if (
                    !classificacaoPreenchida()
                ) {

                    alert(
                        "Preencha a classificação do registro antes de tirar a fotografia."
                    );

                    return;

                }


                if (
                    !nomeAcaoPreenchido()
                ) {

                    alert(
                        "Preencha o Nome da Ação antes de tirar a fotografia."
                    );

                    nomeAcao.focus();

                    return;

                }


                abrirCamera();

            }
        );


        /*
        -----------------------------------------
        REINICIAR
        -----------------------------------------
        */

        botaoReiniciar.addEventListener(
            "click",
            async function () {

                await reiniciarRegistro();

            }
        );


        /*
        =========================================
        GERAR PDF
        =========================================
        */

        botaoGerarPDF.addEventListener(
            "click",
            async function () {

                if (
                    !classificacaoPreenchida()
                ) {

                    alert(
                        "Preencha a classificação do registro antes de gerar o PDF."
                    );

                    return;

                }


                if (
                    !nomeAcaoPreenchido()
                ) {

                    alert(
                        "Preencha o Nome da Ação antes de gerar o PDF."
                    );

                    nomeAcao.focus();

                    return;

                }


                const nomeArquivo =
                    montarNomeArquivoPDF();


                if (
                    !nomeArquivo
                ) {

                    alert(
                        "Não foi possível definir o nome do arquivo."
                    );

                    return;

                }


                await gerarPDF(
                    nomeArquivo
                );

            }
        );


        /*
        =========================================
        MODAL DE INFORMAÇÕES
        =========================================
        */

        botaoInformacoes.addEventListener(
            "click",
            function () {

                modalInformacoes
                    .classList
                    .remove(
                        "oculto"
                    );

                document.body.style.overflow =
                    "hidden";

            }
        );


        /*
        -----------------------------------------
        FECHAR PELO X
        -----------------------------------------
        */

        botaoFecharInformacoes
            .addEventListener(
                "click",
                function () {

                    fecharModalInformacoes();

                }
            );


        /*
        -----------------------------------------
        FECHAR CLICANDO FORA
        -----------------------------------------
        */

        modalInformacoes.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalInformacoes
                ) {

                    fecharModalInformacoes();

                }

            }
        );


        /*
        -----------------------------------------
        FECHAR COM ESC
        -----------------------------------------
        */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    !modalInformacoes
                        .classList
                        .contains(
                            "oculto"
                        )
                ) {

                    fecharModalInformacoes();

                }

            }
        );


        /*
        =========================================
        RECUPERA AS FOTOGRAFIAS SALVAS
        =========================================

        Primeiro recuperamos todas as fotografias
        armazenadas no IndexedDB.

        As URLs "blob:" são reconstruídas pela
        função carregarFotografiasLocais().
        */

        try {

            fotografias =
                await carregarFotografiasLocais();

        }

        catch (erro) {

            console.error(
                "Erro ao recuperar as fotografias:",
                erro
            );

            fotografias = [];

        }


        /*
        =========================================
        MANTÉM A ORDEM ORIGINAL DAS FOTOS
        =========================================
        */

        fotografias.sort(
            function (a, b) {

                return (
                    a.dataHora -
                    b.dataHora
                );

            }
        );


        /*
        =========================================
        RESTAURA OS DADOS DO REGISTRO
        =========================================

        IMPORTANTE:

        A classificação e o Nome da Ação são
        restaurados ANTES da montagem final da
        interface.

        Assim, quando atualizarBotoes() executar,
        os radios e demais campos já estarão
        novamente preenchidos.
        */

        try {

            await restaurarDadosRegistro();

        }

        catch (erro) {

            console.error(
                "Erro ao restaurar os dados do registro:",
                erro
            );

        }


        /*
        =========================================
        MONTA A INTERFACE
        =========================================

        Somente chegamos aqui depois de:

        1. recuperar as fotografias;
        2. reconstruir suas URLs;
        3. restaurar a classificação;
        4. restaurar o Nome da Ação.

        Agora podemos renderizar o histórico e
        validar os botões com o estado correto.
        */

        atualizarInterface();

    }
);



/*
=========================================
ATUALIZAR VALIDAÇÃO DO REGISTRO
=========================================
*/

function atualizarValidacaoRegistro() {

    const registroValido =
        classificacaoPreenchida()
        &&
        nomeAcaoPreenchido();


    const botaoCameraInicial =
        document.getElementById(
            "btn-camera"
        );

    const botaoCameraFinal =
        document.getElementById(
            "btn-camera-final"
        );

    const botaoGerarPDF =
        document.getElementById(
            "btn-pdf"
        );


    if (botaoCameraInicial) {

        botaoCameraInicial.disabled =
            !registroValido;

    }


    if (botaoCameraFinal) {

        botaoCameraFinal.disabled =
            !registroValido;

    }


    if (botaoGerarPDF) {

        botaoGerarPDF.disabled =
            !registroValido;

    }


    atualizarPreviaNomeArquivo();

}

/*
=========================================
SALVAR DADOS DO REGISTRO
=========================================
*/

async function salvarDadosRegistro() {

    const tipo =
        document.querySelector(
            'input[name="tipo-servico"]:checked'
        );

    const subtipo =
        document.querySelector(
            'input[name="subtipo-servico"]:checked'
        );

    const numeroIncidente =
        document.getElementById(
            "numero-incidente"
        );

    const nomeAcao =
        document.getElementById(
            "nome-acao"
        );


    const dadosRegistro = {

        categoria:
            tipo
                ? tipo.value
                : "",

        subcategoria:
            subtipo
                ? subtipo.value
                : "",

        incidente:
            numeroIncidente
                ? numeroIncidente.value
                : "",

        nomeAcao:
            nomeAcao
                ? nomeAcao.value
                : ""

    };


    /*
    =========================================
    LOCALSTORAGE
    =========================================

    Mantemos por compatibilidade e como
    redundância.
    */

    localStorage.setItem(
        "dadosRegistroFotografico",
        JSON.stringify(
            dadosRegistro
        )
    );


    /*
    =========================================
    INDEXEDDB
    =========================================

    A classificação também passa a ser
    persistida no mesmo banco das fotografias.
    */

    try {

        await salvarClassificacaoLocal(
            dadosRegistro
        );

    }

    catch (erro) {

        console.error(
            "Não foi possível salvar os dados do registro no IndexedDB:",
            erro
        );

    }


    atualizarPreviaNomeArquivo();

}

/*
=========================================
RESTAURAR DADOS DO REGISTRO
=========================================
*/

async function restaurarDadosRegistro() {

    let registro = null;


    /*
    =========================================
    1. TENTA INDEXEDDB
    =========================================
    */

    try {

        registro =
            await carregarClassificacaoLocal();

    }

    catch (erro) {

        console.error(
            "Não foi possível recuperar a classificação do IndexedDB:",
            erro
        );

    }


    /*
    =========================================
    2. FALLBACK PARA LOCALSTORAGE
    =========================================
    */

    if (!registro) {

        let dados =
            localStorage.getItem(
                "dadosRegistroFotografico"
            );


        if (!dados) {

            dados =
                localStorage.getItem(
                    "classificacaoRegistro"
                );

        }


        if (dados) {

            try {

                registro =
                    JSON.parse(
                        dados
                    );

            }

            catch (erro) {

                console.error(
                    "Erro ao recuperar dados do registro:",
                    erro
                );

            }

        }

    }


    /*
    =========================================
    NENHUM REGISTRO
    =========================================
    */

    if (!registro) {

        atualizarContadorNomeAcao();
        atualizarValidacaoRegistro();
        atualizarBotoes();

        return;

    }


    const subopcoesExpansao =
        document.getElementById(
            "subopcoes-expansao"
        );

    const subopcoesManutencao =
        document.getElementById(
            "subopcoes-manutencao"
        );

    const campoIncidente =
        document.getElementById(
            "campo-incidente"
        );

    const numeroIncidente =
        document.getElementById(
            "numero-incidente"
        );

    const nomeAcao =
        document.getElementById(
            "nome-acao"
        );


    /*
    =========================================
    RESTAURA CATEGORIA
    =========================================
    */

    if (registro.categoria) {

        const tipo =
            document.querySelector(
                'input[name="tipo-servico"][value="' +
                registro.categoria +
                '"]'
            );


        if (tipo) {

            tipo.checked = true;

        }


        if (
            registro.categoria ===
            "expansao"
        ) {

            subopcoesExpansao
                .classList
                .remove("oculto");

            subopcoesManutencao
                .classList
                .add("oculto");

        }


        else if (
            registro.categoria ===
            "manutencao"
        ) {

            subopcoesManutencao
                .classList
                .remove("oculto");

            subopcoesExpansao
                .classList
                .add("oculto");

        }

    }


    /*
    =========================================
    RESTAURA SUBCATEGORIA
    =========================================
    */

    if (registro.subcategoria) {

        const subtipo =
            document.querySelector(
                'input[name="subtipo-servico"][value="' +
                registro.subcategoria +
                '"]'
            );


        if (subtipo) {

            subtipo.checked = true;

        }

    }


    /*
    =========================================
    RESTAURA INCIDENTE
    =========================================
    */

    if (
        registro.subcategoria ===
        "tratamento-incidente"
    ) {

        campoIncidente
            .classList
            .remove("oculto");

        numeroIncidente.value =
            registro.incidente || "";

    }

    else {

        campoIncidente
            .classList
            .add("oculto");

        numeroIncidente.value = "";

    }


    /*
    =========================================
    RESTAURA NOME DA AÇÃO
    =========================================
    */

    if (nomeAcao) {

        nomeAcao.value =
            String(
                registro.nomeAcao || ""
            ).slice(
                0,
                25
            );

    }


    /*
    =========================================
    MIGRA / SINCRONIZA
    =========================================
    */

    localStorage.removeItem(
        "classificacaoRegistro"
    );


    await salvarDadosRegistro();


    /*
    =========================================
    ATUALIZA INTERFACE
    =========================================
    */

    atualizarContadorNomeAcao();

    atualizarValidacaoRegistro();

    atualizarBotoes();

}

function obterClassificacaoRegistro() {

    const tipo =
        document.querySelector(
            'input[name="tipo-servico"]:checked'
        );

    const subtipo =
        document.querySelector(
            'input[name="subtipo-servico"]:checked'
        );

    const campoNumero =
        document.getElementById(
            "numero-incidente"
        );


    if (!tipo || !subtipo) {

        return null;

    }


    /*
    =========================================
    EXPANSÃO
    =========================================
    */

    if (tipo.value === "expansao") {

        if (subtipo.value === "grupo-a") {

            return {
                categoria: "Expansão",
                subcategoria: "Grupo A",
                incidente: null
            };
        }


        if (subtipo.value === "ligacao-nova") {

            return {
                categoria: "Expansão",
                subcategoria: "Ligação Nova",
                incidente: null
            };
        }
    }


    /*
    =========================================
    MANUTENÇÃO
    =========================================
    */

    if (tipo.value === "manutencao") {

        if (subtipo.value === "melhorias") {

            return {
                categoria: "Manutenção",
                subcategoria: "Melhorias",
                incidente: null
            };
        }


        if (
            subtipo.value ===
            "tratamento-incidente"
        ) {

            const incidente =
                campoNumero.value.trim();

            if (!incidente) {
                return null;
            }


            return {
                categoria: "Manutenção",
                subcategoria:
                    "Tratamento de Pendências de Incidente",
                incidente: incidente
            };
        }
    }


    return null;
}


function classificacaoPreenchida() {

    return obterClassificacaoRegistro() !== null;

}


/*
=========================================
NOME DA AÇÃO PREENCHIDO
=========================================
*/

function nomeAcaoPreenchido() {

    const nomeAcao =
        document.getElementById(
            "nome-acao"
        );


    if (!nomeAcao) {

        return false;

    }


    return (
        nomeAcao.value.trim().length > 0
    );

}


/*
=========================================
ATUALIZAR CONTADOR DO NOME DA AÇÃO
=========================================
*/

function atualizarContadorNomeAcao() {

    const nomeAcao =
        document.getElementById(
            "nome-acao"
        );

    const contador =
        document.getElementById(
            "contador-nome-acao"
        );


    if (
        !nomeAcao ||
        !contador
    ) {

        return;

    }


    contador.textContent =
        `${nomeAcao.value.length}/25`;

}


/*
=========================================
MONTAR NOME DO ARQUIVO PDF
=========================================
*/

function montarNomeArquivoPDF() {

    const classificacao =
        obterClassificacaoRegistro();

    const campoNomeAcao =
        document.getElementById(
            "nome-acao"
        );


    if (
        !classificacao ||
        !campoNomeAcao
    ) {

        return "";

    }


    const nomeAcao =
        campoNomeAcao.value.trim();


    if (!nomeAcao) {

        return "";

    }


    let prefixo = "";


    /*
    =========================================
    EXPANSÃO
    =========================================
    */

    if (
        classificacao.categoria ===
        "Expansão"
    ) {

        prefixo =
            "Expansão - "
            +
            classificacao.subcategoria;

    }


    /*
    =========================================
    MANUTENÇÃO
    =========================================
    */

    else if (
        classificacao.categoria ===
        "Manutenção"
    ) {

        if (
            classificacao.subcategoria ===
            "Tratamento de Pendências de Incidente"
        ) {

            prefixo =
                "Manutenção - Incidente "
                +
                classificacao.incidente;

        }

        else if (
            classificacao.subcategoria ===
            "Melhorias"
        ) {

            prefixo =
                "Manutenção - Melhorias";

        }

    }


    if (!prefixo) {

        return "";

    }


    return (
        prefixo
        +
        " - "
        +
        nomeAcao
    );

}


/*
=========================================
ATUALIZAR PRÉVIA DO NOME DO ARQUIVO
=========================================
*/

function atualizarPreviaNomeArquivo() {

    const previa =
        document.getElementById(
            "previa-nome-arquivo"
        );


    if (!previa) {

        return;

    }


    const nomeArquivo =
        montarNomeArquivoPDF();


    if (!nomeArquivo) {

        previa.textContent =
            "Preencha a classificação e o nome da ação";

        return;

    }


    previa.textContent =
        nomeArquivo + ".pdf";

}



/*
=========================================
FECHAR MODAL DE INFORMAÇÕES
=========================================
*/

function fecharModalInformacoes() {

    const modalInformacoes =
        document.getElementById(
            "modal-informacoes"
        );


    if (!modalInformacoes) {

        return;

    }


    modalInformacoes
        .classList
        .add("oculto");


    document.body.style.overflow = "";

}


/*
=========================================
ADICIONAR FOTOGRAFIA
=========================================
*/

async function adicionarFotografia(
    arquivo
) {

    /*
    -----------------------------------------
    MOMENTO DA CAPTURA
    -----------------------------------------
    */

    const agora =
        new Date();


    /*
    -----------------------------------------
    OBTÉM GPS
    -----------------------------------------
    */

    const localizacao =
        await obterLocalizacaoGPS();


    /*
    -----------------------------------------
    CRIA O REGISTRO
    -----------------------------------------
    */

    const fotografia = {

        id:
            gerarId(),

        arquivo:
            arquivo,

        url:
            URL.createObjectURL(
                arquivo
            ),

        dataHora:
            agora,

        latitude:
            localizacao.latitude,

        longitude:
            localizacao.longitude,

        precisao:
            localizacao.precisao,

        gpsObtido:
            localizacao.sucesso,

        municipio:
            null,

        uf:
            null,

        /*
        Detalhamento opcional da fotografia.
        */

        detalhamento:
            ""

    };


    /*
    -----------------------------------------
    SALVA PRIMEIRO NO INDEXEDDB
    -----------------------------------------

    A fotografia é persistida antes de
    considerarmos o registro concluído.

    Dessa forma, uma atualização ou
    fechamento posterior da página não
    elimina a fotografia.
    */

    try {

        await salvarFotografiaLocal(
            fotografia
        );

    }

    catch (erro) {

        URL.revokeObjectURL(
            fotografia.url
        );

        console.error(
            "Erro ao armazenar a fotografia:",
            erro
        );

        alert(
            "Não foi possível armazenar a fotografia no dispositivo."
        );

        return;

    }


    /*
    -----------------------------------------
    ADICIONA À MEMÓRIA
    -----------------------------------------
    */

    fotografias.push(
        fotografia
    );


    /*
    -----------------------------------------
    ATUALIZA INTERFACE
    -----------------------------------------
    */

    atualizarInterface();


    /*
    -----------------------------------------
    ROLA ATÉ O FINAL
    -----------------------------------------
    */

    setTimeout(
        function () {

            window.scrollTo({

                top:
                    document
                        .documentElement
                        .scrollHeight,

                behavior:
                    "smooth"

            });

        },
        300
    );


    /*
    =========================================
    MUNICÍPIO / UF
    =========================================

    A foto já está armazenada.

    Portanto, demora ou ausência de internet
    nesta consulta não afeta a persistência
    da fotografia.
    */

    if (fotografia.gpsObtido) {

        const local =
            await buscarMunicipioUF(

                fotografia.latitude,
                fotografia.longitude

            );


        /*
        O usuário pode ter excluído a foto
        enquanto a consulta estava sendo
        realizada.
        */

        const fotografiaAindaExiste =
            fotografias.find(
                function (foto) {

                    return (
                        foto.id ===
                        fotografia.id
                    );

                }
            );


        if (!fotografiaAindaExiste) {

            return;

        }


        fotografia.municipio =
            local.municipio;

        fotografia.uf =
            local.uf;


        /*
        Persiste também município/UF.
        */

        try {

            await atualizarFotografiaLocal(
                fotografia
            );

        }

        catch (erro) {

            console.error(
                "Não foi possível atualizar município/UF:",
                erro
            );

        }


        if (
            fotografia.municipio ||
            fotografia.uf
        ) {

            atualizarInterface();

        }

    }

}


/*
=========================================
GERAR IDENTIFICADOR
=========================================
*/

function gerarId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();

    }


    return (
        Date.now().toString()
        +
        "-"
        +
        Math.random()
            .toString(16)
            .slice(2)
    );

}


/*
=========================================
ATUALIZAR INTERFACE
=========================================
*/

function atualizarInterface() {

    atualizarContadores();

    atualizarBotoes();

    renderizarHistorico();

}


/*
=========================================
CONTADORES
=========================================
*/

function atualizarContadores() {

    const contadorFotos =
        document.getElementById(
            "contador-fotos"
        );

    const quantidadeFotos =
        document.getElementById(
            "quantidade-fotos"
        );

    const quantidade =
        fotografias.length;


    /*
    -----------------------------------------
    NENHUMA FOTO
    -----------------------------------------
    */

    if (quantidade === 0) {

        contadorFotos.textContent =
            "Nenhuma fotografia registrada";

        quantidadeFotos.textContent =
            "0 fotos";

        quantidadeFotos.classList.add(
            "oculto"
        );

        return;

    }


    /*
    -----------------------------------------
    UMA FOTO
    -----------------------------------------
    */

    if (quantidade === 1) {

        contadorFotos.textContent =
            "1 fotografia registrada";

        quantidadeFotos.textContent =
            "1 foto";

    }


    /*
    -----------------------------------------
    VÁRIAS FOTOS
    -----------------------------------------
    */

    else {

        contadorFotos.textContent =
            `${quantidade} fotografias registradas`;

        quantidadeFotos.textContent =
            `${quantidade} fotos`;

    }


    quantidadeFotos.classList.remove(
        "oculto"
    );

}


/*
=========================================
BOTÕES
=========================================
*/

function atualizarBotoes() {

    const acoesIniciais =
        document.getElementById(
            "acoes-iniciais"
        );

    const acoesFinais =
        document.getElementById(
            "acoes-finais"
        );

    const botaoReiniciar =
        document.getElementById(
            "btn-reiniciar"
        );


    /*
    =========================================
    EXISTEM FOTOGRAFIAS
    =========================================
    */

    if (fotografias.length > 0) {

        acoesIniciais.classList.add(
            "oculto"
        );

        acoesFinais.classList.remove(
            "oculto"
        );

    }


    /*
    =========================================
    NÃO EXISTEM FOTOGRAFIAS
    =========================================
    */

    else {

        acoesIniciais.classList.remove(
            "oculto"
        );

        acoesFinais.classList.add(
            "oculto"
        );

    }


    /*
    =========================================
    BOTÃO REINICIAR
    =========================================
    */

    const possuiDadosFormulario =
        classificacaoPreenchida()
        ||
        nomeAcaoPreenchido();


    if (
        fotografias.length > 0 ||
        possuiDadosFormulario
    ) {

        botaoReiniciar.classList.remove(
            "oculto"
        );

    }

    else {

        botaoReiniciar.classList.add(
            "oculto"
        );

    }


    atualizarValidacaoRegistro();

}


/*
=========================================
HISTÓRICO
=========================================
*/

function renderizarHistorico() {

    const listaFotos =
        document.getElementById(
            "lista-fotos"
        );

    const historicoVazio =
        document.getElementById(
            "historico-vazio"
        );


    /*
    Limpa somente a representação HTML.

    Isto NÃO apaga nenhuma fotografia
    do IndexedDB.
    */

    listaFotos.innerHTML = "";


    /*
    -----------------------------------------
    HISTÓRICO VAZIO
    -----------------------------------------
    */

    if (fotografias.length === 0) {

        historicoVazio.classList.remove(
            "oculto"
        );

        return;

    }


    /*
    -----------------------------------------
    EXISTEM FOTOS
    -----------------------------------------
    */

    historicoVazio.classList.add(
        "oculto"
    );


    fotografias.forEach(
        function (
            fotografia,
            indice
        ) {

            const item =
                criarItemFotografia(
                    fotografia,
                    indice
                );


            listaFotos.appendChild(
                item
            );

        }
    );

}


/*
=========================================
CRIAR ITEM DO HISTÓRICO
=========================================
*/

function criarItemFotografia(
    fotografia,
    indice
) {

    /*
    -----------------------------------------
    CONTAINER
    -----------------------------------------
    */

    const item =
        document.createElement(
            "article"
        );

    item.className =
        "foto-item";


    /*
    -----------------------------------------
    IMAGEM
    -----------------------------------------
    */

    const imagem =
        document.createElement(
            "img"
        );

    imagem.className =
        "foto-imagem";

    imagem.src =
        fotografia.url;

    imagem.alt =
        `Fotografia ${indice + 1}`;


    /*
    -----------------------------------------
    BOTÃO EXCLUIR
    -----------------------------------------
    */

    const botaoExcluir =
        document.createElement(
            "button"
        );

    botaoExcluir.className =
        "btn-excluir";

    botaoExcluir.type =
        "button";

    botaoExcluir.innerHTML =
        "✕";

    botaoExcluir.setAttribute(
        "aria-label",
        `Excluir fotografia ${indice + 1}`
    );


    botaoExcluir.addEventListener(
        "click",
        function () {

            excluirFotografia(
                fotografia.id
            );

        }
    );


    /*
    -----------------------------------------
    INFORMAÇÕES
    -----------------------------------------
    */

    const informacoes =
        document.createElement(
            "div"
        );

    informacoes.className =
        "foto-informacoes";


    /*
    -----------------------------------------
    TÍTULO
    -----------------------------------------
    */

    const titulo =
        document.createElement(
            "strong"
        );

    titulo.className =
        "foto-titulo";

    titulo.textContent =
        `Fotografia ${String(
            indice + 1
        ).padStart(2, "0")}`;


    /*
    -----------------------------------------
    DATA / HORA
    -----------------------------------------
    */

    const dataHora =
        document.createElement(
            "span"
        );

    dataHora.className =
        "foto-data";

    dataHora.textContent =
        formatarDataHora(
            fotografia.dataHora
        );


    informacoes.appendChild(
        titulo
    );

    informacoes.appendChild(
        dataHora
    );


    /*
    =========================================
    GPS
    =========================================
    */

    if (fotografia.gpsObtido) {

        /*
        -----------------------------------------
        COORDENADAS
        -----------------------------------------
        */

        const coordenadas =
            document.createElement(
                "span"
            );

        coordenadas.className =
            "foto-coordenadas";

        coordenadas.textContent =
            formatarCoordenadas(
                fotografia.latitude,
                fotografia.longitude
            );


        informacoes.appendChild(
            coordenadas
        );


        /*
        -----------------------------------------
        MUNICÍPIO / UF
        -----------------------------------------
        */

        if (
            fotografia.municipio ||
            fotografia.uf
        ) {

            const local =
                document.createElement(
                    "span"
                );

            local.className =
                "foto-local";


            if (
                fotografia.municipio &&
                fotografia.uf
            ) {

                local.textContent =
                    fotografia.municipio
                    +
                    " - "
                    +
                    fotografia.uf;

            }

            else if (
                fotografia.municipio
            ) {

                local.textContent =
                    fotografia.municipio;

            }

            else {

                local.textContent =
                    fotografia.uf;

            }


            informacoes.appendChild(
                local
            );

        }


        /*
        -----------------------------------------
        PRECISÃO DO GPS
        -----------------------------------------
        */

        if (
            fotografia.precisao !== null &&
            fotografia.precisao !== undefined
        ) {

            const precisao =
                document.createElement(
                    "span"
                );

            precisao.className =
                "foto-precisao";

            precisao.textContent =
                "Precisão do GPS: ± "
                +
                Math.round(
                    fotografia.precisao
                )
                +
                " m";


            informacoes.appendChild(
                precisao
            );

        }

    }


    /*
    =========================================
    GPS INDISPONÍVEL
    =========================================
    */

    else {

        const gpsIndisponivel =
            document.createElement(
                "span"
            );

        gpsIndisponivel.className =
            "foto-gps-indisponivel";

        gpsIndisponivel.textContent =
            "Localização não disponível";


        informacoes.appendChild(
            gpsIndisponivel
        );

    }


    /*
    =========================================
    DETALHAMENTO DA FOTOGRAFIA
    =========================================
    */

    const blocoDetalhamento =
        document.createElement(
            "div"
        );

    blocoDetalhamento.className =
        "foto-detalhamento";


    /*
    Cabeçalho do campo.
    */

    const cabecalhoDetalhamento =
        document.createElement(
            "div"
        );

    cabecalhoDetalhamento.className =
        "foto-detalhamento-cabecalho";


    const rotuloDetalhamento =
        document.createElement(
            "label"
        );

    rotuloDetalhamento.textContent =
        "Detalhamento";

    rotuloDetalhamento.setAttribute(
        "for",
        `detalhamento-${fotografia.id}`
    );


    const contadorDetalhamento =
        document.createElement(
            "span"
        );

    contadorDetalhamento.className =
        "foto-detalhamento-contador";


    /*
    Campo de texto.
    */

    const campoDetalhamento =
        document.createElement(
            "textarea"
        );

    campoDetalhamento.id =
        `detalhamento-${fotografia.id}`;

    campoDetalhamento.className =
        "foto-detalhamento-campo";

    campoDetalhamento.maxLength =
        200;

    campoDetalhamento.rows =
        3;

    campoDetalhamento.placeholder =
        "Detalhamento opcional da fotografia";

    campoDetalhamento.value =
        String(
            fotografia.detalhamento || ""
        ).slice(
            0,
            200
        );


    contadorDetalhamento.textContent =
        `${campoDetalhamento.value.length}/200`;


    /*
    Salva automaticamente enquanto
    o usuário digita.
    */

    let temporizadorDetalhamento =
        null;


    campoDetalhamento.addEventListener(
        "input",
        function () {

            if (this.value.length > 200) {

                this.value =
                    this.value.slice(
                        0,
                        200
                    );

            }


            fotografia.detalhamento =
                this.value;


            contadorDetalhamento.textContent =
                `${this.value.length}/200`;


            /*
            Pequeno atraso para evitar gravar no
            IndexedDB a cada tecla pressionada.
            */

            clearTimeout(
                temporizadorDetalhamento
            );


            temporizadorDetalhamento =
                setTimeout(
                    async function () {

                        try {

                            await atualizarFotografiaLocal(
                                fotografia
                            );

                        }

                        catch (erro) {

                            console.error(
                                "Não foi possível salvar o detalhamento da fotografia:",
                                erro
                            );

                        }

                    },
                    300
                );

        }
    );


    /*
    Ao sair do campo, garante que a versão
    mais recente seja persistida imediatamente.
    */

    campoDetalhamento.addEventListener(
        "blur",
        async function () {

            clearTimeout(
                temporizadorDetalhamento
            );


            fotografia.detalhamento =
                this.value;


            try {

                await atualizarFotografiaLocal(
                    fotografia
                );

            }

            catch (erro) {

                console.error(
                    "Não foi possível salvar o detalhamento da fotografia:",
                    erro
                );

            }

        }
    );


    cabecalhoDetalhamento.appendChild(
        rotuloDetalhamento
    );

    cabecalhoDetalhamento.appendChild(
        contadorDetalhamento
    );


    blocoDetalhamento.appendChild(
        cabecalhoDetalhamento
    );

    blocoDetalhamento.appendChild(
        campoDetalhamento
    );


    informacoes.appendChild(
        blocoDetalhamento
    );


    /*
    -----------------------------------------
    MONTAGEM FINAL
    -----------------------------------------
    */

    item.appendChild(
        imagem
    );

    item.appendChild(
        botaoExcluir
    );

    item.appendChild(
        informacoes
    );


    return item;

}


/*
=========================================
FORMATAR DATA E HORA
=========================================
*/

function formatarDataHora(data) {

    if (!(data instanceof Date)) {

        data =
            new Date(data);

    }


    const dataFormatada =
        data.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );


    const horaFormatada =
        data.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    return (
        `${dataFormatada}  ${horaFormatada}`
    );

}


/*
=========================================
EXCLUIR FOTOGRAFIA
=========================================
*/

async function excluirFotografia(id) {

    const fotografia =
        fotografias.find(
            function (foto) {

                return foto.id === id;

            }
        );


    if (!fotografia) {

        return;

    }


    /*
    -----------------------------------------
    CONFIRMAÇÃO
    -----------------------------------------
    */

    const confirmar =
        window.confirm(
            "Deseja excluir esta fotografia?"
        );


    if (!confirmar) {

        return;

    }


    /*
    Primeiro removemos do IndexedDB.

    Assim, se ocorrer algum erro de
    armazenamento, não removemos apenas
    visualmente uma foto que ainda está salva.
    */

    try {

        await excluirFotografiaLocal(
            id
        );

    }

    catch (erro) {

        console.error(
            "Não foi possível excluir a fotografia:",
            erro
        );

        alert(
            "Não foi possível excluir a fotografia."
        );

        return;

    }


    /*
    Libera a URL temporária somente depois
    que a exclusão persistente foi concluída.
    */

    URL.revokeObjectURL(
        fotografia.url
    );


    /*
    Remove da memória.
    */

    fotografias =
        fotografias.filter(
            function (foto) {

                return foto.id !== id;

            }
        );


    atualizarInterface();

}


/*
=========================================
REINICIAR REGISTRO
=========================================
*/

async function reiniciarRegistro() {

    const confirmar =
        window.confirm(
            "Deseja reiniciar o registro?\n\n"
            +
            "Todas as fotografias e informações do registro serão excluídas."
        );


    if (!confirmar) {

        return;

    }


    /*
    =========================================
    LIMPA ARMAZENAMENTO
    =========================================
    */

    try {

        /*
        Remove todas as fotografias.
        */

        await limparFotografiasLocais();

        await excluirClassificacaoLocal();


        /*
        Remove todos os dados do formulário.
        */

        localStorage.removeItem(
            "dadosRegistroFotografico"
        );


        /*
        Remove também a chave da versão
        anterior, caso ainda exista.
        */

        localStorage.removeItem(
            "classificacaoRegistro"
        );

    }

    catch (erro) {

        console.error(
            "Não foi possível reiniciar o registro:",
            erro
        );

        alert(
            "Não foi possível reiniciar o registro."
        );

        return;

    }


    /*
    =========================================
    LIBERA URLs TEMPORÁRIAS
    =========================================
    */

    fotografias.forEach(
        function (fotografia) {

            URL.revokeObjectURL(
                fotografia.url
            );

        }
    );


    /*
    =========================================
    LIMPA FOTOGRAFIAS DA MEMÓRIA
    =========================================
    */

    fotografias = [];


    /*
    =========================================
    LIMPA CLASSIFICAÇÃO
    =========================================
    */

    document.querySelectorAll(
        'input[name="tipo-servico"]'
    ).forEach(
        function (opcao) {

            opcao.checked = false;

        }
    );


    document.querySelectorAll(
        'input[name="subtipo-servico"]'
    ).forEach(
        function (opcao) {

            opcao.checked = false;

        }
    );


    const subopcoesExpansao =
        document.getElementById(
            "subopcoes-expansao"
        );

    const subopcoesManutencao =
        document.getElementById(
            "subopcoes-manutencao"
        );

    const campoIncidente =
        document.getElementById(
            "campo-incidente"
        );

    const numeroIncidente =
        document.getElementById(
            "numero-incidente"
        );

    const nomeAcao =
        document.getElementById(
            "nome-acao"
        );


    if (subopcoesExpansao) {

        subopcoesExpansao.classList.add(
            "oculto"
        );

    }


    if (subopcoesManutencao) {

        subopcoesManutencao.classList.add(
            "oculto"
        );

    }


    if (campoIncidente) {

        campoIncidente.classList.add(
            "oculto"
        );

    }


    if (numeroIncidente) {

        numeroIncidente.value = "";

    }


    /*
    =========================================
    LIMPA NOME DA AÇÃO
    =========================================
    */

    if (nomeAcao) {

        nomeAcao.value = "";

    }


    atualizarContadorNomeAcao();

    atualizarValidacaoRegistro();

    atualizarInterface();

    atualizarBotoes();

}
