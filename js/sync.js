/*
=========================================================
SINCRONIZAÇÃO DE PDFs
=========================================================

Responsabilidades:

1. Localizar PDFs pendentes no IndexedDB.
2. Enviar os PDFs para o Cloudflare Worker.
3. Marcar como SINCRONIZADO somente após confirmação.
4. Registrar falhas de envio.
5. Tentar novamente quando a internet voltar.
6. Evitar duas sincronizações simultâneas.

=========================================================
*/


const URL_API =
    "https://rbo-relatorios-api.rbo-regional-leste-ma.workers.dev";


let sincronizacaoEmAndamento = false;


/*
=========================================================
TEMPOS DE ENVIO E NOVAS TENTATIVAS
=========================================================

TEMPO_LIMITE_ENVIO_MS:
Tempo máximo de um envio. Com sinal ruim,
uma conexão pode ficar "pendurada" sem
responder; o limite libera a fila.

INTERVALOS_NOVA_TENTATIVA_MS:
Se algum envio falhar, a fila é tentada
novamente de forma automática, com espera
crescente: 15 s, 30 s, 1 min, 2 min e,
a partir daí, a cada 5 min.
=========================================================
*/

const TEMPO_LIMITE_ENVIO_MS = 120000;

const INTERVALOS_NOVA_TENTATIVA_MS = [
    15000,
    30000,
    60000,
    120000,
    300000
];

let indiceNovaTentativa = 0;

let temporizadorNovaTentativa = null;


/*
=========================================================
ENVIAR UM PDF AO WORKER
=========================================================
*/

async function enviarPDFWorker(registroPDF) {

    if (
        !registroPDF ||
        !registroPDF.arquivoPDF
    ) {

        throw new Error(
            "Registro de PDF inválido."
        );

    }


    const formulario =
        new FormData();


    formulario.append(
        "id",
        registroPDF.id || ""
    );

    const nomesSeccionais = {
        "Caxias": "Seccional Caxias",
        "Chapadinha": "Seccional Chapadinha",
        "Timon": "Seccional Timon",
        "São João dos Patos": "Seccional São João dos Patos"
    };

    const seccional =
        nomesSeccionais[registroPDF.seccional] ||
        registroPDF.seccional ||
        "";

    formulario.append(
        "seccional",
        seccional
    );

    formulario.append(
        "categoria",
        registroPDF.categoria || ""
    );

    formulario.append(
        "subcategoria",
        registroPDF.subcategoria || ""
    );

    formulario.append(
        "incidente",
        registroPDF.incidente || ""
    );

    formulario.append(
        "instalacao",
        registroPDF.instalacao || ""
    );

    formulario.append(
        "localidade",
        registroPDF.localidade || ""
    );

    formulario.append(
        "nomeAcao",
        registroPDF.nomeAcao || ""
    );


    formulario.append(
        "arquivo",
        registroPDF.arquivoPDF,
        registroPDF.nomeArquivo || "relatorio.pdf"
    );


    /*
    IMPORTANTE:

    Não definir manualmente Content-Type.

    O navegador precisa gerar automaticamente
    o boundary do multipart/form-data.
    */

    /*
    Tempo limite do envio.
    */

    const controlador =
        new AbortController();

    const temporizador =
        setTimeout(
            function () {

                controlador.abort();

            },
            TEMPO_LIMITE_ENVIO_MS
        );


    let resposta;


    try {

        resposta =
            await fetch(
                URL_API + "/upload",
                {
                    method: "POST",
                    body: formulario,
                    signal: controlador.signal
                }
            );

    }
    catch (erro) {

        if (erro.name === "AbortError") {

            throw new Error(
                "Tempo de envio esgotado."
            );

        }

        throw erro;

    }
    finally {

        clearTimeout(
            temporizador
        );

    }


    let dados;


    try {

        dados =
            await resposta.json();

    }
    catch {

        throw new Error(
            "O Worker retornou uma resposta inválida."
        );

    }


    if (
        !resposta.ok ||
        !dados.sucesso
    ) {

        throw new Error(
            dados.erro ||
            "Não foi possível enviar o PDF."
        );

    }


    return dados;

}


/*
=========================================================
ATUALIZAR RELATÓRIOS PENDENTES NA INTERFACE
=========================================================
*/

async function atualizarRelatoriosPendentes() {

    const painel =
        document.getElementById(
            "relatorios-pendentes"
        );

    const lista =
        document.getElementById(
            "lista-relatorios-pendentes"
        );

    const quantidade =
        document.getElementById(
            "quantidade-relatorios-pendentes"
        );


    /*
    O HTML ainda pode não estar disponível
    em algum momento muito inicial da página.
    */

    if (
        !painel ||
        !lista ||
        !quantidade
    ) {

        return;

    }


    try {

        const pendentes =
            await listarPDFsPendentes();


        /*
        -----------------------------------------
        LIMPA SOMENTE A REPRESENTAÇÃO VISUAL
        -----------------------------------------
        */

        lista.innerHTML = "";


        /*
        -----------------------------------------
        NENHUM PDF PENDENTE
        -----------------------------------------
        */

        if (
            !pendentes ||
            pendentes.length === 0
        ) {

            quantidade.textContent = "0";

            painel.classList.add(
                "oculto"
            );

            return;

        }


        /*
        -----------------------------------------
        EXISTEM PDFs PENDENTES
        -----------------------------------------
        */

        quantidade.textContent =
            String(
                pendentes.length
            );


        pendentes.forEach(
            function (registroPDF) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "relatorio-pendente-item";


                const icone =
                    document.createElement(
                        "span"
                    );


                icone.className =
                    "relatorio-pendente-icone";

                icone.textContent =
                    "📄";


                const nome =
                    document.createElement(
                        "span"
                    );


                nome.className =
                    "relatorio-pendente-nome";

                nome.textContent =
                    registroPDF.nomeArquivo ||
                    "Relatório sem nome";


                item.appendChild(
                    icone
                );

                item.appendChild(
                    nome
                );


                lista.appendChild(
                    item
                );

            }
        );


        painel.classList.remove(
            "oculto"
        );

    }

    catch (erro) {

        console.error(
            "Não foi possível atualizar os relatórios pendentes:",
            erro
        );

    }

}


/*
=========================================================
SINCRONIZAR UM PDF
=========================================================
*/

async function sincronizarPDF(
    registroPDF
) {

    /*
    -----------------------------------------
    MARCA A TENTATIVA
    -----------------------------------------
    */

    const tentativas =
        Number(
            registroPDF.tentativas || 0
        ) + 1;


    await atualizarStatusPDF(
        registroPDF.id,
        "ENVIANDO",
        {
            tentativas:
                tentativas,

            ultimaTentativa:
                new Date().toISOString(),

            erro:
                ""
        }
    );


    try {

        console.log(
            "Enviando PDF:",
            registroPDF.nomeArquivo
        );


        const resultado =
            await enviarPDFWorker(
                registroPDF
            );


        /*
        -----------------------------------------
        SOMENTE AQUI CONSIDERAMOS SINCRONIZADO
        -----------------------------------------

        Neste ponto:

        Site
          ↓
        Worker
          ↓
        Google Drive
          ↓
        confirmação de sucesso

        -----------------------------------------
        */

        await atualizarStatusPDF(
            registroPDF.id,
            "SINCRONIZADO",
            {
                sincronizadoEm:
                    new Date().toISOString(),

                erro:
                    "",

                idDrive:
                    resultado.arquivo?.idDrive || ""
            }
        );


        console.log(
            "PDF sincronizado com sucesso:",
            registroPDF.nomeArquivo
        );


        await atualizarRelatoriosPendentes();

        return true;

    }
    catch (erro) {

        console.error(
            "Falha ao sincronizar PDF:",
            registroPDF.nomeArquivo,
            erro
        );


        /*
        -----------------------------------------
        VOLTA PARA PENDENTE
        -----------------------------------------

        O arquivo continua no IndexedDB e poderá
        ser enviado novamente posteriormente.
        */

        await atualizarStatusPDF(
            registroPDF.id,
            "PENDENTE",
            {
                erro:
                    erro.message ||
                    "Erro desconhecido."
            }
        );

        await atualizarRelatoriosPendentes();
        
        return false;

    }

}


/*
=========================================================
SINCRONIZAR FILA
=========================================================
*/

async function sincronizarFilaPDFs() {

    /*
    Evita duas sincronizações simultâneas.
    */

    if (sincronizacaoEmAndamento) {

        console.log(
            "Sincronização já está em andamento."
        );

        return;

    }


    /*
    Sem internet, não há o que fazer.
    */

    if (!navigator.onLine) {

        console.log(
            "Sem conexão. PDFs permanecerão pendentes."
        );

        return;

    }


    sincronizacaoEmAndamento = true;


    /*
    Indica se algum PDF ficou sem enviar,
    para agendar nova tentativa.
    */

    let houveFalha = false;


    try {

        console.log(
            "Verificando fila de PDFs..."
        );


        /*
        -----------------------------------------
        RECUPERA ENVIOS INTERROMPIDOS
        -----------------------------------------

        PDFs que ficaram como ENVIANDO porque o
        aplicativo foi fechado durante o upload
        voltam para a fila.

        É seguro fazer isso aqui: como
        sincronizacaoEmAndamento acabou de ser
        ativado, nenhum envio desta página está
        em curso.
        */

        try {

            const recuperados =
                await restaurarPDFsInterrompidos();


            if (recuperados > 0) {

                console.log(
                    `${recuperados} PDF(s) com envio interrompido voltaram para a fila.`
                );

            }

        }
        catch (erro) {

            console.error(
                "Não foi possível recuperar PDFs interrompidos:",
                erro
            );

        }


        const pendentes =
            await listarPDFsPendentes();


        if (
            !pendentes ||
            pendentes.length === 0
        ) {

            console.log(
                "Nenhum PDF pendente."
            );

            return;

        }


        console.log(
            `${pendentes.length} PDF(s) pendente(s).`
        );


        /*
        Envio sequencial.

        Evita vários uploads simultâneos
        e facilita o controle da fila.
        */

        for (
            const registroPDF
            of pendentes
        ) {

            /*
            Se a internet cair durante a fila,
            interrompemos aqui.
            */

            if (!navigator.onLine) {

                console.log(
                    "Conexão perdida. Sincronização interrompida."
                );

                houveFalha = true;

                break;

            }


            const enviado =
                await sincronizarPDF(
                    registroPDF
                );


            if (!enviado) {

                houveFalha = true;

            }

        }

    }
    catch (erro) {

        console.error(
            "Erro ao processar fila de PDFs:",
            erro
        );

        houveFalha = true;

    }
    finally {

        sincronizacaoEmAndamento = false;

    }


    /*
    -----------------------------------------
    NOVA TENTATIVA AUTOMÁTICA
    -----------------------------------------
    */

    if (houveFalha) {

        agendarNovaTentativa();

    }
    else {

        indiceNovaTentativa = 0;

    }

}


/*
=========================================================
AGENDAR NOVA TENTATIVA
=========================================================

Usado quando algum envio falhou, por
exemplo: aparelho "conectado" ao Wi-Fi ou
aos dados móveis, mas sem internet real.
=========================================================
*/

function agendarNovaTentativa() {

    clearTimeout(
        temporizadorNovaTentativa
    );


    const espera =
        INTERVALOS_NOVA_TENTATIVA_MS[
            Math.min(
                indiceNovaTentativa,
                INTERVALOS_NOVA_TENTATIVA_MS.length - 1
            )
        ];


    indiceNovaTentativa++;


    console.log(
        `Nova tentativa de envio em ${Math.round(espera / 1000)} s.`
    );


    temporizadorNovaTentativa =
        setTimeout(
            function () {

                sincronizarFilaPDFs();

            },
            espera
        );

}


/*
=========================================================
SINCRONIZAR AGORA
=========================================================

Cancela a espera de uma nova tentativa
agendada e sincroniza imediatamente.
=========================================================
*/

function sincronizarAgora() {

    clearTimeout(
        temporizadorNovaTentativa
    );

    indiceNovaTentativa = 0;

    sincronizarFilaPDFs();

}


/*
=========================================================
INTERNET RESTABELECIDA
=========================================================
*/

window.addEventListener(
    "online",
    function () {

        console.log(
            "Internet restabelecida."
        );


        sincronizarAgora();

    }
);


/*
=========================================================
APLICATIVO VOLTOU A FICAR VISÍVEL
=========================================================

No celular, o aplicativo em segundo plano
fica pausado e pode perder o aviso de que a
internet voltou. Ao reabri-lo, a fila é
verificada imediatamente.
=========================================================
*/

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            sincronizarAgora();

        }

    }
);


/*
=========================================================
AO CARREGAR O SITE
=========================================================

Se houver PDFs pendentes de uma sessão anterior,
tentamos sincronizá-los automaticamente.

=========================================================
*/


window.addEventListener(
    "load",
    function () {

        /*
        Mostra imediatamente qualquer PDF
        que já esteja pendente.
        */

        atualizarRelatoriosPendentes();


        /*
        Depois tenta realizar a sincronização.

        Pequeno atraso apenas para não disputar
        processamento com a montagem da tela.
        */

        setTimeout(
            async function () {

                await sincronizarFilaPDFs();

                await atualizarRelatoriosPendentes();

            },
            500
        );

    }
);